import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loading } from './components/ui';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import AuroraDemo from './pages/AuroraDemo';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Otp from './pages/auth/Otp';

import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import CreateGroup from './pages/CreateGroup';
import JoinGroup from './pages/JoinGroup';
import Notifications from './pages/Notifications';
import History from './pages/History';
import Profile from './pages/Profile';
import Kyc from './pages/Kyc';
import Disputes from './pages/Disputes';

import AdminKyc from './pages/admin/AdminKyc';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDisputes from './pages/admin/AdminDisputes';

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Loading />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { token, loading } = useAuth();

  return (
    <Routes>
      {/* Landing publique */}
      <Route path="/" element={token && !loading ? <Navigate to="/tableau-de-bord" replace /> : <Landing />} />
      <Route path="/login" element={token && !loading ? <Navigate to="/tableau-de-bord" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/aurora" element={<AuroraDemo />} />{/* démo motion (validation) */}

      {/* Protégé */}
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/groupes" element={<Groups />} />
        <Route path="/groupes/nouveau" element={<CreateGroup />} />
        <Route path="/groupes/rejoindre" element={<JoinGroup />} />
        <Route path="/groupes/:id" element={<GroupDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/historique" element={<History />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/kyc" element={<Kyc />} />
        <Route path="/litiges" element={<Disputes />} />

        {/* Super-Admin */}
        <Route path="/admin/kyc" element={<AdminOnly><AdminKyc /></AdminOnly>} />
        <Route path="/admin/comptes" element={<AdminOnly><AdminUsers /></AdminOnly>} />
        <Route path="/admin/litiges" element={<AdminOnly><AdminDisputes /></AdminOnly>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
