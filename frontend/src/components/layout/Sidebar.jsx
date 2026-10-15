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
        className={`fixed left-0 top-0 z-50 flex h-dvh w-sidebar-width flex-col gap-4 border-r border-slate-200/80 bg-white py-6 shadow-xl transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="px-6 mb-6 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <img
              alt="Agency Logo"
              className="w-full h-full object-cover"
              src="/Logo.png"
            />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Pocket <span className="bg-[#FFCED2] px-1.5 py-0.5 rounded-md text-slate-900">Agen</span>com
            </span>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Hỗ trợ Tiếp thị
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-1.5 px-3.5">
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
                    className={`relative flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 py-2.5 transition-all ${
                      isActive
                        ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Icon size={19} aria-hidden="true" className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Section: Settings */}
        <div className="px-3.5 mt-auto border-t border-slate-100 pt-3">
          <Link
            to="/settings"
            onClick={onClose}
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
            className={`relative flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 py-2.5 transition-all ${
              location.pathname === '/settings'
                ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
            }`}
          >
            <Settings
              size={19}
              aria-hidden="true"
              className={location.pathname === '/settings' ? 'text-slate-900' : 'text-slate-500'}
            />
            <span className="text-sm">Cài đặt</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
