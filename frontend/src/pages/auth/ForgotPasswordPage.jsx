import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend password reset API
    console.log('Password reset requested for:', email);
    setSubmitted(true);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Back to Homepage Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full shadow-sm border border-surface-container/20 text-on-surface-variant hover:text-primary hover:shadow-md transition-all text-xs font-semibold"
      >
        <ArrowLeft size={14} />
        <span>Quay về trang chủ</span>
      </Link>

      {/* Ambient glow backgrounds */}
      <div className="ambient-glow" style={{ top: '-200px', left: '-200px' }} />
      <div className="ambient-glow" style={{ bottom: '-200px', right: '-200px' }} />

      <div className="w-full max-w-md px-gutter relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-headline-md font-headline-md font-extrabold text-primary">
            Pocket Agencom
          </span>
        </div>

        {/* Forgot Password Card */}
        <div className="glass-panel rounded-lg p-10 flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-ambient">
              <span
                className="material-symbols-outlined text-[32px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                lock_reset
              </span>
            </div>
            <h1 className="text-headline-md font-headline-md text-on-surface mb-2">
              Đặt lại mật khẩu
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại
              mật khẩu cho bạn.
            </p>
          </div>

          {/* Form (hidden after submit) */}
          {!submitted && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="forgot-email"
                  className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
                  />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-surface-container-low border-transparent focus:border-transparent focus:ring-2 focus:ring-secondary-container rounded-full py-3 pl-12 pr-4 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-shadow"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container text-label-sm font-label-sm py-4 rounded-full transition-all duration-200 transform hover:-translate-y-0.5 shadow-ambient flex items-center justify-center gap-2"
              >
                <span>Gửi liên kết đặt lại</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Success State */}
          {submitted && (
            <div className="flex flex-col items-center gap-6 text-center animate-pulse">
              <div className="w-16 h-16 bg-[#e0f2e9] rounded-full flex items-center justify-center mx-auto mb-2 shadow-ambient">
                <CheckCircle size={32} className="text-[#2e7d32]" />
              </div>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng
                kiểm tra hộp thư đến.
              </p>
            </div>
          )}

          {/* Footer Links */}
          <div className="text-center mt-2 border-t border-surface-container-high pt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-label-sm font-label-sm text-on-surface-variant/70">
            © {new Date().getFullYear()} Pocket Agencom. Cần hỗ trợ?{' '}
            <a href="#" className="text-primary hover:underline">
              Liên hệ Hỗ trợ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
