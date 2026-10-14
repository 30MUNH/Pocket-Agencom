const axios = require('axios');
const aiConfig = require('../aiConfig');

/**
 * Groq Cloud Provider (ultra-fast inference, high rate-limit tolerance)
 * Configured with strictly zero-cost free-tier models (openai/gpt-oss-120b).
 */
class GroqProvider {
  constructor(apiKey = aiConfig.keys.groq, model = aiConfig.defaultTextModels.groq) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = 'groq';
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  isAvailable() {
    if (!this.apiKey || this.apiKey.trim().length === 0) return false;
    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('groq', this.model)) return false;
    return true;
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = aiConfig.limits.maxTokens,
    jsonMode = false,
    timeoutMs = aiConfig.limits.requestTimeoutMs,
    model = this.model,
    signal,
  }) {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('Groq API Key is not configured.');
    }

    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('groq', model)) {
      const err = new Error(`Groq model "${model}" is not in the verified free-tier whitelist.`);
      err.status = 403;
      throw err;
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: timeoutMs,
        signal,
      });

      const choice = response.data?.choices?.[0];
      const text = choice?.message?.content || '';
      return {
        text,
        provider: this.name,
        model,
        usage: response.data?.usage || null,
      };
    } catch (err) {
      const status = err.response?.status;
      const retryAfter = err.response?.headers?.['retry-after'];
      const errorMsg = err.response?.data?.error?.message || err.message;

      if (status === 429) {
        const enrichedError = new Error(
          `Groq rate limit (429) reached${retryAfter ? `. Retry after ${retryAfter}s` : ''}: ${errorMsg}`
        );
        enrichedError.status = 429;
        enrichedError.response = err.response;
        throw enrichedError;
      }
      throw err;
    }
  }
}

module.exports = GroqProvider;

