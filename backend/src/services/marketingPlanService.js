const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { isValidPlanTransition } = require('../validators/marketingPlan.validator');

function generateAIContent(data) {
  const contentIdeas = [
    {
      title: 'Video Unboxing & First Impressions',
      channel: 'TikTok/Reels',
      format: 'Short Video (60s)',
      description: `Authentic unboxing showcasing ${data.productDescription.slice(0, 80)}...`,
    },
    {
      title: 'Educational Carousel Post',
      channel: 'Instagram',
      format: '5-slide Carousel',
      description: `Educational content targeting ${data.targetCustomer.slice(0, 60)}...`,
    },
    {
      title: 'Email VIP Early Access',
      channel: 'Email',
      format: 'Newsletter Campaign',
      description: 'Exclusive 24-hour early access for subscribers with personalized discount codes.',
    },
  ];

  const videoScripts = [
    {
      scene: '0-5s',
      action: 'Hook with product reveal and brand logo',
      dialogue: `Hey everyone! Today I'm trying something new for ${data.businessType} lovers...`,
    },
    {
      scene: '5-45s',
      action: 'Product demo with key benefits highlighted',
      dialogue: `What I love most is how this fits perfectly for ${data.targetCustomer.slice(0, 50)}...`,
    },
    {
      scene: '45-60s',
      action: 'CTA with exclusive offer',
      dialogue: `Link in bio for ${data.goal.slice(0, 40)} — don't miss out!`,
    },
  ];

  const checklist = [
    'Prepare product samples for content creators 3 days before launch',
    'Review and approve draft scripts from KOL partners',
    'Set up tracking links and affiliate discount codes',
    'Schedule posts during peak engagement hours',
    'Monitor analytics and adjust strategy weekly',
  ];

  const playbook = `Standard workflow: 1. Brief alignment → 2. Product delivery → 3. Script approval → 4. Content production → 5. Publish & measure → 6. Report ROI. Campaign type: ${data.campaignType}. Budget: ${data.budget || 'TBD'}.`;

  return { contentIdeas, videoScripts, checklist, playbook };
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
  const aiContent = generateAIContent(data);

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
