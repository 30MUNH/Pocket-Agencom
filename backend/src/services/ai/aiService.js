const axios = require('axios');
const aiConfig = require('./aiConfig');
const GroqProvider = require('./providers/groqProvider');
const OpenRouterProvider = require('./providers/openRouterProvider');
const GeminiProvider = require('./providers/geminiProvider');
const FalProvider = require('./providers/falProvider');
const { AppError } = require('../../middleware/errorHandler');
const { findSimilarStrategies } = require('../ragService');
const { uploadCampaignAsset } = require('../storageService');
const prisma = require('../../config/prisma');

// In-memory usage log & concurrency control
const usageLog = [];
let activeGenerations = 0;

/**
 * Exponential backoff with jitter
 */
function waitWithBackoff(attempt, baseMs = aiConfig.limits.backoffBaseMs) {
  const delay = Math.min(baseMs * Math.pow(2, attempt) + Math.random() * 500, 10000);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Checks if an error is transient (rate-limit 429, timeout, or 5xx server error)
 */
function isTransientError(error) {
  if (!error) return false;
  if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('econnreset')) return true;
  const status = error.response?.status || error.status;
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (msg.includes('resource_exhausted') || msg.includes('429') || msg.includes('rate limit')) return true;
  return false;
}

class AIService {
  constructor() {
    this.groq = new GroqProvider();
    this.openrouter = new OpenRouterProvider();
    this.gemini = new GeminiProvider();
    this.fal = new FalProvider();
  }

  getTextProvidersInPriority() {
    const primary = aiConfig.textProvider.toLowerCase();
    const allProviders = [
      { name: 'groq', instance: this.groq },
      { name: 'openrouter', instance: this.openrouter },
      { name: 'gemini', instance: this.gemini },
    ];

    // Place primary first, followed by remaining available providers
    const sorted = allProviders.sort((a, b) => {
      if (a.name === primary) return -1;
      if (b.name === primary) return 1;
      return 0;
    });

    return sorted.filter((p) => p.instance.isAvailable());
  }

  getImageProvidersInPriority() {
    const primary = aiConfig.imageProvider.toLowerCase();
    const allProviders = [
      { name: 'fal', instance: this.fal },
      { name: 'openrouter', instance: this.openrouter },
    ];

    const sorted = allProviders.sort((a, b) => {
      if (a.name === primary) return -1;
      if (b.name === primary) return 1;
      return 0;
    });

    return sorted.filter((p) => p.instance.isAvailable());
  }

  async acquireConcurrencySlot() {
    if (activeGenerations >= aiConfig.limits.maxConcurrentGenerations) {
      throw new AppError(
        'Hệ thống AI đang xử lý tối đa số lượng yêu cầu đồng thời. Vui lòng thử lại sau giây lát.',
        429
      );
    }
    activeGenerations++;
  }

  releaseConcurrencySlot() {
    activeGenerations = Math.max(0, activeGenerations - 1);
  }

  recordUsage(entry) {
    usageLog.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 entries in memory
    if (usageLog.length > 100) {
      usageLog.shift();
    }
  }

  getUsageStats() {
    return {
      activeGenerations,
      totalLogged: usageLog.length,
      recent: usageLog.slice(-10),
    };
  }

  /**
   * Unified Text Generation with provider fallback and exponential backoff
   */
  async generateText({
    prompt,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = aiConfig.limits.maxTokens,
    jsonMode = false,
  }) {
    await this.acquireConcurrencySlot();
    const startTime = Date.now();
    const providers = this.getTextProvidersInPriority();

    if (providers.length === 0) {
      this.releaseConcurrencySlot();
      throw new AppError(
        'Không có nhà cung cấp AI nào được cấu hình API key (Groq, OpenRouter, hoặc Gemini).',
        503
      );
    }

    let lastError = null;

    for (const { name, instance } of providers) {
      for (let attempt = 0; attempt <= aiConfig.limits.maxRetries; attempt++) {
        try {
          const result = await instance.generateText({
            prompt,
            systemPrompt,
            temperature,
            maxTokens,
            jsonMode,
          });

          this.releaseConcurrencySlot();
          this.recordUsage({
            type: 'text',
            provider: name,
            model: result.model,
            durationMs: Date.now() - startTime,
            success: true,
          });

          return result;
        } catch (err) {
          lastError = err;
          console.warn(`[AI Service] ${name} attempt ${attempt + 1} failed:`, err.message || err);

          // If retry-after header exists, respect it bounded
          const retryAfterSec = parseInt(err.response?.headers?.['retry-after'], 10);
          if (retryAfterSec && retryAfterSec > 0 && retryAfterSec <= 10) {
            await new Promise((r) => setTimeout(r, retryAfterSec * 1000));
          } else if (isTransientError(err) && attempt < aiConfig.limits.maxRetries) {
            await waitWithBackoff(attempt);
          } else {
            // Non-transient or retries exhausted for this provider, try next provider
            break;
          }
        }
      }
    }

    this.releaseConcurrencySlot();
    this.recordUsage({
      type: 'text',
      durationMs: Date.now() - startTime,
      success: false,
      error: lastError?.message,
    });

    throw new AppError(
      `Tất cả các dịch vụ AI đều không thể phản hồi: ${lastError?.message || 'Quá tải hoặc hết hạn ngạch'}`,
      503
    );
  }

