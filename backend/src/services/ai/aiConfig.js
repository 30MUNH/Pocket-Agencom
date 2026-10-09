/**
 * AI Service Configuration & Free-Tier Defaults
 * Strictly enforces $0 spending in FREE_ONLY_MODE.
 * Supports Groq, OpenRouter, and Gemini for text generation,
 * and Cloudflare Workers AI for image generation.
 */

const aiConfig = {
  // Free-only mode flags (Strict $0 budget enforcement)
  freeOnlyMode: process.env.FREE_ONLY_MODE !== 'false',
  allowPaidModels: process.env.AI_ALLOW_PAID_MODELS === 'true',

  // Provider selections
  textProvider: process.env.AI_TEXT_PROVIDER || 'groq',
  imageProvider: process.env.AI_IMAGE_PROVIDER || 'cloudflare',

  // Default models (Guaranteed free-tier models)
  defaultTextModels: {
    groq: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    openrouter: process.env.OPENROUTER_MODEL || 'openrouter/free',
    gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },

  defaultImageModels: {
    cloudflare: process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell',
    fal: process.env.FAL_MODEL || 'fal-ai/flux/schnell',
    openrouter: process.env.OPENROUTER_IMAGE_MODEL || 'black-forest-labs/flux-1-schnell',
  },

  // Verified zero-cost models list
  verifiedFreeModels: {
    groq: [
      'openai/gpt-oss-120b',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    openrouter: [
      'openrouter/free',
    ],
    gemini: [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ],
    cloudflare: [
      '@cf/black-forest-labs/flux-1-schnell',
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    ],
  },

  // API Keys
  keys: {
    groq: process.env.GROQ_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
      apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    },
    fal: process.env.FAL_KEY || '',
  },

  // RAG Embeddings configuration (gemini-embedding-2 with 768 dimensions)
  embedding: {
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2',
    dimensions: parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS || '768', 10),
  },

  // Operational limits & daily user quota
  limits: {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '45000', 10),
    imageTimeoutMs: parseInt(process.env.AI_IMAGE_TIMEOUT_MS || '60000', 10),
    maxConcurrentGenerations: parseInt(process.env.AI_MAX_CONCURRENT || '5', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    backoffBaseMs: parseInt(process.env.AI_BACKOFF_BASE_MS || '1000', 10),
    dailyTextRequestsPerUser: parseInt(process.env.AI_DAILY_TEXT_LIMIT || '50', 10),
    dailyImageRequestsPerUser: parseInt(process.env.AI_DAILY_IMAGE_LIMIT || '20', 10),
  },

  userQuotas: {
    dailyGenerationsLimit: parseInt(process.env.AI_DAILY_TEXT_LIMIT || process.env.AI_DAILY_TEXT_QUOTA_PER_USER || '50', 10),
    dailyImagesLimit: parseInt(process.env.AI_DAILY_IMAGE_LIMIT || process.env.AI_DAILY_IMAGE_QUOTA_PER_USER || '20', 10),
  },

  // Supported image aspect ratios mapped to dimensions
  aspectRatios: {
    '1:1': { width: 1024, height: 1024, label: '1:1 (Vuông - Feed Post)' },
    '4:5': { width: 896, height: 1120, label: '4:5 (Dọc - Instagram/FB Feed)' },
    '9:16': { width: 768, height: 1344, label: '9:16 (Story / Reel / TikTok Cover)' },
    '16:9': { width: 1344, height: 768, label: '16:9 (Ngang - Banner / Youtube Cover)' },
  },

  /**
   * Validates whether a model is eligible under the free-tier policy
   */
  isModelFree(provider, modelId) {
    if (!this.freeOnlyMode || this.allowPaidModels) {
      return true;
    }

    if (!provider || !modelId) return false;
    const p = provider.toLowerCase();
    const m = modelId.trim();

    if (p === 'groq') {
      return this.verifiedFreeModels.groq.includes(m);
    }

    if (p === 'openrouter') {
      // Must be openrouter/free meta-router or explicitly end with :free
      return m === 'openrouter/free' || m.endsWith(':free');
    }

    if (p === 'gemini') {
      return this.verifiedFreeModels.gemini.some((freeModel) => m.startsWith(freeModel));
    }

    if (p === 'cloudflare') {
      return this.verifiedFreeModels.cloudflare.includes(m) || m.startsWith('@cf/');
    }

    // fal.ai is paid-only, never free
    if (p === 'fal') {
      return false;
    }

    // Never treat unknown pricing as free
    return false;
  },
};

module.exports = aiConfig;
