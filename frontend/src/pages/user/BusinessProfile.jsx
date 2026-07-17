import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Globe, 
  Coins, 
  Target, 
  Sparkles, 
  Edit3, 
  Save, 
  X, 
  Loader2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { authApi } from '../../api/authApi';

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

export default function BusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'General',
    productDescription: '',
    targetCustomer: '',
    marketingGoal: '',
    budgetRange: '',
    location: ''
  });

  const fetchProfile = async () => {
    try {
      const response = await authApi.me();
      const user = response.data;
      if (user?.businessProfile) {
        setProfile(user.businessProfile);
        setForm({
          businessName: user.businessProfile.businessName || '',
          businessType: user.businessProfile.businessType || 'General',
          productDescription: user.businessProfile.productDescription || '',
          targetCustomer: user.businessProfile.targetCustomer || '',
          marketingGoal: user.businessProfile.marketingGoal || '',
          budgetRange: user.businessProfile.budgetRange || '',
          location: user.businessProfile.location || ''
        });
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
      const response = await authApi.updateBusinessProfile(form);
      setProfile(response.data);
      setIsEditing(false);
      await fetchProfile();
      alert('Cập nhật hồ sơ doanh nghiệp thành công!');
    } catch (err) {
      console.error('Failed to update business profile:', err);
      alert('Có lỗi xảy ra khi lưu thay đổi.');
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
        <Loader2 className="animate-spin" size={32} />
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
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary">
            Hồ sơ Doanh nghiệp
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mt-1">
            Quản lý thông tin chi tiết về thương hiệu và theo dõi hiệu suất các kênh truyền thông liên kết.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Business Profile Details Card */}
        <div className="lg:col-span-1">
          {isEditing ? (
            <form onSubmit={handleSave} className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <div className="flex items-center justify-between border-b border-surface-container pb-4">
                <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-secondary" />
                  Sửa Hồ sơ
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Tên Doanh nghiệp</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Tên thương hiệu..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Lĩnh vực kinh doanh</label>
                  <input
                    type="text"
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Thời trang, F&B, Mỹ phẩm..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Mô tả Sản phẩm/Dịch vụ</label>
                  <textarea
                    value={form.productDescription}
                    onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                    rows={4}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Mô tả chi tiết về sản phẩm hoặc dịch vụ cốt lõi của bạn..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Khách hàng Mục tiêu</label>
                  <textarea
                    value={form.targetCustomer}
                    onChange={(e) => setForm({ ...form, targetCustomer: e.target.value })}
                    rows={3}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Giới trẻ 18-25 tuổi tại các thành phố lớn..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Mục tiêu Tiếp thị</label>
                  <input
                    type="text"
                    value={form.marketingGoal}
                    onChange={(e) => setForm({ ...form, marketingGoal: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Tăng nhận diện thương hiệu, Đẩy doanh số..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Ngân sách dự kiến</label>
                  <input
                    type="text"
                    value={form.budgetRange}
                    onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: 10,000,000 VND / tháng..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-label-xs font-bold text-on-surface-variant">Khu vực địa lý</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Toàn quốc, Hà Nội, TP.HCM..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary disabled:opacity-50 px-6 py-3 rounded-full text-label-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6">
              <div className="border-b border-surface-container pb-4">
                <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-secondary" />
                  Hồ sơ Doanh nghiệp
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Tên Doanh nghiệp
                  </span>
                  <p className="text-body-lg font-bold text-primary">
                    {profile?.businessName || 'Chưa thiết lập tên doanh nghiệp'}
                  </p>
                </div>

                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Lĩnh vực kinh doanh
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider">
                    {profile?.businessType || 'Chưa phân loại'}
                  </span>
                </div>

                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Mô tả Sản phẩm / Dịch vụ
                  </span>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {profile?.productDescription || 'Chưa cung cấp mô tả.'}
                  </p>
                </div>

                <div>
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Khách hàng Mục tiêu
                  </span>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {profile?.targetCustomer || 'Chưa cung cấp đối tượng mục tiêu.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-surface-container">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-body-xs text-on-surface-variant block">Mục tiêu tiếp thị</span>
                      <p className="text-sm font-bold text-primary">{profile?.marketingGoal || 'Chưa thiết lập'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Coins className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-body-xs text-on-surface-variant block">Ngân sách dự kiến</span>
                      <p className="text-sm font-bold text-primary">{profile?.budgetRange || 'Chưa thiết lập'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-body-xs text-on-surface-variant block">Địa điểm/Khu vực</span>
                      <p className="text-sm font-bold text-primary">{profile?.location || 'Toàn quốc'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Bento-style Social Analytics Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Phân tích Kênh Truyền thông
          </h3>

          {socialLinks.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-10 border border-dashed border-outline-variant/60 text-center space-y-4">
              <div className="w-16 h-16 bg-secondary-container text-primary rounded-full flex items-center justify-center mx-auto">
                <Users size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-label-lg font-bold text-primary">Chưa có kênh liên kết nào hoạt động</h4>
                <p className="text-body-md text-on-surface-variant">
                  Hãy kết nối tài khoản TikTok, Facebook hoặc Instagram trong mục Cài đặt để AI thực hiện phân tích số liệu và xuất nhận xét chiến lược.
                </p>
              </div>
              <a
                href="/settings"
                className="inline-block bg-primary text-on-primary font-bold px-6 py-3 rounded-full text-label-sm shadow-sm hover:opacity-90 transition-opacity"
              >
                Liên kết ngay
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bento Card 1: Total Reach */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient border border-surface-container/20 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    Tổng lượng tiếp cận (Reach)
                  </span>
                  <h4 className="text-display-md font-display-md text-primary">
                    {formatFollowers(totalFollowers)}
                  </h4>
                  <span className="text-body-xs text-secondary block font-bold">
                    Người theo dõi tích lũy
                  </span>
                </div>
                <div className="w-14 h-14 bg-secondary-container text-primary rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              {/* Bento Card 2: Average Engagement */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient border border-surface-container/20 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-body-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    Tương tác trung bình
                  </span>
                  <h4 className="text-display-md font-display-md text-primary">
                    {avgEngagement}%
                  </h4>
                  <span className="text-body-xs text-emerald-600 dark:text-emerald-400 block font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Rất ấn tượng
                  </span>
                </div>
                <div className="w-14 h-14 bg-secondary-container text-primary rounded-2xl flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
              </div>

              {/* Bento Cards 3+: Platform specific cards */}
              {socialLinks.map((plat) => (
                <div 
                  key={plat.id}
                  className="sm:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 space-y-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl flex items-center justify-center ${getPlatformColor(plat.platform)}`}>
                        {getPlatformIcon(plat.platform, "w-6 h-6")}
                      </div>
                      <div>
                        <h5 className="text-label-lg font-bold text-primary capitalize flex items-center gap-2">
                          {plat.platform}
                          <a 
                            href={plat.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-on-surface-variant hover:text-primary transition-colors inline-block"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </h5>
                        <span className="text-body-xs text-on-surface-variant">Số liệu phân tích mới nhất</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-right">
                        <span className="text-body-xs text-on-surface-variant block">Followers</span>
                        <span className="text-label-md font-bold text-primary">{formatFollowers(plat.followersCount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-body-xs text-on-surface-variant block">Tương tác</span>
                        <span className="text-label-md font-bold text-primary">{plat.engagementRate}%</span>
                      </div>
                    </div>
                  </div>

                  {plat.aiInsight && (
                    <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-label-xs font-bold text-primary uppercase tracking-wider">
                        <MessageSquare className="w-4 h-4 text-secondary" />
                        Nhận xét chiến lược bằng AI
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-body-md text-on-surface-variant">
                        {plat.aiInsight.split('\n\n').map((section, idx) => {
                          const lines = section.split('\n');
                          const title = lines[0].replace('### ', '');
                          const items = lines.slice(1).map(l => l.replace('- ', ''));
                          const isStrength = title.includes('Điểm mạnh');
                          return (
                            <div key={idx} className="space-y-2">
                              <span className={`font-bold text-sm block ${isStrength ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                {title}
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-sm">
                                {items.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
