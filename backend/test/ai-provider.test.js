const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const sharp = require('sharp');
const prismaFixture = require('./helpers/installPrismaFixture');
const { generateSocialImageSchema, generateImagePromptSchema, refinePlanSchema } = require('../src/validators/marketingPlan.validator');
const aiConfig = require('../src/services/ai/aiConfig');
const aiService = require('../src/services/ai/aiService');

function loadAiConfigWithEnvironment(overrides) {
  const modulePath = require.resolve('../src/services/ai/aiConfig');
  const previousModule = require.cache[modulePath];
  const previousEnvironment = new Map(Object.keys(overrides).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
    delete require.cache[modulePath];
    return require(modulePath);
  } finally {
    for (const [key, value] of previousEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    delete require.cache[modulePath];
    if (previousModule) require.cache[modulePath] = previousModule;
  }
}
const analyticsService = require('../src/services/analyticsService');
const socialService = require('../src/services/socialService');
const scheduledPostService = require('../src/services/scheduledPostService');
const mediaService = require('../src/services/mediaService');
const marketingPlanService = require('../src/services/marketingPlanService');
const CloudflareProvider = require('../src/services/ai/providers/cloudflareProvider');
const FalProvider = require('../src/services/ai/providers/falProvider');
const GroqProvider = require('../src/services/ai/providers/groqProvider');
const OpenRouterProvider = require('../src/services/ai/providers/openRouterProvider');

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

test('direct image service rejects invalid requests before quota or provider use', async () => {
  const userId = 690;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'image');
  const service = new aiService.AIService();
  let providerCalls = 0;
  service.getImageProvidersInPriority = () => [{ name: 'fixture', instance: { async generateImage() { providerCalls += 1; } } }];
  await assert.rejects(service.generateSocialImage({ prompt: 'abc', aspectRatio: '21:9', userId }), { statusCode: 422 });
  assert.equal(providerCalls, 0);
  assert.equal((await aiService.getUserQuotaStatus(userId)).image.used, 0);
});

test('no eligible free image provider leaves quota untouched', async () => {
  const userId = 691;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'image');
  const service = new aiService.AIService();
  service.getImageProvidersInPriority = () => [];
  const previousMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  try {
    await assert.rejects(service.generateSocialImage({ prompt: 'Coffee launch photo', userId }), { statusCode: 503 });
    assert.equal((await aiService.getUserQuotaStatus(userId)).image.used, 0);
  } finally {
    if (previousMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousMode;
  }
});

