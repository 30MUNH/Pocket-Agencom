import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import { toast } from '../../store/toastStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginMutation.mutateAsync({ email, password });
      toast.success(`Chào mừng trở lại, ${data.user.name}!`);
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-secondary-container/20 flex items-center justify-center p-gutter font-body-md text-on-surface relative">
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary-container/30 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-secondary-container/20 blur-[80px] pointer-events-none z-0" />

      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-ambient relative z-10 transition-all duration-300">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant/30">
          <span className="font-headline-md text-headline-md text-primary font-bold">
            Pocket <span className="text-[#F897A8]">Agen</span>com
          </span>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full shadow-sm border border-surface-container/20 text-on-surface-variant hover:text-primary hover:shadow-md transition-all text-xs font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Quay về</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Chào mừng trở lại. Vui lòng nhập thông tin đăng nhập.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block font-label-sm text-label-sm text-on-surface ml-1">
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@pocketagencom.vn"
                className="w-full pl-12 pr-4 py-4 bg-tertiary-fixed rounded-full border-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block font-label-sm text-label-sm text-on-surface ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-tertiary-fixed rounded-full border-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="appearance-none h-4 w-4 rounded-full border border-secondary-fixed-dim bg-secondary-container/30 checked:bg-secondary-container checked:border-secondary focus:outline-none transition-all cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block font-body-md text-[14px] text-on-surface-variant cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:text-secondary-container transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-full shadow-sm font-label-sm text-label-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                isFormValid
                  ? 'bg-[#ff758f] text-white hover:bg-[#ff5c7a] hover:-translate-y-0.5'
                  : 'bg-[#F9E3E5] text-[#b38a90]'
              }`}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="font-body-md text-[14px] text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-label-sm text-label-sm text-primary hover:text-secondary-container transition-colors ml-1">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
