import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend auth API
    console.log('Register attempt:', form);
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md antialiased flex flex-col md:flex-row relative">
      {/* Back to Homepage Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full shadow-sm border border-surface-container/20 text-on-surface-variant hover:text-primary hover:shadow-md transition-all text-xs font-semibold"
      >
        <ArrowLeft size={14} />
        <span>Quay về trang chủ</span>
      </Link>

      {/* ─── Left Side: Registration Form ─── */}
      <main className="flex-1 flex flex-col justify-center items-center p-gutter lg:px-section-padding-desktop w-full md:w-1/2 bg-surface-container-lowest">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '32px' }}
              >
                support_agent
              </span>
              <span className="text-headline-md font-headline-md font-extrabold text-primary tracking-tight">
                Pocket Agencom
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg mb-2 text-primary">
              Bắt đầu ngay
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant">
              Tạo tài khoản để tiếp cận các công cụ tiếp thị thông minh.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1"
              >
                Họ và tên
              </label>
              <div className="relative">
                <User
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="alex@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-label-sm font-label-sm text-on-surface mb-2 ml-1"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <ShieldCheck
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-secondary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container transition-all outline-none text-body-md font-body-md"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 mt-4 ml-1">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={update('agreeTerms')}
                  className="w-4 h-4 rounded border-outline text-secondary focus:ring-secondary-container bg-surface-container-low"
                />
              </div>
              <label
                htmlFor="terms"
                className="text-body-md font-body-md text-on-surface-variant text-sm"
              >
                Tôi đồng ý với{' '}
                <a href="#" className="text-primary font-bold hover:underline">
                  Điều khoản Dịch vụ
                </a>{' '}
                và{' '}
                <a href="#" className="text-primary font-bold hover:underline">
                  Chính sách Bảo mật
                </a>
                .
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-secondary-container text-on-secondary-container font-headline-md text-headline-md shadow-ambient hover:bg-secondary-container/80 hover:-translate-y-0.5 transition-all duration-200 mt-8 flex justify-center items-center gap-2"
            >
              Tạo tài khoản
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary font-bold hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ─── Right Side: Illustration Panel (Desktop Only) ─── */}
      <aside className="hidden md:flex w-1/2 relative bg-secondary-container/20 items-center justify-center p-gutter overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-tertiary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse [animation-delay:2s]" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse [animation-delay:4s]" />
        </div>

        {/* Image Container */}
        <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden shadow-ambient glass-panel p-4 border border-white/40">
          <div className="rounded-2xl overflow-hidden bg-surface-container-lowest h-[600px] relative">
            <img
              className="w-full h-full object-cover"
              alt="A confident micro-business owner working on a modern laptop in a bright, minimalist studio"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTlAaCpLGllkLWQ58-ZL7jyzL4zuWVYbQus_WbWSJ7u0yr35FRyQbc5PkX04vuPVR5M4q6ebyUZrhGuX-mVynhcKretYry8Ym4pyt_Naufs2wOuth1TzW_ZfyXyW7DjnmegYqASwFjbh2EzD2eIN3plmzzBYpu3sNKt_T1UHpz3dC3SmrSNYe6FLE1SoccASGPf5wA1jT_7P1j2QJtlgxYybzX23P2mHWYXGvRhMJLGoxhQrgyQLCM1E7c0e3Y7IM4fLP08IrAtT8"
            />
            {/* Overlay Widget */}
            <div className="absolute bottom-6 left-6 right-6 glass-panel rounded-2xl p-6 border border-white/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="text-label-sm font-label-sm text-primary mb-1">
                  Quản lý dễ dàng
                </h3>
                <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                  Bạn tập trung phát triển, chúng tôi lo phần phức tạp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
