import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Users, MapPin, DollarSign, Star, ArrowLeft, TrendingUp } from 'lucide-react';
import { useKolDirectory } from '../../hooks/useKols';

const CATEGORIES = [
  'Tất cả',
  'Beauty',
  'Tech',
  'Fashion',
  'Food',
  'Travel',
  'Education',
  'Fitness',
  'Lifestyle',
];

function formatFollowers(count) {
  if (!count) return '—';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatPrice(price) {
  if (!price) return 'Liên hệ';
  return `${Number(price).toLocaleString('vi-VN')} VND`;
}

function KolCard({ profile }) {
  const avatarUrl = profile.user?.avatarUrl || profile.avatarUrl;
  const displayName = profile.user?.name || profile.name;
  const categories = profile.categories || [];
  const followerCount = profile.followerCount || 0;
  const bookingPrice = profile.bookingPrice;
  const rating = profile.rating || 0;
  const bio = profile.bio;

  return (
    <div className="group bg-surface-container-lowest rounded-3xl border border-surface-container/20 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Header with gradient */}
      <div className="relative h-24 bg-gradient-to-br from-[#ff758f]/20 via-[#c97aff]/10 to-secondary-container/20">
        <div className="absolute -bottom-8 left-6">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border-[3px] border-surface-container-lowest shadow-ambient overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#ff758f] to-[#c97aff] flex items-center justify-center text-white font-bold text-xl">
                {displayName?.charAt(0)?.toUpperCase() || 'K'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-6 pb-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold text-primary truncate pr-2">{displayName}</h3>
          {rating > 0 && (
            <div className="flex items-center gap-1 text-[#ff758f] shrink-0">
              <Star size={12} fill="currentColor" />
              <span className="text-[11px] font-bold">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {bio && (
          <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 bg-secondary-container/40 text-on-secondary-container rounded-full text-[10px] font-bold"
              >
                {cat}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-bold">
                +{categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto pt-3 border-t border-surface-container/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <Users size={13} />
            <span className="text-[11px] font-bold">{formatFollowers(followerCount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-[#ff758f]" />
            <span className="text-[11px] font-bold text-primary">{formatPrice(bookingPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KolDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const queryParams = useMemo(() => {
    const params = { limit: 50 };
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (selectedCategory !== 'Tất cả') params.category = selectedCategory;
    return params;
  }, [searchQuery, selectedCategory]);

  const { data, isLoading, error } = useKolDirectory(queryParams);
  const profiles = data?.data || [];

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container/20">
        <div className="max-w-[1280px] mx-auto px-gutter flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-headline-md font-headline-md font-extrabold text-primary tracking-tight">
              Pocket <span className="text-[#F897A8]">Agen</span>com
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-xs font-bold text-primary hover:text-[#ff758f] transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-[#ff758f] text-white rounded-full text-xs font-bold hover:bg-[#ff5c7a] transition-colors shadow-ambient"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff758f]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#c97aff]/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-gutter pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff758f]/8 rounded-full text-[11px] font-bold text-[#ff758f] mb-6">
            <TrendingUp size={14} />
            Danh bạ KOL/KOC hàng đầu Việt Nam
          </div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-4 max-w-3xl mx-auto">
            Khám phá Nhà sáng tạo <span className="text-[#ff758f]">phù hợp</span>
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            Tìm kiếm và kết nối với các KOL/KOC hàng đầu trong mọi lĩnh vực, được xác minh và sẵn sàng hợp tác.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, lĩnh vực..."
              className="w-full pl-14 pr-6 py-4.5 rounded-full bg-surface-container-lowest border border-surface-container/30 shadow-ambient text-body-md font-body-md focus:ring-2 focus:ring-[#ff758f]/30 focus:border-[#ff758f]/40 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-[1280px] mx-auto px-gutter pb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-ambient'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[1280px] mx-auto px-gutter pb-20">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm font-medium">Đang tải danh bạ KOL...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-error text-sm font-medium">Không thể tải danh bạ: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && profiles.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-on-surface-variant" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">
              Chưa có KOL/KOC nào trong danh bạ
            </p>
            <p className="text-xs text-on-surface-variant/60">
              Hãy thử thay đổi bộ lọc hoặc quay lại sau.
            </p>
          </div>
        )}

        {!isLoading && !error && profiles.length > 0 && (
          <>
            <p className="text-xs text-on-surface-variant mb-6 font-medium">
              Hiển thị {profiles.length} KOL/KOC
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {profiles.map((profile) => (
                <KolCard key={profile.id} profile={profile} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
