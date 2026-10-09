const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../aiConfig');

/**
 * Google Gemini Provider
 */
class GeminiProvider {
  constructor(apiKey = aiConfig.keys.gemini, model = aiConfig.defaultTextModels.gemini) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = 'gemini';
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && this.client);
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    jsonMode = false,
  }) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API Key is not configured.');
    }

    const genModel = this.client.getGenerativeModel({
      model: this.model,
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

    const result = await genModel.generateContent(requestPayload);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      provider: this.name,
      model: this.model,
      usage: response.usageMetadata || null,
    };
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

    const genModel = this.client.getGenerativeModel({
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

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}

module.exports = GeminiProvider;
