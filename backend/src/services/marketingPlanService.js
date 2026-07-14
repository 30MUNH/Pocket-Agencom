const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { isValidPlanTransition } = require('../validators/marketingPlan.validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Gemini SDK Initialization ──────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.9,
  },
});

const SYSTEM_PROMPT = `Bạn là một Chuyên gia Chiến lược Marketing hàng đầu chuyên về Doanh nghiệp Siêu nhỏ và Nhỏ (Micro-SME) tại Việt Nam.
Bạn có kiến thức sâu rộng về thị trường Việt Nam, hành vi người tiêu dùng Việt, các nền tảng mạng xã hội phổ biến (TikTok, Facebook, Instagram, YouTube Shorts), và xu hướng marketing KOL/KOC tại Việt Nam.

NHIỆM VỤ: Dựa trên thông tin chiến dịch do người dùng cung cấp, hãy tạo ra một bản kế hoạch marketing chi tiết, sáng tạo, thực tế và hoàn toàn bằng tiếng Việt.

QUY TẮC BẮT BUỘC:
1. Toàn bộ nội dung PHẢI được viết bằng tiếng Việt tự nhiên, phù hợp với văn hóa và thị hiếu người Việt.
2. Ý tưởng nội dung phải sáng tạo, bắt trend và phù hợp với ngân sách của doanh nghiệp nhỏ.
3. Kịch bản video phải chi tiết, có phân cảnh rõ ràng với thời gian cụ thể, lời thoại tự nhiên như KOL Việt Nam thực sự.
4. Checklist phải có tối thiểu 5 mục, mỗi mục là một hành động cụ thể và khả thi.
5. Playbook phải là hướng dẫn quy trình từng bước chi tiết, từ chuẩn bị đến đo lường kết quả.

Trả về DUY NHẤT một JSON object hợp lệ theo đúng cấu trúc sau (KHÔNG kèm markdown, backtick, hay văn bản hội thoại):
{
  "contentIdeas": [
    { "title": "string", "channel": "string", "format": "string", "description": "string" }
  ],
  "videoScripts": [
    { "scene": "string (ví dụ: 0-3s)", "action": "string", "dialogue": "string" }
  ],
  "checklist": [ "string", "string", "..." ],
  "playbook": "string (hướng dẫn thực thi chi tiết từng bước)"
}`;

