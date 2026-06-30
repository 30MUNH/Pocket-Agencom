import { Menu, Search, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ROLE_LABELS = {
  user: 'Thương hiệu',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

export default function Header({ onMenuClick, user, userRole, placeholder = 'Tìm kiếm...' }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center w-full px-gutter h-20 z-30 sticky top-0 backdrop-blur-xl bg-surface-container-lowest/80 dark:bg-surface-dim/80 shadow-[0_4px_24px_rgba(255,143,163,0.08)]">
      <div className="flex items-center flex-1 gap-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-on-surface hover:bg-secondary-container/50 rounded-full transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="relative w-full max-w-md hidden md:block">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-body-md font-body-md focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
            placeholder={placeholder}
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button className="p-2 text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary transition-all duration-200 rounded-full flex items-center justify-center">
          <Bell size={20} />
        </button>

        <span className="hidden sm:inline text-xs font-bold text-on-surface-variant uppercase tracking-wider px-3 py-1.5 bg-surface-container-high rounded-full">
          {ROLE_LABELS[userRole] || userRole}
        </span>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold text-primary">{user?.name}</span>
          <span className="text-[10px] text-on-surface-variant">{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-2 text-on-surface-variant hover:bg-error-container/30 hover:text-error transition-all rounded-full"
        >
          <LogOut size={18} />
        </button>

        <div className="w-10 h-10 rounded-full bg-secondary-container overflow-hidden border-2 border-transparent hover:border-secondary-container transition-colors shrink-0">
          <img
            alt="User Profile Avatar"
            className="w-full h-full object-cover"
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`
            }
          />
        </div>
      </div>
    </header>
  );
}
