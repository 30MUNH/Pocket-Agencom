import { BrowserRouter as Router, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

/* ─── Auth Pages ─── */
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

/* ─── Public Landing Page (Phase 7) ─── */
import LandingPage from './pages/public/LandingPage';

/* ─── Portal Layout & Pages ─── */
import DashboardLayout from './components/layout/DashboardLayout';
import UserDashboard from './pages/user/UserDashboard';
import MyPlans from './pages/user/MyPlans';
import TemplateLibrary from './pages/user/TemplateLibrary';
import MyBookings from './pages/user/MyBookings';
import HelpCenter from './pages/user/HelpCenter';
import UserSettings from './pages/user/UserSettings';

/* ─── Marketing Kit Module (Phase 5) ─── */
import GenerateMarketingKit from './pages/user/GenerateMarketingKit';
import MarketingResult from './pages/user/MarketingResult';
import PlanReviewPage from './pages/staff/PlanReviewPage';

/* ─── Bookings & Confirmation Pages (Phase 6) ─── */
import BookingDetailPage from './pages/user/BookingDetailPage';
import BookingConfirmationPage from './pages/user/BookingConfirmationPage';

/* ─── Marketplace Module Pages (Phase 3) ─── */
import KOLMarketplace from './pages/marketplace/KOLMarketplace';
import KOLMarketplaceExplorer from './pages/marketplace/KOLMarketplaceExplorer';
import KOLDetailPage from './pages/marketplace/KOLDetailPage';
import BookCampaignPage from './pages/marketplace/BookCampaignPage';
import PackageDetailPage from './pages/marketplace/PackageDetailPage';

/* ─── Admin & Staff Portal Pages (Phase 4) ─── */
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKOLManagement from './pages/admin/AdminKOLManagement';
import ManageUsers from './pages/admin/ManageUsers';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBookingManagement from './pages/staff/StaffBookingManagement';

/* ─── Dynamic Dashboard Selector ─── */
function DashboardRoute() {
  const { userRole } = useOutletContext();
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'user':
    default:
      return <UserDashboard />;
  }
}

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* ─── Public Pages ─── */}
        <Route path="/" element={<LandingPage />} />

        {/* ─── Authentication Routes ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ─── Standalone/Isolated Workflow Pages ─── */}
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/bookings/confirmation" element={<BookingConfirmationPage />} />

        {/* ─── User Portal Routes (Phase 2 & onwards) ─── */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRoute />} />
          
          {/* AI Marketing Tool Routes */}
          <Route path="/marketing-kit" element={<GenerateMarketingKit />} />
          <Route path="/marketing-kit/result" element={<MarketingResult />} />
          
          <Route path="/plans" element={<MyPlans />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          
          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<KOLMarketplace />} />
          <Route path="/marketplace/explorer" element={<KOLMarketplaceExplorer />} />
          <Route path="/marketplace/kol/:id" element={<KOLDetailPage />} />
          <Route path="/marketplace/book/:id" element={<BookCampaignPage />} />
          <Route path="/marketplace/package/:id" element={<PackageDetailPage />} />

          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/settings" element={<UserSettings />} />

          {/* Admin Routes */}
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/kols" element={<AdminKOLManagement />} />

          {/* Staff Routes */}
          <Route path="/staff/bookings" element={<StaffBookingManagement />} />
          <Route path="/staff/plan-review/:id" element={<PlanReviewPage />} />
        </Route>

        {/* ─── Default redirects ─── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
