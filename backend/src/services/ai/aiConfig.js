/**
 * AI Service Configuration & Defaults
 * Supports Groq, OpenRouter, and Gemini for text generation,
 * and fal.ai, OpenRouter, and Gemini for image generation.
 */

const aiConfig = {
  // Provider selections
  textProvider: process.env.AI_TEXT_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'gemini')),
  imageProvider: process.env.AI_IMAGE_PROVIDER || (process.env.FAL_KEY ? 'fal' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'gemini')),

  // Default models
  defaultTextModels: {
    groq: process.env.GROQ_MODEL || process.env.AI_TEXT_MODEL || 'llama-3.3-70b-versatile',
    openrouter: process.env.OPENROUTER_MODEL || process.env.AI_TEXT_MODEL || 'google/gemini-2.0-flash-001',
    gemini: process.env.GEMINI_MODEL || process.env.AI_TEXT_MODEL || 'gemini-2.5-flash',
  },

  defaultImageModels: {
    fal: process.env.FAL_MODEL || process.env.AI_IMAGE_MODEL || 'fal-ai/flux/schnell',
    openrouter: process.env.OPENROUTER_IMAGE_MODEL || process.env.AI_IMAGE_MODEL || 'black-forest-labs/flux-1-schnell',
    gemini: process.env.GEMINI_IMAGE_MODEL || process.env.AI_IMAGE_MODEL || 'imagen-3.0-generate-002',
  },

  // API Keys
  keys: {
    groq: process.env.GROQ_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
    fal: process.env.FAL_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
  },

  // Operational limits
  limits: {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '45000', 10),
    imageTimeoutMs: parseInt(process.env.AI_IMAGE_TIMEOUT_MS || '60000', 10),
    maxConcurrentGenerations: parseInt(process.env.AI_MAX_CONCURRENT || '5', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    backoffBaseMs: parseInt(process.env.AI_BACKOFF_BASE_MS || '1000', 10),
  },

  // Supported image aspect ratios mapped to dimensions & flux sizes
  aspectRatios: {
    '1:1': { width: 1024, height: 1024, fluxSize: 'square_hd', label: '1:1 (Vuông - Feed Post)' },
    '4:5': { width: 896, height: 1120, fluxSize: 'portrait_4_5', label: '4:5 (Dọc - Instagram/FB Feed)' },
    '9:16': { width: 768, height: 1344, fluxSize: 'portrait_16_9', label: '9:16 (Story / Reel / TikTok Cover)' },
    '16:9': { width: 1344, height: 768, fluxSize: 'landscape_16_9', label: '16:9 (Ngang - Banner / Youtube Cover)' },
  },
};

module.exports = aiConfig;
