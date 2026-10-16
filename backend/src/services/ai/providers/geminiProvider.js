const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../aiConfig');

/**
 * Google Gemini Provider
 */
class GeminiProvider {
  constructor(apiKey = aiConfig.keys.gemini, model = aiConfig.defaultTextModels.gemini) {
    this.name = 'gemini';
    this.model = model;
    this.setApiKeys(apiKey);
  }

  setApiKeys(apiKey) {
    const rawKeys = apiKey || process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    if (Array.isArray(rawKeys)) {
      this.apiKeys = rawKeys.map((k) => String(k).trim()).filter(Boolean);
    } else {
      this.apiKeys = String(rawKeys)
        .split(/[,;\n]+/)
        .map((k) => k.trim())
        .filter(Boolean);
    }
    this.currentKeyIndex = 0;
    this._apiKey = this.apiKeys[0] || '';
    this.client = this._apiKey ? new GoogleGenerativeAI(this._apiKey) : null;
  }

  get apiKey() {
    return this.apiKeys[this.currentKeyIndex] || this._apiKey || '';
  }

  set apiKey(val) {
    this._apiKey = val;
    if (val) {
      this.apiKeys = String(val)
        .split(/[,;\n]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      this.currentKeyIndex = 0;
      this.client = this.apiKeys[0] ? new GoogleGenerativeAI(this.apiKeys[0]) : null;
    } else {
      this.apiKeys = [];
      this.client = null;
    }
  }

  isAvailable() {
    if (!this.apiKeys || this.apiKeys.length === 0) return false;
    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('gemini', this.model)) return false;
    return true;
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    jsonMode = false,
    model = this.model,
    timeoutMs = aiConfig.limits.requestTimeoutMs,
    signal,
  }) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API Key is not configured.');
    }

    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('gemini', model)) {
      const err = new Error(`Gemini model "${model}" is not in the verified free-tier whitelist.`);
      err.status = 403;
      throw err;
    }

    let lastErr = null;
    const totalKeys = this.apiKeys.length;
    const startIndex = this.currentKeyIndex;

    for (let i = 0; i < totalKeys; i++) {
      const keyIndex = (startIndex + i) % totalKeys;
      const currentKey = this.apiKeys[keyIndex];

      try {
        const client = new GoogleGenerativeAI(currentKey);
        const genModel = client.getGenerativeModel({
          model,
          generationConfig: {
            temperature,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        });

        const requestPayload = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        };

        if (systemPrompt) {
          requestPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const result = await genModel.generateContent(requestPayload, { timeout: timeoutMs, signal });
        const response = await result.response;
        const text = response.text();

        this.currentKeyIndex = keyIndex;
        this.client = client;

        return {
          text,
          provider: this.name,
          model: this.model,
          usage: response.usageMetadata || null,
        };
      } catch (err) {
        lastErr = err;
        console.warn(`[Gemini] Key ${keyIndex + 1}/${totalKeys} failed: ${err.message}`);
      }
    }

    throw lastErr || new Error('Gemini text generation failed across all configured keys.');
  }

  async generateVision({
    prompt,
    systemPrompt = '',
    imageBuffer,
    mimeType = 'image/jpeg',
    temperature = 0.7,
  }) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API Key is not configured.');
    }

    let lastErr = null;
    const totalKeys = this.apiKeys.length;
    const startIndex = this.currentKeyIndex;

    for (let i = 0; i < totalKeys; i++) {
      const keyIndex = (startIndex + i) % totalKeys;
      const currentKey = this.apiKeys[keyIndex];

      try {
        const client = new GoogleGenerativeAI(currentKey);
        const genModel = client.getGenerativeModel({
          model: this.model,
          generationConfig: { temperature },
        });

        const imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        };

        const requestPayload = {
          contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
        };

        if (systemPrompt) {
          requestPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const result = await genModel.generateContent(requestPayload);
        const response = await result.response;
        const text = response.text();

        this.currentKeyIndex = keyIndex;
        this.client = client;

        return {
          text,
          provider: this.name,
          model: this.model,
        };
      } catch (err) {
        lastErr = err;
        console.warn(`[Gemini Vision] Key ${keyIndex + 1}/${totalKeys} failed: ${err.message}`);
      }
    }

    throw lastErr || new Error('Gemini Vision analysis failed across all configured keys.');
  }
}

module.exports = GeminiProvider;
