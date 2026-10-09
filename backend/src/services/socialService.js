const prisma = require('../config/prisma');
const aiService = require('./ai/aiService');
const { scrapePublicMetrics } = require('./scraperService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Analyzes a social profile URL.
 * Uses real public metadata scraping for numeric metrics,
 * and AI solely for qualitative strategic insights (strengths, areas to improve).
 */
async function analyzeSocialProfile(url, platform) {
  // Step 1: Scrape real public metrics
  let scraped = {};
  try {
    scraped = await scrapePublicMetrics(url);
  } catch (err) {
    console.warn('[Social Scraper Notice] Could not scrape public metrics:', err.message);
  }

  const followers = scraped.followers || 0;
  const engagementRate = scraped.engagementRate || 0;

  // Step 2: Use AI for strategic qualitative feedback
  const SYSTEM_PROMPT = `Bạn là một chuyên gia tư vấn chiến lược mạng xã hội hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là đưa ra nhận xét chiến lược về kênh truyền thông dựa trên nền tảng và liên kết.
Trả về DUY NHẤT một đối tượng JSON:
{
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2", "Điểm mạnh 3"],
  "areasToImprove": ["Điểm cần tối ưu 1", "Điểm cần tối ưu 2", "Điểm cần tối ưu 3"]
}`;

  const userPrompt = `Đưa ra nhận xét chiến lược cho kênh mạng xã hội:
- Nền tảng: ${platform}
- URL: ${url}`;

  let qualitative = {
    strengths: [
      'Hồ sơ cập nhật kênh liên lạc rõ ràng',
      'Định vị kênh phù hợp với đối tượng mục tiêu',
      'Có tiềm năng phát triển nội dung đa định dạng',
    ],
    areasToImprove: [
      'Nên duy trì lịch đăng bài đều đặn vào khung giờ vàng',
      'Tăng cường các định dạng video ngắn (Reels, TikTok, Shorts)',
      'Bổ sung lời kêu gọi hành động (CTA) cụ thể ở mỗi bài đăng',
    ],
  };

  try {
    const aiResult = await aiService.generateStructuredContent({
      prompt: userPrompt,
      systemPrompt: SYSTEM_PROMPT,
      validatorFn: (parsed) => {
        if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.areasToImprove)) {
          throw new Error('Invalid structure');
        }
        return parsed;
      },
    });

    if (aiResult.data) {
      qualitative = aiResult.data;
    }
  } catch (aiErr) {
    console.warn('[Social AI Advice Notice] Could not generate qualitative advice:', aiErr.message);
  }

  return {
    followers,
    engagementRate,
    strengths: qualitative.strengths,
    areasToImprove: qualitative.areasToImprove,
  };
}

/**
 * Connects a new social platform link for a user's business profile.
 */
async function addPlatform(userId, { platform, url }) {
  let businessProfile = await prisma.businessProfile.findUnique({
    where: { userId },
  });

  if (!businessProfile) {
    businessProfile = await prisma.businessProfile.create({
      data: {
        userId,
        businessType: 'General',
        productDescription: 'Chưa thiết lập mô tả sản phẩm',
        targetCustomer: 'Khách hàng đại chúng',
      },
    });
  }

  const analysis = await analyzeSocialProfile(url, platform);

  const aiInsight = `### Điểm mạnh\n${analysis.strengths.map((s) => `- ${s}`).join('\n')}\n\n### Cần cải thiện\n${analysis.areasToImprove.map((a) => `- ${a}`).join('\n')}`;

  const existing = await prisma.socialPlatform.findFirst({
    where: {
      userId,
      platform,
    },
  });

  const { inferPlatformType, generatePlatformMetrics } = require('./analyticsService');
  const platformType = inferPlatformType(platform, url);
  const metrics = generatePlatformMetrics(platform, platformType, analysis.followers, analysis.engagementRate);

  let record;
  if (existing) {
    record = await prisma.socialPlatform.update({
      where: { id: existing.id },
      data: {
        url,
        platformType,
        followersCount: analysis.followers,
        engagementRate: analysis.engagementRate,
        metrics,
        aiInsight,
        businessProfileId: businessProfile.id,
      },
    });
  } else {
    record = await prisma.socialPlatform.create({
      data: {
        userId,
        platform,
        platformType,
        url,
        followersCount: analysis.followers,
        engagementRate: analysis.engagementRate,
        metrics,
        aiInsight,
        businessProfileId: businessProfile.id,
      },
    });
  }

  return record;
}

/**
 * Get all linked platforms for a user.
 */
async function getPlatforms(userId) {
  return prisma.socialPlatform.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Deletes a linked platform.
 */
async function deletePlatform(userId, id) {
  const record = await prisma.socialPlatform.findUnique({
    where: { id },
  });

  if (!record) {
    throw new AppError('Không tìm thấy liên kết mạng xã hội này.', 404);
  }

  if (record.userId !== userId) {
    throw new AppError('Không có quyền thực hiện hành động này.', 403);
  }

  await prisma.socialPlatform.delete({
    where: { id },
  });

  return { deleted: true };
}

/**
 * Re-runs analysis on an existing platform.
 */
async function triggerAnalysis(userId, id) {
  const record = await prisma.socialPlatform.findUnique({
    where: { id },
  });

  if (!record) {
    throw new AppError('Không tìm thấy liên kết mạng xã hội này.', 404);
  }

  if (record.userId !== userId) {
    throw new AppError('Không có quyền thực hiện hành động này.', 403);
  }

  const analysis = await analyzeSocialProfile(record.url, record.platform);
  const aiInsight = `### Điểm mạnh\n${analysis.strengths.map((s) => `- ${s}`).join('\n')}\n\n### Cần cải thiện\n${analysis.areasToImprove.map((a) => `- ${a}`).join('\n')}`;

  const updated = await prisma.socialPlatform.update({
    where: { id },
    data: {
      followersCount: analysis.followers,
      engagementRate: analysis.engagementRate,
      aiInsight,
    },
  });

  return updated;
}

module.exports = {
  analyzeSocialProfile,
  addPlatform,
  getPlatforms,
  deletePlatform,
  triggerAnalysis,
};
