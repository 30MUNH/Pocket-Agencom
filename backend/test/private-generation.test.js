const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaAccessService } = require('../src/services/mediaAccessService');

test('private generated asset is staged before upload and activated afterward', async () => {
  const writes = [];
  const events = [];
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: {
      async create(args) { events.push('stage'); writes.push(args.data); return { id: 41, ...args.data }; },
      async update(args) { events.push('activate'); return { id: 41, ...writes[0], ...args.data }; },
    } },
    storageOperations: { async uploadPrivateObject({ onPrepared }) { await onPrepared({ bucket: 'campaign-assets-private', path: 'opaque.png', contentType: 'image/png', byteLength: 12 }); events.push('upload'); return { bucket: 'campaign-assets-private', path: 'opaque.png', contentType: 'image/png', byteLength: 12 }; } },
    mode: () => 'private',
  });
  const result = await service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('image'), mimetype: 'image/png' }, purpose: 'campaign', metadata: { name: 'generated' } });
  assert.equal(result.id, 41);
  assert.equal(writes[0].url, null);
  assert.equal(writes[0].sourceKind, 'private_storage');
  assert.equal(writes[0].storageBucket, 'campaign-assets-private');
  assert.equal(writes[0].storagePath, 'opaque.png');
  assert.equal(writes[0].lifecycleState, 'deleting');
  assert.deepEqual(events, ['stage', 'upload', 'activate']);
  assert.equal(JSON.stringify(writes[0]).includes('signed.invalid'), false);
});

test('failed metadata staging prevents Storage upload', async () => {
  let uploaded = false;
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: { async create() { throw new Error('db unavailable'); } } },
    storageOperations: {
      async uploadPrivateObject({ onPrepared }) { await onPrepared({ bucket: 'campaign-assets-private', path: 'opaque.png', contentType: 'image/png', byteLength: 12 }); uploaded = true; },
    },
    mode: () => 'private',
  });
  await assert.rejects(service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('image'), mimetype: 'image/png' }, purpose: 'campaign' }), { statusCode: 503 });
  assert.equal(uploaded, false);
});

test('failed upload leaves no active asset and failed cleanup remains tracked for retry', async () => {
  const staged = [];
  const recovered = [];
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: {
      async create({ data }) { staged.push(data); return { id: 42, ...data }; },
      async updateMany({ data }) { Object.assign(staged[0], data); return { count: 1 }; },
    } },
    storageOperations: { async uploadPrivateObject({ onPrepared }) { await onPrepared({ bucket: 'campaign-assets-private', path: 'failed.png', contentType: 'image/png', byteLength: 12 }); throw new Error('upload failed'); } },
    referenceOperations: { async resumeDeletion(id) { recovered.push(id); throw new Error('cleanup failed'); } },
    mode: () => 'private',
  });
  await assert.rejects(service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('image'), mimetype: 'image/png' }, purpose: 'campaign' }), { statusCode: 503 });
  assert.equal(staged[0].lifecycleState, 'deleting');
  assert.deepEqual(recovered, [42]);
});

test('upload byte validation retains its client error without staging metadata', async () => {
  let staged = false;
  const service = createMediaAccessService({
    prismaClient: { mediaAsset: { async create() { staged = true; } } },
    storageOperations: { async uploadPrivateObject() { throw Object.assign(new Error('Invalid image bytes.'), { statusCode: 400 }); } },
    mode: () => 'private',
  });
  await assert.rejects(service.createOwnedMediaAsset({ ownerId: 5, file: { buffer: Buffer.from('bad'), mimetype: 'image/png' }, purpose: 'campaign' }), { statusCode: 400 });
  assert.equal(staged, false);
});
