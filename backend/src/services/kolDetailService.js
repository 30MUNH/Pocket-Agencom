const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Utility function to validate profile completeness
 * Rule: At least 5 IMAGEs, 3 VIDEOs (with at least 1 full-body VIDEO)
 */
async function validateProfileCompleteness(kolProfileId) {
  const mediaList = await prisma.kolMedia.findMany({
    where: { kolProfileId },
  });

  const imageCount = mediaList.filter((m) => m.mediaType === 'IMAGE').length;
  const videoCount = mediaList.filter((m) => m.mediaType === 'VIDEO').length;
  const fullBodyVideoCount = mediaList.filter(
    (m) => m.mediaType === 'VIDEO' && m.isFullBody === true
  ).length;

  const isImagesComplete = imageCount >= 5;
  const isVideosComplete = videoCount >= 3;
  const isFullBodyComplete = fullBodyVideoCount >= 1;

  const isComplete = isImagesComplete && isVideosComplete && isFullBodyComplete;

  const missing = {
    imagesNeeded: Math.max(0, 5 - imageCount),
    videosNeeded: Math.max(0, 3 - videoCount),
    fullBodyVideosNeeded: Math.max(0, 1 - fullBodyVideoCount),
  };

  if (isComplete) {
    await prisma.kolProfile.update({
      where: { id: kolProfileId },
      data: { isPublic: true, status: 'active' },
    });
  }

  return {
    isComplete,
    counts: {
      images: imageCount,
      videos: videoCount,
      fullBodyVideos: fullBodyVideoCount,
    },
    requirements: {
      minImages: 5,
      minVideos: 3,
      minFullBodyVideos: 1,
    },
    missing,
  };
}

async function addMedia(kolId, user, mediaData) {
  const kolIdInt = parseInt(kolId, 10);
  if (isNaN(kolIdInt)) throw new AppError('Mã KOL không hợp lệ', 400);

  const profile = await prisma.kolProfile.findUnique({
    where: { id: kolIdInt },
  });
  if (!profile) throw new AppError('Không tìm thấy hồ sơ KOL', 404);

  // Check authorization: must be owner of profile, staff, or admin
  if (profile.userId && profile.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền thêm media vào hồ sơ này', 403);
  }

  const newMedia = await prisma.kolMedia.create({
    data: {
      kolProfileId: kolIdInt,
      mediaUrl: mediaData.mediaUrl,
      mediaType: mediaData.mediaType,
      isFullBody: Boolean(mediaData.isFullBody),
    },
  });

  const completeness = await validateProfileCompleteness(kolIdInt);

  return {
    media: newMedia,
    completeness,
  };
}

async function deleteMedia(kolId, mediaId, user) {
  const kolIdInt = parseInt(kolId, 10);
  const mediaIdInt = parseInt(mediaId, 10);
  if (isNaN(kolIdInt) || isNaN(mediaIdInt)) throw new AppError('Mã không hợp lệ', 400);

  const profile = await prisma.kolProfile.findUnique({ where: { id: kolIdInt } });
  if (!profile) throw new AppError('Không tìm thấy hồ sơ KOL', 404);

  if (profile.userId && profile.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền xóa media của hồ sơ này', 403);
  }

  await prisma.kolMedia.delete({
    where: { id: mediaIdInt },
  });

  const completeness = await validateProfileCompleteness(kolIdInt);
  return { completeness };
}

async function getProfileDetails(kolId) {
  const kolIdInt = parseInt(kolId, 10);
  if (isNaN(kolIdInt)) throw new AppError('Mã KOL không hợp lệ', 400);

  const profile = await prisma.kolProfile.findUnique({
    where: { id: kolIdInt },
    include: {
      media: {
        orderBy: { createdAt: 'desc' },
      },
      kolReviews: {
        include: {
          sme: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              businessProfile: {
                select: {
                  businessName: true,
                  businessType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      performances: {
        orderBy: { createdAt: 'desc' },
      },
      servicePackages: {
        where: { status: 'active' },
      },
      platformAccounts: true,
    },
  });

  if (!profile) throw new AppError('Không tìm thấy hồ sơ KOL', 404);

  const completeness = await validateProfileCompleteness(kolIdInt);

  // Calculate average rating from KolReview
  const reviews = profile.kolReviews || [];
  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : Number(profile.rating || 0);

  return {
    ...profile,
    priceFrom: profile.priceFrom ? Number(profile.priceFrom) : null,
    engagementRate: profile.engagementRate ? Number(profile.engagementRate) : 0,
    rating: avgRating,
    completeness,
  };
}

async function addReview(kolId, user, { rating, content }) {
  const kolIdInt = parseInt(kolId, 10);
  if (isNaN(kolIdInt)) throw new AppError('Mã KOL không hợp lệ', 400);

  const profile = await prisma.kolProfile.findUnique({ where: { id: kolIdInt } });
  if (!profile) throw new AppError('Không tìm thấy hồ sơ KOL', 404);

  const newReview = await prisma.kolReview.create({
    data: {
      kolProfileId: kolIdInt,
      smeId: user.id,
      rating: Number(rating),
      content,
    },
    include: {
      sme: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          businessProfile: {
            select: {
              businessName: true,
            },
          },
        },
      },
    },
  });

  // Update average rating on KOL profile
  const allReviews = await prisma.kolReview.findMany({
    where: { kolProfileId: kolIdInt },
    select: { rating: true },
  });
  const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

  await prisma.kolProfile.update({
    where: { id: kolIdInt },
    data: { rating: parseFloat(avg.toFixed(1)) },
  });

  return newReview;
}

async function addPerformance(kolId, user, perfData) {
  const kolIdInt = parseInt(kolId, 10);
  if (isNaN(kolIdInt)) throw new AppError('Mã KOL không hợp lệ', 400);

  const profile = await prisma.kolProfile.findUnique({ where: { id: kolIdInt } });
  if (!profile) throw new AppError('Không tìm thấy hồ sơ KOL', 404);

  if (profile.userId && profile.userId !== user.id && user.role !== 'staff' && user.role !== 'admin') {
    throw new AppError('Bạn không có quyền thêm chỉ số hiệu suất cho hồ sơ này', 403);
  }

  const performance = await prisma.kolPerformance.create({
    data: {
      kolProfileId: kolIdInt,
      postUrl: perfData.postUrl,
      engagementRate: parseFloat(perfData.engagementRate),
      conversions: parseInt(perfData.conversions || 0, 10),
      platform: perfData.platform,
    },
  });

  return performance;
}

module.exports = {
  validateProfileCompleteness,
  addMedia,
  deleteMedia,
  getProfileDetails,
  addReview,
  addPerformance,
};
