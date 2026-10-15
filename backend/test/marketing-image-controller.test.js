const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/installPrismaFixture');

const mediaAccessModule = require('../src/services/mediaAccessService');
const mediaAccessFactory = mediaAccessModule.createMediaAccessService;
const aiService = require('../src/services/ai/aiService');
const originalVisionAvailability = aiService.gemini.isAvailable;
const marketingPlanService = require('../src/services/marketingPlanService');
const originalImageGeneration = marketingPlanService.generateDetailedPostWithImage;
const originalBusinessCheck = marketingPlanService.requireOwnedBusinessProfile;
let authorizationError = null;
marketingPlanService.requireOwnedBusinessProfile = async () => {
  if (authorizationError) throw authorizationError;
  return { id: 45, userId: 12 };
};
let assetCreationCalls = 0;
const deletedAssets = [];
let deletionFails = false;
mediaAccessModule.createMediaAccessService = () => ({
  async createOwnedMediaAsset() {
    assetCreationCalls += 1;
    return { id: 901 };
  },
  async deleteOwnedMediaAsset(ownerId, assetId) {
    deletedAssets.push({ ownerId, assetId });
    if (deletionFails) throw new Error('Storage cleanup pending');
    return { deleted: true };
  },
});
marketingPlanService.generateDetailedPostWithImage = async () => ({ content: 'Fake image-aware post' });
const controllerPath = require.resolve('../src/controllers/marketingPlanController');
delete require.cache[controllerPath];
const controller = require('../src/controllers/marketingPlanController');

test.after(() => {
  mediaAccessModule.createMediaAccessService = mediaAccessFactory;
  marketingPlanService.generateDetailedPostWithImage = originalImageGeneration;
  marketingPlanService.requireOwnedBusinessProfile = originalBusinessCheck;
  aiService.gemini.isAvailable = originalVisionAvailability;
  delete require.cache[controllerPath];
});

test('image-aware generation denies a foreign profile before upload or AI work', async () => {
  assetCreationCalls = 0;
  let aiCalls = 0;
  const priorGenerator = marketingPlanService.generateDetailedPostWithImage;
  marketingPlanService.generateDetailedPostWithImage = async () => { aiCalls += 1; return { content: 'unexpected' }; };
  aiService.gemini.isAvailable = () => true;
  authorizationError = Object.assign(new Error('Business profile not found.'), { statusCode: 404 });
  const req = {
    user: { id: 12, role: 'user' },
    file: { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'test.png' },
    body: { ideaTitle: 'Coffee', ideaDescription: 'New photo', platform: 'Facebook', businessProfileId: '99' },
  };
  let forwardedError;
  const res = { status() { return this; }, json() { return this; } };
  try {
    await controller.generatePostWithImage(req, res, (error) => { forwardedError = error; });
    assert.equal(forwardedError?.statusCode, 404);
    assert.equal(assetCreationCalls, 0);
    assert.equal(aiCalls, 0);
  } finally {
    authorizationError = null;
    marketingPlanService.generateDetailedPostWithImage = priorGenerator;
  }
});

test('image-input generation rejects when Gemini Vision is not eligible before storing an asset', async () => {
  assetCreationCalls = 0;
  aiService.gemini.isAvailable = () => false;
  const req = {
    user: { id: 12, role: 'user' },
    file: { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'test.png' },
    body: {
      ideaTitle: 'Cà phê rang xay',
      ideaDescription: 'Ảnh sản phẩm mới',
      platform: 'Facebook',
      businessProfileId: '45',
    },
  };
  let forwardedError;
  const res = { status() { return this; }, json() { return this; } };

  await controller.generatePostWithImage(req, res, (error) => { forwardedError = error; });

  assert.equal(forwardedError?.statusCode, 503);
  assert.match(forwardedError?.message || '', /Gemini Vision.*free-tier eligibility/);
  assert.equal(assetCreationCalls, 0);
});

test('Vision failure removes only the newly uploaded asset and returns an error', async () => {
  aiService.gemini.isAvailable = () => true;
  deletedAssets.length = 0;
  const prior = marketingPlanService.generateDetailedPostWithImage;
  marketingPlanService.generateDetailedPostWithImage = async () => { throw new Error('Vision unavailable'); };
  const req = { user: { id: 12, role: 'user' }, file: { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'test.png' }, body: { ideaTitle: 'Coffee', ideaDescription: 'New photo', platform: 'Facebook', businessProfileId: '45' } };
  let forwardedError;
  try {
    await controller.generatePostWithImage(req, { status() { return this; }, json() { return this; } }, (error) => { forwardedError = error; });
    assert.match(forwardedError?.message || '', /Vision unavailable/);
    assert.deepEqual(deletedAssets, [{ ownerId: 12, assetId: 901 }]);
  } finally { marketingPlanService.generateDetailedPostWithImage = prior; }
});

test('cleanup failure is surfaced without deleting another user asset', async () => {
  aiService.gemini.isAvailable = () => true;
  deletedAssets.length = 0;
  deletionFails = true;
  const prior = marketingPlanService.generateDetailedPostWithImage;
  marketingPlanService.generateDetailedPostWithImage = async () => { throw new Error('Vision unavailable'); };
  const req = { user: { id: 12, role: 'user' }, file: { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'test.png' }, body: { ideaTitle: 'Coffee', ideaDescription: 'New photo', platform: 'Facebook', businessProfileId: '45' } };
  let forwardedError;
  try {
    await controller.generatePostWithImage(req, { status() { return this; }, json() { return this; } }, (error) => { forwardedError = error; });
    assert.equal(forwardedError?.statusCode, 503);
    assert.deepEqual(deletedAssets, [{ ownerId: 12, assetId: 901 }]);
  } finally { deletionFails = false; marketingPlanService.generateDetailedPostWithImage = prior; }
});