test('concurrency rejection does not reserve image quota', async () => {
  const userId = 692;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'image');
  const service = new aiService.AIService();
  service.getImageProvidersInPriority = () => [{ name: 'fixture', instance: {} }];
  service.acquireConcurrencySlot = async () => { throw Object.assign(new Error('busy'), { statusCode: 429 }); };
  const previousMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  try {
    await assert.rejects(service.generateSocialImage({ prompt: 'Coffee launch photo', userId }), { statusCode: 429 });
    assert.equal((await aiService.getUserQuotaStatus(userId)).image.used, 0);
  } finally {
    if (previousMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousMode;
  }
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

test('OpenRouter empty responses fall through to the next text provider', async () => {
  const originalPost = axios.post;
  axios.post = async () => ({ data: { choices: [{ message: { role: 'assistant', content: '' } }] } });
  try {
    const customService = new aiService.AIService();
    const openrouter = new OpenRouterProvider('test-key', 'openrouter/free');
    let fallbackCalls = 0;
    customService.getTextProvidersInPriority = () => [
      { name: 'openrouter', instance: openrouter },
      {
        name: 'gemini',
        instance: {
          generateText: async () => {
            fallbackCalls++;
            return { text: 'Fallback response', provider: 'gemini', model: 'gemini-2.5-flash' };
          },
        },
      },
    ];

    const result = await customService.generateText({ prompt: 'Return a short response.' });
    assert.equal(result.provider, 'gemini');
    assert.equal(result.text, 'Fallback response');
    assert.equal(fallbackCalls, 1);
  } finally {
    axios.post = originalPost;
  }
});

test('free OpenRouter rate limits fall through after one attempt instead of retrying the same route', async () => {
  const originalPost = axios.post;
  let openRouterCalls = 0;
  axios.post = async () => {
    openRouterCalls++;
    const error = new Error('rate limited');
    error.response = { status: 429, headers: {}, data: { error: { message: 'rate limited' } } };
    throw error;
  };

  try {
    const service = new aiService.AIService();
    service.getTextProvidersInPriority = () => [
      { name: 'openrouter', instance: new OpenRouterProvider('test-key', 'openrouter/free') },
      { name: 'secondary', instance: { isAvailable: () => true, generateText: async () => ({ text: 'fallback', provider: 'secondary' }) } },
    ];
    const result = await service.generateText({ prompt: 'short' });

    assert.equal(openRouterCalls, 1);
    assert.equal(result.provider, 'secondary');
  } finally {
    axios.post = originalPost;
  }
});

test('OpenRouter reports the underlying routed model returned by the provider', async () => {
  const originalPost = axios.post;
  axios.post = async () => ({
    data: {
      model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      choices: [{ message: { role: 'assistant', content: 'Nội dung thử nghiệm.' } }],
      usage: { total_tokens: 10, cost: 0 },
    },
  });
  try {
    const provider = new OpenRouterProvider('test-key', 'openrouter/free');
    const result = await provider.generateText({ prompt: 'Viết một câu tiếng Việt.' });
    assert.equal(result.model, 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free');
  } finally {
    axios.post = originalPost;
  }
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

test('social analysis surfaces provider failure instead of presenting static advice as generated output', async () => {
  const originalGet = axios.get;
  axios.get = async () => { throw new Error('Deterministic offline scraper fixture'); };
  try {
    await assert.rejects(
      socialService.analyzeSocialProfile('https://instagram.com/pocket_test', 'instagram'),
      { statusCode: 503 },
    );
  } finally {
    axios.get = originalGet;
  }
});

test('social analysis consumes one persistent text quota unit for its owner', async () => {
  const userId = 501;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'text');
  const originalGet = axios.get;
  const originalStructured = aiService.generateStructuredContent;
  axios.get = async () => { throw new Error('Deterministic offline scraper fixture'); };
  aiService.generateStructuredContent = async () => ({
    data: { strengths: ['Định vị rõ ràng'], areasToImprove: ['Thêm lời kêu gọi hành động'] },
  });

  try {
    await socialService.analyzeSocialProfile('https://instagram.com/pocket_test', 'instagram', userId);
    assert.equal((await aiService.getUserQuotaStatus(userId)).text.used, 1);
  } finally {
    axios.get = originalGet;
    aiService.generateStructuredContent = originalStructured;
    prismaFixture.__fixture.resetQuota(userId, dateKey, 'text');
  }
});

test('FREE_ONLY_MODE blocks account-unverified providers and unknown Cloudflare models', () => {
  const config = loadAiConfigWithEnvironment({
    FREE_ONLY_MODE: 'true',
    AI_ALLOW_PAID_MODELS: 'false',
    AI_FREE_TIER_CONFIRMED_GROQ: 'false',
    AI_FREE_TIER_CONFIRMED_GEMINI: 'false',
    AI_FREE_TIER_CONFIRMED_CLOUDFLARE: 'false',
  });

  assert.equal(config.isModelFree('groq', 'openai/gpt-oss-120b'), false);
  assert.equal(config.isModelFree('gemini', 'gemini-2.5-flash'), false);
  assert.equal(config.isModelFree('gemini', 'gemini-2.5-flash-pro'), false);
  assert.equal(config.isModelFree('cloudflare', '@cf/black-forest-labs/flux-1-schnell'), false);
  assert.equal(config.isModelFree('cloudflare', '@cf/vendor/metered-model'), false);
  assert.equal(config.isModelFree('openrouter', 'openrouter/free'), true);
  assert.equal(config.isModelFree('openrouter', 'openai/gpt-4o'), false);
  assert.equal(config.isModelFree('fal', 'fal-ai/flux/schnell'), false);
});

test('FREE_ONLY_MODE permits listed providers only after explicit account free-tier confirmation', () => {
  const config = loadAiConfigWithEnvironment({
    FREE_ONLY_MODE: 'true',
    AI_ALLOW_PAID_MODELS: 'false',
    AI_FREE_TIER_CONFIRMED_GROQ: 'true',
    AI_FREE_TIER_CONFIRMED_GEMINI: 'true',
    AI_FREE_TIER_CONFIRMED_CLOUDFLARE: 'true',
  });

  assert.equal(config.isModelFree('groq', 'openai/gpt-oss-120b'), true);
  assert.equal(config.isModelFree('gemini', 'gemini-2.5-flash'), true);
  assert.equal(config.isModelFree('gemini', 'gemini-2.5-flash-pro'), false);
  assert.equal(config.isModelFree('cloudflare', '@cf/black-forest-labs/flux-1-schnell'), true);
  assert.equal(config.isModelFree('cloudflare', '@cf/vendor/metered-model'), false);
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

test('Cloudflare Workers AI sends a bounded Vietnamese JSON request only for a confirmed free text model', async () => {
  const previousConfirmation = aiConfig.freeTierConfirmed.cloudflare;
  const originalPost = axios.post;
  let request;
  aiConfig.freeTierConfirmed.cloudflare = true;
  axios.post = async (url, payload, options) => {
    request = { url, payload, options };
    return { data: { result: { response: '{"title":"Ưu đãi cà phê","caption":"Mời bạn ghé quán hôm nay."}' } } };
  };

  try {
    const provider = new CloudflareProvider('test-account', 'test-token', undefined, '@cf/zai-org/glm-4.7-flash');
    const result = await provider.generateText({
      prompt: 'Viết một caption ngắn cho quán cà phê Việt Nam.',
      systemPrompt: 'Trả về JSON hợp lệ gồm title và caption.',
      maxTokens: 96,
      jsonMode: true,
      timeoutMs: 2345,
    });

    assert.deepEqual(result, {
      text: '{"title":"Ưu đãi cà phê","caption":"Mời bạn ghé quán hôm nay."}',
      provider: 'cloudflare',
      model: '@cf/zai-org/glm-4.7-flash',
      usage: null,
    });
    assert.equal(request.url, 'https://api.cloudflare.com/client/v4/accounts/test-account/ai/run/@cf/zai-org/glm-4.7-flash');
    assert.deepEqual(request.payload.messages, [
      { role: 'system', content: 'Trả về JSON hợp lệ gồm title và caption.' },
      { role: 'user', content: 'Viết một caption ngắn cho quán cà phê Việt Nam.' },
    ]);
    assert.equal(request.payload.max_tokens, 96);
    assert.deepEqual(request.payload.response_format, { type: 'json_object' });
    assert.equal(request.options.timeout, 2345);
    assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  } finally {
    aiConfig.freeTierConfirmed.cloudflare = previousConfirmation;
    axios.post = originalPost;
  }
});

test('Cloudflare GPT-OSS uses Chat Completions with low reasoning effort and bounded JSON output', async () => {
  const previousConfirmation = aiConfig.freeTierConfirmed.cloudflare;
  const originalPost = axios.post;
  let request;
  aiConfig.freeTierConfirmed.cloudflare = true;
  axios.post = async (url, payload, options) => {
    request = { url, payload, options };
    return { data: { model: '@cf/openai/gpt-oss-20b', choices: [{ message: { content: '{"ok":true,"caption":"Xin chào bạn."}' } }], usage: { neurons: 1.25 } } };
  };

  try {
    const provider = new CloudflareProvider('test-account', 'test-token', undefined, '@cf/openai/gpt-oss-20b');
    const result = await provider.generateText({ prompt: 'Create the requested JSON object.', systemPrompt: 'Return JSON.', maxTokens: 80, jsonMode: true });

    assert.equal(request.url, 'https://api.cloudflare.com/client/v4/accounts/test-account/ai/v1/chat/completions');
    assert.equal(request.payload.model, '@cf/openai/gpt-oss-20b');
    assert.equal(request.payload.max_tokens, 80);
    assert.equal(request.payload.reasoning_effort, 'low');
    assert.deepEqual(request.payload.response_format, { type: 'json_object' });
    assert.equal(result.text, '{"ok":true,"caption":"Xin chào bạn."}');
    assert.deepEqual(result.usage, { neurons: 1.25 });
  } finally {
    aiConfig.freeTierConfirmed.cloudflare = previousConfirmation;
    axios.post = originalPost;
  }
});

test('Cloudflare text defaults to the measured structured-output model unless explicitly overridden', () => {
  assert.equal(
    aiConfig.defaultTextModels.cloudflare,
    process.env.CLOUDFLARE_TEXT_MODEL || '@cf/openai/gpt-oss-20b'
  );
});

test('AIService routes text generation to Cloudflare when it is the configured confirmed free provider', async () => {
  const originalPost = axios.post;
  const previousProvider = aiConfig.textProvider;
  const previousConfirmation = aiConfig.freeTierConfirmed.cloudflare;
  aiConfig.textProvider = 'cloudflare';
  aiConfig.freeTierConfirmed.cloudflare = true;
  axios.post = async () => ({ data: { result: { response: 'Xin chào từ Cloudflare.' } } });

  try {
    const service = new aiService.AIService();
    service.cloudflare = new CloudflareProvider('test-account', 'test-token', undefined, '@cf/zai-org/glm-4.7-flash');
    const result = await service.generateText({ prompt: 'Trả lời bằng tiếng Việt.', maxTokens: 48 });

    assert.equal(result.provider, 'cloudflare');
    assert.equal(result.text, 'Xin chào từ Cloudflare.');
    assert.equal(service.getUsageStats().recent.at(-1).provider, 'cloudflare');
  } finally {
    aiConfig.textProvider = previousProvider;
    aiConfig.freeTierConfirmed.cloudflare = previousConfirmation;
    axios.post = originalPost;
  }
});

test('Cloudflare provider errors do not expose upstream bodies, prompts, or credentials', async () => {
  const originalPost = axios.post;
  const previousConfirmation = aiConfig.freeTierConfirmed.cloudflare;
  aiConfig.freeTierConfirmed.cloudflare = true;
  axios.post = async () => {
    const error = new Error('upstream rejected Bearer test-token and private prompt');
    error.response = {
      status: 503,
      data: { errors: [{ message: 'Bearer test-token and private prompt' }] },
    };
    throw error;
  };

  try {
    const provider = new CloudflareProvider('test-account', 'test-token', '@cf/black-forest-labs/flux-1-schnell', '@cf/zai-org/glm-4.7-flash');
    for (const operation of [
      () => provider.generateText({ prompt: 'private prompt' }),
      () => provider.generateImage({ prompt: 'private prompt' }),
    ]) {
      await assert.rejects(operation, (error) => {
        assert.equal(error.statusCode, 502);
        assert.doesNotMatch(error.message, /test-token|private prompt|Bearer/);
        return true;
      });
    }
  } finally {
    aiConfig.freeTierConfirmed.cloudflare = previousConfirmation;
    axios.post = originalPost;
  }
});

test('free Cloudflare image generation does not repeat a potentially billable inference after a transient error', async () => {
  const previousStorageMode = process.env.PRIVATE_STORAGE_MODE;
  process.env.PRIVATE_STORAGE_MODE = 'private';
  let calls = 0;
  try {
    const service = new aiService.AIService();
    service.getImageProvidersInPriority = () => [{
      name: 'cloudflare',
      instance: {
        generateImage: async () => {
          calls++;
          const error = new Error('temporary provider failure');
          error.response = { status: 503 };
          throw error;
        },
      },
    }];
    await assert.rejects(service.generateSocialImage({ prompt: 'simple test image' }), { statusCode: 503 });
    assert.equal(calls, 1);
  } finally {
    if (previousStorageMode === undefined) delete process.env.PRIVATE_STORAGE_MODE;
    else process.env.PRIVATE_STORAGE_MODE = previousStorageMode;
  }
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
  assert.ok(result16x9.originalBuffer, 'Original 1024x1024 buffer must be preserved');
  assert.equal(result16x9.originalBuffer.length, testSquareBuffer.length);

  // Verify composition guidance
  assert.match(CloudflareProvider.getCompositionGuidance('9:16'), /vertical framing/);
  assert.match(CloudflareProvider.getCompositionGuidance('16:9'), /wide horizontal landscape/);
});

test('Cloudflare PNG response retains PNG for square output and labels cropped JPEG separately', async () => {
  const originalPost = axios.post;
  const previousConfirmation = aiConfig.freeTierConfirmed.cloudflare;
  const png = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#4d7166' } }).png().toBuffer();
  axios.post = async () => ({ data: { result: { image: png.toString('base64') } } });
  aiConfig.freeTierConfirmed.cloudflare = true;
  try {
    const provider = new CloudflareProvider('fixture-account', 'fixture-token');
    const square = await provider.generateImage({ prompt: 'Coffee photo', aspectRatio: '1:1' });
    assert.equal(square.mimeType, 'image/png');
    assert.equal(square.originalMimeType, 'image/png');
    const cropped = await provider.generateImage({ prompt: 'Coffee photo', aspectRatio: '4:5' });
    assert.equal(cropped.mimeType, 'image/jpeg');
    assert.equal(cropped.originalMimeType, 'image/png');
    assert.equal((await sharp(cropped.buffer).metadata()).format, 'jpeg');
  } finally {
    axios.post = originalPost;
    aiConfig.freeTierConfirmed.cloudflare = previousConfirmation;
  }
});

test('Zero-Cost Free Tier: user daily quotas enforce limits and reject requests when exhausted (async & sync)', async () => {
  const testUserId = 99991;
  prismaFixture.__fixture.resetQuota(testUserId, new Date().toISOString().slice(0, 10));

  // Consume text quota up to limit
  for (let i = 0; i < aiConfig.userQuotas.dailyGenerationsLimit; i++) {
    const res = await aiService.checkAndIncrementUserQuota(testUserId, 'text');
    assert.equal(res.allowed, true);
  }

  // Next text generation attempt must throw 429
  await assert.rejects(
    async () => {
      await aiService.checkAndIncrementUserQuota(testUserId, 'text');
    },
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /đạt giới hạn sử dụng AI miễn phí trong ngày/);
      return true;
    }
  );

  // Check quota status reporting
  const status = await aiService.getUserQuotaStatus(testUserId);
  assert.equal(status.text.used, aiConfig.userQuotas.dailyGenerationsLimit);
  assert.equal(status.text.remaining, 0);
  assert.equal(status.image.remaining, aiConfig.userQuotas.dailyImagesLimit);

  // Verify sync helper also behaves properly
  const syncUserId = 99992;
  const syncRes = aiService.checkAndIncrementUserQuotaSync(syncUserId, 'text');
  assert.equal(syncRes.allowed, true);
  const syncStatus = aiService.getUserQuotaStatusSync(syncUserId);
  assert.equal(syncStatus.text.used, 1);
});

test('AI quota fails closed when persistent storage is unavailable', async () => {
  prismaFixture.__fixture.failNextQuotaOperation();
  await assert.rejects(
    aiService.checkAndIncrementUserQuota(99991, 'text'),
    (error) => error.statusCode === 503,
  );
});

test('AI quota increments atomically and never exceeds the configured limit', async () => {
  const userId = 99992;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey);
  const limit = aiConfig.userQuotas.dailyGenerationsLimit;
  const results = await Promise.allSettled(
    Array.from({ length: limit + 5 }, () => aiService.checkAndIncrementUserQuota(userId, 'text')),
  );
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, limit);
  assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.statusCode === 429).length, 5);
  assert.equal((await aiService.getUserQuotaStatus(userId)).text.used, limit);
});

