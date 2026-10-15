import { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Lock, Bell, Camera, LogOut, Share2, Loader2, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';
import SocialLinkManager from '../../components/settings/SocialLinkManager';
import { useAuthStore } from '../../store/authStore';
import { useUpdateProfile, useUpdateBusinessProfile } from '../../hooks/useAuth';
import { uploadApi } from '../../api/uploadApi';
import { authApi } from '../../api/authApi';
import { toast } from '../../store/toastStore';
import { toggleNotificationPreference } from '../../utils/notificationPreferences';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAuthStore((s) => s.user);
  
  // Profile form
  const [form, setForm] = useState({
    fullName: user?.name || '',
    emailAddress: user?.email || '',
    phoneNumber: user?.phone || '',
    companyName: user?.businessProfile?.businessName || '',
  });

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Notification preferences
  const [notifSettings, setNotifSettings] = useState(() => {
    const saved = localStorage.getItem('pocket_notif_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      goldenTime: true,
      dailyTrend: true,
      postStatus: true,
      weeklyReport: false,
    };
  });

  const updateProfileMutation = useUpdateProfile();
  const updateBusinessProfileMutation = useUpdateBusinessProfile();

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.name || '',
        emailAddress: user.email || '',
        phoneNumber: user.phone || '',
        companyName: user.businessProfile?.businessName || '',
      });
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadApi.uploadAvatar(file);
      if (!response?.mediaAssetId) throw new Error('Avatar upload did not return an asset ID.');
      await updateProfileMutation.mutateAsync({ avatarMediaAssetId: response.mediaAssetId });
      toast.success('Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        name: form.fullName,
        phone: form.phoneNumber,
      });

      if (user?.role === 'user') {
        await updateBusinessProfileMutation.mutateAsync({
          businessName: form.companyName,
        });
      }

      toast.success('Đã lưu thay đổi hồ sơ thành công!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi lưu thay đổi. Vui lòng thử lại.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    try {
      setIsChangingPass(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || 'Không thể thay đổi mật khẩu.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleToggleNotif = (key) => {
    const updated = toggleNotificationPreference(notifSettings, key);
    setNotifSettings(updated);
    localStorage.setItem('pocket_notif_settings', JSON.stringify(updated));
    toast.success('Đã cập nhật tùy chọn thông báo!');
  };

  return (
    <div className="flex-1 w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary dark:text-inverse-primary mb-3">
          Cài đặt Hệ thống
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Quản lý các thiết lập tài khoản, cấu hình bảo mật mật khẩu và tùy chọn nhận thông báo của bạn.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible border border-slate-200/80">
            {/* Profile Info Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left relative flex items-center rounded-xl py-2.5 px-4 shrink-0 transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }`}
            >
              <UserIcon size={18} className={`mr-3 shrink-0 ${activeTab === 'profile' ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="text-sm">Thông tin Hồ sơ</span>
            </button>

            {/* Security Tab */}
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left relative flex items-center rounded-xl py-2.5 px-4 shrink-0 transition-all ${
                activeTab === 'security'
                  ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }`}
            >
              <Lock size={18} className={`mr-3 shrink-0 ${activeTab === 'security' ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="text-sm">Bảo mật</span>
            </button>

            {/* Notifications Tab */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left relative flex items-center rounded-xl py-2.5 px-4 shrink-0 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }`}
            >
              <Bell size={18} className={`mr-3 shrink-0 ${activeTab === 'notifications' ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="text-sm">Thông báo</span>
            </button>

            {/* Social Integration Tab */}
            <button
              onClick={() => setActiveTab('social')}
              className={`w-full text-left relative flex items-center rounded-xl py-2.5 px-4 shrink-0 transition-all ${
                activeTab === 'social'
                  ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }`}
            >
              <Share2 size={18} className={`mr-3 shrink-0 ${activeTab === 'social' ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="text-sm">Liên kết Mạng xã hội</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          
          {/* TAB 1: Profile Info */}
          {activeTab === 'profile' && (
            <section className="bg-white rounded-2xl shadow-sm p-7 md:p-8 border border-slate-200/80">
              <div className="mb-6 border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Thông tin Hồ sơ</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Cập nhật thông tin định danh và thương hiệu doanh nghiệp của bạn.
                  </p>
                </div>
                
                {/* Avatar upload wrapper */}
                <div 
                  onClick={handleAvatarClick}
                  className="w-20 h-20 rounded-full bg-secondary-container overflow-hidden relative group cursor-pointer border-4 border-surface-container-lowest shadow-ambient shrink-0 flex items-center justify-center ring-2 ring-secondary/30"
                  title="Nhấp để thay đổi ảnh đại diện"
                >
                  {isUploading ? (
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  ) : (
                    <>
                      <AuthorizedMediaImage
                        assetId={user?.avatarMediaAssetId}
                        legacyUrl={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
                        className="w-full h-full object-cover"
                        alt={`${user?.name} Profile Avatar`}
                      />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Camera size={20} className="text-white" />
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="fullName">
                    Họ và Tên
                  </label>
                  <input
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-900 transition-all shadow-xs"
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="emailAddress">
                    Địa chỉ Email (Định danh)
                  </label>
                  <input
                    className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed"
                    id="emailAddress"
                    type="email"
                    value={form.emailAddress}
                    disabled
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="phoneNumber">
                    Số điện thoại
                  </label>
                  <input
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-900 transition-all shadow-xs"
                    id="phoneNumber"
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={form.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                  />
                </div>
                {user?.role === 'user' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="companyName">
                      Tên thương hiệu / Công ty
                    </label>
                    <input
                      className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-900 transition-all shadow-xs"
                      id="companyName"
                      type="text"
                      placeholder="Ví dụ: Agencom Skincare"
                      value={form.companyName}
                      onChange={handleChange('companyName')}
                    />
                  </div>
                )}
                <div className="md:col-span-2 pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending || updateBusinessProfileMutation.isPending}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {(updateProfileMutation.isPending || updateBusinessProfileMutation.isPending) ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Lưu Thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl shadow-sm p-7 md:p-8 border border-slate-200/80">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Đổi Mật khẩu</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Để đảm bảo an toàn cho tài khoản, hãy sử dụng mật khẩu mạnh với tối thiểu 6 ký tự.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary" htmlFor="currentPassword">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-low dark:bg-surface-variant/20 text-primary dark:text-inverse-primary border border-surface-variant/40 rounded-xl px-4 py-3 pr-11 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                        id="currentPassword"
                        type={showCurrentPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                      >
                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary" htmlFor="newPassword">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-low dark:bg-surface-variant/20 text-primary dark:text-inverse-primary border border-surface-variant/40 rounded-xl px-4 py-3 pr-11 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                        id="newPassword"
                        type={showNewPass ? 'text' : 'password'}
                        placeholder="Ít nhất 6 ký tự"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                      >
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary" htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-surface-variant/20 text-primary dark:text-inverse-primary border border-surface-variant/40 rounded-xl px-4 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="bg-primary text-on-primary hover:opacity-90 px-8 py-3 rounded-full text-label-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                    >
                      {isChangingPass ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        'Cập nhật Mật khẩu'
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* Security info card */}
              <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tài khoản được bảo vệ chủ động</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mọi phiên truy cập được bảo vệ bằng mã hóa JWT bảo mật và chuẩn mã hóa mật khẩu bcrypt chống tấn công brute-force.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <section className="bg-white rounded-2xl shadow-sm p-7 md:p-8 border border-slate-200/80">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900">Tùy chọn Nhận thông báo</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Tùy chỉnh các thông báo hệ thống và lời nhắc tối ưu chiến dịch marketing cho tài khoản của bạn.
                </p>
                <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <span className="font-bold shrink-0">📌 Tùy chọn cục bộ:</span>
                  <span>Chỉ lưu trên trình duyệt này; các thông báo chưa được kết nối với hệ thống gửi.</span>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'goldenTime',
                    title: 'Nhắc nhở Giờ Vàng (Golden Time Alert)',
                    desc: 'Tùy chọn cục bộ; không bật thông báo hay đề xuất giờ đăng tự động.',
                  },
                  {
                    key: 'dailyTrend',
                    title: 'Cập nhật Xu hướng Hàng ngày',
                    desc: 'Tùy chọn này chỉ lưu trên thiết bị hiện tại; thông báo xu hướng chưa được gửi.',
                  },
                  {
                    key: 'postStatus',
                    title: 'Thông báo Trạng thái Bài viết',
                    desc: 'Tùy chọn này chỉ lưu trên thiết bị hiện tại; trạng thái bài viết chưa gửi thông báo.',
                  },
                  {
                    key: 'weeklyReport',
                    title: 'Báo cáo Tổng kết Tuần',
                    desc: 'Tùy chọn này chỉ lưu trên thiết bị hiện tại; báo cáo email chưa được gửi.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/80"
                  >
                    <div className="pr-4">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifSettings[item.key]}
                      onClick={() => handleToggleNotif(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings[item.key] ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: Social Integration */}
          {activeTab === 'social' && (
            <SocialLinkManager />
          )}

          {/* Danger Zone / Logout */}
          <section className="bg-white rounded-2xl shadow-sm p-7 md:p-8 border border-slate-200/80 mt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Đăng xuất Tài khoản</h3>
                <p className="text-sm text-slate-500 mt-0.5 max-w-md">
                  Kết thúc phiên làm việc an toàn trên thiết bị này. Bạn có thể đăng nhập lại bất kỳ lúc nào.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                  }
                }}
                className="bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shrink-0 shadow-xs"
              >
                <LogOut size={16} className="text-slate-400 group-hover:text-red-600 transition-colors" />
                Đăng xuất An toàn
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
