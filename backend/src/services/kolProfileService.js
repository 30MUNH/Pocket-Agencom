const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all public KOL profiles for the directory.
 * Merges both self-registered and admin-created KOLs where isPublic = true.
 */
async function listPublicProfiles(filters = {}) {
  const { category, search, page = 1, limit = 20 } = filters;

  const where = { isPublic: true, status: 'active' };

  if (category) {
    where.categories = { has: category };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
      { niche: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [profiles, total] = await Promise.all([
    prisma.kolProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        platformAccounts: true,
      },
      orderBy: [{ rating: 'desc' }, { followerCount: 'desc' }],
      skip,
      take: Number(limit),
    }),
    prisma.kolProfile.count({ where }),
  ]);

  return {
    data: profiles.map(formatProfile),
    pagination: { page: Number(page), limit: Number(limit), total },
  };
}

/**
 * Get the logged-in KOL user's own profile.
 */
async function getMyProfile(userId) {
  const profile = await prisma.kolProfile.findUnique({
    where: { userId },
    include: {
      platformAccounts: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError('KOL profile not found', 404);
  }

  return formatProfile(profile);
}

/**
 * Update the logged-in KOL user's own profile.
 */
async function updateMyProfile(userId, data) {
  // Ensure the profile exists
  const existing = await prisma.kolProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError('KOL profile not found', 404);
  }

  const updateData = {};
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.categories !== undefined) updateData.categories = data.categories;
  if (data.platforms !== undefined) updateData.platforms = data.platforms;
  if (data.bookingPrice !== undefined) updateData.bookingPrice = data.bookingPrice;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
  if (data.followerCount !== undefined) updateData.followerCount = data.followerCount;
  if (data.niche !== undefined) updateData.niche = data.niche;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.name !== undefined) updateData.name = data.name;

  const profile = await prisma.kolProfile.update({
    where: { userId },
    data: updateData,
    include: {
      platformAccounts: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return formatProfile(profile);
}

function formatProfile(profile) {
  return {
    ...profile,
    priceFrom: profile.priceFrom ? Number(profile.priceFrom) : null,
    engagementRate: profile.engagementRate ? Number(profile.engagementRate) : null,
    rating: profile.rating ? Number(profile.rating) : null,
    bookingPrice: profile.bookingPrice ? Number(profile.bookingPrice) : null,
  };
}

module.exports = { listPublicProfiles, getMyProfile, updateMyProfile };
