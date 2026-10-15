const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

if (process.env.PA_REAL_DB_E2E !== 'true' || process.env.NODE_ENV === 'test') {
  throw new Error('Real remediation tests require the opted-in real database runner.');
}
const appEnv = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env')));
const target = resolveRealDbE2eTarget({ optedIn: true, env: process.env, appEnv });
if (target.host !== 'aws-1-ap-southeast-1.pooler.supabase.com' || target.port !== '5432'
  || !appEnv.SUPABASE_URL?.includes('jypgdzzwmzqkcsaqaerj.supabase.co')) {
  throw new Error('Verified Pocket Agencom Supabase target mismatch.');
}
process.env.FREE_ONLY_MODE = 'true';
process.env.AI_ALLOW_PAID_MODELS = 'false';
const prisma = require('../src/config/prisma');
const aiService = require('../src/services/ai/aiService');
const marketingPlanService = require('../src/services/marketingPlanService');
const mediaService = require('../src/services/mediaService');
const runPrefix = `pa-remediation-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

test('real PostgreSQL enforces profile ownership and detects duplicate refinements', { timeout: 180000 }, async (t) => {
  const originalPrompt = aiService.generateImagePrompt;
  const originalRefine = aiService.refineMarketingPlan;
  t.after(async () => {
    aiService.generateImagePrompt = originalPrompt;
    aiService.refineMarketingPlan = originalRefine;
    try {
      const users = await prisma.user.findMany({ where: { email: { startsWith: runPrefix } }, select: { id: true } });
      const ids = users.map(({ id }) => id);
      await prisma.marketingPlan.deleteMany({ where: { userId: { in: ids } } });
      await prisma.mediaAsset.deleteMany({ where: { userId: { in: ids } } });
      await prisma.businessProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids }, email: { startsWith: runPrefix } } });
      assert.equal(await prisma.user.count({ where: { email: { startsWith: runPrefix } } }), 0);
    } finally { await prisma.$disconnect(); }
  });

  const [identity] = await prisma.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
  assert.deepEqual(identity, { database: target.database, schema: target.schema });
  const owner = await prisma.user.create({ data: { name: 'Remediation Owner', email: `${runPrefix}-owner@example.test`, passwordHash: 'test-only', role: 'user', status: 'active' } });
  const other = await prisma.user.create({ data: { name: 'Remediation Other', email: `${runPrefix}-other@example.test`, passwordHash: 'test-only', role: 'user', status: 'active' } });
  const owned = await prisma.businessProfile.create({ data: { userId: owner.id, businessType: 'Coffee', productDescription: runPrefix, targetCustomer: 'Adults' } });
  const foreign = await prisma.businessProfile.create({ data: { userId: other.id, businessType: 'Bakery', productDescription: runPrefix, targetCustomer: 'Adults' } });

  let providerCalls = 0;
  aiService.generateImagePrompt = async () => { providerCalls += 1; return { imagePrompt: 'Coffee' }; };
  await assert.rejects(marketingPlanService.generateImagePrompt(owner.id, { postContent: 'Test coffee post', businessProfileId: foreign.id }), { statusCode: 404 });
  await assert.rejects(mediaService.uploadMediaAsset(owner.id, { name: 'forged', url: 'https://example.com/forged.png', businessProfileId: foreign.id }), { statusCode: 404 });
  assert.equal(providerCalls, 0);
  assert.equal(await prisma.mediaAsset.count({ where: { userId: owner.id } }), 0);
  await marketingPlanService.generateImagePrompt(owner.id, { postContent: 'Test coffee post', businessProfileId: owned.id });
  assert.equal(providerCalls, 1);

  const plan = await prisma.marketingPlan.create({ data: {
    userId: owner.id, businessProfileId: owned.id, goal: 'More customers',
    contentIdeas: '[]', videoScripts: '[]', checklist: '[]', playbook: '[]', seoKeywords: '[]', status: 'saved',
  } });
  let arrivals = 0;
  let release;
  const bothReady = new Promise((resolve) => { release = resolve; });
  aiService.refineMarketingPlan = async () => {
    arrivals += 1;
    if (arrivals === 2) release();
    await bothReady;
    return { contentIdeas: [{ title: 'Coffee', description: 'New post' }], videoScripts: [{ action: 'Film coffee' }], checklist: ['Publish'], playbook: [{ phaseName: 'Launch' }], seoKeywords: [], revisionSummary: 'Changed' };
  };
  const results = await Promise.allSettled([
    marketingPlanService.refinePlan(plan.id, owner.id, { instruction: 'Update post' }),
    marketingPlanService.refinePlan(plan.id, owner.id, { instruction: 'Update post' }),
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter((item) => item.status === 'rejected' && item.reason?.statusCode === 409).length, 1);
  assert.equal((await prisma.marketingPlan.findUnique({ where: { id: plan.id } })).contentIdeas.includes('Coffee'), true);
});
