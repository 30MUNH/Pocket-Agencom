const test = require('node:test');
const assert = require('node:assert/strict');

function loadService(prisma, ai) {
  const prismaPath = require.resolve('../src/config/prisma');
  const aiPath = require.resolve('../src/services/ai/aiService');
  const servicePath = require.resolve('../src/services/marketingPlanService');
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: prisma };
  require.cache[aiPath] = { id: aiPath, filename: aiPath, loaded: true, exports: ai };
  delete require.cache[servicePath];
  return require('../src/services/marketingPlanService');
}

test('two refinements of one version cannot both report success and overwrite each other', async () => {
  const oldVersion = new Date('2026-01-01T00:00:00.000Z');
  const newVersion = new Date('2026-01-01T00:00:01.000Z');
  let row = { id: 7, userId: 4, goal: 'Grow', status: 'draft', updatedAt: oldVersion,
    contentIdeas: '[]', videoScripts: '[]', checklist: '[]', playbook: '[]' };
  let explicitNextVersion = null;
  let providerStarted = 0;
  let releaseProvider;
  const providerGate = new Promise((resolve) => { releaseProvider = resolve; });
  const ai = { async refineMarketingPlan({ instruction }) {
    providerStarted += 1;
    await providerGate;
    return { contentIdeas: [{ title: instruction }], videoScripts: [], checklist: [], playbook: [] };
  } };
  const prisma = { marketingPlan: {
    async findUnique() { return { ...row }; },
    async update({ where, data }) {
      if (where.updatedAt && row.updatedAt.getTime() !== where.updatedAt.getTime()) {
        throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      }
      explicitNextVersion = data.updatedAt || null;
      row = { ...row, ...data, updatedAt: data.updatedAt || newVersion };
      return { ...row };
    },
  } };
  const service = loadService(prisma, ai);
  const first = service.refinePlan(7, 4, { instruction: 'First edit' });
  const second = service.refinePlan(7, 4, { instruction: 'Second edit' });
  for (let i = 0; providerStarted < 2 && i < 10; i += 1) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(providerStarted, 2);
  releaseProvider();
  const results = await Promise.allSettled([first, second]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.statusCode === 409).length, 1);
  assert.ok(explicitNextVersion instanceof Date && explicitNextVersion > oldVersion);
});
