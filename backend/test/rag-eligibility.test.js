const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/installPrismaFixture');

test('RAG refuses to construct a Gemini embedding model until free-tier eligibility is explicit', () => {
  const previous = {
    apiKey: process.env.GEMINI_API_KEY,
    confirmed: process.env.AI_FREE_TIER_CONFIRMED_GEMINI,
    freeOnly: process.env.FREE_ONLY_MODE,
  };
  process.env.GEMINI_API_KEY = 'test-only-gemini-key';
  delete process.env.AI_FREE_TIER_CONFIRMED_GEMINI;
  process.env.FREE_ONLY_MODE = 'true';
  try {
    delete require.cache[require.resolve('../src/services/ai/aiConfig')];
    delete require.cache[require.resolve('../src/services/ragService')];
    const ragService = require('../src/services/ragService');
    assert.throws(ragService.getEmbeddingModel, /Gemini free-tier eligibility is not confirmed/);
  } finally {
    delete require.cache[require.resolve('../src/services/ragService')];
    delete require.cache[require.resolve('../src/services/ai/aiConfig')];
    for (const [key, value] of Object.entries({
      GEMINI_API_KEY: previous.apiKey,
      AI_FREE_TIER_CONFIRMED_GEMINI: previous.confirmed,
      FREE_ONLY_MODE: previous.freeOnly,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
