const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSocialImageSchema, generateImagePromptSchema, refinePlanSchema } = require('../src/validators/marketingPlan.validator');
const aiConfig = require('../src/services/ai/aiConfig');
const aiService = require('../src/services/ai/aiService');
const analyticsService = require('../src/services/analyticsService');
const socialService = require('../src/services/socialService');
const scheduledPostService = require('../src/services/scheduledPostService');
const mediaService = require('../src/services/mediaService');

// Use minimal backoff delay for fast test execution
aiConfig.limits.backoffBaseMs = 1;

test('AI Architecture: aspect ratio schema enforces allowed social media aspect ratios', () => {
  const validRatios = ['1:1', '4:5', '9:16', '16:9'];
  for (const ratio of validRatios) {
    const parsed = generateSocialImageSchema.safeParse({
      prompt: 'A beautiful commercial coffee photo',
      aspectRatio: ratio,
      platform: 'Instagram',
    });
    assert.equal(parsed.success, true, `Expected ratio ${ratio} to be valid`);
  }

  const invalidRatios = ['21:9', '3:2', '2:3', 'custom', ''];
  for (const ratio of invalidRatios) {
    const parsed = generateSocialImageSchema.safeParse({
      prompt: 'A beautiful commercial coffee photo',
      aspectRatio: ratio,
    });
    assert.equal(parsed.success, false, `Expected ratio ${ratio} to be rejected`);
  }
});

test('AI Architecture: prompt validators enforce minimum length and required content', () => {
  // generateSocialImageSchema
  const shortImagePrompt = generateSocialImageSchema.safeParse({ prompt: 'abc' });
  assert.equal(shortImagePrompt.success, false);
  assert.match(shortImagePrompt.error.issues[0].message, /ít nhất 5 ký tự/);

  // generateImagePromptSchema
  const shortContent = generateImagePromptSchema.safeParse({ postContent: 'hey' });
  assert.equal(shortContent.success, false);
  assert.match(shortContent.error.issues[0].message, /ít nhất 5 ký tự/);

  // refinePlanSchema
  const shortInstruction = refinePlanSchema.safeParse({ instruction: 'no' });
  assert.equal(shortInstruction.success, false);
  assert.match(shortInstruction.error.issues[0].message, /ít nhất 3 ký tự/);
});

test('AI Architecture: transient error detection identifies 429 rate limit, 503, and network timeouts', () => {
  assert.equal(aiService.isTransientError({ status: 429 }), true);
  assert.equal(aiService.isTransientError({ response: { status: 429 } }), true);
  assert.equal(aiService.isTransientError({ message: 'Rate limit exceeded: 429' }), true);
  assert.equal(aiService.isTransientError({ message: 'ETIMEDOUT connecting to provider' }), true);
  assert.equal(aiService.isTransientError({ code: 'ECONNRESET' }), true);
  assert.equal(aiService.isTransientError({ status: 503 }), true);

  // Non-transient errors (should fail fast without endless retry)
  assert.equal(aiService.isTransientError({ status: 400, message: 'Bad request invalid payload' }), false);
  assert.equal(aiService.isTransientError({ status: 401, message: 'Invalid API key' }), false);
  assert.equal(aiService.isTransientError({ status: 404, message: 'Model not found' }), false);
});

test('AI Architecture: AI configuration defines prioritized models and timeouts', () => {
  assert.ok(aiConfig.defaultTextModels.groq);
  assert.ok(aiConfig.defaultTextModels.openrouter);
  assert.ok(aiConfig.defaultTextModels.gemini);

  assert.ok(aiConfig.defaultImageModels.fal);
  assert.ok(aiConfig.defaultImageModels.openrouter);

  assert.equal(typeof aiConfig.limits.requestTimeoutMs, 'number');
  assert.ok(aiConfig.limits.requestTimeoutMs >= 10000);
  assert.equal(typeof aiConfig.limits.maxRetries, 'number');
  assert.ok(aiConfig.limits.maxRetries >= 1);

  // Standard social aspect ratios
  assert.ok(aiConfig.aspectRatios['1:1']);
  assert.ok(aiConfig.aspectRatios['4:5']);
  assert.ok(aiConfig.aspectRatios['9:16']);
  assert.ok(aiConfig.aspectRatios['16:9']);
});

