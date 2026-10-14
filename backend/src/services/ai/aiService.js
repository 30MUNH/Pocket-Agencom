const axios = require('axios');
const { z } = require('zod');
const aiConfig = require('./aiConfig');
const GroqProvider = require('./providers/groqProvider');
const OpenRouterProvider = require('./providers/openRouterProvider');
const GeminiProvider = require('./providers/geminiProvider');
const CloudflareProvider = require('./providers/cloudflareProvider');
const FalProvider = require('./providers/falProvider');
const { AppError } = require('../../middleware/errorHandler');
const { findSimilarStrategies } = require('../ragService');
const { createMediaAccessService } = require('../mediaAccessService');
const prisma = require('../../config/prisma');
const privateMediaAccess = createMediaAccessService({ prismaClient: prisma });

// In-memory usage log & concurrency control
const usageLog = [];
let activeGenerations = 0;

// Daily user quota tracking (in-memory cache synced with persistent database)
const userDailyQuotaUsage = new Map();

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks and atomically increments the persistent user quota.
 */
async function checkAndIncrementUserQuota(userId, type = 'text') {
  if (!userId) return { allowed: true, remaining: 999 };
  const dateKey = getTodayKey();
  const quotaKey = `${userId}:${dateKey}:${type}`;
  const maxLimit =
    type === 'image'
      ? aiConfig.userQuotas.dailyImagesLimit
      : aiConfig.userQuotas.dailyGenerationsLimit;

  let currentCount;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      currentCount = await prisma.$transaction(async (tx) => {
        const where = {
          userId_dateKey_type: {
            userId: Number(userId),
            dateKey,
            type,
          },
        };
        const existing = await tx.aiQuotaUsage.findUnique({ where });
        if (existing && existing.count >= maxLimit) {
          throw new AppError(
            `Bạn đã đạt giới hạn sử dụng AI miễn phí trong ngày (${maxLimit} lượt ${type === 'image' ? 'tạo ảnh' : 'tạo nội dung'}). Hạn ngạch sẽ được làm mới vào ngày mai!`,
            429,
          );
        }

        const record = await tx.aiQuotaUsage.upsert({
          where,
          update: { count: { increment: 1 } },
          create: { userId: Number(userId), dateKey, type, count: 1 },
        });
        if (record.count > maxLimit) {
          throw new AppError(
            `Bạn đã đạt giới hạn sử dụng AI miễn phí trong ngày (${maxLimit} lượt ${type === 'image' ? 'tạo ảnh' : 'tạo nội dung'}). Hạn ngạch sẽ được làm mới vào ngày mai!`,
            429,
          );
        }
        return record.count;
      }, { isolationLevel: 'Serializable' });
      break;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (['P2002', 'P2034'].includes(err.code) && attempt < 2) continue;
      throw new AppError('Không thể xác minh hạn ngạch AI. Vui lòng thử lại sau.', 503);
    }
  }

  userDailyQuotaUsage.set(quotaKey, currentCount);
  return {
    allowed: true,
    used: currentCount,
    limit: maxLimit,
    remaining: Math.max(0, maxLimit - currentCount),
  };
}

/**
 * Synchronous quota check for in-memory only operations & synchronous callers
 */
function checkAndIncrementUserQuotaSync(userId, type = 'text') {
  if (!userId) return { allowed: true, remaining: 999 };
  const dateKey = getTodayKey();
  const quotaKey = `${userId}:${dateKey}:${type}`;
  const currentCount = userDailyQuotaUsage.get(quotaKey) || 0;

  const maxLimit =
    type === 'image'
      ? aiConfig.userQuotas.dailyImagesLimit
      : aiConfig.userQuotas.dailyGenerationsLimit;

  if (currentCount >= maxLimit) {
    throw new AppError(
      `Bạn đã đạt giới hạn sử dụng AI miễn phí trong ngày (${maxLimit} lượt ${type === 'image' ? 'tạo ảnh' : 'tạo nội dung'}). Hạn ngạch sẽ được làm mới vào ngày mai!`,
      429
    );
  }

  userDailyQuotaUsage.set(quotaKey, currentCount + 1);
  return {
    allowed: true,
    used: currentCount + 1,
    limit: maxLimit,
    remaining: maxLimit - (currentCount + 1),
  };
}

