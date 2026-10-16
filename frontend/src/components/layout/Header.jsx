import { Menu, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import AuthorizedMediaImage from '../media/AuthorizedMediaImage';

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          type="button"
          aria-label={isMenuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
          aria-expanded={isMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors lg:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{pageTitle}</p>
          <p className="hidden text-xs text-slate-500 sm:block">Pocket Agencom</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <span className="hidden rounded-full bg-[#FFCED2] px-3 py-1 text-xs font-bold text-slate-900 sm:inline-flex shadow-xs">
          {ROLE_LABELS[userRole] || userRole}
        </span>

        <div className="hidden min-w-0 max-w-48 flex-col items-end sm:flex">
          <span className="truncate text-xs font-bold text-slate-900">{user?.name}</span>
          <span className="truncate text-[11px] text-slate-500">{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} aria-hidden="true" />
        </button>

        <div aria-label={user?.name ? `Tài khoản ${user.name}` : 'Tài khoản'} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
          {user?.avatarMediaAssetId || user?.avatarUrl
            ? <AuthorizedMediaImage assetId={user?.avatarMediaAssetId} legacyUrl={user?.avatarUrl} alt="" className="h-full w-full object-cover" />
            : <span aria-hidden="true">{userInitial}</span>}
        </div>
      </div>
    </header>
  );
}
