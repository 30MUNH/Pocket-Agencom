const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function loadAuthService(mockPrisma) {
  const prismaPath = require.resolve('../src/config/prisma');
  const servicePath = require.resolve('../src/services/authService');
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: mockPrisma };
  delete require.cache[servicePath];
  return require('../src/services/authService');
}

test('profile update accepts only an owned active private MediaAsset ID', async () => {
  const calls = [];
  const prisma = {
    mediaAsset: { async findFirst(args) { calls.push(['asset', args]); return { id: 7 }; } },
    user: { async update(args) { calls.push(['update', args]); return { id: 4, avatarMediaAssetId: 7, avatarUrl: null }; } },
  };
  const result = await loadAuthService(prisma).updateProfile(4, { avatarMediaAssetId: 7 });
  assert.equal(result.avatarMediaAssetId, 7);
  assert.deepEqual(calls[0][1].where, { id: 7, userId: 4, sourceKind: 'private_storage', lifecycleState: 'active' });
  assert.equal(calls[1][1].data.avatarUrl, null);
});

test('profile update rejects raw avatar URLs and foreign or non-private IDs', async () => {
  let updateCalls = 0;
  const prisma = {
    mediaAsset: { async findFirst() { return null; } },
    user: { async update() { updateCalls += 1; } },
  };
  const service = loadAuthService(prisma);
  await assert.rejects(service.updateProfile(4, { avatarUrl: 'https://other-user.example/avatar.png' }), { statusCode: 400 });
  await assert.rejects(service.updateProfile(4, { avatarMediaAssetId: 8 }), { statusCode: 404 });
  assert.equal(updateCalls, 0);
});
