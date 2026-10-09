const axios = require('axios');
const aiConfig = require('../aiConfig');

/**
 * Groq Cloud Provider (ultra-fast inference, high rate-limit tolerance)
 */
class GroqProvider {
  constructor(apiKey = aiConfig.keys.groq, model = aiConfig.defaultTextModels.groq) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = 'groq';
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
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
      throw new Error('Groq API Key is not configured.');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: this.model,
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
      },
      timeout: timeoutMs,
    });

    const choice = response.data?.choices?.[0];
    const text = choice?.message?.content || '';
    return {
      text,
      provider: this.name,
      model: this.model,
      usage: response.data?.usage || null,
    };
  }
}

module.exports = GroqProvider;
