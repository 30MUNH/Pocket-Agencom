import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Library,
  CalendarDays,
  HelpCircle,
  Settings,
  Users,
  Building2,
  FolderKanban,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, userRole = 'user' }) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/admin/users', label: 'Quản lý người dùng', icon: Users },
          { path: '/plans', label: 'Duyệt kế hoạch', icon: ClipboardList },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
      case 'staff':
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/plans', label: 'Duyệt kế hoạch', icon: ClipboardList },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
      case 'user':
      default:
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/business-profile', label: 'Hồ sơ Doanh nghiệp', icon: Building2 },
          { path: '/marketing-kit', label: 'Bộ công cụ Marketing', icon: Sparkles },
          { path: '/plans', label: 'Kế hoạch của tôi', icon: ClipboardList },
          { path: '/calendar', label: 'Lịch đăng bài tự động', icon: CalendarDays },
          { path: '/media-library', label: 'Kho dữ liệu Media', icon: FolderKanban },
          { path: '/templates', label: 'Thư viện mẫu', icon: Library },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Đóng điều hướng"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Navigation Drawer */}
      <nav
        aria-label="Điều hướng chính"
        aria-hidden={!isDesktop && !isOpen}
        inert={!isDesktop && !isOpen}
        className={`fixed left-0 top-0 z-50 flex h-dvh w-sidebar-width flex-col gap-4 border-r border-surface-variant bg-white py-6 shadow-xl transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="px-8 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0">
            <img
              alt="Agency Logo"
              className="w-full h-full object-cover"
              src="/Logo.png"
            />
          </div>
          <div>
            <span className="text-headline-md font-headline-md font-extrabold tracking-tight text-on-surface">
              Pocket <span className="text-[#F897A8]">Agen</span>com
            </span>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
              Hỗ trợ Tiếp thị
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/marketing-kit'
                  ? location.pathname.startsWith('/marketing-kit')
                  : location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex min-h-11 items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-primary-container text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full" />
                    )}
                    <Icon size={20} aria-hidden="true" className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Section: Settings */}
        <div className="px-4 mt-auto">
          <Link
            to="/settings"
            onClick={onClose}
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
            className={`relative flex min-h-11 items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
              location.pathname === '/settings'
                ? 'bg-primary-container text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            {location.pathname === '/settings' && (
              <span className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full" />
            )}
            <Settings
              size={20}
              aria-hidden="true"
              className={location.pathname === '/settings' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span className="text-sm font-medium">Cài đặt</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
