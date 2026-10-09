import { BrowserRouter as Router, Routes, Route, useOutletContext } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/public/NotFoundPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserDashboard from './pages/user/UserDashboard';
import MyPlans from './pages/user/MyPlans';
import TemplateLibrary from './pages/user/TemplateLibrary';
import HelpCenter from './pages/user/HelpCenter';
import UserSettings from './pages/user/UserSettings';
import BusinessProfile from './pages/user/BusinessProfile';
import GenerateMarketingKit from './pages/user/GenerateMarketingKit';
import MarketingResult from './pages/user/MarketingResult';
import QuickEditor from './pages/user/QuickEditor';
import ContentCalendar from './pages/user/ContentCalendar';
import MediaLibrary from './pages/user/MediaLibrary';
import PlanReviewPage from './pages/staff/PlanReviewPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import StaffDashboard from './pages/staff/StaffDashboard';
import './App.css';

function DashboardRoute() {
  const { userRole } = useOutletContext();
  if (userRole === 'admin') return <AdminDashboard />;
  if (userRole === 'staff') return <StaffDashboard />;
  return <UserDashboard />;
}

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
