const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
require('./helpers/installPrismaFixture');

function loadAIService(createOwnedMediaAsset) {
  const mediaPath = require.resolve('../src/services/mediaAccessService');
  require.cache[mediaPath] = { id: mediaPath, filename: mediaPath, loaded: true,
    exports: { createMediaAccessService: () => ({ createOwnedMediaAsset }) } };
  const aiPath = require.resolve('../src/services/ai/aiService');
  delete require.cache[aiPath];
  return require('../src/services/ai/aiService');
}

test('processed JPEG and original PNG are persisted with their own verified MIME types', async () => {
  const previousMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  const files = [];
  const aiModule = loadAIService(async ({ file }) => { files.push(file); return { id: files.length }; });
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#aabbcc' } }).jpeg().toBuffer();
  const png = await sharp(jpeg).png().toBuffer();
  const ai = new aiModule.AIService();
  ai.getImageProvidersInPriority = () => [{ name: 'cloudflare', instance: { async generateImage() {
    return { buffer: jpeg, originalBuffer: png, mimeType: 'image/jpeg', originalMimeType: 'image/png', postProcessed: true,
      provider: 'cloudflare', model: 'fixture' };
  } } }];
  try {
    const result = await ai.generateSocialImage({ prompt: 'Coffee photo', userId: 501, aspectRatio: '4:5' });
    assert.equal(result.mediaAssetId, 1);
    assert.equal(result.originalMediaAssetId, 2);
    assert.deepEqual(files.map((file) => file.mimetype), ['image/jpeg', 'image/png']);
  } finally {
    if (previousMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousMode;
  }
});

test('a failed optional original upload returns the persisted processed image with an explicit warning', async () => {
  const previousMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  let uploads = 0;
  const aiModule = loadAIService(async () => {
    uploads += 1;
    if (uploads === 2) throw new Error('original upload failed');
    return { id: 19 };
  });
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#aabbcc' } }).jpeg().toBuffer();
  const ai = new aiModule.AIService();
  ai.getImageProvidersInPriority = () => [{ name: 'cloudflare', instance: { async generateImage() {
    return { buffer: image, originalBuffer: image, mimeType: 'image/jpeg', originalMimeType: 'image/jpeg',
      postProcessed: true, provider: 'cloudflare', model: 'fixture' };
  } } }];
  try {
    const result = await ai.generateSocialImage({ prompt: 'Coffee photo', userId: 502, aspectRatio: '4:5' });
    assert.equal(result.mediaAssetId, 19);
    assert.equal(result.originalMediaAssetId, null);
    assert.equal(result.originalSaveFailed, true);
  } finally {
    if (previousMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousMode;
  }
});

test('persisted MIME follows decoded bytes even when provider labels are wrong', async () => {
  const previousMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  const files = [];
  const aiModule = loadAIService(async ({ file }) => { files.push(file); return { id: files.length }; });
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#aabbcc' } }).png().toBuffer();
  const jpeg = await sharp(png).jpeg().toBuffer();
  const ai = new aiModule.AIService();
  ai.getImageProvidersInPriority = () => [{ name: 'cloudflare', instance: { async generateImage() {
    return { buffer: jpeg, originalBuffer: png, mimeType: 'image/png', originalMimeType: 'image/jpeg',
      postProcessed: true, provider: 'cloudflare', model: 'fixture' };
  } } }];
  try {
    await ai.generateSocialImage({ prompt: 'Coffee photo', userId: 503, aspectRatio: '4:5' });
    assert.deepEqual(files.map((file) => file.mimetype), ['image/jpeg', 'image/png']);
  } finally {
    if (previousMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousMode;
  }
});
