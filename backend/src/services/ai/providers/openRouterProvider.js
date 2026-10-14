const axios = require('axios');
const aiConfig = require('../aiConfig');
const { AppError } = require('../../../middleware/errorHandler');

/**
 * OpenRouter Provider
 * In FREE_ONLY_MODE, strictly routes to verified zero-cost models (e.g. openrouter/free or *:free)
 */
class OpenRouterProvider {
  constructor(
    apiKey = aiConfig.keys.openrouter,
    textModel = aiConfig.defaultTextModels.openrouter,
    imageModel = aiConfig.defaultImageModels.openrouter
  ) {
    this.apiKey = apiKey;
    this.textModel = textModel;
    this.imageModel = imageModel;
    this.name = 'openrouter';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  isAvailable() {
    if (!this.apiKey || this.apiKey.trim().length === 0) return false;
    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('openrouter', this.textModel)) {
      return false;
    }
    return true;
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = aiConfig.limits.maxTokens,
    jsonMode = false,
    timeoutMs = aiConfig.limits.requestTimeoutMs,
    signal,
  }) {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new AppError('OpenRouter API Key is not configured.', 400);
    }

    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('openrouter', this.textModel)) {
      throw new AppError(
        `Mô hình OpenRouter "${this.textModel}" không phải mô hình miễn phí $0. Trong chế độ FREE_ONLY_MODE, chỉ được sử dụng openrouter/free hoặc mô hình kết thúc bằng :free.`,
        403
      );
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: this.textModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await axios.post(this.baseUrl, payload, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pocket-agencom.com',
        'X-Title': 'Pocket Agencom Marketing SaaS',
      },
      timeout: timeoutMs,
      signal,
    });

    const choice = response.data?.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new AppError('OpenRouter returned an empty response.', 502);
    }
    return {
      text,
      provider: this.name,
      // Meta-routes such as openrouter/free return the concrete selected model.
      model: response.data?.model || this.textModel,
      usage: response.data?.usage || null,
    };
  }

  async generateImage() {
    if (aiConfig.freeOnlyMode && !aiConfig.allowPaidModels) {
      throw new AppError(
        'Tạo ảnh qua OpenRouter bị vô hiệu hóa trong chế độ FREE_ONLY_MODE vì không thuộc gói miễn phí $0.',
        403
      );
    }

    throw new AppError('OpenRouter image generation is not configured for free tier.', 403);
  }
}

module.exports = OpenRouterProvider;
