import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Tag,
  DollarSign,
  Eye,
  EyeOff,
  Link2,
  MapPin,
  Users,
  Star,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { useMyKolProfile, useUpdateKolProfile } from '../../hooks/useKols';
import { useUpdateProfile } from '../../hooks/useAuth';
import { uploadApi } from '../../api/uploadApi';
import { toast } from '../../store/toastStore';
import MoneyInput from '../../components/ui/MoneyInput';
import MediaPortfolio from '../../components/kol/MediaPortfolio';
import ReviewSection from '../../components/kol/ReviewSection';
import PerformanceTracker from '../../components/kol/PerformanceTracker';
import SocialLinksManager from '../../components/ui/SocialLinksManager';

const CATEGORY_OPTIONS = [
  'Beauty', 'Tech', 'Fashion', 'Food', 'Travel', 'Education', 'Fitness', 'Lifestyle',
  'Gaming', 'Music', 'Comedy', 'Parenting', 'Finance', 'Health',
];

const PLATFORM_KEYS = [
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
];

export default function KolProfileSettings() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyKolProfile();
  const updateMutation = useUpdateKolProfile();
  const updateProfileMutation = useUpdateProfile();

  const avatarInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const response = await uploadApi.uploadAvatar(file);
      const url = response.url || response;
      await updateProfileMutation.mutateAsync({ avatarUrl: url });
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const [form, setForm] = useState({
    bio: '',
    categories: [],
    platforms: {},
    bookingPrice: '',
    isPublic: false,
    niche: '',
    location: '',
    followerCount: '',
  });

  // Sync form with fetched profile
  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        categories: profile.categories || [],
        platforms: profile.platforms || {},
        bookingPrice: profile.bookingPrice ? String(profile.bookingPrice) : '',
        isPublic: profile.isPublic || false,
        niche: profile.niche || '',
        location: profile.location || '',
        followerCount: profile.followerCount ? String(profile.followerCount) : '',
      });
    }
  }, [profile]);

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const updatePlatform = (key, value) => {
    setForm((prev) => ({
      ...prev,
      platforms: { ...prev.platforms, [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        bio: form.bio,
        categories: form.categories,
        platforms: form.platforms,
        bookingPrice: form.bookingPrice ? parseFloat(form.bookingPrice) : null,
        isPublic: form.isPublic,
        niche: form.niche || form.categories[0] || 'General',
        location: form.location,
        followerCount: form.followerCount ? parseInt(form.followerCount, 10) : 0,
      };
      await updateMutation.mutateAsync(payload);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm font-medium">Đang tải hồ sơ...</span>
      </div>
    );
  }

  const displayName = profile?.user?.name || profile?.name || 'KOL';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-headline-md font-headline-md text-primary font-bold">Hồ sơ KOL/KOC</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Cập nhật thông tin để thương hiệu tìm thấy bạn dễ dàng hơn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#ff758f]/10 flex items-center justify-center">
                  <FileText size={16} className="text-[#ff758f]" />
                </div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Tiểu sử</h2>
              </div>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Giới thiệu về bạn, phong cách sáng tạo nội dung, và lĩnh vực chuyên môn..."
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md resize-none"
              />
            </div>

            {/* Categories */}
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#c97aff]/10 flex items-center justify-center">
                  <Tag size={16} className="text-[#c97aff]" />
                </div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Lĩnh vực hoạt động</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = form.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Links */}
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center">
                  <Link2 size={16} className="text-primary" />
                </div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Liên kết mạng xã hội</h2>
              </div>
              <div className="space-y-3">
                {PLATFORM_KEYS.map((platform) => (
                  <div key={platform.key}>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1">
                      {platform.label}
                    </label>
                    <input
                      type="url"
                      value={form.platforms[platform.key] || ''}
                      onChange={(e) => updatePlatform(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="w-full px-4 py-3 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats & Price */}
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#ff758f]/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-[#ff758f]" />
                </div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Thông tin & Giá</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1">
                    Vị trí
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full pl-10 pr-4 py-3 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1">
                    Tổng Followers
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="number"
                      value={form.followerCount}
                      onChange={(e) => setForm((prev) => ({ ...prev, followerCount: e.target.value }))}
                      placeholder="50000"
                      className="w-full pl-10 pr-4 py-3 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1">
                    Giá Booking (VND)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" />
                    <MoneyInput
                      value={form.bookingPrice}
                      onChange={(v) => setForm((prev) => ({ ...prev, bookingPrice: v }))}
                      placeholder="500.000"
                      inputClassName="w-full pl-10 pr-20 py-3 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Public Toggle */}
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                    {form.isPublic ? <Eye size={16} className="text-[#22c55e]" /> : <EyeOff size={16} className="text-on-surface-variant" />}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-primary">Hiển thị công khai</h2>
                    <p className="text-[11px] text-on-surface-variant">
                      {form.isPublic
                        ? 'Hồ sơ đang hiển thị trên danh bạ KOL/KOC'
                        : 'Bật để thương hiệu có thể tìm thấy bạn'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    form.isPublic ? 'bg-[#22c55e]' : 'bg-surface-container-high'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                      form.isPublic ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-[#ff758f] to-[#c97aff] text-white rounded-full font-headline-md text-headline-md shadow-ambient hover:from-[#ff5c7a] hover:to-[#b55eee] hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Lưu hồ sơ
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Xem trước thẻ KOL
            </h3>
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 shadow-ambient overflow-hidden">
              {/* Card Header */}
              <div className="relative h-20 bg-gradient-to-br from-[#ff758f]/20 via-[#c97aff]/10 to-secondary-container/20">
                <div className="absolute -bottom-7 left-5">
                  <div 
                    onClick={handleAvatarClick}
                    className="w-14 h-14 rounded-2xl bg-surface-container-lowest border-[3px] border-surface-container-lowest shadow-ambient overflow-hidden relative group cursor-pointer flex items-center justify-center"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="animate-spin text-primary" size={18} />
                    ) : profile?.user?.avatarUrl ? (
                      <>
                        <img src={profile.user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-primary/40 hidden group-hover:flex items-center justify-center transition-all">
                          <Camera size={14} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-[#ff758f] to-[#c97aff] flex items-center justify-center text-white font-bold text-lg">
                          {displayName?.charAt(0)?.toUpperCase() || 'K'}
                        </div>
                        <div className="absolute inset-0 bg-primary/40 hidden group-hover:flex items-center justify-center transition-all">
                          <Camera size={14} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="pt-10 px-5 pb-5">
                <h4 className="text-sm font-bold text-primary mb-1">{displayName}</h4>
                {form.bio && (
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
                    {form.bio}
                  </p>
                )}

                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 bg-secondary-container/40 text-on-secondary-container rounded-full text-[10px] font-bold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-surface-container/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <Users size={12} />
                    <span className="text-[10px] font-bold">
                      {form.followerCount ? Number(form.followerCount).toLocaleString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#ff758f]">
                    <DollarSign size={12} />
                    <span className="text-[10px] font-bold">
                      {form.bookingPrice ? `${Number(form.bookingPrice).toLocaleString('vi-VN')} VND` : 'Liên hệ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              form.isPublic
                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}>
              {form.isPublic ? (
                <>
                  <CheckCircle2 size={14} fill="currentColor" />
                  Sẽ hiển thị trên danh bạ
                </>
              ) : (
                <>
                  <EyeOff size={14} />
                  Chưa hiển thị trên danh bạ
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Portfolio & Performance Sections for KOL */}
      {profile?.id && (
        <div className="pt-8 border-t border-surface-variant/30 space-y-12">
          <div>
            <h3 className="text-xl font-extrabold text-primary mb-4">1. Bộ sưu tập Media (Portfolio)</h3>
            <MediaPortfolio
              kolId={profile.id}
              media={profile.media || []}
              completeness={profile.completeness}
              isOwner={true}
            />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-primary mb-4">2. Chỉ số Hiệu suất Chiến dịch (Performance)</h3>
            <PerformanceTracker
              kolId={profile.id}
              performances={profile.performances || []}
              isOwner={true}
            />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-primary mb-4">3. Nhận xét & Đánh giá từ Doanh nghiệp</h3>
            <ReviewSection
              kolId={profile.id}
              reviews={profile.kolReviews || []}
              rating={profile.rating}
            />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-primary mb-4">4. Quản lý Liên kết Mạng Xã Hội (Social Links)</h3>
            <SocialLinksManager
              userRole="KOL"
              initialLinks={[
                { id: '1', platform: 'tiktok', platformName: 'TikTok', url: 'https://tiktok.com/@creator_official' },
                { id: '2', platform: 'instagram', platformName: 'Instagram', url: 'https://instagram.com/creator_official' }
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