test('AI Architecture: multi-provider priority fallback when primary provider encounters an error', async () => {
  const customService = new aiService.AIService();

  // Mock primary provider that fails with 429
  let primaryCallCount = 0;
  const mockFailingPrimary = {
    generateText: async () => {
      primaryCallCount++;
      const err = new Error('Rate limit 429');
      err.status = 429;
      throw err;
    },
  };

  // Mock secondary provider that succeeds
  let secondaryCallCount = 0;
  const mockSucceedingSecondary = {
    generateText: async ({ prompt }) => {
      secondaryCallCount++;
      return { text: `Success fallback response for: ${prompt}`, provider: 'mockSecondary', model: 'test-model' };
    },
  };

  // Override provider list
  customService.getTextProvidersInPriority = () => [
    { name: 'mockPrimary', instance: mockFailingPrimary },
    { name: 'mockSecondary', instance: mockSucceedingSecondary },
  ];

  const result = await customService.generateText({ prompt: 'Test marketing prompt' });
  assert.ok(primaryCallCount >= 1, 'Primary provider should have been attempted');
  assert.equal(secondaryCallCount, 1, 'Secondary provider should have succeeded on fallback');
  assert.equal(result.provider, 'mockSecondary');
  assert.match(result.text, /Success fallback response/);
});

test('AI Architecture: throws explicit error when all providers fail without returning mock plan data', async () => {
  const customService = new aiService.AIService();

  const mockFail1 = {
    generateText: async () => {
      const err = new Error('Groq 500 error');
      err.status = 500;
      throw err;
    },
  };
  const mockFail2 = {
    generateText: async () => {
      const err = new Error('Gemini 503 error');
      err.status = 503;
      throw err;
    },
  };

  customService.getTextProvidersInPriority = () => [
    { name: 'groq', instance: mockFail1 },
    { name: 'gemini', instance: mockFail2 },
  ];

  await assert.rejects(
    async () => {
      await customService.generateText({ prompt: 'Generate marketing plan' });
    },
    (err) => {
      // Must throw honest 502/503 AppError, never return dummy fake response
      return err.statusCode === 503 || err.statusCode === 502;
    }
  );
});

test('Honest Data Layer: analytics never fabricates metrics using Math.random', () => {
  // Unrecorded profile returns empty metrics array without random fake counts
  const emptyMetrics = analyticsService.generatePlatformMetrics('facebook', 'social', null, null);
  assert.deepEqual(emptyMetrics, []);

  // When followers and ER are genuinely recorded, they are accurately reported
  const recordedMetrics = analyticsService.generatePlatformMetrics('facebook', 'social', 1250, 4.2);
  assert.equal(recordedMetrics.length, 2);
  assert.equal(recordedMetrics[0].key, 'followers');
  assert.equal(recordedMetrics[0].value, 1250);
  assert.equal(recordedMetrics[1].key, 'er');
  assert.equal(recordedMetrics[1].value, 4.2);

  // Platform type inference
  assert.equal(analyticsService.inferPlatformType('shopee'), 'ecommerce');
  assert.equal(analyticsService.inferPlatformType('instagram'), 'social');
  assert.equal(analyticsService.inferPlatformType('unknown_platform'), 'custom');
});

test('Honest Data Layer: scheduled posts and media stores return honest empty state when unpopulated', async () => {
  const posts = await scheduledPostService.getScheduledPosts(88888);
  assert.ok(Array.isArray(posts));
  assert.equal(posts.length, 0, 'Must not return hardcoded KitKat demo posts');

  const assets = await mediaService.getMediaAssets(88888);
  assert.ok(Array.isArray(assets));
  assert.equal(assets.length, 0, 'Must not return hardcoded Unsplash demo assets');
});

test('Honest Data Layer: social metrics does not hallucinate follower numbers when scraper is unavailable', async () => {
  const res = await socialService.analyzeSocialProfile('https://instagram.com/pocket_test', 'instagram');
  assert.ok(res);
  // Followers must default to 0 (or null), never a random number from Math.random
  assert.equal(res.followers, 0);
  assert.equal(res.engagementRate, 0);
  assert.ok(Array.isArray(res.strengths));
  assert.ok(Array.isArray(res.areasToImprove));
});
