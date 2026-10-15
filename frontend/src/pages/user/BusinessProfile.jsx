import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Activity,
  Globe,
  Coins,
  Target,
  Sparkles,
  Edit3,
  Save,
  Loader2,
  ExternalLink,
  Share2,
  Volume2,
  Award
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { toast } from '../../store/toastStore';
import SocialLinksManager, { PLATFORM_VALIDATION_RULES } from '../../components/ui/SocialLinksManager';
import CumulativeMediaAnalytics from '../../components/analytics/CumulativeMediaAnalytics';

function FacebookIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function TikTokIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.71-.53-1.3-1.22-1.74-2v6.62c.04 2.87-1.39 5.86-3.99 7.06-2.58 1.25-6.02.9-8.15-1.14-2.28-2.26-2.47-6.27-.42-8.77 1.83-2.3 5.34-2.88 7.82-1.33v4.19c-1.41-.95-3.41-.74-4.57.51-.97 1.09-1.01 2.89-.08 4 .98 1.22 2.85 1.48 4.09.57.85-.59 1.28-1.63 1.25-2.67V.02z"/>
    </svg>
  );
}

const SOCIAL_PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@thuong_hieu' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/thuong.hieu' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/thuong.hieu' },
];

export default function BusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states with all required fields
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'General',
    productDescription: '',
    targetCustomer: '',
    budgetRange: '',
    location: '',
    usp: '',
    brandVoice: 'Chuyên nghiệp',
    priceRange: 'Trung cấp',
    bestSellingProduct: '',
    monthlyMarketingBudget: ''
  });

  // Managed social platforms state for SocialLinksManager
  const [managedSocialLinks, setManagedSocialLinks] = useState([]);

  // One URL input per major platform: { tiktok: '', facebook: '', instagram: '' }
  const [socialForm, setSocialForm] = useState(
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, '']))
  );

  const buildSocialForm = (platforms = []) => {
    const next = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, '']));
    platforms.forEach((item) => {
      const key = (item.platform || '').toLowerCase();
      if (key in next) next[key] = item.url || '';
    });
    return next;
  };

  const fetchProfile = async () => {
    try {
      const user = await authApi.me();
      if (user?.businessProfile) {
        setProfile(user.businessProfile);
        setForm({
          businessName: user.businessProfile.businessName || '',
          businessType: user.businessProfile.businessType || 'General',
          productDescription: user.businessProfile.productDescription || '',
          targetCustomer: user.businessProfile.targetCustomer || '',
          budgetRange: user.businessProfile.budgetRange || '',
          location: user.businessProfile.location || '',
          usp: user.businessProfile.usp || '',
          brandVoice: user.businessProfile.brandVoice || 'Chuyên nghiệp',
          priceRange: user.businessProfile.priceRange || 'Trung cấp',
          bestSellingProduct: user.businessProfile.bestSellingProduct || '',
          monthlyMarketingBudget: user.businessProfile.monthlyMarketingBudget || ''
        });
        setSocialForm(buildSocialForm(user.businessProfile.socialPlatforms));
        const formattedPlatforms = (user.businessProfile.socialPlatforms || []).map((sp) => ({
          id: String(sp.id || `link-${sp.platform}`),
          platform: sp.platform,
          platformName: PLATFORM_VALIDATION_RULES?.[sp.platform]?.name || sp.platform,
          url: sp.url,
          metrics: sp.metrics || null,
        }));
        setManagedSocialLinks(formattedPlatforms);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const socialLinks = managedSocialLinks
        .map(({ platform, url }) => ({ platform, url: (url || '').trim() }))
        .filter((item) => item.url !== '');

      const updatedProfile = await authApi.updateBusinessProfile({ ...form, socialLinks });
      setProfile(updatedProfile);
      setIsEditing(false);
      await fetchProfile();
      toast.success('Cập nhật hồ sơ doanh nghiệp thành công!');
    } catch (err) {
      console.error('Failed to update business profile:', err);
      toast.error('Có lỗi xảy ra khi lưu thay đổi.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformIcon = (platform, sizeClass = "w-5 h-5") => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return <TikTokIcon className={sizeClass} />;
      case 'facebook':
        return <FacebookIcon className={sizeClass} />;
      case 'instagram':
        return <InstagramIcon className={sizeClass} />;
      default:
        return <Globe className={sizeClass} />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'bg-black text-white';
      case 'facebook':
        return 'bg-[#1877F2] text-white';
      case 'instagram':
        return 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
        <Loader2 className="animate-spin text-secondary" size={32} />
        <span className="text-body-md font-medium">Đang tải hồ sơ doanh nghiệp...</span>
      </div>
    );
  }

  const socialLinks = profile?.socialPlatforms || [];
  const totalFollowers = socialLinks.reduce((sum, item) => sum + (item.followersCount || 0), 0);
  const avgEngagement = socialLinks.length > 0 
    ? (socialLinks.reduce((sum, item) => sum + (item.engagementRate || 0), 0) / socialLinks.length).toFixed(2)
    : 0;

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary">
            Hồ sơ Doanh nghiệp
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mt-1">
            Quản lý định vị thương hiệu và cung cấp dữ liệu chi tiết cho thuật toán AI thiết lập chiến lược tiếp thị.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary hover:shadow-ambient px-6 py-3 rounded-full text-label-sm font-bold transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Edit3 size={16} />
            Chỉnh sửa Hồ sơ
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Bento Grid layout for Form Editing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Tổng quan Doanh nghiệp */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-container pb-3">
                <div className="p-2 bg-primary-container text-primary rounded-xl">
                  <Building2 size={20} />
                </div>
                <h3 className="text-headline-sm font-bold text-primary">Tổng quan Doanh nghiệp</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Tên Doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Nhập tên thương hiệu của bạn..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Lĩnh vực kinh doanh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Thời trang, F&B, Mỹ phẩm..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Địa điểm / Vị trí kinh doanh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Toàn quốc, Hà Nội, TP.HCM..."
                  />
                </div>
              </div>
            </div>

            {/* Bento Card 2: Định vị & Sản phẩm */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-container pb-3">
                <div className="p-2 bg-secondary-container text-secondary rounded-xl">
                  <Award size={20} />
                </div>
                <h3 className="text-headline-sm font-bold text-primary">Định vị & Sản phẩm</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    USP (Điểm khác biệt độc nhất) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.usp}
                    onChange={(e) => setForm({ ...form, usp: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Nguyên liệu 100% hữu cơ, Bảo hành 10 năm..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Hình ảnh xuất hiện (Brand Voice) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.brandVoice}
                    onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                  >
                    <option value="Chuyên nghiệp, tin cậy">Chuyên nghiệp, tin cậy</option>
                    <option value="Hài hước, gần gũi, bắt trend">Hài hước, gần gũi, bắt trend</option>
                    <option value="Sang trọng, cao cấp, tinh tế">Sang trọng, cao cấp, tinh tế</option>
                    <option value="Mạnh mẽ, năng động, thể thao">Mạnh mẽ, năng động, thể thao</option>
                    <option value="Nhẹ nhàng, thư thái, tự nhiên">Nhẹ nhàng, thư thái, tự nhiên</option>
                    <option value="Đột phá, nổi loạn, độc lạ">Đột phá, nổi loạn, độc lạ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Phân khúc giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.priceRange}
                    onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                  >
                    <option value="Giá rẻ / Bình dân">Giá rẻ / Bình dân</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Cận cao cấp">Cận cao cấp</option>
                    <option value="Cao cấp / Xa xỉ">Cao cấp / Xa xỉ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Sản phẩm bán chạy nhất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.bestSellingProduct}
                    onChange={(e) => setForm({ ...form, bestSellingProduct: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Kem chống nắng thuần chay, Combo trà sữa..."
                  />
                </div>
              </div>
            </div>

            {/* Bento Card 3: Khách hàng & Ngân sách */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-container pb-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
                  <Users size={20} />
                </div>
                <h3 className="text-headline-sm font-bold text-primary">Khách hàng & Ngân sách</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Mô tả Sản phẩm / Dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={form.productDescription}
                    onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                    rows={2}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Mô tả chi tiết về sản phẩm cốt lõi..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Khách hàng Mục tiêu <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={form.targetCustomer}
                    onChange={(e) => setForm({ ...form, targetCustomer: e.target.value })}
                    rows={2}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Giới trẻ 18-25 quan tâm môi trường..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Ngân sách tiếp thị hàng tháng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.monthlyMarketingBudget}
                    onChange={(e) => setForm({ ...form, monthlyMarketingBudget: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: 10.000.000 - 20.000.000 VND..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 4: Kênh Bán Hàng & Thương Mại Điện Tử (SME) */}
          <SocialLinksManager
            userRole="SME"
            initialLinks={managedSocialLinks}
            onChange={setManagedSocialLinks}
          />

          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-outline-variant/20 hover:bg-outline-variant/35 text-primary px-8 py-3 rounded-full text-label-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 px-8 py-3 rounded-full text-label-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu toàn bộ hồ sơ
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Business Profile Bento Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bento block: Brand details */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary-container/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="border-b border-surface-container pb-4">
                <h3 className="text-headline-md font-bold text-primary flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-secondary" />
                  Hồ sơ Thương hiệu
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Tên Doanh nghiệp
                  </span>
                  <p className="text-body-lg font-bold text-primary">
                    {profile?.businessName || 'Chưa thiết lập'}
                  </p>
                </div>

                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Lĩnh vực kinh doanh
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider">
                    {profile?.businessType || 'Chưa phân loại'}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Mô tả Sản phẩm / Dịch vụ
                  </span>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {profile?.productDescription || 'Chưa cung cấp mô tả.'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Khách hàng Mục tiêu
                  </span>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {profile?.targetCustomer || 'Chưa cung cấp khách hàng mục tiêu.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bento block: Brand positioning */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6 relative overflow-hidden">
              <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary-container/25 rounded-full blur-2xl pointer-events-none" />
              
              <div className="border-b border-surface-container pb-4">
                <h3 className="text-headline-md font-bold text-primary flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-secondary" />
                  Định vị Chiến lược (Dùng cho AI)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container/30 space-y-1">
                  <span className="text-body-xs font-bold text-secondary uppercase tracking-wider block">
                    USP (Điểm khác biệt độc nhất)
                  </span>
                  <p className="text-body-md font-bold text-primary">
                    {profile?.usp || 'Chưa thiết lập điểm khác biệt'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container/30 space-y-1">
                  <span className="text-body-xs font-bold text-secondary uppercase tracking-wider block">
                    Hình ảnh xuất hiện (Brand Voice)
                  </span>
                  <p className="text-body-md font-bold text-primary flex items-center gap-2">
                    <Volume2 size={16} className="text-secondary shrink-0" />
                    {profile?.brandVoice || 'Chưa thiết lập'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container/30 space-y-1">
                  <span className="text-body-xs font-bold text-secondary uppercase tracking-wider block">
                    Phân khúc giá
                  </span>
                  <p className="text-body-md font-bold text-primary">
                    {profile?.priceRange || 'Chưa thiết lập'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container/30 space-y-1">
                  <span className="text-body-xs font-bold text-secondary uppercase tracking-wider block">
                    Sản phẩm bán chạy nhất
                  </span>
                  <p className="text-body-md font-bold text-primary">
                    {profile?.bestSellingProduct || 'Chưa thiết lập'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bento Card for Social Links */}
            <div className="bg-gradient-to-r from-secondary-container/40 to-primary-container/20 rounded-[2rem] p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-5 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-36 h-36 bg-primary-container/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-secondary shrink-0" />
                    <h4 className="text-label-lg font-bold text-primary">Liên kết Mạng xã hội</h4>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    Kết nối tài khoản TikTok, Facebook hoặc Instagram của thương hiệu. AI của Agencom sẽ tự động tải số liệu phân tích và đưa ra phản hồi, giúp xây dựng kịch bản và kế hoạch tối ưu hơn.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-secondary text-on-secondary hover:opacity-90 px-6 py-3 rounded-full text-label-sm font-bold shadow-md transition-all whitespace-nowrap flex items-center gap-2 shrink-0"
                >
                  {socialLinks.length === 0 ? 'Thêm liên kết' : 'Cập nhật liên kết'} <Edit3 size={14} />
                </button>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-3 relative z-10">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-surface-container-lowest/80 hover:bg-surface-container-lowest border border-surface-container/40 rounded-full pl-1.5 pr-4 py-1.5 transition-colors group"
                    >
                      <span className={`p-1.5 rounded-full ${getPlatformColor(link.platform)}`}>
                        {getPlatformIcon(link.platform, 'w-3.5 h-3.5')}
                      </span>
                      <span className="text-sm font-bold text-primary capitalize">{link.platform}</span>
                      <ExternalLink size={12} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mini Info Cards & Social Analytics Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <h3 className="text-headline-sm font-bold text-primary flex items-center gap-2 pb-3 border-b border-surface-container">
                <Target className="w-5 h-5 text-secondary" />
                Thông số Tiếp thị
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary-container text-primary rounded-xl shrink-0 mt-0.5">
                    <Coins size={16} />
                  </div>
                  <div>
                    <span className="text-body-xs text-on-surface-variant block">Ngân sách tháng</span>
                    <p className="text-sm font-bold text-primary">{profile?.monthlyMarketingBudget || 'Chưa thiết lập'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary-container text-primary rounded-xl shrink-0 mt-0.5">
                    <Globe size={16} />
                  </div>
                  <div>
                    <span className="text-body-xs text-on-surface-variant block">Vị trí hoạt động</span>
                    <p className="text-sm font-bold text-primary">{profile?.location || 'Toàn quốc'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card: Channels Stats Summary */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <h3 className="text-headline-sm font-bold text-primary flex items-center gap-2 pb-3 border-b border-surface-container">
                <Activity className="w-5 h-5 text-emerald-600" />
                Truyền thông tích lũy
              </h3>

              {socialLinks.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-body-md text-on-surface-variant text-sm">Chưa có kênh liên kết nào hoạt động.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex min-h-11 items-center px-2 text-xs font-bold text-secondary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Liên kết ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface-variant">Tổng lượng người theo dõi:</span>
                    <span className="text-sm font-bold text-primary">{formatFollowers(totalFollowers)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface-variant">Tương tác trung bình:</span>
                    <span className="text-sm font-bold text-primary">{avgEngagement}%</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    {socialLinks.map(link => (
                      <div key={link.id} className="flex items-center gap-2 text-sm text-on-surface-variant capitalize">
                        {getPlatformIcon(link.platform, "w-4 h-4 text-secondary")}
                        <span>{link.platform}</span>
                        <span className="ml-auto font-bold text-primary">{formatFollowers(link.followersCount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Truyền thông tích lũy (Cumulative Media Analytics) Section */}
        <div className="pt-6">
          <CumulativeMediaAnalytics businessId={profile?.id} />
        </div>
      </div>
      )}
    </div>
  );
}