  /**
   * Structured JSON Content Generation with validation
   */
  async generateStructuredContent({ prompt, systemPrompt, validatorFn }) {
    const rawResult = await this.generateText({
      prompt,
      systemPrompt,
      jsonMode: true,
      temperature: 0.7,
    });

    let parsed;
    try {
      // Clean possible markdown code fences if provider returns ```json ... ```
      let text = rawResult.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      parsed = JSON.parse(text);
    } catch (parseErr) {
      throw new AppError('Mô hình AI trả về dữ liệu JSON không hợp lệ.', 502);
    }

    if (typeof validatorFn === 'function') {
      const validated = validatorFn(parsed);
      return { data: validated, provider: rawResult.provider, model: rawResult.model };
    }

    return { data: parsed, provider: rawResult.provider, model: rawResult.model };
  }

  /**
   * Generates a Comprehensive Marketing Plan
   */
  async generateMarketingPlan(userId, data, profile) {
    const brandVoice = profile?.brandVoice || 'Chuyên nghiệp, tin cậy, gần gũi với khách hàng Việt Nam';
    const usp = profile?.usp || 'Sản phẩm chất lượng cao, giá thành hợp lý';
    const priceRange = profile?.priceRange || 'Trung bình';
    const bestSellingProduct = profile?.bestSellingProduct || data.productDescription || 'Sản phẩm chủ lực';
    const location = profile?.location || 'Toàn quốc';

    const SYSTEM_PROMPT = `Bạn là Giám đốc Chiến lược Marketing & Tăng trưởng (CMO) hàng đầu tại Việt Nam, am hiểu sâu sắc thị trường tiêu dùng nội địa và hành vi khách hàng trên mạng xã hội (Facebook, TikTok, Instagram, Zalo, Shopee).

BẠN PHẢI TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ VỚI CÁC TRƯỜNG SAU:
{
  "contentIdeas": [
    { "title": "Tiêu đề ý tưởng", "channel": "Kênh (TikTok/Facebook/Instagram)", "format": "Định dạng (Reels/Bài viết/Livestream)", "description": "Mô tả chi tiết cách triển khai" }
  ],
  "videoScripts": [
    { "scene": "Phân cảnh (vd: 0-5s)", "action": "Hành động/Hình ảnh trực quan", "dialogue": "Lời thoại hoặc lời dẫn hấp dẫn" }
  ],
  "checklist": [
    "Hành động cụ thể cần làm 1",
    "Hành động cụ thể cần làm 2"
  ],
  "playbook": [
    {
      "phaseName": "Tên giai đoạn (Giai đoạn 1: Chuẩn bị...)",
      "duration": "Thời gian (vd: Ngày 1 - Ngày 5)",
      "objective": "Mục tiêu cụ thể của giai đoạn",
      "keyActions": ["Hành động 1", "Hành động 2"],
      "focusChannels": ["Kênh trọng tâm"]
    }
  ],
  "seoKeywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
  "budgetBreakdown": {
    "channels": [
      { "channel": "Facebook Ads", "percentage": 50, "estimatedVnd": 5000000 },
      { "channel": "TikTok Ads", "percentage": 30, "estimatedVnd": 3000000 },
      { "channel": "Sản xuất nội dung", "percentage": 20, "estimatedVnd": 2000000 }
    ]
  }
}

YÊU CẦU NỘI DUNG:
1. Bám sát Brand Voice: "${brandVoice}" và Điểm độc nhất (USP): "${usp}".
2. Kịch bản videoScripts phải có ít nhất 4 phân cảnh với lời thoại cuốn hút.
3. ContentIdeas phải có ít nhất 3 ý tưởng phù hợp với kênh triển khai.
4. Tuyệt đối KHÔNG trả về markdown ngoài JSON.`;

    let userPrompt = `Hãy tạo kế hoạch marketing cho chiến dịch:
- Ngành hàng: ${data.businessType}
- Loại chiến dịch: ${data.campaignType}
- Sản phẩm/dịch vụ: ${data.productDescription}
- Khách hàng mục tiêu: ${data.targetCustomer}
- Mục tiêu chiến dịch: ${data.goal}
- Ngân sách: ${data.budget ? Number(data.budget).toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}
- Kênh triển khai: ${data.deploymentChannels || 'Facebook, TikTok'}
- Tài nguyên hiện có: ${data.existingResources || 'Ảnh chụp sản phẩm'}
- Lý do chiến dịch: ${data.campaignReason || 'Tăng doanh số bán hàng'}`;

    // RAG Enrichment: find similar past successful strategies
    try {
      const similar = await findSimilarStrategies(`${data.businessType} - ${data.campaignType} - ${data.goal}`);
      if (similar && similar.length > 0) {
        userPrompt += `\n\nTham khảo các chiến lược case study đã thành công:\n${similar.map((s, i) => `--- Case study ${i + 1} ---\n${s.content}`).join('\n\n')}`;
      }
    } catch (ragErr) {
      console.warn('[RAG Notice] Proceeding without RAG context:', ragErr.message);
    }

    const validator = (parsed) => {
      if (!parsed.contentIdeas || !parsed.videoScripts || !parsed.checklist || !parsed.playbook || !parsed.seoKeywords) {
        throw new AppError('Dữ liệu kế hoạch tiếp thị từ AI thiếu các trường bắt buộc.', 502);
      }
      return parsed;
    };

    const result = await this.generateStructuredContent({
      prompt: userPrompt,
      systemPrompt: SYSTEM_PROMPT,
      validatorFn: validator,
    });

    return result.data;
  }