test('image-prompt generation reserves enough bounded completion tokens for the verified reasoning model', async () => {
  const service = new aiService.AIService();
  let request;
  service.generateText = async (options) => {
    request = options;
    return { text: 'Warm Vietnamese coffee shop, soft morning light, editorial commercial photography.' };
  };

  const result = await service.generateImagePrompt({
    userId: null,
    postContent: 'Mời bạn ghé thử cà phê rang mới.',
    platform: 'Facebook',
  });

  assert.equal(request.maxTokens, 512);
  assert.equal(result.imagePrompt, 'Warm Vietnamese coffee shop, soft morning light, editorial commercial photography.');
});

test('Quick Editor, image-prompt, and plan-refinement text actions each consume one daily quota unit', async () => {
  const userId = 501;
  const dateKey = new Date().toISOString().slice(0, 10);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'text');
  const service = new aiService.AIService();
  service.getTextProvidersInPriority = () => [{
    name: 'test-provider',
    instance: {
      generateText: async ({ jsonMode }) => ({
        text: jsonMode
          ? JSON.stringify({ contentIdeas: [{ title: 'Morning coffee', description: 'Invite customers' }], videoScripts: [{ action: 'Show the coffee' }], checklist: ['Prepare a post'], playbook: [{ phaseName: 'Launch' }], seoKeywords: [], revisionSummary: 'Đã rút gọn kế hoạch.' })
          : 'Ghé quán trước 10 giờ để thưởng thức mẻ cà phê rang mới nhé!',
        provider: 'test-provider',
        model: 'test-model',
      }),
    },
  }];

  await service.generateDetailedPost({ userId, ideaTitle: 'Mẻ rang mới', ideaDescription: 'Cà phê rang thủ công', platform: 'Facebook' });
  await service.generateImagePrompt({ userId, postContent: 'Mời bạn ghé thử cà phê rang mới.', platform: 'Facebook' });
  await service.refineMarketingPlan({ userId, plan: { goal: 'Tăng lượt khách', contentIdeas: [], videoScripts: [], checklist: [], playbook: [] }, instruction: 'Rút gọn' });

  const status = await aiService.getUserQuotaStatus(userId);
  assert.equal(status.text.used, 3);
  prismaFixture.__fixture.resetQuota(userId, dateKey, 'text');
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

test('Ownership & Security: scheduled posts and media library prevent cross-user modifications', async () => {
  const userA = 501;
  const userB = 502;

  // Create post for user A
  const postA = await scheduledPostService.createScheduledPost(userA, {
    title: 'Post của User A',
    content: 'Nội dung bảo mật của User A',
    imageUrl: 'https://example.com/userA.jpg',
  });

  // User B cannot update post A
  await assert.rejects(
    async () => {
      await scheduledPostService.updateScheduledPostStatus(userB, postA.id, 'approved');
    },
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // User B cannot delete post A
  await assert.rejects(
    async () => {
      await scheduledPostService.deleteScheduledPost(userB, postA.id);
    },
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // User A can update their own post
  const updated = await scheduledPostService.updateScheduledPost(userA, postA.id, {
    title: 'Post của User A (Đã cập nhật)',
  });
  assert.equal(updated.title, 'Post của User A (Đã cập nhật)');
  assert.equal(updated.imageUrl, 'https://example.com/userA.jpg');

  // Media Library: User B cannot delete User A's asset
  const assetA = await mediaService.uploadMediaAsset(userA, {
    name: 'asset_userA.jpg',
    url: 'https://example.com/assetA.jpg',
  });

  await assert.rejects(
    async () => {
      await mediaService.deleteMediaAsset(userB, assetA.id);
    },
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // User A can delete their own asset
  const deletedAsset = await mediaService.deleteMediaAsset(userA, assetA.id);
  assert.equal(deletedAsset.deleted, true);
});

test('trend generation surfaces provider failure instead of silently returning curated trends', async () => {
  await assert.rejects(aiService.getTrendingBulletin({ forceRefresh: true }), { statusCode: 503 });
});

