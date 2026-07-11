import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CircleDollarSign, Phone, Crown, Play, Link2, Share2, Check, X,
  TriangleAlert, ArrowLeft, Dices, Upload, PiggyBank, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useGroup, useCurrentCycle, useDashboard, useDeclareContribution, useInvite,
  useStartCycle, useValidateMember, useCloseCycle, useDrawCycle, useAdvanceCycle,
  useSettleGroup, useValidateContribution, useDisputeContribution, formatFCFA,
} from '../lib/queries';
import { Loading, EmptyState, StatusPill, Avatar, ProgressBar, Modal, Field, Toast, Spinner } from '../components/ui';
import { Stagger, StaggerItem } from '../components/motion';
import { CycleCompleteMotion } from '../components/celebrations';
import { CONTRIB_STATUS, GROUP_STATUS, scoreBadge } from '../lib/status';
import RotationRing from '../components/RotationRing';

const MEMBER_STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-gold-soft text-gold' },
  valide: { label: 'Validé', cls: 'bg-success-soft text-success' },
  actif: { label: 'Actif', cls: 'bg-success-soft text-success' },
  refuse: { label: 'Refusé', cls: 'bg-danger-soft text-danger' },
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

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
  const [cycleClosed, setCycleClosed] = useState(false);

  if (isLoading || !group) return <Loading />;

  const isAdmin = user?.id === group.admin_id;
  const isAccu = group.type === 'accumulative';
  const membres = group.adhesions ?? [];
  const st = GROUP_STATUS[group.statut] ?? GROUP_STATUS.ouvert;

  // Cercle : membres actifs (plus d'ordre pre-etabli). Le gagnant n'est mis en
  // avant qu'apres le tirage au sort.
  const actifs = membres.filter((m) => m.statut === 'actif');
  const ringMembers = actifs.map((m) => ({
    name: `${m.user?.prenom ?? ''} ${m.user?.nom ?? ''}`.trim() || m.user?.telephone || '?',
    isYou: m.user_id === user?.id,
    status: m.user_id === user?.id ? cycle?.ma_cotisation_statut : undefined,
  }));
  const tirageFait = !!cycle?.tirage_effectue;
  const benefIdx = tirageFait ? Math.max(actifs.findIndex((m) => m.user_id === cycle.beneficiaire?.id), 0) : -1;
  const potTotal = Number(group.montant_cotisation || 0) * Math.max(actifs.length, 1);

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
    try {
      await startCycle.mutateAsync();
      setToast(isAccu ? 'Épargne démarrée. Les membres peuvent déposer.' : 'Collecte démarrée. Le bénéficiaire sera tiré au sort après validation.');
    } catch (e) { setToast(e.response?.data?.message ?? 'Démarrage impossible.'); }
  };

  return (
    <div className="relative isolate">
      <div className="relative z-10 space-y-6">
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
          <div className="grid h-11 w-11 place-items-center rounded-card bg-primary-soft text-primary">
            {isAccu ? <PiggyBank size={20} /> : <CircleDollarSign size={20} />}
          </div>
          <div>
            <p className="text-xs text-ink-soft">{isAccu ? 'Dépôt par période' : 'Cotisation par tour'}</p>
            <p className="font-mono text-2xl font-semibold text-ink">{formatFCFA(group.montant_cotisation)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            isAccu ? 'coffre-fort' : 'rotative',
            group.frequence,
            `pénalité ${group.penalite_pourcentage}%`,
            `grâce ${group.delai_grace_jours} j`,
            ...(isAccu && group.date_echeance ? [`échéance ${formatDate(group.date_echeance)}`] : []),
          ].map((t) => (
            <span key={t} className="pill bg-surface-alt capitalize text-ink-soft">{t}</span>
          ))}
        </div>
      </div>

      {/* Tour en cours */}
      {group.statut === 'en_cours' && cycle && (
        <CycleCard cycle={cycle} group={group} members={ringMembers} benefIdx={benefIdx} onDeclare={() => setDeclareOpen(true)} />
      )}

      {/* Tableau de bord admin */}
      {isAdmin && group.statut === 'en_cours' && cycle && (
        <AdminDashboard cycleId={cycle.id} groupId={id} isAccu={isAccu} onToast={setToast} onCelebrate={() => setCycleClosed(true)} />
      )}

      {/* Actions admin — groupe ouvert */}
      {isAdmin && group.statut === 'ouvert' && (
        <div className="card space-y-4 p-5">
          <div className="rounded-card bg-surface-alt p-4 text-sm text-ink-soft">
            <p className="mb-1 font-semibold text-ink">Ajouter des membres</p>
            1. Générez un code. 2. Partagez-le à des personnes ayant un compte <b>KYC vérifié</b>.
            3. Elles le saisissent dans « Rejoindre ». 4. Vous validez leur demande ci-dessous.
            <p className="mt-2 text-xs text-ink-faint">Capacité : {actifs.length}/{group.nb_membres_max} membres actifs.</p>
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
            {startCycle.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><Play size={18} /> {isAccu ? "Démarrer l'épargne" : 'Démarrer la collecte'}</>}
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
          <div className="card"><EmptyState icon=""title="Aucun membre"message="Invitez des membres avec un code."/></div>
        ) : (
          <Stagger className="space-y-2">
            {membres.map((m) => {
              const ms = MEMBER_STATUS[m.statut] ?? MEMBER_STATUS.en_attente;
              const nom = `${m.user?.prenom ?? ''} ${m.user?.nom ?? ''}`.trim() || m.user?.telephone;
              const isBenef = tirageFait && m.user_id === cycle?.beneficiaire?.id;
              const score = m.user?.score_fiabilite;
              const sb = score != null ? scoreBadge(score) : null;
              return (
                <StaggerItem key={m.id ?? m.user_id} className="card flex items-center gap-3 p-3">
                  <Avatar name={nom} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium text-ink">{nom}{isBenef && <Crown size={14} className="text-gold" />}</p>
                    <div className="flex items-center gap-3 text-xs text-ink-faint">
                      <span>{m.user?.telephone}</span>
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
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </section>

      {declareOpen && cycle && (
        <DeclareModal cycle={cycle} group={group} groupId={id} onClose={() => setDeclareOpen(false)} onDone={(msg) => { setDeclareOpen(false); setToast(msg); }} />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
      <CycleCompleteMotion open={cycleClosed} total={potTotal} format={formatFCFA} onDone={() => setCycleClosed(false)} />
      </div>
    </div>
  );
}

/** Carte « tour en cours » : cercle des membres + état de collecte + MON état. */
function CycleCard({ cycle, group, members = [], benefIdx = -1, onDeclare }) {
  const isAccu = group.type === 'accumulative';
  const benef = cycle.beneficiaire;
  const tirageFait = !!cycle.tirage_effectue;
  const monStatut = cycle.ma_cotisation_statut; // a_payer | declare_paye | valide | litige
  const s = CONTRIB_STATUS[monStatut] ?? CONTRIB_STATUS.a_payer;
  const n = Math.max(members.length, 1);
  const progress = Math.min((cycle.numero_periode ?? 1) / n, 1);
  const peutDeclarer = ['a_payer', 'en_attente', 'litige'].includes(monStatut) && !(!isAccu && tirageFait);

  return (
    <div className="card overflow-hidden">
      {members.length > 0 && (
        <div className="flex flex-col items-center border-b border-line bg-surface-alt/40 py-6">
          <RotationRing
            members={members}
            progress={isAccu ? 0 : progress}
            beneficiaryIndex={benefIdx}
            centerLabel={isAccu ? 'Période' : 'Tour'}
            centerValue={isAccu ? `${cycle.numero_periode}` : `${cycle.numero_periode}/${n}`}
            size={280}
            interactive
          />
        </div>
      )}

      <div className="p-5">
        {/* Bandeau contextuel selon le type / l'etat */}
        {isAccu ? (
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-card bg-primary-soft text-primary"><CalendarClock size={20} /></div>
            <div>
              <p className="text-xs text-ink-soft">Épargne coffre-fort — restitution à l'échéance</p>
              <p className="font-semibold text-ink">{formatDate(group.date_echeance)}</p>
              <p className="text-xs text-ink-faint">Chaque membre récupérera exactement le total de ses propres dépôts.</p>
            </div>
          </div>
        ) : tirageFait ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={benef ? `${benef.prenom} ${benef.nom}` : '?'} size={46} />
              <Crown size={16} className="absolute -right-1 -top-1 text-gold" fill="#C6974F" />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Bénéficiaire tiré au sort — tour n°{cycle.numero_periode}</p>
              <p className="font-semibold text-ink">{benef ? `${benef.prenom} ${benef.nom}` : '—'}{cycle.est_beneficiaire && ' — c\'est vous'}</p>
              {benef?.telephone && <p className="flex items-center gap-1 text-xs text-ink-faint"><Phone size={12} /> {benef.telephone}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-card bg-gold-soft text-gold"><Dices size={20} /></div>
            <div>
              <p className="text-xs text-ink-soft">Collecte du tour n°{cycle.numero_periode}</p>
              <p className="font-semibold text-ink">Bénéficiaire tiré au sort après la collecte</p>
              <p className="text-xs text-ink-faint">Le gagnant reste inconnu tant que toutes les cotisations ne sont pas validées.</p>
            </div>
          </div>
        )}

        {/* Mon état pour ce tour */}
        <div className="mt-4 rounded-card bg-surface-alt p-4">
          {!isAccu && cycle.est_beneficiaire ? (
            <p className="text-sm text-ink-soft">Vous avez été tiré au sort : vous recevez le pot de ce tour. L'administrateur vous transfère les fonds et téléverse le reçu.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink-soft">{isAccu ? 'Votre dépôt pour cette période' : 'Votre cotisation pour ce tour'}</p>
                <p className="mt-1"><span className={`pill ${s.cls}`}>{s.label}</span></p>
              </div>
              {peutDeclarer && (
                <button className="btn-primary" onClick={onDeclare}>
                  <CircleDollarSign size={18} /> {isAccu ? 'Déposer' : 'Déclarer'} {formatFCFA(cycle.montant_cotisation)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ cycleId, groupId, isAccu, onToast, onCelebrate }) {
  const { data, isLoading } = useDashboard(cycleId);
  const validate = useValidateContribution(cycleId, groupId);
  const dispute = useDisputeContribution(cycleId);
  const draw = useDrawCycle(groupId);
  const closeCycle = useCloseCycle(groupId);
  const advance = useAdvanceCycle(groupId);
  const settle = useSettleGroup(groupId);
  const fileRef = useRef(null);
  const [contestId, setContestId] = useState(null);
  if (isLoading || !data) return <div className="card p-5"><Spinner /></div>;

  const onValidate = async (contributionId) => {
    try { await validate.mutateAsync(contributionId); onToast('Cotisation validée.'); }
    catch (e) { onToast(e.response?.data?.message ?? 'Validation impossible.'); }
  };
  const onDraw = async () => {
    try { const c = await draw.mutateAsync(cycleId); onToast(`Tirage : ${c.beneficiaire?.prenom} ${c.beneficiaire?.nom} reçoit le pot.`); }
    catch (e) { onToast(e.response?.data?.message ?? 'Tirage impossible.'); }
  };
  const onPickRecu = (e) => {
    const recu = e.target.files?.[0];
    e.target.value = '';
    if (!recu) return;
    closeCycle.mutate({ cycleId, recu }, {
      onSuccess: () => onCelebrate?.(),
      onError: (err) => onToast(err.response?.data?.message ?? 'Clôture impossible.'),
    });
  };
  const onAdvance = async () => {
    try { await advance.mutateAsync(cycleId); onToast('Période clôturée. Période suivante ouverte.'); }
    catch (e) { onToast(e.response?.data?.message ?? 'Action impossible.'); }
  };
  const onSettle = async () => {
    if (!window.confirm("Restituer à chaque membre le total de ses versements ? Cela clôture l'épargne.")) return;
    try { const p = await settle.mutateAsync(); onToast(`Restitution effectuée : ${p.length} membre(s) remboursé(s).`); }
    catch (e) { onToast(e.response?.data?.message ?? 'Restitution impossible.'); }
  };

  const busy = draw.isPending || closeCycle.isPending || advance.isPending || settle.isPending;

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Tableau de bord (admin)</h2>
        <span className="font-mono font-semibold text-success">{data.taux_collecte}% validé</span>
      </div>
      <ProgressBar value={(data.taux_collecte ?? 0) / 100} />

      <Stagger className="mt-4 space-y-2">
        {data.membres.map((m) => (
          <StaggerItem key={m.user_id} className="flex items-center gap-3 border-b border-line pb-2 last:border-0">
            <Avatar name={m.nom} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{m.nom}</p>
              {m.reference_transaction && <p className="truncate font-mono text-xs text-ink-faint">Réf. {m.reference_transaction}</p>}
            </div>
            {m.statut === 'declare_paye' ? (
              <div className="flex gap-2">
                <button className="btn-primary px-3 py-1.5 text-xs" disabled={validate.isPending} onClick={() => onValidate(m.contribution_id)}><Check size={14} /> Valider</button>
                <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => setContestId(m.contribution_id)}><X size={14} /></button>
              </div>
            ) : (
              <StatusPill status={m.statut} />
            )}
          </StaggerItem>
        ))}
      </Stagger>

      {/* Actions de fin de tour selon le type et l'etat */}
      <div className="mt-5 space-y-2">
        {isAccu ? (
          <>
            <button className="btn-secondary w-full" disabled={!data.peut_avancer || busy} onClick={onAdvance}>
              <CalendarClock size={18} /> Clôturer la période
            </button>
            <button className="btn-primary w-full" disabled={busy} onClick={onSettle}>
              <PiggyBank size={18} /> Restituer à l'échéance
            </button>
            {!data.peut_avancer && <p className="text-center text-xs text-ink-faint">La période se clôture une fois tous les dépôts validés. La restitution rembourse chaque membre de ses propres versements.</p>}
          </>
        ) : data.tirage_effectue ? (
          <>
            <div className="rounded-card bg-primary-soft/60 p-3 text-center text-sm text-primary">
              Bénéficiaire tiré : <b>{data.beneficiaire?.prenom} {data.beneficiaire?.nom}</b>. Transférez-lui le pot puis téléversez le reçu.
            </div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPickRecu} />
            <button className="btn-primary w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
              {closeCycle.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><Upload size={18} /> Téléverser le reçu et clôturer</>}
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary w-full" disabled={!data.peut_tirer || busy} onClick={onDraw}>
              {draw.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><Dices size={18} /> Lancer le tirage au sort</>}
            </button>
            {!data.peut_tirer && <p className="text-center text-xs text-ink-faint">Le tirage se débloque une fois <b>toutes</b> les cotisations validées (100 %).</p>}
          </>
        )}
      </div>

      {contestId && (
        <ContestModal
          onClose={() => setContestId(null)}
          onSubmit={async (description) => {
            try { await dispute.mutateAsync({ contributionId: contestId, description }); onToast('Litige ouvert.'); setContestId(null); }
            catch (e) { onToast(e.response?.data?.message ?? 'Action impossible.'); }
          }}
          pending={dispute.isPending}
        />
      )}
    </div>
  );
}

function ContestModal({ onClose, onSubmit, pending }) {
  const [motif, setMotif] = useState('');
  const [erreur, setErreur] = useState(null);
  return (
    <Modal open onClose={onClose} title="Contester ce dépôt"
      actions={<>
        <button className="btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn-danger" disabled={pending} onClick={() => { if (!motif.trim()) return setErreur('Indiquez le motif.'); onSubmit(motif.trim()); }}>
          {pending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Ouvrir le litige'}
        </button>
      </>}>
      <p className="mb-3 text-sm text-ink-soft">Le dépôt déclaré est introuvable ? Ouvrez un litige : le membre concerné sera gelé le temps de l'investigation.</p>
      <Field label="Motif" error={erreur}>
        <textarea className="input min-h-[90px]" placeholder="Ex. Aucun dépôt retrouvé sur le compte de collecte." value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Field>
    </Modal>
  );
}

function DeclareModal({ cycle, group, groupId, onClose, onDone }) {
  const declare = useDeclareContribution(cycle.id, groupId);
  const isAccu = group.type === 'accumulative';
  const [methode, setMethode] = useState('wave');
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState(null);

  const submit = async () => {
    setErreur(null);
    if (!reference.trim()) return setErreur('La référence de transaction est obligatoire.');
    try {
      await declare.mutateAsync({ methode_paiement: methode, reference_transaction: reference.trim() });
      onDone('Déclaration envoyée. En attente de validation de l\'administrateur.');
    } catch (e) { setErreur(e.response?.data?.message ?? 'Déclaration impossible.'); }
  };

  return (
    <Modal open onClose={onClose} title={isAccu ? 'Déposer mon épargne' : 'Déclarer ma cotisation'}
      actions={<>
        <button className="btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={submit} disabled={declare.isPending}>{declare.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Envoyer la déclaration'}</button>
      </>}>
      <div className="rounded-card bg-surface-alt p-4">
        <p className="text-xs text-ink-soft">{isAccu ? 'Montant à déposer' : 'Montant à verser dans le pot'}</p>
        <p className="font-mono text-xl font-semibold text-ink">{formatFCFA(cycle.montant_cotisation)}</p>
      </div>
      <p className="my-3 text-xs text-ink-soft">Effectuez le transfert Mobile Money, puis saisissez la référence reçue par SMS. <b className="text-ink">L'administrateur</b> vérifiera le dépôt réel et validera votre cotisation.</p>
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
