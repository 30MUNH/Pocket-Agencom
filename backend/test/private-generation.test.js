const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaAccessService } = require('../src/services/mediaAccessService');

test('private generated asset persistence stores only object metadata and returns an asset record', async () => {
  const writes = [];
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: { async create(args) { writes.push(args.data); return { id: 41, ...args.data }; } } },
    storageOperations: { async uploadPrivateObject() { return { bucket: 'campaign-assets-private', path: 'opaque.png', contentType: 'image/png', byteLength: 12 }; } },
    mode: () => 'private',
  });
  const result = await service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('image'), mimetype: 'image/png' }, purpose: 'campaign', metadata: { name: 'generated' } });
  assert.equal(result.id, 41);
  assert.equal(writes[0].url, null);
  assert.equal(writes[0].sourceKind, 'private_storage');
  assert.equal(writes[0].storageBucket, 'campaign-assets-private');
  assert.equal(writes[0].storagePath, 'opaque.png');
  assert.equal(JSON.stringify(writes[0]).includes('signed.invalid'), false);
});

test('private object is compensated when MediaAsset persistence fails', async () => {
  const removed = [];
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: { async create() { throw new Error('db unavailable'); } } },
    storageOperations: {
      async uploadPrivateObject() { return { bucket: 'campaign-assets-private', path: 'opaque.png', contentType: 'image/png', byteLength: 12 }; },
      async removePrivateObject(input) { removed.push(input); },
    },
    mode: () => 'private',
  });
  await assert.rejects(service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('image'), mimetype: 'image/png' }, purpose: 'campaign' }), { statusCode: 503 });
  assert.deepEqual(removed, [{ bucket: 'campaign-assets-private', path: 'opaque.png' }]);
});
