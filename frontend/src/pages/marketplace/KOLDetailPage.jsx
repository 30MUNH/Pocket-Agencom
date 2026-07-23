import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Star, Globe, Loader2, Users, Image, MessageSquare, TrendingUp } from 'lucide-react';
import { kolApi } from '../../api/kolApi';
import { useAuthStore } from '../../store/authStore';
import MediaPortfolio from '../../components/kol/MediaPortfolio';
import ReviewSection from '../../components/kol/ReviewSection';
import PerformanceTracker from '../../components/kol/PerformanceTracker';

export default function KOLDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('MEDIA'); // MEDIA | REVIEWS | PERFORMANCE

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kolApi.getProfileDetails(id);
      setProfile(data);
    } catch (err) {
      console.error('Error loading KOL profile details:', err);
      setError(err?.message || 'Không thể tải chi tiết hồ sơ KOL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const isOwner = user && profile && (user.id === profile.userId || user.role === 'admin' || user.role === 'staff');

  const formatFollowers = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-on-surface-variant">
        <Loader2 className="animate-spin text-primary" size={24} />
        Đang tải hồ sơ KOL...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant mb-4">{error || 'Không tìm thấy KOL.'}</p>
        <Link to="/marketplace" className="text-primary font-bold hover:underline">
          Quay lại danh sách KOL/KOC
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          to="/marketplace"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group inline-flex"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-label-sm uppercase tracking-widest text-[11px] font-bold">Quay lại KOL/KOC</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] shadow-sm overflow-hidden border border-surface-variant/30">
        <div className="h-56 md:h-72 bg-gradient-to-r from-primary/30 to-secondary/30 relative">
          <img
            className="w-full h-full object-cover opacity-80"
            src={profile.coverUrl || 'https://picsum.photos/seed/kol_cover/1200/400'}
            alt={`${profile.name} cover`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>

        <div className="relative px-6 md:px-10 pb-8 -mt-16 md:-mt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-md shrink-0 bg-surface-container">
              <img
                className="w-full h-full object-cover"
                src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`}
                alt={profile.name}
              />
            </div>

            <div className="pb-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white md:text-primary dark:md:text-inverse-primary leading-tight">
                  {profile.name}
                </h2>
                {profile.isVerified && (
                  <span className="bg-secondary-container text-on-secondary-container rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90 md:text-on-surface-variant flex justify-center md:justify-start items-center gap-1 mt-1">
                {profile.kolType?.replace('_', ' ').toUpperCase()} • {profile.niche}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <span className="text-xs text-white/90 md:text-on-surface-variant flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" /> {profile.rating || '5.0'} ({profile.kolReviews?.length || 0} đánh giá)
                </span>
                <span className="text-xs text-white/90 md:text-on-surface-variant flex items-center gap-1">
                  <Users size={13} className="text-primary" /> {formatFollowers(profile.followerCount)} người theo dõi
                </span>
                {profile.location && (
                  <span className="text-xs text-white/90 md:text-on-surface-variant flex items-center gap-1">
                    <Globe size={13} /> {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <Link
              to={`/marketplace/book/${profile.id}`}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-md transition-all text-center"
            >
              Đặt lịch Hợp tác
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Center Column (Tabs & Feature Sections) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest dark:bg-tertiary-container rounded-full border border-surface-variant/30 text-xs font-bold">
            <button
              onClick={() => setActiveTab('MEDIA')}
              className={`flex-1 py-3 rounded-full transition-all flex items-center justify-center gap-2 ${
                activeTab === 'MEDIA'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Image size={15} /> Bộ sưu tập Media ({profile.media?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex-1 py-3 rounded-full transition-all flex items-center justify-center gap-2 ${
                activeTab === 'REVIEWS'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <MessageSquare size={15} /> Đánh giá SMEs ({profile.kolReviews?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('PERFORMANCE')}
              className={`flex-1 py-3 rounded-full transition-all flex items-center justify-center gap-2 ${
                activeTab === 'PERFORMANCE'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <TrendingUp size={15} /> Hiệu suất ({profile.performances?.length || 0})
            </button>
          </div>

          {/* Tab 1: Media Portfolio */}
          {activeTab === 'MEDIA' && (
            <MediaPortfolio
              kolId={profile.id}
              media={profile.media || []}
              completeness={profile.completeness}
              isOwner={isOwner}
              onRefresh={fetchDetails}
            />
          )}

          {/* Tab 2: Review Section */}
          {activeTab === 'REVIEWS' && (
            <ReviewSection
              kolId={profile.id}
              reviews={profile.kolReviews || []}
              rating={profile.rating}
              onRefresh={fetchDetails}
            />
          )}

          {/* Tab 3: Performance Tracker */}
          {activeTab === 'PERFORMANCE' && (
            <PerformanceTracker
              kolId={profile.id}
              performances={profile.performances || []}
              isOwner={isOwner}
              onRefresh={fetchDetails}
            />
          )}
        </div>

        {/* Right Column: Bio & Pricing Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Tiểu sử & Giới thiệu</h3>
            <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
              {profile.bio || 'Chưa cập nhật tiểu sử.'}
            </p>

            <div className="pt-4 border-t border-surface-variant/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Lĩnh vực chính:</span>
                <span className="font-bold text-primary">{profile.niche}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Giá tham khảo từ:</span>
                <span className="font-extrabold text-emerald-600">
                  {profile.priceFrom ? `${profile.priceFrom.toLocaleString('vi-VN')} VNĐ` : 'Liên hệ'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Tỷ lệ tương tác:</span>
                <span className="font-bold text-primary">{profile.engagementRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
