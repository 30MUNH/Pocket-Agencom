const axios = require('axios');
const aiConfig = require('../aiConfig');

/**
 * OpenRouter Provider (unified access to hundreds of open & commercial models)
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
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = aiConfig.limits.maxTokens,
    jsonMode = false,
    timeoutMs = aiConfig.limits.requestTimeoutMs,
  }) {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API Key is not configured.');
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
    });

    const choice = response.data?.choices?.[0];
    const text = choice?.message?.content || '';
    return {
      text,
      provider: this.name,
      model: this.textModel,
      usage: response.data?.usage || null,
    };
  }

  async generateImage({
    prompt,
    aspectRatio = '1:1',
    timeoutMs = aiConfig.limits.imageTimeoutMs,
  }) {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API Key is not configured.');
    }

    // Attempt generation via image-capable model prompt
    const response = await axios.post(
      this.baseUrl,
      {
        model: this.imageModel,
        messages: [
          {
            role: 'user',
            content: `Generate a high quality marketing image with aspect ratio ${aspectRatio}: ${prompt}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pocket-agencom.com',
          'X-Title': 'Pocket Agencom Marketing SaaS',
        },
        timeout: timeoutMs,
      }
    );

    const message = response.data?.choices?.[0]?.message;
    // Check if image URL was returned in content or multimodal fields
    const imageUrl = message?.images?.[0] || message?.image_url || null;
    if (!imageUrl) {
      throw new Error('OpenRouter image model did not return a valid image URL.');
    }

    return {
      imageUrl,
      provider: this.name,
      model: this.imageModel,
      aspectRatio,
    };
  }
}

module.exports = OpenRouterProvider;