async function getUserQuotaStatus(userId) {
  if (!userId) {
    return {
      text: { used: 0, limit: aiConfig.userQuotas.dailyGenerationsLimit, remaining: aiConfig.userQuotas.dailyGenerationsLimit },
      image: { used: 0, limit: aiConfig.userQuotas.dailyImagesLimit, remaining: aiConfig.userQuotas.dailyImagesLimit },
    };
  }
  const dateKey = getTodayKey();
  let textUsed = 0;
  let imageUsed = 0;

  try {
    const records = await prisma.aiQuotaUsage.findMany({
      where: {
        userId: Number(userId),
        dateKey,
      },
    });
    for (const r of records) {
      if (r.type === 'text') textUsed = r.count;
      if (r.type === 'image') imageUsed = r.count;
    }
  } catch {
    throw new AppError('Không thể tải hạn ngạch AI. Vui lòng thử lại sau.', 503);
  }

  return {
    text: {
      used: textUsed,
      limit: aiConfig.userQuotas.dailyGenerationsLimit,
      remaining: Math.max(0, aiConfig.userQuotas.dailyGenerationsLimit - textUsed),
    },
    image: {
      used: imageUsed,
      limit: aiConfig.userQuotas.dailyImagesLimit,
      remaining: Math.max(0, aiConfig.userQuotas.dailyImagesLimit - imageUsed),
    },
  };
}

function getUserQuotaStatusSync(userId) {
  if (!userId) {
    return {
      text: { used: 0, limit: aiConfig.userQuotas.dailyGenerationsLimit, remaining: aiConfig.userQuotas.dailyGenerationsLimit },
      image: { used: 0, limit: aiConfig.userQuotas.dailyImagesLimit, remaining: aiConfig.userQuotas.dailyImagesLimit },
    };
  }
  const dateKey = getTodayKey();
  const textUsed = userDailyQuotaUsage.get(`${userId}:${dateKey}:text`) || 0;
  const imageUsed = userDailyQuotaUsage.get(`${userId}:${dateKey}:image`) || 0;
  return {
    text: {
      used: textUsed,
      limit: aiConfig.userQuotas.dailyGenerationsLimit,
      remaining: Math.max(0, aiConfig.userQuotas.dailyGenerationsLimit - textUsed),
    },
    image: {
      used: imageUsed,
      limit: aiConfig.userQuotas.dailyImagesLimit,
      remaining: Math.max(0, aiConfig.userQuotas.dailyImagesLimit - imageUsed),
    },
  };
}

