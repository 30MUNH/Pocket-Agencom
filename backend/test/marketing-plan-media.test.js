const test = require('node:test');
const assert = require('node:assert/strict');

function loadMarketingPlanService(prisma) {
  const prismaPath = require.resolve('../src/config/prisma');
  const aiPath = require.resolve('../src/services/ai/aiService');
  const servicePath = require.resolve('../src/services/marketingPlanService');
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: prisma };
  require.cache[aiPath] = { id: aiPath, filename: aiPath, loaded: true, exports: {} };
  delete require.cache[servicePath];
  return require('../src/services/marketingPlanService');
}

function setup({ plan = { id: 6, userId: 4 }, assets = [{ id: 8, userId: 4, lifecycleState: 'active' }] } = {}) {
  const calls = [];
  const tx = {
    async $queryRaw() { calls.push(['lock']); },
    marketingPlan: { async findUnique() { return plan; } },
    mediaAsset: { async findUnique({ where }) { return assets.find((asset) => asset.id === where.id) || null; } },
    marketingPlanAsset: {
      async createMany(args) { calls.push(['createMany', args.data]); return { count: args.data.length }; },
      async findMany() { return []; },
    },
  };
  return { calls, prisma: { async $transaction(callback) { return callback(tx); } } };
}

test('Marketing Plan attachment writes normalized same-owner ID relations under asset lock', async () => {
  const { calls, prisma } = setup();
  const service = loadMarketingPlanService(prisma);
  await service.attachMediaAssets(6, 4, [8]);
  assert.ok(calls.some(([name]) => name === 'lock'));
  assert.deepEqual(calls.find(([name]) => name === 'createMany')[1], [{ userId: 4, marketingPlanId: 6, mediaAssetId: 8, purpose: 'attachment' }]);
});

test('foreign or deleting asset cannot be attached to a Marketing Plan', async () => {
  const foreign = setup({ assets: [{ id: 8, userId: 99, lifecycleState: 'active' }] });
  await assert.rejects(loadMarketingPlanService(foreign.prisma).attachMediaAssets(6, 4, [8]), { statusCode: 404 });
  const deleting = setup({ assets: [{ id: 8, userId: 4, lifecycleState: 'deleting' }] });
  await assert.rejects(loadMarketingPlanService(deleting.prisma).attachMediaAssets(6, 4, [8]), { statusCode: 404 });
});
