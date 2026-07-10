import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, UserPlus, ArrowDownLeft, ArrowUpRight, Sparkles, ArrowRight, Crown, CalendarClock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroups, useMyHistory, useGroup, useCurrentCycle, formatFCFA } from '../lib/queries';
import { EmptyState, StatusPill } from '../components/ui';
import { AnimatedNumber, Skeleton } from '../components/motion';
import { duration, easing } from '../motion/tokens';
import GroupCard from '../components/GroupCard';
import RotationRing from '../components/RotationRing';
import ScoreGauge from '../components/ScoreGauge';

const sum = (arr, pred) => arr.filter(pred).reduce((t, x) => t + Number(x.montant || 0), 0);
const DATE_FR = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/* Entrée bento : cascade courte (stagger 60 ms, fade + slide 8px, ≤700 ms total). */
const bentoContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const bentoCell = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const groupsQ = useGroups();
  const histQ = useMyHistory();

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
  const versementEnAttente = sum(versements, (v) => v.statut === 'en_attente');
  const score = Number(user?.score_fiabilite); // l'API sérialise un décimal en chaîne ("100.00")

  const isSuper = user?.role === 'super_admin';
  const isAdmin = groups.some((g) => g.admin_id === user?.id);
  const role = isSuper ? { l: 'Super-administrateur', c: 'bg-danger text-white' } : isAdmin ? { l: 'Administrateur', c: 'bg-primary text-white' } : { l: 'Membre', c: 'bg-surface-alt text-ink-soft' };

  // Cercle de Rotation interactif de la tontine active.
  const fg = featuredQ.data;
  const fc = featuredCycleQ.data;
  const fMembers = fg ? (fg.adhesions ?? []).filter((m) => m.statut === 'actif' && m.ordre_rotation).sort((a, b) => a.ordre_rotation - b.ordre_rotation) : [];
  const fRing = fMembers.map((m) => ({
    name: `${m.user?.prenom ?? ''} ${m.user?.nom ?? ''}`.trim() || m.user?.telephone || '?',
    isYou: m.user_id === user?.id,
    status: m.user_id === user?.id ? fc?.ma_cotisation_statut : undefined,
  }));
  const fBenefIdx = fc ? Math.max(fMembers.findIndex((m) => m.user_id === fc.beneficiaire?.id), 0) : 0;
  const showFeatured = fg && fc && fRing.length > 0;

  // « À recevoir » : un versement réellement en attente, sinon le pot ATTENDU quand c'est
  // ton tour d'être bénéficiaire du cycle en cours (le bénéficiaire ne cotise pas son
  // propre tour -> pot ≈ montant × (nb membres actifs − 1)).
  const potAttendu = fc?.est_beneficiaire && fMembers.length > 1
    ? Number(fc.montant_cotisation || 0) * (fMembers.length - 1)
    : 0;
  const aRecevoir = versementEnAttente > 0 ? versementEnAttente : potAttendu;
  const aRecevoirEstime = versementEnAttente === 0 && potAttendu > 0;

  const activite = [
    ...cotisations.map((c) => ({ ...c, t: 'cotisation' })),
    ...versements.map((v) => ({ ...v, t: 'versement' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="relative isolate">

      <div className="relative z-10 space-y-8">
        {/* En-tête */}
        <div>
          <p className="text-sm capitalize text-ink-soft">{DATE_FR}</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">Bonjour {user?.prenom} </h1>
            <span className={`pill ${role.c}`}>{role.l}</span>
          </div>
        </div>

        {/* ===== BENTO GRID ===== */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          variants={bentoContainer} initial="hidden" animate="show"
        >
          {/* Grande cellule : cycle en cours + Cercle de Rotation interactif */}
          <motion.div variants={bentoCell} className="col-span-2 lg:col-span-2 lg:row-span-2">
            {showFeatured ? (
              <div className="card flex h-full flex-col overflow-hidden">
                <div className="flex justify-center border-b border-line bg-surface-alt/40 py-6">
                  <RotationRing
                    members={fRing}
                    progress={Math.min(fc.numero_periode / Math.max(fRing.length, 1), 1)}
                    beneficiaryIndex={fBenefIdx}
                    centerLabel="Tour" centerValue={`${fc.numero_periode}/${fRing.length}`}
                    size={200} interactive
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs uppercase tracking-wide text-primary">Tour en cours</p>
                  <h3 className="text-lg font-semibold text-ink">{fg.nom}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
                    <Crown size={14} className="text-gold" />
                    Bénéficiaire : <b className="text-ink">{fc.beneficiaire ? `${fc.beneficiaire.prenom} ${fc.beneficiaire.nom}` : '—'}</b>
                    {fc.est_beneficiaire && "(c'est vous)"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Votre cotisation :</span> <StatusPill status={fc.ma_cotisation_statut} />
                  </div>
                  <p className="mt-2 text-xs text-ink-faint">Astuce : touchez un avatar du cercle pour voir son statut.</p>
                  <Link to={`/groupes/${fg.id}`} className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary">
                    Voir la tontine <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card flex h-full flex-col items-center justify-center p-6 text-center">
                <EmptyState icon=""title="Aucun cycle en cours"
                  message="Démarrez une tontine pour voir le Cercle de Rotation s'animer ici."
                  action={<Link to="/groupes/nouveau" className="btn-primary">Créer une tontine</Link>} />
              </div>
            )}
          </motion.div>

          {/* Épargne validée — cellule héro (dégradé) */}
          <motion.div variants={bentoCell} className="col-span-2 overflow-hidden rounded-sheet bg-hero p-5 text-white shadow-raised">
            <p className="text-sm text-white/70">Épargne validée</p>
            <p className="mt-1 font-mono text-3xl font-semibold sm:text-4xl"><AnimatedNumber value={epargne} format={formatFCFA} /></p>
            <div className="mt-4 flex gap-6 border-t border-white/15 pt-3 text-sm">
              <div><p className="text-xs text-white/60">Reçu</p><p className="font-mono font-semibold"><AnimatedNumber value={recu} format={formatFCFA} /></p></div>
              <div className="border-l border-white/15 pl-6"><p className="text-xs text-white/60">Tontines</p><p className="font-mono font-semibold"><AnimatedNumber value={groups.length} /></p></div>
            </div>
          </motion.div>

          {/* Score de fiabilité */}
          <motion.div variants={bentoCell} className="col-span-1 flex flex-col items-center justify-center gap-1 rounded-card border border-line bg-surface p-4 shadow-soft">
            {Number.isFinite(score)
              ? <ScoreGauge score={score} size={92} />
              : <p className="py-4 text-center text-xs text-ink-faint">Score bientôt disponible</p>}
            <Link to="/profil" className="text-xs font-medium text-primary">Détails ›</Link>
          </motion.div>

          {/* À recevoir */}
          <motion.div variants={bentoCell} className="col-span-1 flex flex-col justify-center rounded-card border border-line bg-surface p-4 shadow-soft">
            <div className="mb-1 grid h-9 w-9 place-items-center rounded-full bg-gold-soft text-gold"><CalendarClock size={18} /></div>
            <p className="text-xs text-ink-soft">À recevoir</p>
            <p className="font-mono text-lg font-semibold text-ink"><AnimatedNumber value={aRecevoir} format={formatFCFA} /></p>
            {aRecevoirEstime && <p className="mt-0.5 text-[11px] text-gold">Pot attendu de ton tour</p>}
          </motion.div>
        </motion.div>

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
              <EmptyState icon=""title="Aucune tontine pour l'instant"
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
    </div>
  );
}

/* Squelette de chargement à la forme du bento (plutôt qu'un spinner générique). */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" rounded="rounded-pill" />
        <Skeleton className="h-7 w-56" rounded="rounded-pill" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="col-span-2 h-80 lg:row-span-2" />
        <Skeleton className="col-span-2 h-36 rounded-sheet" />
        <Skeleton className="col-span-1 h-32" />
        <Skeleton className="col-span-1 h-32" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-44" rounded="rounded-pill" />
        <Skeleton className="h-11 w-52" rounded="rounded-pill" />
      </div>
    </div>
  );
}