const marketingPlanOutputSchema = z.object({
  contentIdeas: z.array(z.object({
    title: z.string(),
    channel: z.string().optional(),
    format: z.string().optional(),
    description: z.string(),
  })).min(1),
  videoScripts: z.array(z.object({
    scene: z.string().optional(),
    action: z.string(),
    dialogue: z.string().optional(),
  })).min(1),
  checklist: z.array(z.string()).min(1),
  playbook: z.array(z.object({
    phaseName: z.string(),
    duration: z.string().optional(),
    objective: z.string().optional(),
    keyActions: z.array(z.string()).optional(),
    focusChannels: z.array(z.string()).optional(),
  })).min(1),
  seoKeywords: z.array(z.string()).optional().default([]),
  budgetBreakdown: z.object({
    channels: z.array(z.object({
      channel: z.string(),
      percentage: z.number().optional(),
      estimatedVnd: z.number().optional(),
    })).optional(),
  }).optional().nullable(),
});

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
    this.cloudflare = new CloudflareProvider();
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
      { name: 'cloudflare', instance: this.cloudflare },
      { name: 'fal', instance: this.fal },
      { name: 'openrouter', instance: this.openrouter },
    ];

    const sorted = allProviders.sort((a, b) => {
      if (a.name === primary) return -1;
      if (b.name === primary) return 1;
      return 0;
    });

    // In FREE_ONLY_MODE, strictly filter out paid image providers
    if (aiConfig.freeOnlyMode || !aiConfig.allowPaidModels) {
      return sorted.filter((p) => p.name === 'cloudflare' && p.instance.isAvailable());
    }

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
    if (userId) {
      await checkAndIncrementUserQuota(userId, 'text');
    }
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
      const parsedValidation = marketingPlanOutputSchema.safeParse(parsed);
      if (!parsedValidation.success) {
        console.warn('[Zod Plan Validation Warning]', parsedValidation.error.issues);
        if (!parsed.contentIdeas || !parsed.videoScripts || !parsed.checklist || !parsed.playbook) {
          throw new AppError('Dữ liệu kế hoạch tiếp thị từ AI thiếu các trường bắt buộc.', 502);
        }
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
    mediaAssetId,
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
        return { content: visionResult.text.trim(), mediaAssetId };
      } catch (err) {
        console.warn('[Gemini Vision fallback to text model]:', err.message);
      }
    }

    // Fallback: Use standard text model describing the image context
    const textResult = await this.generateText({
      prompt: `${userPrompt}\n(Ảnh đính kèm đã được gửi an toàn để phân tích.)`,
      systemPrompt,
    });

    return { content: textResult.text.trim(), mediaAssetId };
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
    if ((process.env.PRIVATE_STORAGE_MODE || 'disabled') !== 'private') {
      throw new AppError('Private image storage is disabled.', 503);
    }
    if (userId) {
      await checkAndIncrementUserQuota(userId, 'image');
    }
    await this.acquireConcurrencySlot();
    const startTime = Date.now();
    const providers = this.getImageProvidersInPriority();

    if (providers.length === 0) {
      this.releaseConcurrencySlot();
      throw new AppError(
        'Không có nhà cung cấp tạo ảnh AI miễn phí nào khả dụng (vui lòng cấu hình CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN).',
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

    // Persist generated bytes only to private Storage; provider URLs/data URLs are never durable fallbacks.
    let imageBuffer = generatedImageResult.buffer;
    let mimeType = (generatedImageResult.contentType || 'image/jpeg').split(';')[0].trim().toLowerCase();
    if (!imageBuffer && /^https?:\/\//i.test(generatedImageResult.imageUrl || '')) {
      try {
        const imageResponse = await axios.get(generatedImageResult.imageUrl, { responseType: 'arraybuffer', timeout: 20_000 });
        imageBuffer = Buffer.from(imageResponse.data);
        mimeType = (imageResponse.headers['content-type'] || mimeType).split(';')[0].trim().toLowerCase();
      } catch {
        throw new AppError('Generated image could not be saved to private storage.', 503);
      }
    }
    if (!userId || !imageBuffer) throw new AppError('Generated image could not be saved to private storage.', 503);

    const mainAsset = await privateMediaAccess.createOwnedMediaAsset({
      ownerId: userId,
      file: { buffer: imageBuffer, mimetype: mimeType, originalname: `AI_${platform}_${aspectRatio.replace(':', 'x')}` },
      purpose: 'campaign',
      metadata: { name: `AI_${platform}_${aspectRatio.replace(':', 'x')}_${Date.now()}`, businessProfileId },
    });
    let originalAssetId = null;
    if (generatedImageResult.originalBuffer && generatedImageResult.postProcessed) {
      const originalAsset = await privateMediaAccess.createOwnedMediaAsset({
        ownerId: userId,
        file: { buffer: generatedImageResult.originalBuffer, mimetype: mimeType, originalname: `AI_original_${Date.now()}` },
        purpose: 'campaign',
        metadata: { name: `AI_original_${Date.now()}`, businessProfileId },
      });
      originalAssetId = originalAsset.id;
    }

    this.recordUsage({
      type: 'image',
      provider: generatedImageResult.provider,
      model: generatedImageResult.model,
      durationMs: Date.now() - startTime,
      success: true,
    });

    return {
      mediaAssetId: mainAsset.id,
      originalMediaAssetId: originalAssetId,
      prompt,
      aspectRatio,
      provider: generatedImageResult.provider,
      model: generatedImageResult.model,
      postProcessed: Boolean(generatedImageResult.postProcessed),
    };
  }

  /**
   * Generates or fetches current viral marketing trends in Vietnam,
   * cached in memory to save user quota, with instant refresh capability.
   */
  async getTrendingBulletin({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (!forceRefresh && cachedTrends && now - lastTrendsFetchTime < TRENDS_CACHE_TTL_MS) {
      return cachedTrends;
    }

    const SYSTEM_PROMPT = `Bạn là Chuyên gia Khám phá Trào lưu Mạng Xã hội (Social Trends Scout) hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là tổng hợp 3 trào lưu marketing nóng hổi, sáng tạo và cực kỳ dễ áp dụng cho các chủ shop kinh doanh và SME tại Việt Nam trên TikTok, Facebook, Instagram và Threads.

BẠN BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT MỘT MẢNG JSON HỢP LỆ GỒM 3 ĐỐI TƯỢNG VỚI CẤU TRÚC SAU:
[
  {
    "id": 1,
    "title": "Tiêu đề trào lưu hấp dẫn (VD: Trend '...': ...)",
    "tags": ["#Tag1", "#Tag2", "#Tag3"],
    "trendScope": "SIMPLE_POST",
    "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    "teaser": "Mô tả ngắn gọn và hấp dẫn về cách shop có thể mượn trào lưu này để viral",
    "iconName": "Flame",
    "prefill": {
      "campaignType": "awareness",
      "description": "Chi tiết kịch bản áp dụng thực tế cho cửa hàng",
      "primaryGoal": "Mục tiêu cụ thể",
      "customerProfile": "Khách hàng mục tiêu phù hợp"
    }
  }
]
trendScope có thể là "SIMPLE_POST" (cho 2 trào lưu) hoặc "CAMPAIGN" (cho 1 trào lưu).
iconName có thể là: "Flame", "Zap", hoặc "Award".
Tuyệt đối KHÔNG trả về markdown ngoài mảng JSON.`;

    const prompt = 'Hãy tổng hợp 3 trào lưu marketing thực tế, mới mẻ và dễ áp dụng nhất tuần này tại Việt Nam.';

    try {
      const result = await this.generateStructuredContent({
        prompt,
        systemPrompt: SYSTEM_PROMPT,
        validatorFn: (parsed) => {
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('AI did not return an array of trends');
          }
          return parsed.map((item, idx) => ({
            id: idx + 1,
            title: item.title || `Trào lưu tiếp thị hot #${idx + 1}`,
            tags: Array.isArray(item.tags) ? item.tags : ['#Viral', '#XuHướng'],
            trendScope: item.trendScope === 'CAMPAIGN' ? 'CAMPAIGN' : 'SIMPLE_POST',
            image: item.image || CURATED_DEFAULT_TRENDS[idx % CURATED_DEFAULT_TRENDS.length].image,
            teaser: item.teaser || item.description || 'Trào lưu đang thu hút lượng tương tác lớn trên mạng xã hội.',
            iconName: item.iconName || (idx === 0 ? 'Flame' : idx === 1 ? 'Zap' : 'Award'),
            iconColor: idx === 0 ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : idx === 1 ? 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
            badgeColor: idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : idx === 1 ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
            prefill: {
              campaignType: item.prefill?.campaignType || (idx === 1 ? 'sales' : 'awareness'),
              description: item.prefill?.description || item.teaser || 'Chiến dịch tiếp thị theo xu hướng',
              primaryGoal: item.prefill?.primaryGoal || 'Tăng nhận diện thương hiệu và tương tác',
              customerProfile: item.prefill?.customerProfile || 'Khách hàng trẻ trung yêu thích mạng xã hội',
            },
          }));
        },
      });

      if (result.data && result.data.length > 0) {
        cachedTrends = result.data;
        lastTrendsFetchTime = Date.now();
        return cachedTrends;
      }
    } catch (err) {
      console.warn('[AI Trend Scout Notice] Using curated default trends fallback:', err.message);
    }

    cachedTrends = CURATED_DEFAULT_TRENDS;
    lastTrendsFetchTime = Date.now();
    return cachedTrends;
  }
}

