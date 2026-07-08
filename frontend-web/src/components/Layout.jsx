import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Users, Bell, History, User, ShieldCheck, FileCheck2, Scale, LogOut, Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroups, useNotifications } from '../lib/queries';

function Item({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-primary-soft text-primary' : 'text-ink-soft hover:bg-surface-alt'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.8} />
      <span className="flex-1">{label}</span>
      {badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">{badge}</span>}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuper = user?.role === 'super_admin';
  const { data: groups } = useGroups();
  const { data: notifs } = useNotifications();
  const unread = notifs?.non_lues ?? 0;
  const isAdmin = (groups ?? []).some((g) => g.admin_id === user?.id);
  const roleLabel = isSuper ? 'Super-administrateur' : isAdmin ? 'Administrateur' : 'Membre';

  const onLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-card bg-hero text-white"><Coins size={18} /></div>
          <div>
            <div className="font-display text-lg font-semibold leading-none text-ink">TontineSecure</div>
            <div className="text-[11px] text-ink-faint">{roleLabel}</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <Item to="/" icon={Home} label="Accueil" />
          <Item to="/groupes" icon={Users} label="Mes tontines" />
          <Item to="/notifications" icon={Bell} label="Notifications" badge={unread} />
          <Item to="/historique" icon={History} label="Historique" />
          <Item to="/profil" icon={User} label="Profil" />

          {isSuper && (
            <>
              <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Administration</div>
              <Item to="/admin/kyc" icon={FileCheck2} label="Vérifications KYC" />
              <Item to="/admin/litiges" icon={Scale} label="Litiges" />
              <Item to="/admin/comptes" icon={ShieldCheck} label="Comptes" />
            </>
          )}
        </nav>

        <button onClick={onLogout} className="mt-2 flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft">
          <LogOut size={18} strokeWidth={1.8} /> Se déconnecter
        </button>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-card bg-hero text-white"><Coins size={16} /></div>
          <span className="font-display font-semibold">TontineSecure</span>
        </div>
        <button onClick={onLogout} className="text-danger"><LogOut size={20} /></button>
      </header>

      {/* Contenu */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Nav mobile bas */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-surface py-2 md:hidden">
        {[['/', Home], ['/groupes', Users], ['/notifications', Bell], ['/profil', User]].map(([to, Icon]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `grid place-items-center px-4 py-1 ${isActive ? 'text-primary' : 'text-ink-faint'}`}>
            <Icon size={22} strokeWidth={1.8} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
