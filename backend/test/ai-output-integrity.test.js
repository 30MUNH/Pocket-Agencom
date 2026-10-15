const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/installPrismaFixture');
const { AIService } = require('../src/services/ai/aiService');

const request = {
  businessType: 'coffee', campaignType: 'awareness', productDescription: 'Fresh roasted coffee',
  targetCustomer: 'Local customers', goal: 'More returning customers',
};

test('marketing generation rejects truthy malformed arrays before persistence', async () => {
  const ai = new AIService();
  ai.generateText = async () => ({
    text: JSON.stringify({ contentIdeas: { title: 'Wrong shape' }, videoScripts: [], checklist: [], playbook: [] }),
    provider: 'fixture', model: 'fixture',
  });
  await assert.rejects(ai.generateMarketingPlan(null, request, null), { statusCode: 502 });
});

test('plan refinement rejects wrong element types rather than replacing saved content', async () => {
  const ai = new AIService();
  ai.generateText = async () => ({
    text: JSON.stringify({ contentIdeas: ['bad'], videoScripts: [{}], checklist: ['ok'], playbook: [{ phaseName: 'Start' }] }),
    provider: 'fixture', model: 'fixture',
  });
  await assert.rejects(ai.refineMarketingPlan({
    plan: { goal: 'Grow', contentIdeas: '[]', videoScripts: '[]', checklist: '[]', playbook: '[]' },
    instruction: 'Make it shorter',
  }), { statusCode: 502 });
});

test('valid optional export details survive complete plan validation', async () => {
  const ai = new AIService();
  ai.generateText = async () => ({ text: JSON.stringify({
    contentIdeas: [{ title: 'Coffee launch', description: 'Show new beans', rationale: 'Audience interest' }],
    videoScripts: [{ action: 'Film', hook: 'Fresh beans', script: 'Open the bag', callToAction: 'Visit us' }],
    checklist: ['Publish'], playbook: [{ phaseName: 'Launch' }],
  }), provider: 'fixture', model: 'fixture' });
  const result = await ai.generateMarketingPlan(null, request, null);
  assert.equal(result.contentIdeas[0].rationale, 'Audience interest');
  assert.equal(result.videoScripts[0].hook, 'Fresh beans');
  assert.equal(result.videoScripts[0].callToAction, 'Visit us');
});

test('UI-rendered optional fields with wrong types fail validation', async () => {
  const ai = new AIService();
  ai.generateText = async () => ({ text: JSON.stringify({
    contentIdeas: [{ title: 'Coffee', description: 'Show beans' }],
    videoScripts: [{ action: 'Film', visual: { unsafe: true } }],
    checklist: ['Publish'], playbook: [{ phaseName: 'Launch' }],
  }), provider: 'fixture', model: 'fixture' });
  await assert.rejects(ai.generateMarketingPlan(null, request, null), { statusCode: 502 });
});

test('budget channel details are preserved or normalized to the UI contract', async () => {
  const ai = new AIService();
  const base = { contentIdeas: [{ title: 'Coffee', description: 'Show beans' }], videoScripts: [{ action: 'Film' }], checklist: ['Publish'], playbook: [{ phaseName: 'Launch' }] };
  ai.generateText = async () => ({ text: JSON.stringify({ ...base, budgetBreakdown: { channels: [{ channelName: 'Facebook', percentOfTotal: 60, items: [{ name: 'Ads', percent: 100 }] }] } }), provider: 'fixture', model: 'fixture' });
  const rich = await ai.generateMarketingPlan(null, request, null);
  assert.deepEqual(rich.budgetBreakdown.channels[0], { channelName: 'Facebook', percentOfTotal: 60, items: [{ name: 'Ads', percent: 100 }] });
  ai.generateText = async () => ({ text: JSON.stringify({ ...base, budgetBreakdown: { channels: [{ channel: 'TikTok', percentage: 40, estimatedVnd: 2000000 }] } }), provider: 'fixture', model: 'fixture' });
  const older = await ai.generateMarketingPlan(null, request, null);
  assert.deepEqual(older.budgetBreakdown.channels[0], { channelName: 'TikTok', percentOfTotal: 40, items: [{ name: 'Ngân sách kênh', percent: 100 }] });
  ai.generateText = async () => ({ text: JSON.stringify({ ...base, budgetBreakdown: { channels: [{ channelName: 'Broken', percentOfTotal: '60', items: [] }] } }), provider: 'fixture', model: 'fixture' });
  await assert.rejects(ai.generateMarketingPlan(null, request, null), { statusCode: 502 });
});
