import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loading } from './components/ui';
import Layout from './components/Layout';

/* Code-splitting par route : la landing (qui embarque GSAP + le scroll storytelling)
   et le cluster app authentifié partent dans des chunks séparés — le bundle initial
   ne paie que ce qu'il affiche. Clé du budget Lighthouse mobile (≥85). */
const Landing = lazy(() => import('./pages/Landing'));
const AuroraDemo = lazy(() => import('./pages/AuroraDemo'));
const CelebrationDemo = lazy(() => import('./pages/CelebrationDemo'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Otp = lazy(() => import('./pages/auth/Otp'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const Notifications = lazy(() => import('./pages/Notifications'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const Kyc = lazy(() => import('./pages/Kyc'));
const Disputes = lazy(() => import('./pages/Disputes'));

const AdminKyc = lazy(() => import('./pages/admin/AdminKyc'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDisputes = lazy(() => import('./pages/admin/AdminDisputes'));

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

  // Chargement de marque (logo animé) au demarrage de l'app, avant tout affichage
  // — s'applique partout, y compris la page de connexion et la vitrine.
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-bg"><Loading /></div>;
  }

  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      {/* Landing publique */}
      <Route path="/" element={token && !loading ? <Navigate to="/tableau-de-bord" replace /> : <Landing />} />
      {/* Vitrine consultable même connecté (démos / soutenance) — sans redirection */}
      <Route path="/decouvrir" element={<Landing />} />
      <Route path="/login" element={token && !loading ? <Navigate to="/tableau-de-bord" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/aurora" element={<AuroraDemo />} />{/* démo motion (validation) */}
      <Route path="/celebration" element={<CelebrationDemo />} />{/* démo motion (validation) */}

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
    </Suspense>
  );
}
