import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* ─── Auth Pages ─── */
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* ─── Authentication Routes ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ─── Default redirect to login ─── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ─── Placeholder: Dashboard, Marketplace, etc. (Phase 2+) ─── */}
      </Routes>
    </Router>
  );
}

export default App;
