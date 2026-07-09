import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { GROUP_STATUS } from '../lib/status';
import { formatFCFA } from '../lib/queries';
import { ProgressBar } from './ui';

export default function GroupCard({ group, admin }) {
  const st = GROUP_STATUS[group.statut] ?? GROUP_STATUS.ouvert;
  const membres = group.membres_actifs_count ?? 0;
  const max = group.nb_membres_max ?? 1;
  // Pour un groupe démarré, le « total » pertinent est son effectif, pas le plafond.
  const denom = group.statut === 'ouvert' ? max : membres;

  return (
    <Link to={`/groupes/${group.id}`} className="card card-interactive block p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-primary-soft text-primary"><Users size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-ink">{group.nom}</h3>
            {admin && <span className="pill bg-primary-soft text-primary">Admin</span>}
          </div>
          <p className="text-xs capitalize text-ink-soft">{group.type} · {group.frequence}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-semibold text-ink">{formatFCFA(group.montant_cotisation)}</div>
          <span className={`pill ${st.cls}`}>{st.label}</span>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={denom ? membres / denom : 0} tone={group.statut === 'cloture' ? 'bg-ink-faint' : 'bg-primary'} />
        <p className="mt-1 text-right text-xs text-ink-faint">
          {group.statut === 'ouvert' ? `${membres}/${max} membres` : `${membres} membre(s) · rotation en cours`}
        </p>
      </div>
    </Link>
  );
}
