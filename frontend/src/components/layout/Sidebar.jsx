import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Library,
  Compass,
  CalendarDays,
  HelpCircle,
  Settings,
  Users,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, userRole = 'user' }) {
  const location = useLocation();

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/admin/kols', label: 'Quản lý KOL', icon: Compass },
          { path: '/admin/users', label: 'Quản lý người dùng', icon: Users },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
      case 'staff':
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/staff/bookings', label: 'Bảng đặt lịch', icon: CalendarDays },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
      case 'user':
      default:
        return [
          { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { path: '/marketing-kit', label: 'Bộ công cụ Marketing', icon: Sparkles },
          { path: '/plans', label: 'Kế hoạch của tôi', icon: ClipboardList },
          { path: '/templates', label: 'Thư viện mẫu', icon: Library },
          { path: '/marketplace', label: 'Chợ KOL/KOC', icon: Compass },
          { path: '/bookings', label: 'Lịch đặt KOL', icon: CalendarDays },
          { path: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Navigation Drawer */}
      <nav
        className={`bg-surface-container-lowest dark:bg-tertiary-container shadow-[4px_0_24px_rgba(255,143,163,0.08)] fixed left-0 top-0 h-screen w-sidebar-width flex flex-col py-8 gap-4 z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="px-8 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0">
            <img
              alt="Agency Logo"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuABvgqTpEzAVJS3X5DCoJATOMivDwThuouFa_NwU-ZeY7DZJvLhNW7jaUOhaumxNWkDBAsr2vpvschkNz2TwwxyJhXjcll0knl1pHx6RvpB5quuWGX6kI7SR8Wp6_xav0lUrqnDbutk36YEo2-7XqwtGGYa117puAxlP7soBagyMi5c1nZLk5bhW7lQ33DS2JB5X48xhYongko4KuSjMbc_HSkC0TGO5xbn9bxbrGcDWr3Uc8ziISvfrbtMczIBGrns7N__g7jmJeo"
            />
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-extrabold text-primary tracking-tight">
              Pocket Agencom
            </h1>
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
              const isActive =
                item.path === '/marketplace'
                  ? location.pathname.startsWith('/marketplace')
                  : item.path === '/marketing-kit'
                  ? location.pathname.startsWith('/marketing-kit')
                  : item.path === '/admin/kols'
                  ? location.pathname.startsWith('/admin/kols')
                  : location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-4 py-3.5 px-6 rounded-full transition-all relative ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-primary hover:bg-secondary-container/20'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full" />
                    )}
                    <Icon size={20} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
                    <span className="text-label-sm font-label-sm">{item.label}</span>
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
            className={`flex items-center gap-4 py-3.5 px-6 rounded-full transition-all relative ${
              location.pathname === '/settings'
                ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-secondary-container/20'
            }`}
          >
            {location.pathname === '/settings' && (
              <span className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full" />
            )}
            <Settings
              size={20}
              className={location.pathname === '/settings' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span className="text-label-sm font-label-sm">Cài đặt</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
