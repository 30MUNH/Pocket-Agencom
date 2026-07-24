const prisma = require('../config/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../middleware/errorHandler');

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.9,
  },
});

/**
 * Simulates analysis of a social profile URL using Gemini API.
 * Returns a JSON object with mock followers, engagement rate, strengths, and areas to improve.
 */
async function analyzeSocialProfile(url, platform) {
  const SYSTEM_PROMPT = `Bạn là một chuyên gia phân tích dữ liệu mạng xã hội hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là nhận vào một URL tài khoản mạng xã hội (từ TikTok, Facebook, hoặc Instagram) và phân tích/giả lập các chỉ số kênh của họ dựa trên thông tin trong URL hoặc tên thương hiệu/username được gợi ý trong URL.

Hãy trả về duy nhất một đối tượng JSON có cấu trúc sau (KHÔNG kèm theo markdown, ký tự \`\`\` hay văn bản hội thoại):
{
  "followers": number (số lượng người theo dõi ngẫu nhiên phù hợp với nền tảng và tên kênh, ví dụ từ 1200 đến 850000),
  "engagementRate": number (tỷ lệ tương tác theo %, ví dụ từ 1.2 đến 15.0),
  "strengths": string[] (mảng chứa ít nhất 3 nhận xét chiến lược bằng tiếng Việt về điểm mạnh hiện tại của kênh),
  "areasToImprove": string[] (mảng chứa ít nhất 3 nhận xét chiến lược bằng tiếng Việt về những điểm cần tối ưu hóa hoặc cải thiện để phát triển kênh)
}`;

  const userPrompt = `Hãy phân tích tài khoản mạng xã hội này:
- Nền tảng: ${platform}
- URL: ${url}

Hãy đọc kỹ URL, trích xuất username/thương hiệu (nếu có) và sinh ra các số liệu, phân tích sát thực tế và cụ thể cho kênh đó. Trả về đúng định dạng JSON yêu cầu.`;

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return {
      followers: Number(parsed.followers) || Math.floor(Math.random() * 45000) + 5000,
      engagementRate: Number(parsed.engagementRate) || parseFloat((Math.random() * 5 + 1.5).toFixed(2)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [
        'Hình ảnh sản phẩm rõ ràng, chuyên nghiệp',
        'Tương tác tốt với khách hàng dưới phần bình luận',
        'Nội dung video ngắn bắt mắt, trực quan'
      ],
      areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove : [
        'Cần đăng bài đều đặn hơn vào các khung giờ vàng',
        'Chưa đa dạng hóa định dạng nội dung (thiếu Reels/Shorts)',
        'Nên bổ sung thêm lời kêu gọi hành động (CTA) rõ ràng'
      ]
    };
  } catch (err) {
    console.error('[Gemini Social AI Error]', err.message || err);
    // Fallback in case of API limits, network issues, or parsing errors
    return {
      followers: Math.floor(Math.random() * 25000) + 2500,
      engagementRate: parseFloat((Math.random() * 4 + 1.8).toFixed(2)),
      strengths: [
        'Hồ sơ được cập nhật thông tin liên hệ đầy đủ',
        'Có tệp khách hàng trung thành tương tác thường xuyên',
        'Hình ảnh mang phong cách riêng nhất quán'
      ],
      areasToImprove: [
        'Tần suất đăng tải nội dung còn thưa thớt',
        'Cần tối ưu hóa mô tả kênh để tăng tính thương hiệu',
        'Chưa tận dụng tốt âm thanh thịnh hành (đối với video ngắn)'
      ]
    };
  }
}

/**
 * Connects a new social platform link for a user's business profile.
 */
async function addPlatform(userId, { platform, url }) {
  // Find or create Business Profile
  let businessProfile = await prisma.businessProfile.findUnique({
    where: { userId }
  });

  if (!businessProfile) {
    businessProfile = await prisma.businessProfile.create({
      data: {
        userId,
        businessType: 'General',
        productDescription: 'Chưa thiết lập mô tả sản phẩm',
        targetCustomer: 'Khách hàng đại chúng',
      }
    });
  }

  // Analyze profile URL via Gemini
  const analysis = await analyzeSocialProfile(url, platform);

  // Format the aiInsight as a neat markdown string
  const aiInsight = `### Điểm mạnh\n${analysis.strengths.map(s => `- ${s}`).join('\n')}\n\n### Cần cải thiện\n${analysis.areasToImprove.map(a => `- ${a}`).join('\n')}`;

  // Check if platform is already linked for this user to avoid duplicates
  const existing = await prisma.socialPlatform.findFirst({
    where: {
      userId,
      platform
    }
  });

  // Infer platform type (social, ecommerce, custom) and generate initial dynamic metrics
  const { inferPlatformType, generateDemoMetrics } = require('./analyticsService');
  const platformType = inferPlatformType(platform, url);
  const metrics = generateDemoMetrics(platform, platformType, analysis.followers, analysis.engagementRate);

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
        businessProfileId: businessProfile.id
      }
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
        businessProfileId: businessProfile.id
      }
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
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Deletes a linked platform.
 */
async function deletePlatform(userId, id) {
  const record = await prisma.socialPlatform.findUnique({
    where: { id }
  });

  if (!record) {
    throw new AppError('Không tìm thấy liên kết mạng xã hội này.', 404);
  }

  if (record.userId !== userId) {
    throw new AppError('Không có quyền thực hiện hành động này.', 403);
  }

  await prisma.socialPlatform.delete({
    where: { id }
  });

  return { deleted: true };
}

/**
 * Re-runs analysis on an existing platform.
 */
async function triggerAnalysis(userId, id) {
  const record = await prisma.socialPlatform.findUnique({
    where: { id }
  });

  if (!record) {
    throw new AppError('Không tìm thấy liên kết mạng xã hội này.', 404);
  }

  if (record.userId !== userId) {
    throw new AppError('Không có quyền thực hiện hành động này.', 403);
  }

  const analysis = await analyzeSocialProfile(record.url, record.platform);
  const aiInsight = `### Điểm mạnh\n${analysis.strengths.map(s => `- ${s}`).join('\n')}\n\n### Cần cải thiện\n${analysis.areasToImprove.map(a => `- ${a}`).join('\n')}`;

  const updated = await prisma.socialPlatform.update({
    where: { id },
    data: {
      followersCount: analysis.followers,
      engagementRate: analysis.engagementRate,
      aiInsight
    }
  });

  return updated;
}

module.exports = {
  analyzeSocialProfile,
  addPlatform,
  getPlatforms,
  deletePlatform,
  triggerAnalysis
};
