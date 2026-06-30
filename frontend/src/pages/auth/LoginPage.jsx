import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend auth API
    console.log('Login attempt:', { email, remember });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-secondary-container/20 flex items-center justify-center p-gutter font-body-md text-on-surface relative">
      {/* Back to Homepage Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full shadow-sm border border-surface-container/20 text-on-surface-variant hover:text-primary hover:shadow-md transition-all text-xs font-semibold"
      >
        <ArrowLeft size={14} />
        <span>Quay về trang chủ</span>
      </Link>

      {/* Decorative background blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary-container/30 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-secondary-container/20 blur-[80px] pointer-events-none z-0" />

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-ambient relative z-10 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline-md text-headline-md text-primary font-bold mb-2">
            Pocket Agencom
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Chào mừng trở lại. Vui lòng nhập thông tin đăng nhập.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block font-label-sm text-label-sm text-on-surface ml-1"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none"
              />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="w-full pl-12 pr-4 py-4 bg-tertiary-fixed rounded-full border-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block font-label-sm text-label-sm text-on-surface ml-1"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none"
              />
              <input
                id="login-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-tertiary-fixed rounded-full border-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="appearance-none h-4 w-4 rounded-full border border-secondary-fixed-dim bg-secondary-container/30 checked:bg-secondary-container checked:border-secondary focus:outline-none transition-all cursor-pointer flex items-center justify-center after:content-[''] after:block after:w-1.5 after:h-1.5 after:bg-secondary after:rounded-full after:opacity-0 checked:after:opacity-100 after:transition-opacity"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block font-body-md text-[14px] text-on-surface-variant cursor-pointer"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="font-label-sm text-label-sm text-primary hover:text-secondary-container transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-sm font-label-sm text-label-sm bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-container transition-all duration-200"
            >
              Đăng nhập
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="font-body-md text-[14px] text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-label-sm text-label-sm text-primary hover:text-secondary-container transition-colors ml-1"
            >
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
