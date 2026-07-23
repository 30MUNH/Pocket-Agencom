const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getMarketCampaigns(user = null) {
  // If user is a logged-in KOL, check if they have a KolProfile to check application status
  let userKolProfileId = null;
  if (user && user.role === 'kol') {
    const kolProfile = await prisma.kolProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (kolProfile) {
      userKolProfileId = kolProfile.id;
    }
  }

  const campaigns = await prisma.marketingPlan.findMany({
    where: {
      isLookingForKol: true,
    },
    include: {
      businessProfile: {
        select: {
          id: true,
          businessName: true,
          businessType: true,
          productDescription: true,
          targetCustomer: true,
          location: true,
          brandVoice: true,
          budgetRange: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      applications: {
        select: {
          id: true,
          kolProfileId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return campaigns.map((campaign) => {
    const hasApplied = userKolProfileId
      ? campaign.applications.some((app) => app.kolProfileId === userKolProfileId)
      : false;

    return {
      id: campaign.id,
      goal: campaign.goal,
      campaignType: campaign.campaignType,
      budget: campaign.budget ? Number(campaign.budget) : null,
      contentIdeas: campaign.contentIdeas,
      deploymentChannels: campaign.deploymentChannels,
      createdAt: campaign.createdAt,
      brandName: campaign.businessProfile?.businessName || campaign.user?.name || 'Thương hiệu',
      businessType: campaign.businessProfile?.businessType || 'Doanh nghiệp',
      location: campaign.businessProfile?.location || 'Toàn quốc',
      productDescription: campaign.businessProfile?.productDescription,
      targetCustomer: campaign.businessProfile?.targetCustomer,
      applicationsCount: campaign.applications.length,
      hasApplied,
    };
  });
}

async function applyToCampaign(campaignId, user, { coverLetter }) {
  const campaignIdInt = parseInt(campaignId, 10);
  if (isNaN(campaignIdInt)) {
    throw new AppError('Mã chiến dịch không hợp lệ', 400);
  }

  // Find KOL profile for this user
  const kolProfile = await prisma.kolProfile.findUnique({
    where: { userId: user.id },
  });

  if (!kolProfile) {
    throw new AppError('Bạn chưa tạo hồ sơ KOL. Vui lòng cập nhật hồ sơ trước khi ứng tuyển.', 400);
  }

  // Check campaign exists and is active for recruiting
  const campaign = await prisma.marketingPlan.findUnique({
    where: { id: campaignIdInt },
  });

  if (!campaign) {
    throw new AppError('Không tìm thấy chiến dịch', 404);
  }

  if (!campaign.isLookingForKol) {
    throw new AppError('Chiến dịch này hiện không tiếp nhận hồ sơ ứng tuyển', 400);
  }

  // Check existing application
  const existingApp = await prisma.campaignApplication.findUnique({
    where: {
      campaignId_kolProfileId: {
        campaignId: campaignIdInt,
        kolProfileId: kolProfile.id,
      },
    },
  });

  if (existingApp) {
    throw new AppError('Bạn đã ứng tuyển vào chiến dịch này rồi', 400);
  }

  const application = await prisma.campaignApplication.create({
    data: {
      campaignId: campaignIdInt,
      kolProfileId: kolProfile.id,
      coverLetter: coverLetter || null,
      status: 'pending',
    },
    include: {
      kolProfile: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return application;
}

async function getCampaignApplications(campaignId, user) {
  const campaignIdInt = parseInt(campaignId, 10);
  if (isNaN(campaignIdInt)) {
    throw new AppError('Mã chiến dịch không hợp lệ', 400);
  }

  const campaign = await prisma.marketingPlan.findUnique({
    where: { id: campaignIdInt },
  });

  if (!campaign) {
    throw new AppError('Không tìm thấy chiến dịch', 404);
  }

  // Permission check: campaign owner, staff or admin
  if (campaign.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền xem danh sách ứng tuyển của chiến dịch này', 403);
  }

  const applications = await prisma.campaignApplication.findMany({
    where: { campaignId: campaignIdInt },
    include: {
      kolProfile: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          kolType: true,
          niche: true,
          location: true,
          followerCount: true,
          rating: true,
          engagementRate: true,
          priceFrom: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return applications.map((app) => ({
    id: app.id,
    campaignId: app.campaignId,
    status: app.status,
    coverLetter: app.coverLetter,
    createdAt: app.createdAt,
    kol: {
      id: app.kolProfile.id,
      name: app.kolProfile.name,
      avatarUrl: app.kolProfile.avatarUrl,
      kolType: app.kolProfile.kolType,
      niche: app.kolProfile.niche,
      location: app.kolProfile.location,
      followerCount: app.kolProfile.followerCount,
      rating: app.kolProfile.rating ? Number(app.kolProfile.rating) : 0,
      engagementRate: app.kolProfile.engagementRate ? Number(app.kolProfile.engagementRate) : 0,
      priceFrom: app.kolProfile.priceFrom ? Number(app.kolProfile.priceFrom) : null,
    },
  }));
}

async function updateApplicationStatus(applicationId, user, { status }) {
  const appIdInt = parseInt(applicationId, 10);
  if (isNaN(appIdInt)) {
    throw new AppError('Mã ứng tuyển không hợp lệ', 400);
  }

  const application = await prisma.campaignApplication.findUnique({
    where: { id: appIdInt },
    include: {
      campaign: true,
    },
  });

  if (!application) {
    throw new AppError('Không tìm thấy đơn ứng tuyển', 404);
  }

  // Check ownership
  if (application.campaign.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền cập nhật trạng thái ứng tuyển này', 403);
  }

  const updated = await prisma.campaignApplication.update({
    where: { id: appIdInt },
    data: { status },
    include: {
      kolProfile: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return updated;
}

async function toggleRecruiting(campaignId, user, isLookingForKol) {
  const campaignIdInt = parseInt(campaignId, 10);
  if (isNaN(campaignIdInt)) {
    throw new AppError('Mã chiến dịch không hợp lệ', 400);
  }

  const campaign = await prisma.marketingPlan.findUnique({
    where: { id: campaignIdInt },
  });

  if (!campaign) {
    throw new AppError('Không tìm thấy chiến dịch', 404);
  }

  if (campaign.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền thay đổi trạng thái tuyển KOL của chiến dịch này', 403);
  }

  const updated = await prisma.marketingPlan.update({
    where: { id: campaignIdInt },
    data: {
      isLookingForKol: isLookingForKol !== undefined ? isLookingForKol : !campaign.isLookingForKol,
    },
  });

  return updated;
}

module.exports = {
  getMarketCampaigns,
  applyToCampaign,
  getCampaignApplications,
  updateApplicationStatus,
  toggleRecruiting,
};
