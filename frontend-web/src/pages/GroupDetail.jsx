import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CircleDollarSign, Phone, CalendarClock, Crown, Play, Link2, Share2, Check, X,
  LockKeyhole, TriangleAlert, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useGroup, useCurrentCycle, useDashboard, useDeclareContribution, useInvite,
  useStartCycle, useValidateMember, useCloseCycle, formatFCFA,
} from '../lib/queries';
import { Loading, EmptyState, StatusPill, Avatar, ProgressBar, Modal, Field, Toast, Spinner } from '../components/ui';
import { CONTRIB_STATUS, GROUP_STATUS, scoreBadge } from '../lib/status';

const MEMBER_STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-gold-soft text-gold' },
  valide: { label: 'Validé', cls: 'bg-success-soft text-success' },
  actif: { label: 'Actif', cls: 'bg-success-soft text-success' },
  refuse: { label: 'Refusé', cls: 'bg-danger-soft text-danger' },
};

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroup(id);
  const { data: cycle } = useCurrentCycle(id);
  const invite = useInvite(id);
  const startCycle = useStartCycle(id);
  const validateMember = useValidateMember(id);
  const [toast, setToast] = useState(null);
  const [code, setCode] = useState(null);
  const [declareOpen, setDeclareOpen] = useState(false);

  if (isLoading || !group) return <Loading />;

  const isAdmin = user?.id === group.admin_id;
  const membres = group.adhesions ?? [];
  const st = GROUP_STATUS[group.statut] ?? GROUP_STATUS.ouvert;

  const onInvite = async () => {
    try { const r = await invite.mutateAsync(); setCode(r.code); } catch (e) { setToast(e.response?.data?.message ?? 'Erreur'); }
  };
  const share = async () => {
    const msg = `Rejoignez ma tontine « ${group.nom} » sur TontineSecure avec le code : ${code}`;
    try { if (navigator.share) await navigator.share({ text: msg }); else { await navigator.clipboard.writeText(code); setToast('Code copié !'); } } catch { /* annulé */ }
  };
  const onValidate = async (userId, decision) => {
    try { await validateMember.mutateAsync({ userId, decision }); setToast(decision === 'valide' ? 'Membre validé.' : 'Adhésion refusée.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
  };
  const onStart = async () => {
    try { await startCycle.mutateAsync(); setToast('Cycle démarré ! Ordre de rotation généré.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Démarrage impossible.'); }
  };

  return (
    <div className="space-y-6">
      <Link to="/groupes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary"><ArrowLeft size={16} /> Mes tontines</Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">{group.nom}</h1>
        {isAdmin && <span className="pill bg-primary-soft text-primary"><Crown size={13} /> Admin</span>}
        <span className={`pill ${st.cls}`}>{st.label}</span>
      </div>
      {group.description && <p className="-mt-3 text-sm text-ink-soft">{group.description}</p>}

      {/* Infos financières */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-card bg-primary-soft text-primary"><CircleDollarSign size={20} /></div>
          <div>
            <p className="text-xs text-ink-soft">Cotisation par tour</p>
            <p className="font-mono text-2xl font-semibold text-ink">{formatFCFA(group.montant_cotisation)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[group.type, group.frequence, `pénalité ${group.penalite_pourcentage}%`, `grâce ${group.delai_grace_jours} j`].map((t) => (
            <span key={t} className="pill bg-surface-alt capitalize text-ink-soft">{t}</span>
          ))}
        </div>
      </div>

      {/* Cycle en cours — clarté du parcours */}
      {group.statut === 'en_cours' && cycle && (
        <CycleCard cycle={cycle} groupId={id} onDeclare={() => setDeclareOpen(true)} />
      )}

      {/* Tableau de bord admin */}
      {isAdmin && group.statut === 'en_cours' && cycle && (
        <AdminDashboard cycleId={cycle.id} groupId={id} onToast={setToast} />
      )}

      {/* Actions admin — groupe ouvert */}
      {isAdmin && group.statut === 'ouvert' && (
        <div className="card space-y-4 p-5">
          <div className="rounded-card bg-surface-alt p-4 text-sm text-ink-soft">
            <p className="mb-1 font-semibold text-ink">Ajouter des membres</p>
            1. Générez un code. 2. Partagez-le à des personnes ayant un compte <b>KYC vérifié</b>.
            3. Elles le saisissent dans « Rejoindre ». 4. Vous validez leur demande ci-dessous.
            <p className="mt-2 text-xs text-ink-faint">Capacité : {membres.filter((m) => m.statut === 'actif').length}/{group.nb_membres_max} membres actifs.</p>
          </div>
          {!code ? (
            <button className="btn-secondary w-full" onClick={onInvite} disabled={invite.isPending}>
              {invite.isPending ? <Spinner className="h-5 w-5" /> : <><Link2 size={18} /> Générer un code d'invitation</>}
            </button>
          ) : (
            <div className="rounded-card border border-line p-4 text-center">
              <p className="label">Code d'invitation (valable 7 jours)</p>
              <p className="my-2 font-mono text-2xl font-semibold tracking-widest text-primary">{code}</p>
              <button className="btn-primary w-full" onClick={share}><Share2 size={18} /> Partager le code</button>
            </div>
          )}
          <button className="btn-primary w-full" onClick={onStart} disabled={startCycle.isPending}>
            {startCycle.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><Play size={18} /> Démarrer le cycle</>}
          </button>
        </div>
      )}

      {/* Membres */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Membres ({membres.length})</h2>
          <Link to="/litiges" className="inline-flex items-center gap-1 text-sm font-medium text-danger"><TriangleAlert size={15} /> Signaler un litige</Link>
        </div>
        {membres.length === 0 ? (
          <div className="card"><EmptyState icon="👤" title="Aucun membre" message="Invitez des membres avec un code." /></div>
        ) : (
          <div className="space-y-2">
            {membres.map((m) => {
              const ms = MEMBER_STATUS[m.statut] ?? MEMBER_STATUS.en_attente;
              const nom = `${m.user?.prenom ?? ''} ${m.user?.nom ?? ''}`.trim() || m.user?.telephone;
              const isBenef = cycle && m.user_id === cycle.beneficiaire?.id;
              const score = m.user?.score_fiabilite;
              const sb = score != null ? scoreBadge(score) : null;
              return (
                <div key={m.id ?? m.user_id} className="card flex items-center gap-3 p-3">
                  <Avatar name={nom} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium text-ink">{nom}{isBenef && <Crown size={14} className="text-gold" />}</p>
                    <div className="flex items-center gap-3 text-xs text-ink-faint">
                      {m.ordre_rotation ? <span>Ordre {m.ordre_rotation}</span> : <span>{m.user?.telephone}</span>}
                      {sb && <span>· Score {Number(score).toFixed(0)}%</span>}
                    </div>
                  </div>
                  {isAdmin && m.statut === 'en_attente' ? (
                    <div className="flex gap-2">
                      <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => onValidate(m.user_id, 'valide')}><Check size={15} /> Valider</button>
                      <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => onValidate(m.user_id, 'refuse')}><X size={15} /></button>
                    </div>
                  ) : (
                    <span className={`pill ${ms.cls}`}>{ms.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {declareOpen && cycle && (
        <DeclareModal cycle={cycle} groupId={id} onClose={() => setDeclareOpen(false)} onDone={(msg) => { setDeclareOpen(false); setToast(msg); }} />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

/** Carte « cycle en cours » : bénéficiaire explicite + MON état de cotisation. */
function CycleCard({ cycle, onDeclare }) {
  const benef = cycle.beneficiaire;
  const monStatut = cycle.ma_cotisation_statut; // beneficiaire | a_payer | declare_paye | valide | litige
  const s = CONTRIB_STATUS[monStatut] ?? CONTRIB_STATUS.a_payer;

  return (
    <div className="overflow-hidden rounded-sheet bg-night p-6 text-white shadow-raised">
      <p className="text-sm text-white/70">Tour n°{cycle.numero_periode} · bénéficiaire</p>
      <div className="mt-2 flex items-center gap-3">
        <Avatar name={benef ? `${benef.prenom} ${benef.nom}` : '?'} size={46} />
        <div>
          <p className="text-lg font-semibold">{benef ? `${benef.prenom} ${benef.nom}` : '—'}{cycle.est_beneficiaire && ' — c\'est vous 🎉'}</p>
          {benef?.telephone && <p className="flex items-center gap-1 text-sm text-white/70"><Phone size={13} /> {benef.telephone}</p>}
        </div>
      </div>

      <div className="mt-5 rounded-card bg-white/10 p-4">
        {cycle.est_beneficiaire ? (
          <p className="text-sm">Vous recevez les fonds ce tour-ci. Confirmez chaque paiement reçu dans <b>Notifications</b>.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/60">Votre cotisation pour ce tour</p>
              <p className="mt-1"><span className={`pill ${s.cls}`}>{s.label}</span></p>
            </div>
            {['a_payer', 'en_attente', 'litige'].includes(monStatut) && (
              <button className="btn bg-white font-semibold text-primary hover:bg-white/90" onClick={onDeclare}>
                <CircleDollarSign size={18} /> Déclarer {formatFCFA(cycle.montant_cotisation)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ cycleId, groupId, onToast }) {
  const { data, isLoading } = useDashboard(cycleId);
  const closeCycle = useCloseCycle(groupId);
  if (isLoading || !data) return <div className="card p-5"><Spinner /></div>;

  const onClose = async () => {
    try { await closeCycle.mutateAsync(cycleId); onToast('Cycle clôturé. Versement au bénéficiaire en cours.'); }
    catch (e) { onToast(e.response?.data?.message ?? 'Clôture impossible.'); }
  };

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Tableau de bord (admin)</h2>
        <span className="font-mono font-semibold text-success">{data.taux_collecte}% collecté</span>
      </div>
      <ProgressBar value={(data.taux_collecte ?? 0) / 100} />
      <div className="mt-4 space-y-2">
        {data.membres.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 border-b border-line pb-2 last:border-0">
            <Avatar name={m.nom} size={34} />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{m.nom}</p>
              <p className="text-xs text-ink-faint">{m.est_beneficiaire ? 'Bénéficiaire du tour' : `Ordre ${m.ordre_rotation ?? '—'}`}</p>
            </div>
            <StatusPill status={m.est_beneficiaire ? 'beneficiaire' : m.statut} />
          </div>
        ))}
      </div>
      <button className="btn-primary mt-4 w-full" disabled={!data.peut_cloturer || closeCycle.isPending} onClick={onClose}>
        <LockKeyhole size={18} /> Clôturer le cycle
      </button>
      {!data.peut_cloturer && <p className="mt-2 text-center text-xs text-ink-faint">La clôture exige que toutes les cotisations soient validées (RG-08).</p>}
    </div>
  );
}

function DeclareModal({ cycle, groupId, onClose, onDone }) {
  const declare = useDeclareContribution(cycle.id, groupId);
  const [methode, setMethode] = useState('wave');
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState(null);
  const benef = cycle.beneficiaire;

  const submit = async () => {
    setErreur(null);
    if (!reference.trim()) return setErreur('La référence de transaction est obligatoire.');
    try { await declare.mutateAsync({ methode_paiement: methode, reference_transaction: reference.trim() }); onDone('Cotisation déclarée. En attente de validation du bénéficiaire.'); }
    catch (e) { setErreur(e.response?.data?.message ?? 'Déclaration impossible.'); }
  };

  return (
    <Modal open onClose={onClose} title="Déclarer ma cotisation"
      actions={<>
        <button className="btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={submit} disabled={declare.isPending}>{declare.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Déclarer le paiement'}</button>
      </>}>
      <div className="rounded-card bg-surface-alt p-4">
        <p className="text-xs text-ink-soft">Montant à transférer à {benef ? `${benef.prenom} ${benef.nom}` : 'le bénéficiaire'}{benef?.telephone ? ` (${benef.telephone})` : ''}</p>
        <p className="font-mono text-xl font-semibold text-ink">{formatFCFA(cycle.montant_cotisation)}</p>
      </div>
      <p className="my-3 text-xs text-ink-soft">Effectuez le transfert Mobile Money, puis saisissez la référence reçue par SMS. Le bénéficiaire la validera.</p>
      <Field label="Méthode">
        <div className="flex gap-2 rounded-pill bg-surface-alt p-1">
          {[['wave', 'Wave'], ['orange_money', 'Orange Money'], ['mock', 'Test']].map(([v, l]) => (
            <button key={v} onClick={() => setMethode(v)} className={`flex-1 rounded-pill py-1.5 text-xs font-medium ${methode === v ? 'bg-primary text-white' : 'text-ink-soft'}`}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="Référence de transaction (SMS)" error={erreur}>
        <input className="input font-mono uppercase" placeholder="Ex. WV-8H2K3P" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
    </Modal>
  );
}
