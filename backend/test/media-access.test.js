const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaAccessService } = require('../src/services/mediaAccessService');

function setup({ asset = { id: 12, userId: 4, sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'campaign-assets-private', storagePath: 'opaque.png' }, user = { id: 4, status: 'active' }, mode = 'private' } = {}) {
  const calls = [];
  const tx = {
    async $queryRaw() { calls.push(['lock']); return []; },
    mediaAsset: { async findUnique() { calls.push(['asset']); return asset; } },
    user: { async findUnique() { calls.push(['user']); return user; } },
    mediaAssetAccessLease: {
      async create({ data }) { calls.push(['lease-create', data]); return { id: 99 }; },
      async delete({ where }) { calls.push(['lease-delete', where]); return {}; },
    },
  };
  const prismaClient = { async $transaction(callback) { return callback(tx); }, mediaAssetAccessLease: tx.mediaAssetAccessLease };
  const storageClient = { storage: { from(bucket) { return { async createSignedUrl(path, seconds, options) { calls.push(['sign', bucket, path, seconds, options]); return { data: { signedUrl: 'https://signed.invalid/a?token=x' }, error: null }; } }; } } };
  return { calls, service: createMediaAccessService({ prismaClient, storageClient, mode: () => mode, now: () => new Date('2026-01-01T00:00:00Z') }) };
}

test('signs only owned active private asset IDs for exactly 600 seconds and cleans lease', async () => {
  const { calls, service } = setup();
  const result = await service.getAuthorizedMediaAccess({ requester: { id: 4, role: 'user' }, assetId: '12', disposition: 'inline' });
  assert.equal(result.expiresAt, '2026-01-01T00:10:00.000Z');
  assert.deepEqual(calls.filter(([name]) => name === 'sign')[0].slice(1, 4), ['campaign-assets-private', 'opaque.png', 600]);
  assert.ok(calls.some(([name]) => name === 'lease-create'));
  assert.ok(calls.some(([name]) => name === 'lease-delete'));
  assert.equal(JSON.stringify(result).includes('opaque.png'), false);
});

test('absent and foreign asset IDs return the same not-found response', async () => {
  for (const asset of [null, { id: 12, userId: 99, sourceKind: 'private_storage', lifecycleState: 'active' }]) {
    const { service } = setup({ asset });
    await assert.rejects(service.getAuthorizedMediaAccess({ requester: { id: 4, role: 'user' }, assetId: '12' }), { statusCode: 404 });
  }
});

test('disabled users and deleting assets cannot mint new signed URLs', async () => {
  const disabled = setup({ user: { id: 4, status: 'archived' } });
  await assert.rejects(disabled.service.getAuthorizedMediaAccess({ requester: { id: 4, role: 'user' }, assetId: '12' }), { statusCode: 403 });
  const deleting = setup({ asset: { id: 12, userId: 4, sourceKind: 'private_storage', lifecycleState: 'deleting' } });
  await assert.rejects(deleting.service.getAuthorizedMediaAccess({ requester: { id: 4, role: 'user' }, assetId: '12' }), { statusCode: 404 });
});

test('mode disabled and foreign bucket/path overrides never produce signing calls', async () => {
  const { calls, service } = setup({ mode: 'disabled' });
  await assert.rejects(service.getAuthorizedMediaAccess({ requester: { id: 4, role: 'user' }, assetId: '12', bucket: 'avatars', path: 'owned' }), { statusCode: 503 });
  assert.equal(calls.some(([name]) => name === 'sign'), false);
});

test('admin avatar access is limited to the target user linked avatar and 600 second URL', async () => {
  const asset = { id: 12, userId: 8, sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'avatars-private', storagePath: 'opaque-avatar.png', purpose: 'avatar' };
  const calls = [];
  const tx = {
    async $queryRaw() { calls.push(['lock']); },
    user: { async findUnique() { return { id: 8, status: 'active', avatarMediaAssetId: 12 }; } },
    mediaAsset: { async findUnique() { return asset; } },
    mediaAssetAccessLease: { async create() { return { id: 31 }; }, async delete() { return {}; } },
  };
  const prismaClient = { async $transaction(callback) { return callback(tx); }, mediaAssetAccessLease: tx.mediaAssetAccessLease };
  const storageClient = { storage: { from(bucket) { return { async createSignedUrl(path, seconds) { calls.push(['sign', bucket, path, seconds]); return { data: { signedUrl: 'https://signed.invalid/avatar' } }; } }; } } };
  const service = createMediaAccessService({ prismaClient, storageClient, mode: () => 'private' });
  const result = await service.getAdminUserAvatarAccess({ requester: { id: 2, role: 'admin' }, targetUserId: 8 });
  assert.equal(result.temporary, true);
  assert.deepEqual(calls.find(([name]) => name === 'sign'), ['sign', 'avatars-private', 'opaque-avatar.png', 600]);
});

test('non-admin, inactive target, mismatched avatar and non-avatar assets cannot be signed by admin surface', async () => {
  for (const { requester, target, asset } of [
    { requester: { id: 2, role: 'user' }, target: { id: 8, status: 'active', avatarMediaAssetId: 12 }, asset: { id: 12, userId: 8, purpose: 'avatar', sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'avatars-private', storagePath: 'x' } },
    { requester: { id: 2, role: 'staff' }, target: { id: 8, status: 'inactive', avatarMediaAssetId: 12 }, asset: { id: 12, userId: 8, purpose: 'avatar', sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'avatars-private', storagePath: 'x' } },
    { requester: { id: 2, role: 'admin' }, target: { id: 8, status: 'active', avatarMediaAssetId: 12 }, asset: { id: 12, userId: 9, purpose: 'avatar', sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'avatars-private', storagePath: 'x' } },
    { requester: { id: 2, role: 'admin' }, target: { id: 8, status: 'active', avatarMediaAssetId: 12 }, asset: { id: 12, userId: 8, purpose: 'attachment', sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'avatars-private', storagePath: 'x' } },
  ]) {
    const calls = [];
    const tx = {
      async $queryRaw() {},
      user: { async findUnique() { return target; } },
      mediaAsset: { async findUnique() { return asset; } },
      mediaAssetAccessLease: { async create() { return { id: 31 }; }, async delete() { return {}; } },
    };
    const prismaClient = { async $transaction(callback) { return callback(tx); }, mediaAssetAccessLease: tx.mediaAssetAccessLease };
    const storageClient = { storage: { from() { return { async createSignedUrl() { calls.push(['sign']); return { data: { signedUrl: 'https://signed.invalid' } }; } }; } } };
    const service = createMediaAccessService({ prismaClient, storageClient, mode: () => 'private' });
    await assert.rejects(service.getAdminUserAvatarAccess({ requester, targetUserId: 8 }));
    assert.equal(calls.length, 0);
  }
});
