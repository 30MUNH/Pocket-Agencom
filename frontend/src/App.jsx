import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useOutletContext } from 'react-router-dom';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const MyPlans = lazy(() => import('./pages/user/MyPlans'));
const TemplateLibrary = lazy(() => import('./pages/user/TemplateLibrary'));
const HelpCenter = lazy(() => import('./pages/user/HelpCenter'));
const UserSettings = lazy(() => import('./pages/user/UserSettings'));
const BusinessProfile = lazy(() => import('./pages/user/BusinessProfile'));
const GenerateMarketingKit = lazy(() => import('./pages/user/GenerateMarketingKit'));
const MarketingResult = lazy(() => import('./pages/user/MarketingResult'));
const QuickEditor = lazy(() => import('./pages/user/QuickEditor'));
const ContentCalendar = lazy(() => import('./pages/user/ContentCalendar'));
const MediaLibrary = lazy(() => import('./pages/user/MediaLibrary'));
const PlanReviewPage = lazy(() => import('./pages/staff/PlanReviewPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));

function DashboardRoute() {
  const { userRole } = useOutletContext();
  if (userRole === 'admin') return <AdminDashboard />;
  if (userRole === 'staff') return <StaffDashboard />;
  return <UserDashboard />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-on-surface-variant" role="status">Đang tải trang…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/marketing-kit" element={<GenerateMarketingKit />} />
            <Route path="/marketing-kit/result" element={<MarketingResult />} />
            <Route path="/user/quick-editor" element={<QuickEditor />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/media-library" element={<MediaLibrary />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/plans" element={<MyPlans />} />
            <Route path="/templates" element={<TemplateLibrary />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/business-profile" element={<BusinessProfile />} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route
              path="/staff/plan-review/:id"
              element={<ProtectedRoute roles={['staff', 'admin']}><PlanReviewPage /></ProtectedRoute>}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
