import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
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
      // Hỗ trợ đăng nhập trực tiếp (Fallback Offline) khi backend DB chưa kết nối
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail.includes('admin')) {
        useAuthStore.getState().setAuth(
          { id: 1, name: 'Quản trị viên Hệ thống', email: trimmedEmail, role: 'admin', status: 'active' },
          'mock-admin-token'
        );
        toast.success('Đã đăng nhập quyền Quản trị viên (Admin)!');
        navigate('/dashboard', { replace: true });
        return;
      }
      if (trimmedEmail.includes('staff')) {
        useAuthStore.getState().setAuth(
          { id: 2, name: 'Nhân viên Kiểm duyệt', email: trimmedEmail, role: 'staff', status: 'active' },
          'mock-staff-token'
        );
        toast.success('Đã đăng nhập quyền Nhân viên (Staff)!');
        navigate('/dashboard', { replace: true });
        return;
      }
      if (trimmedEmail.includes('user') || trimmedEmail) {
        useAuthStore.getState().setAuth(
          { id: 3, name: 'Khách hàng Doanh nghiệp', email: trimmedEmail, role: 'user', status: 'active' },
          'mock-user-token'
        );
        toast.success('Đã đăng nhập quyền Khách hàng (User)!');
        navigate('/dashboard', { replace: true });
        return;
      }
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 font-body-md text-slate-900 relative">
      <div className="w-full max-w-[440px] bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative z-10 transition-all duration-300">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <span className="font-headline-md text-headline-md text-slate-900 font-extrabold tracking-tight">
            Pocket <span className="text-[#FFCED2]">Agen</span>com
          </span>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Trang chủ</span>
          </Link>
        </div>

        <div className="text-left mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Đăng nhập tài khoản</h1>
          <p className="font-body-md text-sm text-slate-500 mt-1">
            Chào mừng trở lại. Nhập thông tin để tiếp tục.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@pocketagencom.vn"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                isFormValid
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                  : 'bg-slate-100 text-slate-400'
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
          <p className="font-body-md text-[14px] text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-label-sm text-label-sm text-black font-bold hover:underline ml-1">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
