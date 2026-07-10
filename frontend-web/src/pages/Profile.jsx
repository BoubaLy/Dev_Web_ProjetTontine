import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Contact, Mail, ShieldCheck, LogOut, ChevronRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyHistory } from '../lib/queries';
import { Avatar } from '../components/ui';
import { scoreBadge } from '../lib/status';
import ScoreGauge from '../components/ScoreGauge';
import ScoreTimeline from '../components/ScoreTimeline';
import { ScoreLevelUpMotion } from '../components/celebrations';

const KYC = { verifie: 'Vérifié', en_attente: 'En attente', rejete: 'Rejeté' };

/* Palier de fiabilité : 0 = À risque (<70), 1 = Correct (70-89), 2 = Fiable (≥90). */
function tierOf(score) {
  if (score >= 90) return 2;
  if (score >= 70) return 1;
  return 0;
}

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
  const histQ = useMyHistory();
  const score = Number(user?.score_fiabilite ?? 100);
  const badge = scoreBadge(score);
  const [levelUp, setLevelUp] = useState(false);

  // Moment ③ : montée de score à un palier. On compare au dernier palier connu
  // (localStorage), on ne déclenche QUE sur un franchissement vers le haut — jamais
  // au premier chargement (sinon faux positif).
  useEffect(() => {
    if (!user?.id) return;
    const key = `ts:score-tier:${user.id}`;
    const tier = tierOf(score);
    const prev = localStorage.getItem(key);
    if (prev != null && tier > Number(prev)) setLevelUp(true);
    localStorage.setItem(key, String(tier));
  }, [user?.id, score]);

  const onLogout = async () => { await logout(); navigate('/login'); };
  const cotisations = histQ.data?.cotisations ?? [];

  return (
    <div className="relative isolate space-y-5">
      {/* Écran calme : fond ambiant en intensité `soft` (très atténué) — la lisibilité prime. */}
      <div className="overflow-hidden rounded-sheet bg-hero p-6 text-center text-white shadow-raised">
        <div className="mx-auto w-fit"><Avatar name={`${user?.prenom} ${user?.nom}`} size={72} /></div>
        <h1 className="mt-3 text-xl font-semibold">{user?.prenom} {user?.nom}</h1>
        <p className="font-mono text-sm text-white/70">{user?.telephone}</p>
        <span className="mt-3 inline-block rounded-pill bg-white/20 px-4 py-1 text-sm">
          {user?.role === 'super_admin'? 'Super-administrateur': 'Membre'}
        </span>
      </div>

      {/* Score de fiabilité — jauge (accent->gold, jamais rouge) + frise temporelle */}
      <div className="card p-5">
        <div className="flex items-center gap-5">
          <ScoreGauge score={score} size={104} label="Fiabilité" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">Score de fiabilité</span>
              <span className={`pill ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Calculé sur vos cotisations validées à temps. Plus il est haut, plus les groupes vous font confiance.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">Historique de fiabilité</p>
          <ScoreTimeline cotisations={cotisations} />
        </div>
      </div>

      <div className="space-y-2">
        <Row icon={Contact} title="Vérification d'identité (KYC)" value={KYC[user?.statut_kyc] ?? '—'} to="/kyc" />
        <Row icon={Mail} title="Email" value={user?.email ?? 'Non renseigné'} />
        <Row icon={ShieldCheck} title="Rôle" value={user?.role === 'super_admin' ? 'Super-administrateur' : 'Membre'} />
        <Row icon={Globe} title="Voir la page d'accueil publique" value="La vitrine du site" to="/decouvrir" />
      </div>

      <button onClick={onLogout} className="btn-danger w-full"><LogOut size={18} /> Se déconnecter</button>

      <ScoreLevelUpMotion open={levelUp} level={badge.label} score={score} onDone={() => setLevelUp(false)} />
    </div>
  );
}