// ── Gemini-powered AI Content Generator ────────────────────────────────────────
async function generateAIContent(data) {
  const userPrompt = `Hãy tạo kế hoạch marketing cho chiến dịch sau:

- Loại chiến dịch: ${data.campaignType}
- Ngành hàng: ${data.businessType}
- Mô tả sản phẩm/dịch vụ: ${data.productDescription}
- Khách hàng mục tiêu: ${data.targetCustomer}
- Mục tiêu chiến dịch: ${data.goal}
- Ngân sách dự kiến: ${data.budget ? Number(data.budget).toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}

Yêu cầu:
- Tạo ít nhất 3 ý tưởng nội dung (contentIdeas) phù hợp với ngành ${data.businessType} và loại chiến dịch ${data.campaignType}.
- Tạo kịch bản video ngắn (videoScripts) gồm ít nhất 4 phân cảnh chi tiết.
- Tạo danh sách checklist công việc (checklist) gồm ít nhất 5 mục hành động cụ thể.
- Tạo playbook hướng dẫn quy trình thực thi từ A đến Z.`;

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Validate required fields exist
    if (!parsed.contentIdeas || !parsed.videoScripts || !parsed.checklist || !parsed.playbook) {
      throw new Error('Gemini response missing required fields');
    }

    return parsed;
  } catch (err) {
    console.error('[Gemini AI Error]', err.message || err);

    // Fallback: return minimal valid content so the request doesn't crash
    return {
      contentIdeas: [
        {
          title: 'Video giới thiệu sản phẩm',
          channel: 'TikTok/Reels',
          format: 'Short Video (60s)',
          description: `Giới thiệu ${(data.productDescription || '').slice(0, 80)} một cách chân thực và gần gũi.`,
        },
        {
          title: 'Bài viết hình ảnh chuyên sâu',
          channel: 'Facebook',
          format: 'Bài viết kèm album ảnh',
          description: `Nội dung hướng đến ${(data.targetCustomer || '').slice(0, 60)} với thông điệp rõ ràng.`,
        },
        {
          title: 'Livestream tương tác trực tiếp',
          channel: 'Facebook/TikTok',
          format: 'Livestream (30-60 phút)',
          description: 'Trải nghiệm sản phẩm trực tiếp, giải đáp thắc mắc và tặng voucher cho người xem.',
        },
      ],
      videoScripts: [
        { scene: '0-3s', action: 'Hook gây tò mò, hiển thị sản phẩm nổi bật', dialogue: 'Chào mọi người! Hôm nay mình sẽ chia sẻ một sản phẩm cực kỳ đáng thử...' },
        { scene: '3-20s', action: 'Demo sản phẩm, nêu bật lợi ích chính', dialogue: `Điểm mình thích nhất ở sản phẩm này là phù hợp hoàn hảo cho ${(data.targetCustomer || '').slice(0, 50)}...` },
        { scene: '20-50s', action: 'Chia sẻ trải nghiệm cá nhân và kết quả thực tế', dialogue: 'Sau khi sử dụng, mình thấy sự khác biệt rõ rệt...' },
        { scene: '50-60s', action: 'CTA kèm ưu đãi độc quyền', dialogue: `Link ở bio nhé! Đừng bỏ lỡ ưu đãi đặc biệt chỉ có hôm nay!` },
      ],
      checklist: [
        'Chuẩn bị mẫu sản phẩm gửi cho KOL/KOC trước ngày quay 3 ngày',
        'Duyệt kịch bản nháp từ đối tác KOL',
        'Thiết lập link tracking và mã giảm giá riêng cho chiến dịch',
        'Lên lịch đăng bài vào khung giờ vàng tương tác',
        'Theo dõi số liệu và điều chỉnh chiến lược hàng tuần',
      ],
      playbook: `Quy trình thực thi: 1. Thống nhất brief → 2. Gửi sản phẩm → 3. Duyệt kịch bản → 4. Sản xuất nội dung → 5. Đăng bài & đo lường → 6. Báo cáo ROI. Loại chiến dịch: ${data.campaignType}. Ngân sách: ${data.budget || 'Chưa xác định'}.`,
    };
  }
}

function formatPlan(plan) {
  const parse = (field) => {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  };

  return {
    ...plan,
    budget: plan.budget ? Number(plan.budget) : null,
    contentIdeas: parse(plan.contentIdeas),
    videoScripts: parse(plan.videoScripts),
    checklist: parse(plan.checklist),
  };
}

