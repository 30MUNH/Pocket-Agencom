const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Determines the platform category based on key or URL.
 * Supports dynamic platforms without hardcoding.
 */
function inferPlatformType(platformKey = '', url = '') {
  const p = platformKey.toLowerCase();
  const u = url.toLowerCase();

  const ecommerceKeys = ['shopee', 'lazada', 'tiki', 'tiktok_shop', 'tiktokshop', 'sendo', 'amazon', 'shopify', 'woocommerce'];
  if (ecommerceKeys.some(k => p.includes(k) || u.includes(k))) {
    return 'ecommerce';
  }

  const socialKeys = ['facebook', 'tiktok', 'instagram', 'youtube', 'threads', 'twitter', 'x', 'zalo', 'linkedin', 'pinterest'];
  if (socialKeys.some(k => p.includes(k) || u.includes(k))) {
    return 'social';
  }

  return 'custom';
}

/**
 * Formats genuine platform metrics from recorded data.
 * Does not fabricate random demo metrics.
 */
function generatePlatformMetrics(platformKey, platformType, followersCount = null, engagementRate = null) {
  const metrics = [];

  if (followersCount !== null && followersCount !== undefined && followersCount > 0) {
    metrics.push({
      key: 'followers',
      label: 'Người theo dõi ghi nhận',
      value: Number(followersCount),
      format: 'number',
      unit: 'người',
      trend: null,
      category: platformType,
      description: 'Số người theo dõi ghi nhận từ liên kết công khai',
    });
  }

  if (engagementRate !== null && engagementRate !== undefined && engagementRate > 0) {
    metrics.push({
      key: 'er',
      label: 'Tỷ lệ tương tác (ER)',
      value: Number(engagementRate),
      format: 'percentage',
      unit: '%',
      trend: null,
      category: platformType,
      description: 'Tỷ lệ tương tác trung bình ghi nhận',
    });
  }

  return metrics;
}

/**
 * Backward compatibility alias for generatePlatformMetrics without Math.random
 */
function generateDemoMetrics(platformKey, platformType, followersCount = 0, engagementRate = 0) {
  return generatePlatformMetrics(platformKey, platformType, followersCount, engagementRate);
}

/**
 * Gets aggregated business analytics grouped by connected external platform.
 * Relies strictly on recorded data and honest empty states.
 */
async function getBusinessAnalytics(businessProfileId, userId = null) {
  let businessProfile;

  if (businessProfileId) {
    businessProfile = await prisma.businessProfile.findUnique({
      where: { id: parseInt(businessProfileId, 10) },
      include: {
        socialPlatforms: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  } else if (userId) {
    businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: parseInt(userId, 10) },
      include: {
        socialPlatforms: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  if (!businessProfile) {
    throw new AppError('Không tìm thấy thông tin hồ sơ doanh nghiệp.', 404);
  }

  const platformsList = businessProfile.socialPlatforms || [];

  // Group and format metrics strictly from real data
  const processedPlatforms = platformsList.map((platform) => {
    const inferredType = platform.platformType || inferPlatformType(platform.platform, platform.url);

    let metrics = Array.isArray(platform.metrics) && platform.metrics.length > 0
      ? platform.metrics
      : generatePlatformMetrics(platform.platform, inferredType, platform.followersCount, platform.engagementRate);

    return {
      id: platform.id,
      platformKey: platform.platform.toLowerCase(),
      platformName: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
      platformType: inferredType,
      url: platform.url,
      followersCount: platform.followersCount || null,
      engagementRate: platform.engagementRate || null,
      aiInsight: platform.aiInsight,
      metrics,
      hasRealData: metrics.length > 0,
      updatedAt: platform.updatedAt,
    };
  });

  // Calculate aggregated summary metrics across all platforms
  let totalReach = 0;
  let totalGMV = 0;
  let totalImpressions = 0;
  let socialPlatformCount = 0;
  let ecommercePlatformCount = 0;

  processedPlatforms.forEach((p) => {
    if (p.platformType === 'social') socialPlatformCount++;
    if (p.platformType === 'ecommerce') ecommercePlatformCount++;

    p.metrics.forEach((m) => {
      if (m.key === 'reach' || m.key === 'page_views' || m.key === 'traffic' || m.key === 'followers') {
        totalReach += Number(m.value) || 0;
      }
      if (m.key === 'impressions') {
        totalImpressions += Number(m.value) || 0;
      }
      if (m.key === 'gmv') {
        totalGMV += Number(m.value) || 0;
      }
    });
  });

  return {
    businessId: businessProfile.id,
    businessName: businessProfile.businessName || 'Doanh nghiệp',
    businessType: businessProfile.businessType,
    summary: {
      totalConnectedPlatforms: processedPlatforms.length,
      socialPlatformCount,
      ecommercePlatformCount,
      totalReach,
      totalImpressions,
      totalGMV,
      currencySymbol: '₫',
      hasLiveMetrics: totalReach > 0 || totalGMV > 0 || totalImpressions > 0,
      note: 'Dữ liệu được lấy từ số liệu thực tế được ghi nhận hoặc trích xuất từ liên kết công khai.',
    },
    platforms: processedPlatforms,
  };
}

module.exports = {
  inferPlatformType,
  generatePlatformMetrics,
  generateDemoMetrics,
  getBusinessAnalytics,
};
