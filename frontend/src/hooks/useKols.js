import { useQuery } from '@tanstack/react-query';
import { kolApi } from '../api/kolApi';

export function useKols(params = {}) {
  return useQuery({
    queryKey: ['kols', params],
    queryFn: () => kolApi.list(params),
  });
}

export function useKol(id) {
  return useQuery({
    queryKey: ['kols', id],
    queryFn: () => kolApi.getById(id),
    enabled: !!id,
  });
}

export function mapKolToCreator(kol) {
  if (!kol) return null;
  const platforms = kol.platformAccounts?.map((a) => {
    const p = a.platform?.toLowerCase();
    if (p === 'tiktok') return 'TT';
    if (p === 'instagram') return 'IG';
    if (p === 'youtube') return 'YT';
    if (p === 'facebook') return 'FB';
    return a.platform?.slice(0, 2).toUpperCase();
  }) || [];

  // Parse audience gender
  let female = 50;
  let male = 50;
  if (kol.audienceGender) {
    const femaleMatch = kol.audienceGender.match(/(\d+)%\s*Nữ/i);
    const maleMatch = kol.audienceGender.match(/(\d+)%\s*Nam/i);
    if (femaleMatch) female = parseInt(femaleMatch[1], 10);
    if (maleMatch) male = parseInt(maleMatch[1], 10);
  }

  // Parse audience age range
  let audienceAge = [
    { range: '13-17', percentage: 20 },
    { range: '18-24', percentage: 50 },
    { range: '25-34', percentage: 30 },
  ];
  if (kol.audienceAgeRange) {
    const parts = kol.audienceAgeRange.split(',');
    const parsed = parts.map(part => {
      const rangeMatch = part.match(/(\d+-\d+)/);
      const percentMatch = part.match(/\((\d+)%\)/);
      if (rangeMatch && percentMatch) {
        return {
          range: rangeMatch[1],
          percentage: parseInt(percentMatch[1], 10)
        };
      }
      return null;
    }).filter(Boolean);
    if (parsed.length > 0) {
      audienceAge = parsed;
    }
  }

  // Generate campaigns by niche
  const nichesBrands = {
    'Thời trang & Lối sống': [
      { brand: 'Eco Chic', title: 'Chuỗi Reel Phối đồ', views: '850K', type: 'video', image: 'https://picsum.photos/seed/fashion1/400/300' },
      { brand: 'Zara Vietnam', title: 'Lookbook Mùa Đông', views: '1.2M', type: 'video', image: 'https://picsum.photos/seed/fashion2/400/300' }
    ],
    'Công nghệ & Đồ chơi số': [
      { brand: 'MechKeyboards', title: 'Chuỗi Đánh giá Chuyên nghiệp', views: '110K', type: 'video', image: 'https://picsum.photos/seed/tech1/400/300' },
      { brand: 'Apex Phone', title: 'Video Đánh giá Sản phẩm Chủ lực', views: '2.5M', type: 'video', image: 'https://picsum.photos/seed/tech2/400/300' }
    ],
    'Mỹ phẩm & Làm đẹp': [
      { brand: 'Glow Skincare', title: 'Video Ra mắt Mùa hè', views: '1.2M', type: 'video', image: 'https://picsum.photos/seed/beauty1/400/300' },
      { brand: 'Lumina Cosmetics', title: 'Trải nghiệm son kem mới', views: '750K', type: 'video', image: 'https://picsum.photos/seed/beauty2/400/300' }
    ],
    'Ẩm thực & Du lịch': [
      { brand: 'Traveloka', title: 'Vlog du lịch Đà Lạt 3N2Đ', views: '950K', type: 'video', image: 'https://picsum.photos/seed/travel1/400/300' },
      { brand: 'Phúc Long', title: 'Review Menu trà sữa mới', views: '430K', type: 'video', image: 'https://picsum.photos/seed/travel2/400/300' }
    ],
    'Giáo dục & Phát triển bản thân': [
      { brand: 'Coursera', title: 'Hành trình tự học lập trình', views: '320K', type: 'video', image: 'https://picsum.photos/seed/edu1/400/300' },
      { brand: 'Spiderum', title: 'Làm thế nào để quản lý thời gian', views: '180K', type: 'video', image: 'https://picsum.photos/seed/edu2/400/300' }
    ],
    'Sức khỏe & Thể thao': [
      { brand: 'California Fitness', title: 'Thử thách Plank 30 ngày', views: '620K', type: 'video', image: 'https://picsum.photos/seed/fit1/400/300' },
      { brand: 'Decathlon', title: 'Review đồ chạy bộ mùa hè', views: '280K', type: 'video', image: 'https://picsum.photos/seed/fit2/400/300' }
    ]
  };
  const nicheKey = kol.niche || 'Mỹ phẩm & Làm đẹp';
  const pastCampaigns = nichesBrands[nicheKey] || nichesBrands['Mỹ phẩm & Làm đẹp'];

  const testimonials = [
    {
      brandName: 'Lumina Cosmetics',
      role: 'Giám đốc Marketing',
      rating: 5,
      comment: `${kol.name} đã mang lại nội dung đặc biệt vượt mục tiêu tương tác của chúng tôi tới 45%. Rất chuyên nghiệp, giao tiếp tốt và sáng tạo!`,
      date: '2 tuần trước',
      avatarLetter: 'L',
    },
    {
      brandName: 'Eco Chic Beauty',
      role: 'PR Coordinator',
      rating: 4.8,
      comment: `Làm việc với ${kol.name} rất suôn sẻ. Nội dung chân thực, thu hút được nhiều sự quan tâm từ nhóm khách hàng mục tiêu của chúng tôi.`,
      date: '1 tháng trước',
      avatarLetter: 'E',
    }
  ];

  return {
    id: kol.id,
    name: kol.name,
    handle: kol.platformAccounts?.[0]?.username ? `@${kol.platformAccounts[0].username}` : `@kol${kol.id}`,
    category: kol.niche,
    location: kol.location || 'Việt Nam',
    verified: kol.isVerified,
    rating: Number(kol.rating) || 0,
    followers: kol.followerCount,
    engagement: Number(kol.engagementRate) || 0,
    camps: kol.completedCampaigns,
    startingPrice: Number(kol.priceFrom) || 0,
    priceRange: kol.priceFrom ? `Từ ${Number(kol.priceFrom).toLocaleString('vi-VN')} VND` : 'Liên hệ',
    platforms,
    avatar: kol.avatarUrl,
    coverImage: kol.coverUrl,
    bio: kol.bio,
    servicePackages: kol.servicePackages || [],
    platformAccounts: kol.platformAccounts || [],
    audienceGender: { female, male },
    audienceAge,
    pastCampaigns,
    testimonials,
  };
}