async function generatePlan(userId, data) {
  const aiContent = await generateAIContent(data);

  const plan = await prisma.$transaction(async (tx) => {
    let profile = await tx.businessProfile.findUnique({ where: { userId } });

    if (profile) {
      profile = await tx.businessProfile.update({
        where: { id: profile.id },
        data: {
          businessType: data.businessType,
          productDescription: data.productDescription,
          targetCustomer: data.targetCustomer,
          marketingGoal: data.goal,
          budgetRange: data.budget ? `${data.budget} VND` : profile.budgetRange,
        },
      });
    } else {
      profile = await tx.businessProfile.create({
        data: {
          userId,
          businessType: data.businessType,
          productDescription: data.productDescription,
          targetCustomer: data.targetCustomer,
          marketingGoal: data.goal,
          budgetRange: data.budget ? `${data.budget} VND` : null,
        },
      });
    }

    const created = await tx.marketingPlan.create({
      data: {
        userId,
        businessProfileId: profile.id,
        goal: data.goal,
        campaignType: data.campaignType,
        budget: data.budget,
        contentIdeas: JSON.stringify(aiContent.contentIdeas),
        videoScripts: JSON.stringify(aiContent.videoScripts),
        checklist: JSON.stringify(aiContent.checklist),
        playbook: aiContent.playbook,
        status: 'draft',
      },
      include: {
        businessProfile: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return created;
  });

  return formatPlan(plan);
}

async function getPlans(user) {
  const where =
    user.role === 'staff' || user.role === 'admin'
      ? { status: { in: ['saved', 'reviewed', 'need_revision'] } }
      : { userId: user.id };

  const plans = await prisma.marketingPlan.findMany({
    where,
    include: {
      businessProfile: true,
      reviewedBy: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return plans.map(formatPlan);
}

async function getPlanById(id, user) {
  const plan = await prisma.marketingPlan.findUnique({
    where: { id: Number(id) },
    include: {
      businessProfile: true,
      reviewedBy: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!plan) {
    throw new AppError('Marketing plan not found', 404);
  }

  if (user.role === 'user' && plan.userId !== user.id) {
    throw new AppError('Access denied', 403);
  }

  return formatPlan(plan);
}

async function savePlan(id, userId) {
  const plan = await prisma.marketingPlan.findUnique({ where: { id: Number(id) } });
  if (!plan) {
    throw new AppError('Marketing plan not found', 404);
  }
  if (plan.userId !== userId) {
    throw new AppError('Access denied', 403);
  }

  const targetStatus = 'saved';
  if (!isValidPlanTransition(plan.status, targetStatus) && plan.status !== 'saved') {
    if (plan.status === 'draft') {
      // allowed
    } else {
      throw new AppError(`Cannot save plan in "${plan.status}" status`, 422);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.marketingPlan.update({
      where: { id: Number(id) },
      data: { status: 'saved' },
      include: {
        businessProfile: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Plan saved',
        message: `Your marketing plan "${result.goal.slice(0, 50)}" has been saved to your dashboard.`,
        type: 'plan',
      },
    });

    const staffUsers = await tx.user.findMany({
      where: { role: 'staff', status: 'active' },
      select: { id: true },
      take: 5,
    });

    for (const staff of staffUsers) {
      await tx.notification.create({
        data: {
          userId: staff.id,
          title: 'Plan ready for review',
          message: `Marketing plan from user requires staff review.`,
          type: 'plan',
        },
      });
    }

    return result;
  });

  return formatPlan(updated);
}

async function reviewPlan(id, staffUser, { action, note }) {
  const plan = await prisma.marketingPlan.findUnique({ where: { id: Number(id) } });
  if (!plan) {
    throw new AppError('Marketing plan not found', 404);
  }

  const statusMap = {
    approve: 'approved',
    need_revision: 'need_revision',
    reviewed: 'reviewed',
  };
  const newStatus = statusMap[action];

  if (action === 'approve' && !['saved', 'reviewed'].includes(plan.status)) {
    throw new AppError(`Cannot approve plan in "${plan.status}" status`, 422);
  } else if (action !== 'approve' && !isValidPlanTransition(plan.status, newStatus)) {
    throw new AppError(
      `Invalid plan transition from "${plan.status}" to "${newStatus}"`,
      422
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.marketingPlan.update({
      where: { id: Number(id) },
      data: {
        status: newStatus,
        reviewedById: staffUser.id,
      },
      include: {
        businessProfile: true,
        reviewedBy: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const messages = {
      approved: 'Your marketing plan has been approved by our team!',
      need_revision: note || 'Your marketing plan needs revisions. Please review staff feedback.',
      reviewed: 'Your marketing plan has been reviewed and is pending final approval.',
    };

    await tx.notification.create({
      data: {
        userId: plan.userId,
        title: `Plan ${newStatus.replace(/_/g, ' ')}`,
        message: messages[newStatus] || note || `Plan status updated to ${newStatus}`,
        type: 'plan',
      },
    });

    return result;
  });

  return formatPlan(updated);
}

async function deletePlan(id, userId) {
  const plan = await prisma.marketingPlan.findUnique({ where: { id: Number(id) } });
  if (!plan) {
    throw new AppError('Marketing plan not found', 404);
  }
  if (plan.userId !== userId) {
    throw new AppError('Access denied', 403);
  }

  await prisma.marketingPlan.delete({ where: { id: Number(id) } });
  return { deleted: true };
}

module.exports = {
  generatePlan,
  getPlans,
  getPlanById,
  savePlan,
  reviewPlan,
  deletePlan,
};
