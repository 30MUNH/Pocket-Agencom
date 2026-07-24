const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Determines the platform category based on key or URL.
 * Supports dynamic dynamic platforms without hardcoding.
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
 * Generates structured demo metrics dynamically based on platform type.
 */
function generateDemoMetrics(platformKey, platformType, followersCount = 0, engagementRate = 0) {
  const baseFollowers = followersCount || Math.floor(Math.random() * 25000) + 5000;
  const baseER = engagementRate || parseFloat((Math.random() * 4 + 2.5).toFixed(2));

  if (platformType === 'ecommerce') {
    const gmv = Math.floor(Math.random() * 150000000) + 50000000;
    const aov = Math.floor(Math.random() * 250000) + 150000;
    const conversionRate = parseFloat((Math.random() * 2.5 + 1.8).toFixed(2));
    const pageViews = Math.floor(gmv / (aov * (conversionRate / 100)));
    const rating = parseFloat((4.7 + Math.random() * 0.3).toFixed(1));

    return [
      {
        key: 'gmv',
        label: 'Tổng doanh số (GMV)',
        value: gmv,
        format: 'currency',
        currencySymbol: '₫',
        unit: 'VND',
        trend: '+24.5%',
        category: 'ecommerce',
        description: 'Tổng giá trị hàng hóa giao dịch trong tháng'
      },
      {
        key: 'aov',
        label: 'Giá trị đơn hàng trung bình (AOV)',
        value: aov,
        format: 'currency',
        currencySymbol: '₫',
        unit: 'VND',
        trend: '+5.2%',
        category: 'ecommerce',
        description: 'Số tiền trung bình khách hàng chi trả trên 1 đơn'
      },
      {
        key: 'conversion_rate',
        label: 'Tỷ lệ chuyển đổi (Conversion Rate)',
        value: conversionRate,
        format: 'percentage',
        unit: '%',
        trend: '+0.8%',
        category: 'ecommerce',
        description: 'Tỷ lệ lượt truy cập gian hàng chốt đơn thành công'
      },
      {
        key: 'page_views',
        label: 'Lượt xem trang sản phẩm (Page Views)',
        value: Math.round(pageViews),
        format: 'number',
        unit: 'lượt xem',
        trend: '+15.3%',
        category: 'ecommerce',
        description: 'Tổng số lượt khách truy cập các gian hàng'
      },
      {
        key: 'shop_rating',
        label: 'Đánh giá gian hàng (Shop Rating)',
        value: rating,
        format: 'rating',
        unit: '/5',
        trend: '0.0',
        category: 'ecommerce',
        description: 'Đánh giá trung bình từ người mua hàng'
      }
    ];
  }

  if (platformType === 'social') {
    const reach = baseFollowers * (Math.floor(Math.random() * 4) + 3);
    const impressions = reach * (Math.floor(Math.random() * 2) + 2);
    const followerGrowth = Math.floor(baseFollowers * 0.08);
    const videoCompletionRate = parseFloat((Math.random() * 20 + 35).toFixed(1));

    return [
      {
        key: 'reach',
        label: 'Lượt tiếp cận (Reach)',
        value: reach,
        format: 'number',
        unit: 'người',
        trend: '+18.4%',
        category: 'social',
        description: 'Số tài khoản duy nhất đã tiếp cận nội dung'
      },
      {
        key: 'impressions',
        label: 'Lượt hiển thị (Impressions)',
        value: impressions,
        format: 'number',
        unit: 'lượt',
        trend: '+22.1%',
        category: 'social',
        description: 'Tổng số lần nội dung được hiển thị trên màn hình'
      },
      {
        key: 'er',
        label: 'Tỷ lệ tương tác (ER)',
        value: baseER,
        format: 'percentage',
        unit: '%',
        trend: '+1.2%',
        category: 'social',
        description: 'Tỷ lệ thích, bình luận, chia sẻ trên tổng lượt tiếp cận'
      },
      {
        key: 'follower_growth',
        label: 'Tăng trưởng người theo dõi',
        value: followerGrowth,
        format: 'number',
        unit: 'người',
        trend: '+8.5%',
        category: 'social',
        description: 'Số người theo dõi mới nhận được trong kỳ'
      },
      {
        key: 'video_completion_rate',
        label: 'Tỷ lệ xem hết Video',
        value: videoCompletionRate,
        format: 'percentage',
        unit: '%',
        trend: '+3.5%',
        category: 'social',
        description: 'Tỷ lệ người dùng xem video đến giây cuối cùng'
      }
    ];
  }

  // Fallback for custom platforms / websites
  return [
    {
      key: 'traffic',
      label: 'Lượt truy cập (Traffic)',
      value: Math.floor(Math.random() * 40000) + 10000,
      format: 'number',
      unit: 'lượt',
      trend: '+12.0%',
      category: 'custom',
      description: 'Tổng số lượt truy cập liên kết'
    },
    {
      key: 'bounce_rate',
      label: 'Tỷ lệ thoát (Bounce Rate)',
      value: parseFloat((Math.random() * 15 + 30).toFixed(1)),
      format: 'percentage',
      unit: '%',
      trend: '-2.4%',
      category: 'custom',
      description: 'Tỷ lệ người dùng rời trang mà không tương tác'
    },
    {
      key: 'avg_session',
      label: 'Thời gian ở lại trang trung bình',
      value: parseFloat((Math.random() * 2 + 1.5).toFixed(1)),
      format: 'number',
      unit: 'phút',
      trend: '+0.5m',
      category: 'custom',
      description: 'Thời gian trung bình người dùng trải nghiệm'
    }
  ];
}

/**
 * Gets aggregated business analytics grouped by connected external platform.
 * Supports dynamic platforms without hardcoding.
 */
async function getBusinessAnalytics(businessProfileId, userId = null) {
  let businessProfile;

  if (businessProfileId) {
    businessProfile = await prisma.businessProfile.findUnique({
      where: { id: parseInt(businessProfileId, 10) },
      include: {
        socialPlatforms: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });
  } else if (userId) {
    businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: parseInt(userId, 10) },
      include: {
        socialPlatforms: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }

  if (!businessProfile) {
    throw new AppError('Không tìm thấy thông tin hồ sơ doanh nghiệp.', 404);
  }

  const platformsList = businessProfile.socialPlatforms || [];

  // Group and format metrics dynamically per platform
  const processedPlatforms = platformsList.map((platform) => {
    const inferredType = platform.platformType || inferPlatformType(platform.platform, platform.url);
    
    // Parse or generate dynamic metrics array
    let metrics = Array.isArray(platform.metrics) && platform.metrics.length > 0
      ? platform.metrics
      : generateDemoMetrics(platform.platform, inferredType, platform.followersCount, platform.engagementRate);

    return {
      id: platform.id,
      platformKey: platform.platform.toLowerCase(),
      platformName: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
      platformType: inferredType,
      url: platform.url,
      followersCount: platform.followersCount,
      engagementRate: platform.engagementRate,
      aiInsight: platform.aiInsight,
      metrics,
      updatedAt: platform.updatedAt
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
      if (m.key === 'reach' || m.key === 'page_views' || m.key === 'traffic') {
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
      currencySymbol: '₫'
    },
    platforms: processedPlatforms
  };
}

module.exports = {
  inferPlatformType,
  generateDemoMetrics,
  getBusinessAnalytics
};
