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
    priceRange: kol.priceFrom ? `$${Math.round(Number(kol.priceFrom) / 23000)}+` : 'Liên hệ',
    platforms,
    avatar: kol.avatarUrl,
    coverImage: kol.coverUrl,
    bio: kol.bio,
    servicePackages: kol.servicePackages || [],
    platformAccounts: kol.platformAccounts || [],
  };
}