const CURATED_DEFAULT_TRENDS = [
  {
    id: 1,
    title: "Trend 'Thông báo mất tích': Biến sự cố thành Content triệu view!",
    tags: ["#Fastvertising", "#HàiHước", "#Viral"],
    trendScope: "SIMPLE_POST",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    teaser: "Lô hàng 12 tấn KitKat biến mất và cách các thương hiệu lớn 'mượn cớ' thông báo thất lạc để giật spotlight. Shop của bạn có gì để báo 'mất tích' không?",
    iconName: "Flame",
    iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    prefill: {
      campaignType: "awareness",
      description: "Chiến dịch bắt trend 'Thông báo mất tích' - mượn cớ thông báo thất lạc sản phẩm hoặc dịch vụ độc đáo của cửa hàng để tạo sự tò mò, hài hước và thu hút sự chú ý cực lớn từ khách hàng.",
      primaryGoal: "Tạo nội dung viral thu hút trên 10,000 tương tác và tăng nhận diện thương hiệu",
      customerProfile: "Khách hàng trẻ trung, thích theo dõi xu hướng mạng xã hội (Facebook, TikTok, Instagram) và thích nội dung hài hước.",
    }
  },
  {
    id: 2,
    title: "Trend 'Unboxing Hộp Mù (Blind Box)': Cơn sốt bóc quà kích thích tò mò!",
    tags: ["#XuHướngTiêuDùng", "#KíchThíchTòMò", "#DễÁpDụng"],
    trendScope: "CAMPAIGN",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    teaser: "Sức hút từ cảm giác hồi hộp khi tự tay bóc hộp đồ chơi, mỹ phẩm hay phụ kiện ngẫu nhiên. Áp dụng ngay hình thức 'Blind Box' để x3 doanh số bán hàng.",
    iconName: "Zap",
    iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
    prefill: {
      campaignType: "sales",
      description: "Bắt trend 'Unboxing Blind Box' - Đóng gói các sản phẩm bán chạy hoặc các combo của cửa hàng dưới dạng hộp mù ngẫu nhiên kèm theo một số quà tặng giới hạn bất ngờ.",
      primaryGoal: "Thúc đẩy doanh số bán hàng tăng gấp đôi trong tháng và giới thiệu dòng sản phẩm mới.",
      customerProfile: "Khách hàng thích sự bất ngờ, đam mê sưu tầm, đặc biệt là nhóm đối tượng học sinh, sinh viên và nhân viên văn phòng trẻ tuổi.",
    }
  },
  {
    id: 3,
    title: "Trend 'Thử thách 7 ngày lột xác': Kể câu chuyện hành trình đầy cảm xúc!",
    tags: ["#Storytelling", "#TrựcQuan", "#ĐángTinCậy"],
    trendScope: "SIMPLE_POST",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
    teaser: "Tạo dựng lòng tin tuyệt đối bằng cách ghi lại hành trình thay đổi rõ rệt trước và sau khi sử dụng sản phẩm. Phù hợp nhất cho thời trang, mỹ phẩm và sức khỏe.",
    iconName: "Award",
    iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    prefill: {
      campaignType: "retention",
      description: "Chiến dịch kể chuyện (Storytelling) ghi lại hành trình thực tế 'Thử thách 7 ngày lột xác' của khách hàng/người trải nghiệm khi sử dụng sản phẩm chăm sóc/sức khỏe/thời trang.",
      primaryGoal: "Tăng niềm tin vào sản phẩm thông qua minh chứng trực quan, nâng tỷ lệ giữ chân khách hàng cũ lên 25%.",
      customerProfile: "Khách hàng quan tâm sâu sắc tới kết quả thực tế, chú trọng chất lượng, hiệu quả lâu dài và giá trị thực sự của sản phẩm.",
    }
  }
];

let cachedTrends = null;
let lastTrendsFetchTime = 0;
const TRENDS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const aiService = new AIService();
aiService.isTransientError = isTransientError;
aiService.AIService = AIService;
aiService.checkAndIncrementUserQuota = checkAndIncrementUserQuota;
aiService.checkAndIncrementUserQuotaSync = checkAndIncrementUserQuotaSync;
aiService.getUserQuotaStatus = getUserQuotaStatus;
aiService.getUserQuotaStatusSync = getUserQuotaStatusSync;
aiService.marketingPlanOutputSchema = marketingPlanOutputSchema;
aiService.CURATED_DEFAULT_TRENDS = CURATED_DEFAULT_TRENDS;
module.exports = aiService;