  /**
   * Generates a Detailed Social Post for a specific platform & trend
   */
  async generateDetailedPost({
    ideaTitle,
    ideaDescription,
    platform,
    brandVoice = 'Chuyên nghiệp, tin cậy',
    usp = 'Chất lượng cao',
    resources = 'Chưa xác định',
    reason = 'Chưa xác định',
  }) {
    const SYSTEM_PROMPT = `Bạn là một Chuyên gia Sáng tạo Nội dung (Content Creator) hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là viết một bài đăng mạng xã hội (social media post) hoàn chỉnh, sẵn sàng đăng tải dựa trên ý tưởng và nền tảng được cung cấp, phù hợp với tiếng nói thương hiệu và các điểm nổi bật của doanh nghiệp.

CẤU TRÚC BÀI ĐĂNG:
1. Hook hấp dẫn, giữ chân người đọc ngay từ dòng đầu tiên.
2. Body làm nổi bật giá trị sản phẩm và điểm độc nhất (USP).
3. Call-to-Action (CTA) kêu gọi hành động rõ ràng.
4. Dùng emojis sinh động, phù hợp văn hóa mạng xã hội Việt Nam.
5. Hashtags liên quan ở cuối bài.
Chỉ trả về nội dung bài viết dạng văn bản thuần túy, không thêm lời chào hay giải thích ngoài bài viết.`;

    const prompt = `Viết bài đăng cho nền tảng: "${platform}"
- Tiêu đề ý tưởng: ${ideaTitle}
- Mô tả: ${ideaDescription}
- USP thương hiệu: ${usp}
- Brand Voice: ${brandVoice}
- Tài nguyên: ${resources}
- Lý do/Bối cảnh: ${reason}`;

    const result = await this.generateText({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.8,
    });

    return { content: result.text.trim() };
  }

