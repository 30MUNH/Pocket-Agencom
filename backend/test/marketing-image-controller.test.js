const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/installPrismaFixture');

const mediaAccessModule = require('../src/services/mediaAccessService');
const mediaAccessFactory = mediaAccessModule.createMediaAccessService;
const aiService = require('../src/services/ai/aiService');
const originalVisionAvailability = aiService.gemini.isAvailable;
const marketingPlanService = require('../src/services/marketingPlanService');
const originalImageGeneration = marketingPlanService.generateDetailedPostWithImage;
let assetCreationCalls = 0;
mediaAccessModule.createMediaAccessService = () => ({
  async createOwnedMediaAsset() {
    assetCreationCalls += 1;
    return { id: 901 };
  },
});
marketingPlanService.generateDetailedPostWithImage = async () => ({ content: 'Fake image-aware post' });
const controllerPath = require.resolve('../src/controllers/marketingPlanController');
delete require.cache[controllerPath];
const controller = require('../src/controllers/marketingPlanController');

test.after(() => {
  mediaAccessModule.createMediaAccessService = mediaAccessFactory;
  marketingPlanService.generateDetailedPostWithImage = originalImageGeneration;
  aiService.gemini.isAvailable = originalVisionAvailability;
  delete require.cache[controllerPath];
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
