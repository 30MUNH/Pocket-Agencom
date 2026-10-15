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
    model = aiConfig.defaultImageModels.cloudflare,
    textModel = aiConfig.defaultTextModels.cloudflare
  ) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.model = model;
    this.textModel = textModel;
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

  isTextAvailable() {
    return this.isAvailable() && aiConfig.isModelFree('cloudflare', this.textModel);
  }

  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = 256,
    jsonMode = false,
    model = this.textModel,
    timeoutMs = aiConfig.limits.requestTimeoutMs,
    signal,
  }) {
    if (!this.isAvailable()) {
      throw new AppError('Cloudflare Workers AI is not configured.', 503);
    }
    if (aiConfig.freeOnlyMode && !aiConfig.isModelFree('cloudflare', model)) {
      throw new AppError('Cloudflare Workers AI model is not verified for free-tier use.', 403);
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const tokenLimit = Number.isFinite(Number(maxTokens))
      ? Math.min(Math.max(Math.floor(Number(maxTokens)), 1), aiConfig.limits.maxTokens)
      : 256;
    const useChatCompletions = model === '@cf/openai/gpt-oss-20b' || model === '@cf/openai/gpt-oss-120b';
    const payload = useChatCompletions
      ? { model, messages, temperature, max_tokens: tokenLimit, reasoning_effort: 'low' }
      : { messages, temperature, max_tokens: tokenLimit };
    if (jsonMode) payload.response_format = { type: 'json_object' };

    const endpoint = useChatCompletions
      ? `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/v1/chat/completions`
      : `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;
    let response;
    try {
      response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: timeoutMs,
        signal,
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        throw new AppError('Cloudflare Workers AI authentication or model access was denied.', 401);
      }
      if (status === 429) {
        throw new AppError('Cloudflare Workers AI daily capacity is exhausted.', 429);
      }
      throw new AppError('Cloudflare Workers AI text inference failed.', 502);
    }

    const result = response.data?.result;
    const text = useChatCompletions
      ? response.data?.choices?.[0]?.message?.content
      : result?.response ?? result?.text ?? result?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new AppError('Cloudflare Workers AI returned an empty text response.', 502);
    }
    return {
      text,
      provider: this.name,
      model: response.data?.model || result?.model || model,
      usage: response.data?.usage || result?.usage || null,
    };
  }

  static getCompositionGuidance(aspectRatio) {
    switch (aspectRatio) {
      case '9:16':
        return 'vertical framing, subject centered in safe area, generous top and bottom breathing room, wide angle view, no edge clipping';
      case '16:9':
        return 'wide horizontal landscape framing, centered subject, wide field of view, horizontal breathing room, no edge clipping';
      case '4:5':
        return 'portrait framing, centered subject, balanced safe area margins, social feed orientation';
      case '1:1':
      default:
        return 'balanced square framing, centered subject, clean borders';
    }
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

    // Append composition-aware guidance to prevent critical subjects being clipped
    const guidance = CloudflareProvider.getCompositionGuidance(aspectRatio);
    const enrichedPrompt = `${prompt.trim()}, ${guidance}`;

    let response;
    try {
      response = await axios.post(
        endpoint,
        {
          prompt: enrichedPrompt,
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
      if (status === 401 || status === 403) {
        throw new AppError('Cloudflare Workers AI authentication or model access was denied.', 401);
      }

      if (status === 429) {
        throw new AppError(
          'Đã hết hạn mức sử dụng miễn phí hàng ngày (Daily Neurons) của Cloudflare Workers AI. Vui lòng thử lại vào ngày mai.',
          429
        );
      }

      throw new AppError('Cloudflare Workers AI image generation failed.', 502);
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

    // Step 3: Aspect Ratio Processing with Attention Strategy and Center Fallback
    const processed = await this.postProcessImageWithSharp(rawBuffer, aspectRatio);

    return {
      buffer: processed.buffer,
      originalBuffer: rawBuffer,
      mimeType: processed.postProcessed ? 'image/jpeg' : mimeType,
      originalMimeType: mimeType,
      provider: this.name,
      model: this.model,
      aspectRatio,
      dimensions: { width: processed.width, height: processed.height },
      postProcessed: processed.postProcessed,
      nativeModelResolution: '1024x1024',
    };
  }

  /**
   * Post-processes 1024x1024 native image to standard aspect ratios via Sharp attention-crop with center fallback
   */
  async postProcessImageWithSharp(rawBuffer, aspectRatio = '1:1') {
    const targetConfig = aiConfig.aspectRatios[aspectRatio] || aiConfig.aspectRatios['1:1'];
    let finalBuffer = rawBuffer;
    let postProcessed = false;

    if (aspectRatio !== '1:1') {
      try {
        // First try attention-based crop to preserve faces and primary visual subjects
        finalBuffer = await sharp(rawBuffer)
          .resize({
            width: targetConfig.width,
            height: targetConfig.height,
            fit: 'cover',
            position: sharp.strategy.attention,
          })
          .jpeg({ quality: 90 })
          .toBuffer();
        postProcessed = true;
      } catch (attErr) {
        // Fallback to center crop
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
        } catch (centerErr) {
          console.warn('[Sharp Aspect Ratio Notice] Post-processing failed, preserving 1:1 image:', centerErr.message);
          finalBuffer = rawBuffer;
          postProcessed = false;
        }
      }
    }

    return {
      buffer: finalBuffer,
      originalBuffer: rawBuffer,
      width: postProcessed ? targetConfig.width : 1024,
      height: postProcessed ? targetConfig.height : 1024,
      postProcessed,
    };
  }
}

module.exports = CloudflareProvider;
