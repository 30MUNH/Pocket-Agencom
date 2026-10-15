const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/installPrismaFixture');
const { AIService } = require('../src/services/ai/aiService');

test('failed Vision analysis is not silently replaced by a text-only claim', async () => {
  const ai = new AIService();
  ai.gemini.isAvailable = () => true;
  ai.gemini.generateVision = async () => { throw new Error('provider error'); };
  let textCalls = 0;
  ai.generateText = async () => { textCalls += 1; return { text: 'not analyzed' }; };
  await assert.rejects(ai.generateDetailedPostWithImage({ ideaTitle: 'Coffee', ideaDescription: 'New photo', platform: 'Facebook', file: { buffer: Buffer.from('test'), mimetype: 'image/png' }, mediaAssetId: 5 }), { statusCode: 503 });
  assert.equal(textCalls, 0);
});
