import { Link, useNavigate } from 'react-router-dom';
import { Contact, Mail, ShieldCheck, LogOut, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, ProgressBar } from '../components/ui';
import { scoreBadge } from '../lib/status';

const KYC = { verifie: 'Vérifié', en_attente: 'En attente', rejete: 'Rejeté' };

function Row({ icon: Icon, title, value, to }) {
  const inner = (
    <div className="card flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-card bg-primary-soft text-primary"><Icon size={18} /></div>
      <div className="flex-1"><p className="text-sm font-medium text-ink">{title}</p>{value && <p className="text-xs text-ink-faint">{value}</p>}</div>
      {to && <ChevronRight size={18} className="text-ink-faint" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const score = Number(user?.score_fiabilite ?? 100);
  const badge = scoreBadge(score);

  const onLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-sheet bg-hero p-6 text-center text-white shadow-raised">
        <div className="mx-auto w-fit"><Avatar name={`${user?.prenom} ${user?.nom}`} size={72} /></div>
        <h1 className="mt-3 text-xl font-semibold">{user?.prenom} {user?.nom}</h1>
        <p className="font-mono text-sm text-white/70">{user?.telephone}</p>
        <span className="mt-3 inline-block rounded-pill bg-white/20 px-4 py-1 text-sm">
          {user?.role === 'super_admin' ? '🛡️ Super-administrateur' : 'Membre'}
        </span>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-ink"><Star size={18} className="text-gold" fill="#C99A4B" /> Score de fiabilité</span>
          <span className={`pill ${badge.cls}`}>{badge.label}</span>
        </div>
        <p className="my-2 text-3xl font-semibold text-ink">{score.toFixed(0)}<span className="text-lg text-ink-faint"> %</span></p>
        <ProgressBar value={score / 100} tone={score >= 90 ? 'bg-success' : score >= 70 ? 'bg-gold' : 'bg-danger'} />
        <p className="mt-2 text-xs text-ink-faint">Calculé sur vos cotisations validées à temps. Plus il est haut, plus les groupes vous font confiance.</p>
      </div>

      <div className="space-y-2">
        <Row icon={Contact} title="Vérification d'identité (KYC)" value={KYC[user?.statut_kyc] ?? '—'} to="/kyc" />
        <Row icon={Mail} title="Email" value={user?.email ?? 'Non renseigné'} />
        <Row icon={ShieldCheck} title="Rôle" value={user?.role === 'super_admin' ? 'Super-administrateur' : 'Membre'} />
      </div>

      <button onClick={onLogout} className="btn-danger w-full"><LogOut size={18} /> Se déconnecter</button>
    </div>
  );
}
