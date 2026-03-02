import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Stores from './pages/Stores';
import SellerRequests from './pages/SellerRequests';
import Categories from './pages/Categories';
import Banners from './pages/Banners';
import Comments from './pages/Comments';
import Reports from './pages/Reports';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
        <div style={{ fontSize: 14, color: '#64748b' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><SellerRequests /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/stores" element={<PrivateRoute><Stores /></PrivateRoute>} />
      <Route path="/shops" element={<PrivateRoute><Stores /></PrivateRoute>} />
      <Route path="/seller-requests" element={<PrivateRoute><SellerRequests /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/banners" element={<PrivateRoute><Banners /></PrivateRoute>} />
      <Route path="/comments" element={<PrivateRoute><Comments /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
      <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
