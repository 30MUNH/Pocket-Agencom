const test = require('node:test');
const assert = require('node:assert/strict');
const { createStorageService, PRIVATE_BUCKETS, assertStorageConfiguration } = require('../src/services/storageService');

function fakeStorage() {
  const calls = [];
  return {
    calls,
    storage: { from(bucket) { return {
      async upload(path, body, options) { calls.push({ type: 'upload', bucket, path, body, options }); return { data: { path }, error: null }; },
      async remove(paths) { calls.push({ type: 'remove', bucket, paths }); return { data: paths, error: null }; },
      async createSignedUrl(path, seconds, options) { calls.push({ type: 'sign', bucket, path, seconds, options }); return { data: { signedUrl: `https://signed.invalid/${bucket}/${path}?token=secret` }, error: null }; },
    }; } },
  };
}

test('private storage defaults disabled and private configuration fails closed', async () => {
  const service = createStorageService({ storageClient: fakeStorage(), env: {} });
  await assert.rejects(service.uploadPrivateObject({ ownerId: 5, purpose: 'campaign', file: { buffer: Buffer.from('x'), mimetype: 'image/png' } }), { statusCode: 503 });
  assert.throws(() => assertStorageConfiguration('private', {}), { statusCode: 503 });
});

test('private upload selects purpose bucket and opaque path server-side', async () => {
  const storageClient = fakeStorage();
  const service = createStorageService({ storageClient, env: { PRIVATE_STORAGE_MODE: 'private', SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-only' } });
  const result = await service.uploadPrivateObject({ ownerId: 5, purpose: 'avatar', file: { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'private.png' } });
  assert.equal(result.bucket, PRIVATE_BUCKETS.avatars);
  assert.match(result.path, /^[0-9a-f-]+\.png$/);
  assert.equal(Object.hasOwn(result, 'url'), false);
  assert.equal(storageClient.calls[0].path.includes('user-5'), false);
  assert.equal(storageClient.calls[0].options.upsert, false);
});

test('private storage failure never falls back to a public bucket and does not leak errors', async () => {
  const storageClient = fakeStorage();
  storageClient.storage.from = (bucket) => ({ async upload(path) { storageClient.calls.push({ bucket, path }); return { error: { message: 'secret token and object path' } }; } });
  const service = createStorageService({ storageClient, env: { PRIVATE_STORAGE_MODE: 'private', SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-only' } });
  await assert.rejects(service.uploadPrivateObject({ ownerId: 5, purpose: 'campaign', file: { buffer: Buffer.from('x'), mimetype: 'image/png' } }), (error) => !error.message.includes('secret token') && !error.message.includes('server-only'));
  assert.equal(storageClient.calls.length, 1);
  assert.equal(storageClient.calls[0].bucket, PRIVATE_BUCKETS.campaign);
});
