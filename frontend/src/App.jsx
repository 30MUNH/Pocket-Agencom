import { BrowserRouter as Router, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/public/LandingPage';
import KolDirectory from './pages/public/KolDirectory';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserDashboard from './pages/user/UserDashboard';
import MyPlans from './pages/user/MyPlans';
import TemplateLibrary from './pages/user/TemplateLibrary';
import MyBookings from './pages/user/MyBookings';
import HelpCenter from './pages/user/HelpCenter';
import UserSettings from './pages/user/UserSettings';
import BusinessProfile from './pages/user/BusinessProfile';
import GenerateMarketingKit from './pages/user/GenerateMarketingKit';
import MarketingResult from './pages/user/MarketingResult';
import QuickEditor from './pages/user/QuickEditor';
import ContentCalendar from './pages/user/ContentCalendar';
import MediaLibrary from './pages/user/MediaLibrary';
import KolBookingManager from './pages/business/KolBookingManager';
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
import KolDashboard from './pages/kol/KolDashboard';
import KolProfileSettings from './pages/kol/KolProfileSettings';
import CampaignJobBoard from './pages/marketplace/CampaignJobBoard';
import ApplicationManager from './pages/marketplace/ApplicationManager';
import OrderManagement from './pages/kol/OrderManagement';
import SecureNegotiationChat from './pages/kol/SecureNegotiationChat';
import IncomeDashboard from './pages/kol/IncomeDashboard';

function DashboardRoute() {
  const { userRole } = useOutletContext();
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'kol':
      return <KolDashboard />;
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
        <Route path="/kols" element={<KolDirectory />} />

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
          <Route path="/user/quick-editor" element={<QuickEditor />} />
          <Route path="/calendar" element={<ContentCalendar />} />
          <Route path="/media-library" element={<MediaLibrary />} />
          <Route path="/plans" element={<MyPlans />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/marketplace" element={<KOLMarketplace />} />
          <Route path="/marketplace/job-board" element={<CampaignJobBoard />} />
          <Route path="/marketplace/explorer" element={<KOLMarketplaceExplorer />} />
          <Route path="/marketplace/kol/:id" element={<KOLDetailPage />} />
          <Route path="/marketplace/book/:id" element={<BookCampaignPage />} />
          <Route path="/marketplace/package/:id" element={<PackageDetailPage />} />
          <Route path="/campaigns/:id/applications" element={<ApplicationManager />} />
          <Route path="/chat" element={<SecureNegotiationChat />} />
          <Route path="/bookings" element={<KolBookingManager />} />
          <Route path="/kol-bookings" element={<KolBookingManager />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/business-profile" element={<BusinessProfile />} />

          {/* KOL Protected Routes */}
          <Route
            path="/kol/profile"
            element={
              <ProtectedRoute roles={['kol']}>
                <KolProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kol/orders"
            element={
              <ProtectedRoute roles={['kol']}>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kol/job-board"
            element={
              <ProtectedRoute roles={['kol', 'user']}>
                <CampaignJobBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kol/chat"
            element={
              <ProtectedRoute roles={['kol']}>
                <SecureNegotiationChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kol/income"
            element={
              <ProtectedRoute roles={['kol']}>
                <IncomeDashboard />
              </ProtectedRoute>
            }
          />

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
