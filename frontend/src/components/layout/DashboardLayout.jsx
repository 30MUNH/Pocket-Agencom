import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuthStore } from '../../store/authStore';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'user';
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (userRole === 'admin') {
      const isAdminPath =
        path === '/dashboard' || path.startsWith('/admin') || path === '/help' || path === '/settings';
      if (!isAdminPath) {
        navigate('/dashboard');
      }
    } else if (userRole === 'staff') {
      const isStaffPath =
        path === '/dashboard' ||
        path.startsWith('/staff') ||
        path === '/help' ||
        path === '/settings';
      if (!isStaffPath) {
        navigate('/dashboard');
      }
    } else {
      const isRestrictedPath = path.startsWith('/admin') || path.startsWith('/staff');
      if (isRestrictedPath) {
        navigate('/dashboard');
      }
    }
  }, [userRole, location.pathname, navigate]);

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />

      <div className="flex-1 flex flex-col lg:ml-sidebar-width min-w-0 transition-all duration-300 relative">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} userRole={userRole} />

        <main className="flex-1 px-gutter py-8 max-w-container-max mx-auto w-full flex flex-col">
          <Outlet context={{ userRole, user }} />
        </main>

        <Footer />
      </div>
    </div>
  );
}
