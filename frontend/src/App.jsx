import { BrowserRouter as Router, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/public/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserDashboard from './pages/user/UserDashboard';
import MyPlans from './pages/user/MyPlans';
import TemplateLibrary from './pages/user/TemplateLibrary';
import MyBookings from './pages/user/MyBookings';
import HelpCenter from './pages/user/HelpCenter';
import UserSettings from './pages/user/UserSettings';
import GenerateMarketingKit from './pages/user/GenerateMarketingKit';
import MarketingResult from './pages/user/MarketingResult';
import PlanReviewPage from './pages/staff/PlanReviewPage';
import BookingDetailPage from './pages/user/BookingDetailPage';
import BookingConfirmationPage from './pages/user/BookingConfirmationPage';
import KOLMarketplace from './pages/marketplace/KOLMarketplace';
import KOLMarketplaceExplorer from './pages/marketplace/KOLMarketplaceExplorer';
import KOLDetailPage from './pages/marketplace/KOLDetailPage';
import BookCampaignPage from './pages/marketplace/BookCampaignPage';
import PackageDetailPage from './pages/marketplace/PackageDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKOLManagement from './pages/admin/AdminKOLManagement';
import ManageUsers from './pages/admin/ManageUsers';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBookingManagement from './pages/staff/StaffBookingManagement';

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/confirmation"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <BookingConfirmationPage />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/marketing-kit" element={<GenerateMarketingKit />} />
          <Route path="/marketing-kit/result" element={<MarketingResult />} />
          <Route path="/plans" element={<MyPlans />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/marketplace" element={<KOLMarketplace />} />
          <Route path="/marketplace/explorer" element={<KOLMarketplaceExplorer />} />
          <Route path="/marketplace/kol/:id" element={<KOLDetailPage />} />
          <Route path="/marketplace/book/:id" element={<BookCampaignPage />} />
          <Route path="/marketplace/package/:id" element={<PackageDetailPage />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/settings" element={<UserSettings />} />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kols"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminKOLManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/bookings"
            element={
              <ProtectedRoute roles={['staff', 'admin']}>
                <StaffBookingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/plan-review/:id"
            element={
              <ProtectedRoute roles={['staff', 'admin']}>
                <PlanReviewPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
