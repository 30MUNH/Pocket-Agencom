import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Briefcase } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import { toast } from '../../store/toastStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const update = (field) => (event) => setForm((current) => ({
    ...current,
    [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    if (!form.agreeTerms) return toast.error('Vui lòng đồng ý với Điều khoản Dịch vụ');
    try {
      const data = await registerMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'user',
      });
      toast.success(`Tài khoản ${data.user.name} đã được tạo!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại');
    }
  };

  const fields = [
    ['name', 'Họ và tên', 'text', User, 'Nguyễn Văn A'],
    ['email', 'Địa chỉ Email', 'email', Mail, 'alex@example.com'],
  ];

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md flex flex-col md:flex-row">
      <main className="flex-1 flex items-center justify-center p-gutter lg:px-section-padding-desktop bg-surface-container-lowest">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-12">
            <span className="text-headline-md font-extrabold text-primary">Pocket <span className="text-[#F897A8]">Agen</span>com</span>
            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-container/20 text-on-surface-variant text-xs font-semibold">
              <ArrowLeft size={14} /> Quay về
            </Link>
          </div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary mb-2">Bắt đầu ngay</h1>
          <p className="text-body-lg text-on-surface-variant mb-8">Tạo tài khoản doanh nghiệp để tiếp cận các công cụ tiếp thị thông minh.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(([name, label, type, Icon, placeholder]) => (
              <label key={name} className="block text-label-sm text-on-surface">
                <span className="block mb-2 ml-1">{label}</span>
                <span className="relative block">
                  <Icon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input id={`reg-${name}`} type={type} required value={form[name]} onChange={update(name)} placeholder={placeholder} className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low focus:ring-2 focus:ring-secondary-container outline-none" />
                </span>
              </label>
            ))}

            {[
              ['password', 'Mật khẩu', showPassword, () => setShowPassword((value) => !value), 8],
              ['confirmPassword', 'Xác nhận mật khẩu', showConfirmPassword, () => setShowConfirmPassword((value) => !value)],
            ].map(([name, label, visible, toggle, minLength]) => (
              <label key={name} className="block text-label-sm text-on-surface">
                <span className="block mb-2 ml-1">{label}</span>
                <span className="relative block">
                  {name === 'password' ? <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" /> : <ShieldCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />}
                  <input type={visible ? 'text' : 'password'} required minLength={minLength} value={form[name]} onChange={update(name)} className="w-full pl-12 pr-12 py-4 rounded-full bg-surface-container-low focus:ring-2 focus:ring-secondary-container outline-none" />
                  <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </span>
              </label>
            ))}

            <label className="flex items-start gap-3 text-sm text-on-surface-variant">
              <input type="checkbox" checked={form.agreeTerms} onChange={update('agreeTerms')} className="mt-0.5" />
              Tôi đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật.
            </label>
            <button type="submit" disabled={registerMutation.isPending} className="w-full py-4 rounded-full bg-[#ff758f] text-white font-bold flex justify-center items-center gap-2 disabled:opacity-60">
              {registerMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Briefcase size={20} />}
              Tạo tài khoản <ArrowRight size={20} />
            </button>
          </form>
          <p className="mt-8 text-center text-on-surface-variant">Đã có tài khoản? <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link></p>
        </div>
      </main>
      <aside className="hidden md:flex w-1/2 bg-secondary-container/20 items-center justify-center p-gutter">
        <div className="w-full max-w-lg rounded-3xl bg-surface-container-lowest shadow-ambient p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-secondary-container/40 flex items-center justify-center mb-6"><Briefcase size={36} className="text-primary" /></div>
          <h2 className="text-headline-md text-primary mb-3">The Marketing Agency in Your Pocket</h2>
          <p className="text-on-surface-variant">Lập kế hoạch bằng AI, quản lý nội dung, lịch đăng, ngân sách và hiệu quả chiến dịch trong một nơi.</p>
        </div>
      </aside>
    </div>
  );
}