  /**
   * Multi-modal generation: Post + Design tips from uploaded image
   */
  async generateDetailedPostWithImage({
    ideaTitle,
    ideaDescription,
    platform,
    brandVoice = 'Chuyên nghiệp',
    usp = 'Chất lượng cao',
    file,
    imageUrl,
  }) {
    const systemPrompt = `Bạn là Giám đốc Sáng tạo (Creative Director) hàng đầu tại Việt Nam.
Người dùng gửi cho bạn ảnh sản phẩm thô. Hãy trả về CHÍNH XÁC hai phần:

[NỘI DUNG BÀI ĐĂNG]
(Bài đăng hoàn chỉnh: Hook -> Khai thác chi tiết nhìn thấy trong ảnh -> Call to Action -> Hashtags)

[GỢI Ý THIẾT KẾ]
(4-6 gạch đầu dòng hướng dẫn chỉnh sửa ảnh thực tế trên Canva/CapCut cho người không chuyên)`;

    const userPrompt = `Tạo bài đăng nền tảng "${platform}" cho sản phẩm trong ảnh:
- Tiêu đề: ${ideaTitle}
- Mô tả: ${ideaDescription}
- USP: ${usp}
- Brand Voice: ${brandVoice}`;

    // Use Gemini Vision if Gemini key is available
    if (this.gemini.isAvailable()) {
      try {
        const visionResult = await this.gemini.generateVision({
          prompt: userPrompt,
          systemPrompt,
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
        });
        return { content: visionResult.text.trim(), imageUrl };
      } catch (err) {
        console.warn('[Gemini Vision fallback to text model]:', err.message);
      }
    }

    // Fallback: Use standard text model describing the image context
    const textResult = await this.generateText({
      prompt: `${userPrompt}\n(Ảnh đính kèm đã được tải lên: ${imageUrl})`,
      systemPrompt,
    });

    return { content: textResult.text.trim(), imageUrl };
  }

  /**
   * Real Marketing Plan Revision Assistant
   * Refines existing marketing plan based on natural language user feedback
   */
  async refineMarketingPlan({ plan, instruction }) {
    const SYSTEM_PROMPT = `Bạn là Trợ lý Chiến lược Marketing AI.
Người dùng đang có một kế hoạch marketing và muốn điều chỉnh nó theo yêu cầu cụ thể.
Nhiệm vụ của bạn là nhận kế hoạch hiện tại và chỉ dẫn điều chỉnh, sau đó cập nhật kế hoạch phù hợp với chỉ dẫn.

BẠN PHẢI TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ VỚI CÁC TRƯỜNG ĐÃ ĐƯỢC ĐIỀU CHỈNH:
{
  "contentIdeas": [...],
  "videoScripts": [...],
  "checklist": [...],
  "playbook": [...],
  "seoKeywords": [...],
  "revisionSummary": "Tóm tắt ngắn gọn những điểm bạn vừa cập nhật theo yêu cầu của người dùng"
}`;

    const prompt = `KẾ HOẠCH HIỆN TẠI:
- Mục tiêu: ${plan.goal}
- Ngành hàng: ${plan.businessProfile?.businessType || 'Chung'}
- Ý tưởng nội dung hiện tại: ${typeof plan.contentIdeas === 'string' ? plan.contentIdeas : JSON.stringify(plan.contentIdeas)}
- Kịch bản video hiện tại: ${typeof plan.videoScripts === 'string' ? plan.videoScripts : JSON.stringify(plan.videoScripts)}
- Checklist hiện tại: ${typeof plan.checklist === 'string' ? plan.checklist : JSON.stringify(plan.checklist)}
- Playbook hiện tại: ${typeof plan.playbook === 'string' ? plan.playbook : JSON.stringify(plan.playbook)}

YÊU CẦU ĐIỀU CHỈNH CỦA NGƯỜI DÙNG:
"${instruction}"

Hãy áp dụng yêu cầu trên để cập nhật lại các phần trong kế hoạch cho thật thực tế, sáng tạo và bám sát mong muốn của người dùng.`;

    const result = await this.generateStructuredContent({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      validatorFn: (parsed) => {
        if (!parsed.contentIdeas || !parsed.videoScripts || !parsed.checklist || !parsed.playbook) {
          throw new AppError('Dữ liệu cập nhật từ AI không đầy đủ cấu trúc.', 502);
        }
        return parsed;
      },
    });

    return result.data;
  }

  /**
   * Derives an Image Prompt / Creative Brief from post content & campaign brief
   */
  async generateImagePrompt({ postContent, platform, brandContext = '' }) {
    const SYSTEM_PROMPT = `You are an elite Commercial Advertising Visual Director specializing in image generation prompts for diffusion models like FLUX and Midjourney.
Your task is to analyze a Vietnamese social media marketing post and craft a detailed English prompt for generating a stunning, high-converting commercial photograph or graphic.

CRITICAL RULES:
1. Describe the scene, lighting, camera angle, textures, colors, and subject in vivid English.
2. Incorporate modern Vietnamese commercial aesthetic (e.g. cozy Saigon cafe aesthetic, tropical natural lighting, minimalist Vietnamese retail).
3. DO NOT include long text or typography in the image prompt because diffusion models butcher text.
4. Keep the output clean: return ONLY the final English prompt, under 100 words, no quotes or prefixes.`;

    const prompt = `Social Media Platform: ${platform}
Brand & Business Context: ${brandContext}
Post Content:
${postContent.slice(0, 1000)}`;

    const result = await this.generateText({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 250,
    });

    return { imagePrompt: result.text.trim() };
  }

