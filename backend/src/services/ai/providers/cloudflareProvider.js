const axios = require('axios');
const sharp = require('sharp');
const aiConfig = require('../aiConfig');
const { AppError } = require('../../../middleware/errorHandler');

/**
 * Cloudflare Workers AI Provider (Free-tier FLUX.1 Schnell image generation)
 * Model: @cf/black-forest-labs/flux-1-schnell
 * Output: 1024x1024 native resolution with sharp post-processing for requested aspect ratios
 */
class CloudflareProvider {
  constructor(
    accountId = aiConfig.keys.cloudflare.accountId,
    apiToken = aiConfig.keys.cloudflare.apiToken,
    model = aiConfig.defaultImageModels.cloudflare
  ) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.model = model;
    this.name = 'cloudflare';
  }

  isAvailable() {
    return Boolean(
      this.accountId &&
      this.accountId.trim().length > 0 &&
      this.apiToken &&
      this.apiToken.trim().length > 0
    );
  }

  /**
   * Generates an image using Cloudflare Workers AI
   * @param {Object} options
   * @param {string} options.prompt - Visual description in English
   * @param {string} options.aspectRatio - '1:1' | '4:5' | '9:16' | '16:9'
   * @param {number} [options.steps=4] - Generation steps (1-4 for FLUX Schnell)
   * @param {number} [options.timeoutMs] - Request timeout
   */
  async generateImage({
    prompt,
    aspectRatio = '1:1',
    steps = 4,
    timeoutMs = aiConfig.limits.imageTimeoutMs,
  }) {
    if (!this.isAvailable()) {
      throw new AppError(
        'Chưa cấu hình tài khoản Cloudflare Workers AI miễn phí (CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN). Vui lòng cập nhật biến môi trường trên server để sử dụng tính năng tạo ảnh AI miễn phí $0.',
        400
      );
    }

    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('cloudflare', this.model)) {
      throw new AppError(
        `Mô hình ảnh "${this.model}" không thuộc danh mục miễn phí đã xác thực trong chế độ FREE_ONLY_MODE.`,
        403
      );
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;

    let response;
    try {
      response = await axios.post(
        endpoint,
        {
          prompt: prompt.trim(),
          steps: Math.min(Math.max(steps, 1), 4),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: timeoutMs,
          // Handle both JSON base64 and binary response formats
          responseType: 'json',
        }
      );
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const errorMsg = data?.errors?.[0]?.message || data?.message || err.message;

      if (status === 401 || status === 403) {
        throw new AppError(
          `Xác thực Cloudflare Workers AI thất bại: ${errorMsg}. Vui lòng kiểm tra CLOUDFLARE_API_TOKEN và quyền hạn token.`,
          401
        );
      }

      if (status === 429) {
        throw new AppError(
          'Đã hết hạn mức sử dụng miễn phí hàng ngày (Daily Neurons) của Cloudflare Workers AI. Vui lòng thử lại vào ngày mai.',
          429
        );
      }

      throw new AppError(`Lỗi kết xuất ảnh từ Cloudflare Workers AI: ${errorMsg}`, 502);
    }

    // Step 2: Decode Image Data
    let rawBuffer = null;
    let mimeType = 'image/jpeg';

    if (response.data?.result?.image) {
      // Cloudflare standard base64 output
      rawBuffer = Buffer.from(response.data.result.image, 'base64');
    } else if (Buffer.isBuffer(response.data)) {
      rawBuffer = response.data;
    } else if (typeof response.data === 'string') {
      rawBuffer = Buffer.from(response.data, 'base64');
    }

    if (!rawBuffer || rawBuffer.length < 100) {
      throw new AppError('Cloudflare Workers AI không trả về dữ liệu hình ảnh hợp lệ.', 502);
    }

    // Detect format from magic bytes
    if (rawBuffer[0] === 0x89 && rawBuffer[1] === 0x50) {
      mimeType = 'image/png';
    } else if (rawBuffer[0] === 0xFF && rawBuffer[1] === 0xD8) {
      mimeType = 'image/jpeg';
    }

    // Step 3: Aspect Ratio Processing
    const processed = await this.postProcessImageWithSharp(rawBuffer, aspectRatio);

    return {
      buffer: processed.buffer,
      mimeType: processed.postProcessed ? 'image/jpeg' : mimeType,
      provider: this.name,
      model: this.model,
      aspectRatio,
      dimensions: { width: processed.width, height: processed.height },
      postProcessed: processed.postProcessed,
      nativeModelResolution: '1024x1024',
    };
  }

  /**
   * Post-processes 1024x1024 native image to standard aspect ratios via Sharp center-crop
   */
  async postProcessImageWithSharp(rawBuffer, aspectRatio = '1:1') {
    const targetConfig = aiConfig.aspectRatios[aspectRatio] || aiConfig.aspectRatios['1:1'];
    let finalBuffer = rawBuffer;
    let postProcessed = false;

    if (aspectRatio !== '1:1') {
      try {
        finalBuffer = await sharp(rawBuffer)
          .resize({
            width: targetConfig.width,
            height: targetConfig.height,
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 90 })
          .toBuffer();
        postProcessed = true;
      } catch (sharpErr) {
        console.warn('[Sharp Aspect Ratio Notice] Post-processing failed, preserving 1:1 image:', sharpErr.message);
        finalBuffer = rawBuffer;
        postProcessed = false;
      }
    }

    return {
      buffer: finalBuffer,
      width: postProcessed ? targetConfig.width : 1024,
      height: postProcessed ? targetConfig.height : 1024,
      postProcessed,
    };
  }
}

module.exports = CloudflareProvider;
