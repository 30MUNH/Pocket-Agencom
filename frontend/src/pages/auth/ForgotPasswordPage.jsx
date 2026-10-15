import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUnavailable(true);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md px-gutter relative z-10">
        {/* Logo and Back Link */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <span className="text-headline-md font-headline-md font-extrabold text-black">
            Pocket Agencom
          </span>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-slate-600 hover:text-black transition-all text-xs font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Quay về</span>
          </Link>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-800">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                lock_reset
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
              Đặt lại mật khẩu
            </h1>
            <p className="font-body-md text-sm text-slate-500">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại
              mật khẩu cho bạn.
            </p>
          </div>

          {/* Form (hidden after submit) */}
          {!unavailable && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="forgot-email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                <span>Gửi liên kết đặt lại</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Success State */}
          {unavailable && (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-950">
              <Mail size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>
                Tính năng đặt lại mật khẩu hiện chưa khả dụng. Email chưa được gửi.
                Vui lòng đăng nhập để đổi mật khẩu trong phần Cài đặt hoặc liên hệ bộ phận hỗ trợ.
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
            <Link to="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
