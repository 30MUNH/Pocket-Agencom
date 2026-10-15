const prisma = require('../config/prisma');
const supabase = require('../config/supabase');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const { isValidPlanTransition } = require('../validators/marketingPlan.validator');
const aiService = require('./ai/aiService');
const { validateExternalMediaUrl } = require('./externalMediaUrl');
const { requireOwnedBusinessProfile } = require('./businessProfileAccess');

function assertNoInternalStorageUrls(value, seen = new Set()) {
  if (value == null || typeof value !== 'object') {
    if (typeof value === 'string') {
      const urls = value.match(/https?:\/\/[^\s"'<>\])}]+/gi) || [];
      for (const url of urls) validateExternalMediaUrl(url);
    }
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) value.forEach((entry) => assertNoInternalStorageUrls(entry, seen));
  else Object.values(value).forEach((entry) => assertNoInternalStorageUrls(entry, seen));
}


async function generateAIContent(data, profile, userId) {
  return aiService.generateMarketingPlan(userId, data, profile);
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
    playbook: parse(plan.playbook),
    seoKeywords: parse(plan.seoKeywords),
    budgetBreakdown: parse(plan.budgetBreakdown),
  };
}

async function generatePlan(userId, data) {
  let profile = await prisma.businessProfile.findUnique({ where: { userId } });
  
  assertNoInternalStorageUrls(data);
  const aiContent = await generateAIContent(data, profile, userId);
  assertNoInternalStorageUrls(aiContent);

  const plan = await prisma.$transaction(async (tx) => {
    let profileTx = await tx.businessProfile.findUnique({ where: { userId } });

    if (profileTx) {
      profileTx = await tx.businessProfile.update({
        where: { id: profileTx.id },
        data: {
          businessType: data.businessType,
          productDescription: data.productDescription,
          targetCustomer: data.targetCustomer,
          marketingGoal: data.goal,
          budgetRange: data.budget ? `${data.budget} VND` : profileTx.budgetRange,
        },
      });
    } else {
      profileTx = await tx.businessProfile.create({
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
        businessProfileId: profileTx.id,
        goal: data.goal,
        campaignType: data.campaignType,
        budget: data.budget,
        deploymentChannels: data.deploymentChannels || null,
        existingResources: data.existingResources || null,
        campaignReason: data.campaignReason || null,
        contentIdeas: JSON.stringify(aiContent.contentIdeas),
        videoScripts: JSON.stringify(aiContent.videoScripts),
        checklist: JSON.stringify(aiContent.checklist),
        playbook: JSON.stringify(aiContent.playbook),
        seoKeywords: JSON.stringify(aiContent.seoKeywords),
        budgetBreakdown: aiContent.budgetBreakdown ? JSON.stringify(aiContent.budgetBreakdown) : null,
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
      mediaAssets: { select: { mediaAssetId: true, purpose: true, mediaAsset: { select: { id: true, name: true, sourceKind: true, fileType: true } } } },
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
  }, { maxWait: 10_000, timeout: 15_000 });

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

async function generateDetailedPost(user, { ideaTitle, ideaDescription, platform, businessProfileId, existingResources, campaignReason }) {
  let profile = null;
  if (businessProfileId) {
    profile = await requireOwnedBusinessProfile(user.id, businessProfileId, prisma);
  }

  if (!profile) {
    profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });
  }

  // Graceful fallback defaults if user has not completed their business profile yet
  const brandVoice = profile?.brandVoice || 'Chuyên nghiệp, tin cậy, gần gũi và hài hước phù hợp với mạng xã hội Việt Nam';
  const usp = profile?.usp || 'Sản phẩm/dịch vụ chất lượng cao, giá thành hợp lý, phục vụ tận tâm';

  return aiService.generateDetailedPost({
    userId: user.id,
    ideaTitle,
    ideaDescription,
    platform,
    brandVoice,
    usp,
    resources: existingResources,
    reason: campaignReason,
  });
}

async function generateDetailedPostWithImage(user, { ideaTitle, ideaDescription, platform, businessProfileId, existingResources, campaignReason }, file, mediaAssetId) {
  const profile = await requireOwnedBusinessProfile(user.id, businessProfileId, prisma);

  return aiService.generateDetailedPostWithImage({
    userId: user.id,
    ideaTitle,
    ideaDescription,
    platform,
    brandVoice: profile.brandVoice,
    usp: profile.usp,
    resources: existingResources,
    reason: campaignReason,
    file,
    mediaAssetId,
  });
}

/**
 * Real Marketing Plan Revision Assistant
 */
async function refinePlan(id, userId, { instruction }) {
  const plan = await prisma.marketingPlan.findUnique({
    where: { id: Number(id) },
    include: { businessProfile: true },
  });

  if (!plan) {
    throw new AppError('Marketing plan not found', 404);
  }

  if (plan.userId !== userId) {
    throw new AppError('Access denied', 403);
  }

  const refinedData = await aiService.refineMarketingPlan({ userId, plan, instruction });
  assertNoInternalStorageUrls(refinedData);

  let updated;
  try {
    updated = await prisma.marketingPlan.update({
      where: { id: Number(id), userId, updatedAt: plan.updatedAt },
      data: {
        contentIdeas: JSON.stringify(refinedData.contentIdeas),
        videoScripts: JSON.stringify(refinedData.videoScripts),
        checklist: JSON.stringify(refinedData.checklist),
        playbook: JSON.stringify(refinedData.playbook),
        seoKeywords: JSON.stringify(refinedData.seoKeywords || []),
        hasLegacyContent: false,
        updatedAt: new Date(Math.max(Date.now(), plan.updatedAt.getTime() + 1)),
      },
      include: {
        businessProfile: true,
        reviewedBy: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('This plan changed while AI was preparing the revision. Reload it and retry.', 409);
    throw error;
  }

  return {
    ...formatPlan(updated),
    revisionSummary: refinedData.revisionSummary,
  };
}

/**
 * Derives an AI Image Prompt from post content
 */
async function generateImagePrompt(userId, { postContent, platform, businessProfileId }) {
  let brandContext = '';
  if (businessProfileId) {
    const profile = await requireOwnedBusinessProfile(userId, businessProfileId, prisma);
    brandContext = `${profile.businessType || ''} - USP: ${profile.usp || ''} - Giọng điệu: ${profile.brandVoice || ''}`;
  }

  return aiService.generateImagePrompt({
    userId,
    postContent,
    platform: platform || 'Facebook',
    brandContext,
  });
}

/**
 * Generates AI Social Post Image
 */
async function generateSocialImage(userId, { prompt, aspectRatio, platform, businessProfileId }) {
  if (businessProfileId != null) await requireOwnedBusinessProfile(userId, businessProfileId, prisma);
  return aiService.generateSocialImage({
    prompt,
    aspectRatio: aspectRatio || '1:1',
    platform: platform || 'Facebook',
    userId,
    businessProfileId,
  });
}

/**
  * Fetches trending bulletin topics (AI generated or curated)
  */
async function attachMediaAssets(planId, userId, requestedAssetIds) {
  if (!Array.isArray(requestedAssetIds) || requestedAssetIds.length > 50) throw new AppError('Invalid MediaAsset list.', 400);
  const assetIds = [...new Set(requestedAssetIds.map((value) => {
    const text = String(value);
    if (!/^[1-9]\d*$/.test(text)) throw new AppError('Invalid media asset ID.', 400);
    return Number(text);
  }))].sort((a, b) => a - b);
  return prisma.$transaction(async (tx) => {
    for (const assetId of assetIds) await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${assetId}`}, 0))::text`;
    const plan = await tx.marketingPlan.findUnique({ where: { id: Number(planId) }, select: { id: true, userId: true } });
    if (!plan || plan.userId !== userId) throw new AppError('Marketing plan not found.', 404);
    for (const assetId of assetIds) {
      const asset = await tx.mediaAsset.findUnique({ where: { id: assetId }, select: { id: true, userId: true, lifecycleState: true } });
      if (!asset || asset.userId !== userId || asset.lifecycleState !== 'active') throw new AppError('Media asset not found.', 404);
    }
    if (assetIds.length) await tx.marketingPlanAsset.createMany({
      data: assetIds.map((mediaAssetId) => ({ userId, marketingPlanId: plan.id, mediaAssetId, purpose: 'attachment' })),
      skipDuplicates: true,
    });
    return tx.marketingPlanAsset.findMany({ where: { userId, marketingPlanId: plan.id }, select: { mediaAssetId: true, purpose: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
  });
}

async function detachMediaAsset(planId, userId, requestedAssetId) {
  const text = String(requestedAssetId);
  if (!/^[1-9]\d*$/.test(text)) throw new AppError('Invalid media asset ID.', 400);
  const mediaAssetId = Number(text);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${mediaAssetId}`}, 0))::text`;
    const plan = await tx.marketingPlan.findUnique({ where: { id: Number(planId) }, select: { id: true, userId: true } });
    if (!plan || plan.userId !== userId) throw new AppError('Marketing plan not found.', 404);
    const removed = await tx.marketingPlanAsset.deleteMany({ where: { userId, marketingPlanId: plan.id, mediaAssetId } });
    return { detached: removed.count > 0 };
  });
}

async function getTrendingBulletin(forceRefresh = false) {
  return aiService.getTrendingBulletin({ forceRefresh });
}

module.exports = {
  assertNoInternalStorageUrls,
  formatPlan,
  generatePlan,
  getPlans,
  getPlanById,
  savePlan,
  reviewPlan,
  deletePlan,
  generateDetailedPost,
  generateDetailedPostWithImage,
  requireOwnedBusinessProfile: (userId, businessProfileId) => requireOwnedBusinessProfile(userId, businessProfileId, prisma),
  refinePlan,
  generateImagePrompt,
  generateSocialImage,
  attachMediaAssets,
  detachMediaAsset,
  getTrendingBulletin,
};
