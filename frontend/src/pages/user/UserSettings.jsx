import { useState, useRef } from 'react';
import { User as UserIcon, Lock, Bell, Camera, LogOut, Share2, Loader2 } from 'lucide-react';
import SocialLinkManager from '../../components/settings/SocialLinkManager';
import { useAuthStore } from '../../store/authStore';
import { useUpdateProfile, useUpdateBusinessProfile } from '../../hooks/useAuth';
import { uploadApi } from '../../api/uploadApi';

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAuthStore((s) => s.user);
  
  const [form, setForm] = useState({
    fullName: user?.name || '',
    emailAddress: user?.email || '',
    phoneNumber: user?.phone || '',
    companyName: user?.businessProfile?.businessName || '',
  });

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const updateBusinessProfileMutation = useUpdateBusinessProfile();

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
      const url = response.url || response;
      await updateProfileMutation.mutateAsync({ avatarUrl: url });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
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

      alert('Đã lưu thay đổi hồ sơ thành công!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi khi lưu thay đổi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-4">
          Cài đặt
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
          Quản lý các thiết lập tài khoản, cài đặt bảo mật và tùy chọn nhận thông báo của bạn bên dưới.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {/* Profile Info Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left relative flex items-center rounded-full py-3 px-6 shrink-0 transition-all ${
                activeTab === 'profile'
                  ? 'bg-secondary-container text-primary font-bold shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <UserIcon size={18} className="mr-3 text-secondary shrink-0" />
              <span className="text-label-sm font-label-sm">Thông tin Hồ sơ</span>
            </button>

            {/* Security Tab */}
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left relative flex items-center rounded-full py-3 px-6 shrink-0 transition-all ${
                activeTab === 'security'
                  ? 'bg-secondary-container text-primary font-bold shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Lock size={18} className="mr-3 text-secondary shrink-0" />
              <span className="text-label-sm font-label-sm">Bảo mật</span>
            </button>

            {/* Notifications Tab */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left relative flex items-center rounded-full py-3 px-6 shrink-0 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-secondary-container text-primary font-bold shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Bell size={18} className="mr-3 text-secondary shrink-0" />
              <span className="text-label-sm font-label-sm">Thông báo</span>
            </button>

            {/* Social Integration Tab */}
            <button
              onClick={() => setActiveTab('social')}
              className={`w-full text-left relative flex items-center rounded-full py-3 px-6 shrink-0 transition-all ${
                activeTab === 'social'
                  ? 'bg-secondary-container text-primary font-bold shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Share2 size={18} className="mr-3 text-secondary shrink-0" />
              <span className="text-label-sm font-label-sm">Liên kết Mạng xã hội</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'profile' && (
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 md:p-12 border border-surface-container/20">
              <div className="mb-8 border-b border-surface-container pb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-headline-md font-headline-md text-primary">Thông tin Hồ sơ</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant mt-2">
                    Cập nhật thông tin cá nhân và thông tin công ty của bạn.
                  </p>
                </div>
                
                {/* Avatar upload wrapper */}
                <div 
                  onClick={handleAvatarClick}
                  className="w-20 h-20 rounded-full bg-secondary-container overflow-hidden relative group cursor-pointer border-4 border-surface-container-lowest shadow-ambient shrink-0 flex items-center justify-center"
                >
                  {isUploading ? (
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  ) : (
                    <>
                      <img
                        className="w-full h-full object-cover"
                        alt={`${user?.name} Profile Avatar`}
                        src={
                          user?.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`
                        }
                      />
                      <div className="absolute inset-0 bg-primary/40 hidden group-hover:flex items-center justify-center transition-all">
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

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="block text-label-sm font-label-sm text-on-surface-variant" htmlFor="fullName">
                    Họ và Tên
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-3 text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-label-sm font-label-sm text-on-surface-variant" htmlFor="emailAddress">
                    Địa chỉ Email
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest text-primary/60 border border-surface-variant rounded-xl px-4 py-3 text-body-md font-body-md focus:outline-none cursor-not-allowed"
                    id="emailAddress"
                    type="email"
                    value={form.emailAddress}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-label-sm font-label-sm text-on-surface-variant" htmlFor="phoneNumber">
                    Số điện thoại
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-3 text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
                    id="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                  />
                </div>
                {user?.role === 'user' && (
                  <div className="space-y-2">
                    <label className="block text-label-sm font-label-sm text-on-surface-variant" htmlFor="companyName">
                      Tên công ty
                    </label>
                    <input
                      className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-3 text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
                      id="companyName"
                      type="text"
                      value={form.companyName}
                      onChange={handleChange('companyName')}
                    />
                  </div>
                )}
                <div className="md:col-span-2 pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending || updateBusinessProfileMutation.isPending}
                    className="bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary hover:shadow-ambient px-8 py-3 rounded-full text-label-sm font-label-sm transition-all duration-200 transform hover:-translate-y-[2px]"
                  >
                    {(updateProfileMutation.isPending || updateBusinessProfileMutation.isPending) ? 'Đang lưu...' : 'Lưu Thay đổi'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 md:p-12 border border-surface-container/20">
              <h3 className="text-headline-md font-headline-md text-primary mb-6">Cài đặt Bảo mật</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Cấu hình xác thực hai yếu tố, đặt lại mật khẩu và quản lý khóa API tại đây. (Đang phát triển)
              </p>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 md:p-12 border border-surface-container/20">
              <h3 className="text-headline-md font-headline-md text-primary mb-6">Tùy chọn Nhận thông báo</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Kiểm soát thông báo email, cập nhật tiếp thị và nhật ký hệ thống. (Đang phát triển)
              </p>
            </section>
          )}

          {activeTab === 'social' && (
            <SocialLinkManager />
          )}

          {/* Danger Zone / Logout */}
          <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 md:p-12 border border-surface-variant/40 mt-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-headline-md font-headline-md text-primary">Đăng xuất</h3>
                <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-md">
                  Kết thúc phiên làm việc hiện tại một cách an toàn. Bạn sẽ cần đăng nhập lại để truy cập tài khoản.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                  }
                }}
                className="bg-surface-container-lowest border border-outline text-primary hover:bg-secondary-container/50 px-8 py-3 rounded-full text-label-sm font-label-sm transition-all duration-200 flex items-center justify-center gap-2 group shrink-0"
              >
                <LogOut size={16} className="text-outline group-hover:text-primary transition-colors" />
                Đăng xuất An toàn
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
