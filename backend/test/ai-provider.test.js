const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { generateSocialImageSchema, generateImagePromptSchema, refinePlanSchema } = require('../src/validators/marketingPlan.validator');
const aiConfig = require('../src/services/ai/aiConfig');
const aiService = require('../src/services/ai/aiService');
const analyticsService = require('../src/services/analyticsService');
const socialService = require('../src/services/socialService');
const scheduledPostService = require('../src/services/scheduledPostService');
const mediaService = require('../src/services/mediaService');
const CloudflareProvider = require('../src/services/ai/providers/cloudflareProvider');
const FalProvider = require('../src/services/ai/providers/falProvider');
const GroqProvider = require('../src/services/ai/providers/groqProvider');

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

test('Zero-Cost Free Tier: model whitelist verifies zero-cost models and rejects paid ones', () => {
  // Groq verified free
  assert.equal(aiConfig.isModelFree('groq', 'openai/gpt-oss-120b'), true);
  // Groq deprecated or unverified
  assert.equal(aiConfig.isModelFree('groq', 'llama-3.3-70b-versatile'), false);
  assert.equal(aiConfig.isModelFree('groq', 'unknown/model'), false);

  // OpenRouter verified free
  assert.equal(aiConfig.isModelFree('openrouter', 'openrouter/free'), true);
  assert.equal(aiConfig.isModelFree('openrouter', 'meta-llama/llama-3.3-70b-instruct:free'), true);
  // OpenRouter paid models
  assert.equal(aiConfig.isModelFree('openrouter', 'openai/gpt-4o'), false);
  assert.equal(aiConfig.isModelFree('openrouter', 'anthropic/claude-3.5-sonnet'), false);

  // Gemini verified free
  assert.equal(aiConfig.isModelFree('gemini', 'gemini-2.0-flash'), true);
  assert.equal(aiConfig.isModelFree('gemini', 'gemini-2.5-flash'), true);
  assert.equal(aiConfig.isModelFree('gemini', 'gemini-1.5-pro'), false);

  // Cloudflare Workers AI free tier
  assert.equal(aiConfig.isModelFree('cloudflare', '@cf/black-forest-labs/flux-1-schnell'), true);

  // fal.ai is always paid
  assert.equal(aiConfig.isModelFree('fal', 'fal-ai/flux/schnell'), false);
});

test('Zero-Cost Free Tier: fal.ai provider is disabled in FREE_ONLY_MODE', async () => {
  const fal = new FalProvider('mock-fal-key');
  assert.equal(fal.isAvailable(), false, 'fal.ai must not be available in free-only mode');

  await assert.rejects(
    async () => {
      await fal.generateImage({ prompt: 'A cup of coffee' });
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /FREE_ONLY_MODE/);
      return true;
    }
  );
});

test('Zero-Cost Free Tier: GroqProvider rejects unverified or paid models in FREE_ONLY_MODE', async () => {
  const groq = new GroqProvider('mock-groq-key', 'unverified-paid-model');
  assert.equal(groq.isAvailable(), false);

  await assert.rejects(
    async () => {
      await groq.generateText({ prompt: 'Hello', model: 'unverified-paid-model' });
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /not in the verified free-tier whitelist/);
      return true;
    }
  );
});

test('Zero-Cost Free Tier: Cloudflare Workers AI sharp center-crop produces accurate aspect ratios', async () => {
  const cf = new CloudflareProvider('mock-account', 'mock-token');

  // Create a 1024x1024 test PNG/JPEG buffer with sharp
  const testSquareBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: { r: 50, g: 100, b: 150 },
    },
  }).jpeg().toBuffer();

  // Test 1:1 (Square - no crop needed)
  const result1x1 = await cf.postProcessImageWithSharp(testSquareBuffer, '1:1');
  const meta1x1 = await sharp(result1x1.buffer).metadata();
  assert.equal(meta1x1.width, 1024);
  assert.equal(meta1x1.height, 1024);
  assert.equal(result1x1.postProcessed, false);

  // Test 4:5 (Instagram / Facebook feed)
  const result4x5 = await cf.postProcessImageWithSharp(testSquareBuffer, '4:5');
  const meta4x5 = await sharp(result4x5.buffer).metadata();
  assert.equal(meta4x5.width, 896);
  assert.equal(meta4x5.height, 1120);
  assert.equal(result4x5.postProcessed, true);

  // Test 9:16 (TikTok / Reels / Story)
  const result9x16 = await cf.postProcessImageWithSharp(testSquareBuffer, '9:16');
  const meta9x16 = await sharp(result9x16.buffer).metadata();
  assert.equal(meta9x16.width, 768);
  assert.equal(meta9x16.height, 1344);
  assert.equal(result9x16.postProcessed, true);

  // Test 16:9 (YouTube / Blog / Cover)
  const result16x9 = await cf.postProcessImageWithSharp(testSquareBuffer, '16:9');
  const meta16x9 = await sharp(result16x9.buffer).metadata();
  assert.equal(meta16x9.width, 1344);
  assert.equal(meta16x9.height, 768);
  assert.equal(result16x9.postProcessed, true);
});

test('Zero-Cost Free Tier: user daily quotas enforce limits and reject requests when exhausted', () => {
  const testUserId = 99991;

  // Consume text quota up to limit
  for (let i = 0; i < aiConfig.userQuotas.dailyGenerationsLimit; i++) {
    const res = aiService.checkAndIncrementUserQuota(testUserId, 'text');
    assert.equal(res.allowed, true);
  }

  // Next text generation attempt must throw 429
  assert.throws(
    () => {
      aiService.checkAndIncrementUserQuota(testUserId, 'text');
    },
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /đạt giới hạn sử dụng AI miễn phí trong ngày/);
      return true;
    }
  );

  // Check quota status reporting
  const status = aiService.getUserQuotaStatus(testUserId);
  assert.equal(status.text.used, aiConfig.userQuotas.dailyGenerationsLimit);
  assert.equal(status.text.remaining, 0);
  assert.equal(status.image.remaining, aiConfig.userQuotas.dailyImagesLimit);
});

test('Persistence: scheduled post format extracts embedded image URLs without schema drift', () => {
  const rawPost = {
    id: 101,
    title: 'Bài viết quảng cáo cà phê',
    content: 'Thưởng thức cà phê nguyên chất mỗi sáng!\n\n[IMAGE_URL: https://storage.pocket-agencom.com/ai-123.jpg]',
  };

  const formatted = scheduledPostService.formatPostWithImage(rawPost);
  assert.equal(formatted.title, 'Bài viết quảng cáo cà phê');
  assert.equal(formatted.content, 'Thưởng thức cà phê nguyên chất mỗi sáng!');
  assert.equal(formatted.imageUrl, 'https://storage.pocket-agencom.com/ai-123.jpg');

  // Post without image should remain untouched
  const noImagePost = { id: 102, title: 'Bài viết thường', content: 'Chỉ có văn bản thuần.' };
  const formattedNoImg = scheduledPostService.formatPostWithImage(noImagePost);
  assert.equal(formattedNoImg.content, 'Chỉ có văn bản thuần.');
  assert.equal(formattedNoImg.imageUrl, null);
});