  /**
   * Generates Social Post Image using fal.ai / OpenRouter,
   * copies the generated image into application Supabase Storage,
   * and saves a persistent MediaAsset record.
   */
  async generateSocialImage({
    prompt,
    aspectRatio = '1:1',
    platform = 'Facebook',
    userId,
    businessProfileId = null,
  }) {
    await this.acquireConcurrencySlot();
    const startTime = Date.now();
    const providers = this.getImageProvidersInPriority();

    if (providers.length === 0) {
      this.releaseConcurrencySlot();
      throw new AppError(
        'Không có nhà cung cấp tạo ảnh AI nào được cấu hình (FAL_KEY hoặc OPENROUTER_API_KEY).',
        503
      );
    }

    let lastError = null;
    let generatedImageResult = null;

    for (const { name, instance } of providers) {
      for (let attempt = 0; attempt <= aiConfig.limits.maxRetries; attempt++) {
        try {
          generatedImageResult = await instance.generateImage({
            prompt,
            aspectRatio,
          });
          break;
        } catch (err) {
          lastError = err;
          console.warn(`[AI Image Service] ${name} attempt ${attempt + 1} failed:`, err.message || err);
          if (isTransientError(err) && attempt < aiConfig.limits.maxRetries) {
            await waitWithBackoff(attempt);
          } else {
            break;
          }
        }
      }

      if (generatedImageResult) break;
    }

    this.releaseConcurrencySlot();

    if (!generatedImageResult) {
      this.recordUsage({
        type: 'image',
        durationMs: Date.now() - startTime,
        success: false,
        error: lastError?.message,
      });
      throw new AppError(
        `Không thể tạo ảnh AI: ${lastError?.message || 'Lỗi từ nhà cung cấp dịch vụ'}`,
        503
      );
    }

    // Step 2: Download the generated image buffer to prevent expiring temporary URLs
    let persistentUrl = generatedImageResult.imageUrl;
    let sizeBytes = 0;
    try {
      const imageResponse = await axios.get(generatedImageResult.imageUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
      });

      const buffer = Buffer.from(imageResponse.data);
      sizeBytes = buffer.length;
      const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
      const fileExt = mimeType.includes('png') ? '.png' : '.jpg';
      const fileName = `ai-${Date.now()}-${Math.round(Math.random() * 1e6)}${fileExt}`;

      // Upload buffer to Supabase Storage
      const pseudoMulterFile = {
        buffer,
        mimetype: mimeType,
        originalname: fileName,
      };

      const uploaded = await uploadCampaignAsset(pseudoMulterFile, `user-${userId}`);
      persistentUrl = uploaded.publicUrl;
    } catch (storageErr) {
      console.warn('[Storage Notice] Could not mirror image to Supabase Storage, using provider URL:', storageErr.message);
      // Fallback to provider image URL if Supabase storage is unavailable in local dev
    }

    // Step 3: Persist into media_assets table
    let assetRecord = null;
    try {
      assetRecord = await prisma.mediaAsset.create({
        data: {
          userId,
          businessProfileId: businessProfileId ? Number(businessProfileId) : null,
          name: `AI_${platform}_${aspectRatio.replace(':', 'x')}_${Date.now()}`,
          url: persistentUrl,
          fileType: 'image',
          sizeBytes,
        },
      });
    } catch (dbErr) {
      console.warn('[Prisma Notice] Could not save MediaAsset record:', dbErr.message);
    }

    this.recordUsage({
      type: 'image',
      provider: generatedImageResult.provider,
      model: generatedImageResult.model,
      durationMs: Date.now() - startTime,
      success: true,
    });

    return {
      imageUrl: persistentUrl,
      mediaAssetId: assetRecord?.id || null,
      prompt,
      aspectRatio,
      provider: generatedImageResult.provider,
      model: generatedImageResult.model,
    };
  }
}

const aiService = new AIService();
aiService.isTransientError = isTransientError;
aiService.AIService = AIService;
module.exports = aiService;
