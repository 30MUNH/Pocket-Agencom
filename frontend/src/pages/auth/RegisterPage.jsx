import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Briefcase, Star } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import { toast } from '../../store/toastStore';

const TABS = [
  {
    id: 'user',
    label: 'Đăng ký cho Thương hiệu',
    sublabel: 'Dành cho doanh nghiệp / SME',
    icon: Briefcase,
  },
  {
    id: 'kol',
    label: 'Trở thành KOL/KOC',
    sublabel: 'Dành cho nhà sáng tạo nội dung',
    icon: Star,
  },
];

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const isFormValid =
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.password.trim() !== '' &&
    form.confirmPassword.trim() !== '' &&
    form.agreeTerms;

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!form.agreeTerms) {
      toast.error('Vui lòng đồng ý với Điều khoản Dịch vụ');
      return;
    }
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (activeTab === 'kol') {
        payload.role = 'kol';
      }
      const data = await registerMutation.mutateAsync(payload);
      toast.success(`Tài khoản ${data.user.name} đã được tạo!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md antialiased flex flex-col md:flex-row relative">
      <main className="flex-1 flex flex-col justify-center items-center p-gutter lg:px-section-padding-desktop w-full md:w-1/2 bg-surface-container-lowest">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-12">
            <span className="text-headline-md font-headline-md font-extrabold text-primary tracking-tight">
              Pocket <span className="text-[#F897A8]">Agen</span>com
            </span>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full shadow-sm border border-surface-container/20 text-on-surface-variant hover:text-primary hover:shadow-md transition-all text-xs font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Quay về</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg mb-2 text-primary">
              Bắt đầu ngay
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant">
              {activeTab === 'user'
                ? 'Tạo tài khoản để tiếp cận các công cụ tiếp thị thông minh.'
                : 'Đăng ký để kết nối với thương hiệu và nhận cơ hội hợp tác.'}
            </p>
          </div>

          {/* ── Tab Switcher ── */}
          <div className="relative mb-8">
            <div className="flex bg-surface-container-low rounded-2xl p-1.5 relative">
              {/* Animated sliding background */}
              <div
                className="absolute top-1.5 bottom-1.5 rounded-xl bg-surface-container-lowest shadow-ambient transition-all duration-300 ease-out"
                style={{
                  left: activeTab === 'user' ? '6px' : '50%',
                  width: 'calc(50% - 6px)',
                }}
              />
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3.5 px-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-primary font-bold'
                        : 'text-on-surface-variant hover:text-primary/70'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-all duration-300 ${
                        isActive ? 'text-[#ff758f]' : ''
                      }`}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold leading-tight whitespace-nowrap">
                        {tab.label}
                      </span>
                      <span
                        className={`text-[10px] leading-tight transition-all duration-300 ${
                          isActive ? 'text-on-surface-variant' : 'text-on-surface-variant/60'
                        }`}
                      >
                        {tab.sublabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reg-name" className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1">
                Họ và tên
              </label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input id="reg-name" type="text" required value={form.name} onChange={update('name')} placeholder="Nguyễn Văn A" className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input id="reg-email" type="email" required value={form.email} onChange={update('email')} placeholder="alex@example.com" className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={update('password')} placeholder="••••••••" className="w-full pl-12 pr-12 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <ShieldCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input id="reg-confirm-password" type={showConfirmPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="••••••••" className="w-full pl-12 pr-12 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* KOL-specific info banner */}
            {activeTab === 'kol' && (
              <div className="bg-gradient-to-r from-[#fff0f3] to-[#f0e6ff] rounded-2xl p-4 border border-[#F897A8]/20 transition-all duration-300 animate-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff758f]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Star size={16} className="text-[#ff758f]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary mb-1">Đăng ký nhanh, hoàn thiện sau</p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Sau khi tạo tài khoản, bạn sẽ được hướng dẫn hoàn thiện hồ sơ KOL/KOC — thêm tiểu sử, lĩnh vực, giá đặt lịch — để xuất hiện trước hàng nghìn thương hiệu.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 mt-4 ml-1">
              <input id="terms" type="checkbox" checked={form.agreeTerms} onChange={update('agreeTerms')} className="w-4 h-4 rounded border-outline text-secondary focus:ring-secondary-container bg-surface-container-low" />
              <label htmlFor="terms" className="text-body-md font-body-md text-on-surface-variant text-sm">
                Tôi đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật.
              </label>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className={`w-full py-4 rounded-full font-headline-md text-headline-md shadow-ambient hover:-translate-y-0.5 transition-all duration-200 mt-8 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                isFormValid
                  ? activeTab === 'kol'
                    ? 'bg-gradient-to-r from-[#ff758f] to-[#c97aff] text-white hover:from-[#ff5c7a] hover:to-[#b55eee]'
                    : 'bg-[#ff758f] text-white hover:bg-[#ff5c7a]'
                  : 'bg-[#F9E3E5] text-[#b38a90]'
              }`}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  {activeTab === 'kol' ? 'Đăng ký KOL/KOC' : 'Tạo tài khoản'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>

      <aside className="hidden md:flex w-1/2 relative bg-secondary-container/20 items-center justify-center p-gutter overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse transition-colors duration-500 ${
              activeTab === 'kol' ? 'bg-[#c97aff]/40' : 'bg-secondary-container'
            }`}
          />
          <div
            className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-colors duration-500 ${
              activeTab === 'kol' ? 'bg-[#ff758f]/30' : 'bg-[#F897A8]/30'
            }`}
          />
        </div>
        <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden shadow-ambient glass-panel p-4 border border-white/40">
          <div className="rounded-2xl overflow-hidden bg-surface-container-lowest h-[600px] relative flex flex-col items-center justify-center p-8 text-center">
            {activeTab === 'user' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-secondary-container/40 flex items-center justify-center mb-6">
                  <Briefcase size={36} className="text-primary" />
                </div>
                <h2 className="text-headline-md font-headline-md text-primary mb-3">
                  The Marketing Agency <br /> in Your Pocket
                </h2>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-sm leading-relaxed">
                  Nơi tạo chiến dịch marketing hiệu quả được <br /> thiết kế riêng cho SME Việt Nam.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="px-4 py-2 bg-secondary-container/30 rounded-full text-[11px] font-bold text-on-secondary-container">AI Marketing Kit</div>
                  <div className="px-4 py-2 bg-secondary-container/30 rounded-full text-[11px] font-bold text-on-secondary-container">KOL Matching</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff758f]/20 to-[#c97aff]/20 flex items-center justify-center mb-6">
                  <Star size={36} className="text-[#ff758f]" />
                </div>
                <h2 className="text-headline-md font-headline-md text-primary mb-3">
                  Mở rộng cơ hội hợp tác
                </h2>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-sm leading-relaxed">
                  Tạo hồ sơ chuyên nghiệp, xuất hiện trước hàng nghìn thương hiệu và nhận đặt lịch trực tiếp.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="px-4 py-2 bg-[#ff758f]/10 rounded-full text-[11px] font-bold text-[#ff758f]">Hồ sơ KOL</div>
                  <div className="px-4 py-2 bg-[#c97aff]/10 rounded-full text-[11px] font-bold text-[#9b59b6]">Nhận Booking</div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
