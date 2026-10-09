const axios = require('axios');
const aiConfig = require('../aiConfig');

/**
 * fal.ai Provider for high-speed image generation (FLUX models).
 * In FREE_ONLY_MODE, fal.ai is strictly disabled to prevent paid credits consumption.
 */
class FalProvider {
  constructor(apiKey = aiConfig.keys.fal, model = aiConfig.defaultImageModels.fal) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = 'fal';
    this.baseUrl = `https://fal.run/${this.model}`;
  }

  isAvailable() {
    if (aiConfig.freeOnlyMode || !aiConfig.allowPaidModels) {
      return false;
    }
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateImage({
    prompt,
    aspectRatio = '1:1',
    timeoutMs = aiConfig.limits.imageTimeoutMs,
  }) {
    if (aiConfig.freeOnlyMode || !aiConfig.allowPaidModels) {
      const error = new Error('fal.ai is disabled because FREE_ONLY_MODE is enabled ($0 budget constraint).');
      error.status = 403;
      throw error;
    }

    if (!this.isAvailable()) {
      throw new Error('fal.ai API Key (FAL_KEY) is not configured.');
    }

    const ratioConfig = aiConfig.aspectRatios[aspectRatio] || aiConfig.aspectRatios['1:1'];

    const payload = {
      prompt,
      image_size: {
        width: ratioConfig.width,
        height: ratioConfig.height,
      },
      num_inference_steps: 4, // optimal for FLUX schnell
      enable_safety_checker: true,
    };

    const response = await axios.post(this.baseUrl, payload, {
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs,
    });

    const images = response.data?.images;
    if (!images || !Array.isArray(images) || images.length === 0 || !images[0]?.url) {
      throw new Error('fal.ai did not return a valid generated image URL.');
    }

    return {
      imageUrl: images[0].url,
      width: images[0].width || ratioConfig.width,
      height: images[0].height || ratioConfig.height,
      contentType: images[0].content_type || 'image/jpeg',
      provider: this.name,
      model: this.model,
      aspectRatio,
    };
  }
}

module.exports = FalProvider;

