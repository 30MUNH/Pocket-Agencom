const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function register(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: 'user',
        status: 'active',
      },
    });

    await tx.businessProfile.create({
      data: {
        userId: newUser.id,
        businessType: data.businessType || 'General',
        productDescription: data.productDescription || 'Pending profile setup',
        targetCustomer: data.targetCustomer || 'General audience',
      },
    });

    return newUser;
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
}

async function login(email, password) {
  return loginWithPrisma(prisma, email, password);
}

async function loginWithPrisma(prismaClient, email, password) {
  const user = await prismaClient.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Account is inactive or banned', 403);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      phone: true,
      createdAt: true,
      businessProfile: {
        include: {
          socialPlatforms: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

const MANAGED_SOCIAL_PLATFORMS = ['tiktok', 'facebook', 'instagram'];

async function updateBusinessProfile(userId, data) {
  const profile = await prisma.businessProfile.upsert({
    where: { userId },
    update: {
      businessName: data.businessName,
      businessType: data.businessType,
      productDescription: data.productDescription,
      targetCustomer: data.targetCustomer,
      marketingGoal: data.marketingGoal,
      budgetRange: data.budgetRange,
      location: data.location,
      usp: data.usp,
      brandVoice: data.brandVoice,
      priceRange: data.priceRange,
      bestSellingProduct: data.bestSellingProduct,
      monthlyMarketingBudget: data.monthlyMarketingBudget,
    },
    create: {
      userId,
      businessName: data.businessName,
      businessType: data.businessType || 'General',
      productDescription: data.productDescription || 'Pending profile setup',
      targetCustomer: data.targetCustomer || 'General audience',
      marketingGoal: data.marketingGoal,
      budgetRange: data.budgetRange,
      location: data.location,
      usp: data.usp,
      brandVoice: data.brandVoice,
      priceRange: data.priceRange,
      bestSellingProduct: data.bestSellingProduct,
      monthlyMarketingBudget: data.monthlyMarketingBudget,
    },
  });

  // Sync social links only when the client sends them, so partial updates
  // (e.g. company name from settings) never touch linked platforms.
  if (Array.isArray(data.socialLinks)) {
    const links = data.socialLinks
      .map((item) => ({
        platform: String(item.platform || '').toLowerCase(),
        url: String(item.url || '').trim(),
      }))
      .filter((item) => MANAGED_SOCIAL_PLATFORMS.includes(item.platform) && item.url);

    const existing = await prisma.socialPlatform.findMany({
      where: { userId, platform: { in: MANAGED_SOCIAL_PLATFORMS } },
    });

    const sentPlatforms = links.map((l) => l.platform);
    const toDelete = existing.filter((p) => !sentPlatforms.includes(p.platform));

    await prisma.$transaction([
      ...toDelete.map((p) =>
        prisma.socialPlatform.delete({ where: { id: p.id } })
      ),
      ...links.map((link) => {
        const current = existing.find((p) => p.platform === link.platform);
        if (current) {
          return prisma.socialPlatform.update({
            where: { id: current.id },
            data: { url: link.url },
          });
        }
        return prisma.socialPlatform.create({
          data: {
            userId,
            platform: link.platform,
            url: link.url,
            followersCount: 0,
            engagementRate: 0,
            businessProfileId: profile.id,
          },
        });
      }),
    ]);
  }

  return prisma.businessProfile.findUnique({
    where: { userId },
    include: { socialPlatforms: true },
  });
}

async function updateProfile(userId, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      phone: true,
      createdAt: true,
      businessProfile: {
        include: {
          socialPlatforms: true,
        },
      },
    },
  });

  return user;
}

module.exports = {
  register,
  login,
  loginWithPrisma,
  getMe,
  updateBusinessProfile,
  updateProfile,
};
