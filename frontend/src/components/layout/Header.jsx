import { Menu, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ROLE_LABELS = {
  user: 'Thương hiệu',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

export default function Header({ onMenuClick, isMenuOpen, user, userRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitle = location.pathname.startsWith('/marketing-kit/result')
    ? 'Kết quả kế hoạch'
    : ({
        '/dashboard': 'Bảng điều khiển',
        '/marketing-kit': 'Bộ công cụ Marketing',
        '/user/quick-editor': 'Soạn bài nhanh',
        '/calendar': 'Lịch đăng bài',
        '/media-library': 'Thư viện Media',
        '/media': 'Thư viện Media',
        '/plans': 'Kế hoạch của tôi',
        '/templates': 'Thư viện mẫu',
        '/help': 'Trung tâm trợ giúp',
        '/settings': 'Cài đặt',
        '/business-profile': 'Hồ sơ doanh nghiệp',
        '/admin/users': 'Quản lý người dùng',
      }[location.pathname] || 'Pocket Agencom');

  const userInitial = user?.name?.trim()?.[0]?.toLocaleUpperCase('vi-VN') || '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-variant bg-white px-gutter">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          type="button"
          aria-label={isMenuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
          aria-expanded={isMenuOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors lg:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">{pageTitle}</p>
          <p className="hidden text-xs text-on-surface-variant sm:block">Pocket Agencom</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant sm:inline-flex">
          {ROLE_LABELS[userRole] || userRole}
        </span>

        <div className="hidden min-w-0 max-w-48 flex-col items-end sm:flex">
          <span className="truncate text-xs font-semibold text-on-surface">{user?.name}</span>
          <span className="truncate text-[11px] text-on-surface-variant">{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>

        <div aria-label={user?.name ? `Tài khoản ${user.name}` : 'Tài khoản'} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-sm font-semibold text-primary">
          {user?.avatarUrl
            ? <img alt="" className="h-full w-full object-cover" src={user.avatarUrl} />
            : <span aria-hidden="true">{userInitial}</span>}
        </div>
      </div>
    </header>
  );
}
