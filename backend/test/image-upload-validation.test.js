const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { createStorageService } = require('../src/services/storageService');

function setup() {
  const uploads = [];
  const storageClient = { storage: { from(bucket) { return {
    async upload(path, body, options) { uploads.push({ bucket, path, body, options }); return { error: null }; },
  }; } } };
  const service = createStorageService({ storageClient, env: {
    PRIVATE_STORAGE_MODE: 'private', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture',
  } });
  return { uploads, service };
}

test('invalid and mislabeled image bytes create no private object', async () => {
  const { uploads, service } = setup();
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#aabbcc' } }).jpeg().toBuffer();
  for (const file of [
    { buffer: Buffer.from('not an image'), mimetype: 'image/png' },
    { buffer: jpeg, mimetype: 'image/png' },
    { buffer: Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(128)]), mimetype: 'image/png' },
  ]) {
    await assert.rejects(service.uploadPrivateObject({ ownerId: 4, purpose: 'campaign', file }), { statusCode: 400 });
  }
  assert.equal(uploads.length, 0);
});

test('verified PNG bytes keep their original bytes and derived metadata', async () => {
  const { uploads, service } = setup();
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#aabbcc' } }).png().toBuffer();
  const result = await service.uploadPrivateObject({ ownerId: 4, purpose: 'avatar', file: { buffer: png, mimetype: 'image/png' } });
  assert.equal(result.contentType, 'image/png');
  assert.match(result.path, /\.png$/);
  assert.deepEqual(uploads[0].body, png);
  assert.equal(uploads[0].options.contentType, 'image/png');
});
