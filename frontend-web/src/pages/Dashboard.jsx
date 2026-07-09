import { Link } from 'react-router-dom';
import { Plus, UserPlus, ArrowDownLeft, ArrowUpRight, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroups, useMyHistory, useGroup, useCurrentCycle, formatFCFA } from '../lib/queries';
import { EmptyState, StatusPill } from '../components/ui';
import { AnimatedNumber, Skeleton } from '../components/motion';
import GroupCard from '../components/GroupCard';
import RotationRing from '../components/RotationRing';

const sum = (arr, pred) => arr.filter(pred).reduce((t, x) => t + Number(x.montant || 0), 0);
const DATE_FR = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Dashboard() {
  const { user } = useAuth();
  const groupsQ = useGroups();
  const histQ = useMyHistory();

  // Tontine active mise en avant (Cercle de Rotation) — hooks appelés avant tout return.
  const groupsData = groupsQ.data ?? [];
  const featuredId = groupsData.find((g) => g.statut === 'en_cours')?.id;
  const featuredQ = useGroup(featuredId);
  const featuredCycleQ = useCurrentCycle(featuredId);

  if (groupsQ.isLoading || histQ.isLoading) return <DashboardSkeleton />;

  const groups = groupsData;
  const cotisations = histQ.data?.cotisations ?? [];
  const versements = histQ.data?.versements ?? [];
  const epargne = sum(cotisations, (c) => c.statut === 'valide');
  const recu = sum(versements, (v) => v.statut === 'verse');
  const aRecevoir = sum(versements, (v) => v.statut === 'en_attente');

  const isSuper = user?.role === 'super_admin';
  const isAdmin = groups.some((g) => g.admin_id === user?.id);
  const role = isSuper ? { l: 'Super-administrateur', c: 'bg-danger text-white' } : isAdmin ? { l: 'Administrateur', c: 'bg-primary text-white' } : { l: 'Membre', c: 'bg-surface-alt text-ink-soft' };

  // Cercle de Rotation de la tontine active
  const fg = featuredQ.data;
  const fc = featuredCycleQ.data;
  const fMembers = fg ? (fg.adhesions ?? []).filter((m) => m.statut === 'actif' && m.ordre_rotation).sort((a, b) => a.ordre_rotation - b.ordre_rotation) : [];
  const fRing = fMembers.map((m) => ({ name: `${m.user?.prenom ?? ''} ${m.user?.nom ?? ''}`.trim() || m.user?.telephone || '?' }));
  const fBenefIdx = fc ? Math.max(fMembers.findIndex((m) => m.user_id === fc.beneficiaire?.id), 0) : 0;
  const showFeatured = fg && fc && fRing.length > 0;

  const activite = [
    ...cotisations.map((c) => ({ ...c, t: 'cotisation' })),
    ...versements.map((v) => ({ ...v, t: 'versement' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <p className="text-sm capitalize text-ink-soft">{DATE_FR}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink">Bonjour {user?.prenom} 👋</h1>
          <span className={`pill ${role.c}`}>{role.l}</span>
        </div>
      </div>

      {/* Héro solde */}
      <div className="overflow-hidden rounded-sheet bg-hero p-6 text-white shadow-raised">
        <p className="text-sm text-white/70">Épargne validée</p>
        <p className="mt-1 font-mono text-4xl font-semibold"><AnimatedNumber value={epargne} format={formatFCFA} /></p>
        <div className="mt-5 flex gap-6 border-t border-white/15 pt-4">
          <div><p className="text-xs text-white/60">Reçu</p><p className="font-mono font-semibold"><AnimatedNumber value={recu} format={formatFCFA} /></p></div>
          <div className="border-l border-white/15 pl-6"><p className="text-xs text-white/60">À recevoir</p><p className="font-mono font-semibold"><AnimatedNumber value={aRecevoir} format={formatFCFA} /></p></div>
          <div className="border-l border-white/15 pl-6"><p className="text-xs text-white/60">Tontines</p><p className="font-mono font-semibold"><AnimatedNumber value={groups.length} /></p></div>
        </div>
      </div>

      {/* Tour en cours — Cercle de Rotation de la tontine active */}
      {showFeatured && (
        <Link to={`/groupes/${fg.id}`} className="card card-interactive block overflow-hidden">
          <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              <RotationRing members={fRing} progress={Math.min(fc.numero_periode / Math.max(fRing.length, 1), 1)} beneficiaryIndex={fBenefIdx} centerLabel="Tour" centerValue={`${fc.numero_periode}/${fRing.length}`} size={180} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">Tour en cours</p>
              <h3 className="text-lg font-semibold text-ink">{fg.nom}</h3>
              <p className="mt-1 text-sm text-ink-soft">Bénéficiaire : <b className="text-ink">{fc.beneficiaire ? `${fc.beneficiaire.prenom} ${fc.beneficiaire.nom}` : '—'}</b>{fc.est_beneficiaire && " (c'est vous 🎉)"}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-ink-soft">Votre cotisation :</span> <StatusPill status={fc.ma_cotisation_statut} />
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Voir la tontine <ArrowRight size={16} /></span>
            </div>
          </div>
        </Link>
      )}

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-3">
        <Link to="/groupes/nouveau" className="btn-primary"><Plus size={18} /> Créer une tontine</Link>
        <Link to="/groupes/rejoindre" className="btn-secondary"><UserPlus size={18} /> Rejoindre avec un code</Link>
      </div>

      {/* Mes tontines */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Mes tontines</h2>
          <Link to="/groupes" className="text-sm font-medium text-primary">Tout voir ›</Link>
        </div>
        {groups.length === 0 ? (
          <div className="card">
            <EmptyState icon="👥" title="Aucune tontine pour l'instant"
              message="Créez votre premier groupe ou rejoignez-en un avec un code d'invitation."
              action={<Link to="/groupes/nouveau" className="btn-primary">Créer une tontine</Link>} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.slice(0, 4).map((g) => <GroupCard key={g.id} group={g} admin={g.admin_id === user?.id} />)}
          </div>
        )}
      </section>

      {/* Activité récente */}
      {activite.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Activité récente</h2>
          <div className="card divide-y divide-line">
            {activite.map((a) => (
              <div key={`${a.t}-${a.id}`} className="flex items-center gap-3 p-4">
                <div className={`grid h-10 w-10 place-items-center rounded-full ${a.t === 'versement' ? 'bg-success-soft text-success' : 'bg-surface-alt text-ink-soft'}`}>
                  {a.t === 'versement' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{a.t === 'versement' ? 'Versement reçu' : 'Cotisation'} · {a.cycle?.group?.nom ?? 'Tontine'}</p>
                  <p className="text-xs text-ink-faint">Tour {a.cycle?.numero_periode ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${a.t === 'versement' ? 'text-success' : 'text-ink'}`}>{a.t === 'versement' ? '+' : ''}{formatFCFA(a.montant)}</p>
                  {a.t === 'cotisation' && <StatusPill status={a.statut} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3 rounded-card bg-surface-alt p-4 text-sm text-ink-soft">
        <Sparkles size={18} className="text-gold" />
        Cotisez à temps pour faire grimper votre score de fiabilité, gage de confiance auprès des groupes.
      </div>
    </div>
  );
}

/* Squelette de chargement à la forme du contenu (plutôt qu'un spinner générique). */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" rounded="rounded-pill" />
        <Skeleton className="h-7 w-56" rounded="rounded-pill" />
      </div>
      <Skeleton className="h-40 w-full rounded-sheet" />
      <Skeleton className="h-48 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-11 w-44" rounded="rounded-pill" />
        <Skeleton className="h-11 w-52" rounded="rounded-pill" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
