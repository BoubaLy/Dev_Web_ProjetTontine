import { useState } from 'react';
import { Coins, CircleCheck, ShieldAlert, HandCoins, BellRing, Clock, Gavel, BellOff } from 'lucide-react';
import { useNotifications, useConfirmContribution, useDisputeContribution, useMarkRead } from '../lib/queries';
import { Loading, EmptyState, Modal, Toast, Spinner } from '../components/ui';

const META = {
  contribution_declaree: { Icon: Coins, cls: 'bg-gold-soft text-gold' },
  cotisation_validee: { Icon: CircleCheck, cls: 'bg-success-soft text-success' },
  litige_ouvert: { Icon: ShieldAlert, cls: 'bg-danger-soft text-danger' },
  litige_resolu: { Icon: Gavel, cls: 'bg-primary-soft text-primary' },
  versement_recu: { Icon: HandCoins, cls: 'bg-success-soft text-success' },
  rappel_cotisation: { Icon: BellRing, cls: 'bg-primary-soft text-primary' },
  validation_en_retard: { Icon: Clock, cls: 'bg-danger-soft text-danger' },
};

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const confirm = useConfirmContribution();
  const dispute = useDisputeContribution();
  const markRead = useMarkRead();
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [disputeTarget, setDisputeTarget] = useState(null);
  const [motif, setMotif] = useState('');

  if (isLoading) return <Loading />;
  const notifs = data?.notifications ?? [];

  const doConfirm = async () => {
    const t = confirmTarget; setConfirmTarget(null);
    try { await confirm.mutateAsync(t.contributionId); await markRead.mutateAsync(t.notifId); setToast('Réception confirmée ✅ La cotisation est validée.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
  };
  const doDispute = async () => {
    if (!motif.trim()) return;
    const t = disputeTarget; setDisputeTarget(null);
    try { await dispute.mutateAsync({ contributionId: t.contributionId, description: motif.trim() }); await markRead.mutateAsync(t.notifId); setToast('Anomalie signalée, un litige a été ouvert.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
    finally { setMotif(''); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Notifications</h1>

      {notifs.length === 0 ? (
        <div className="card"><EmptyState icon="🔔" title="Aucune notification" message="Les rappels, validations et alertes apparaîtront ici." /></div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const meta = META[n.type] ?? { Icon: BellRing, cls: 'bg-surface-alt text-ink-soft' };
            const Icon = meta.Icon;
            // Les boutons n'apparaissent que si la déclaration est ENCORE à valider (non lue).
            const aValider = n.type === 'contribution_declaree' && !n.lu;
            return (
              <div key={n.id} className={`card p-4 ${!n.lu ? 'border-l-4 border-l-primary' : 'opacity-80'}`}>
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.cls}`}><Icon size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm text-ink">{n.data?.message ?? n.type}</p>
                    <p className="mt-1 text-xs text-ink-faint">{new Date(n.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!n.lu && <button className="text-xs text-ink-faint hover:text-primary" onClick={() => markRead.mutate(n.id)}>Marquer lu</button>}
                </div>
                {aValider && (
                  <div className="mt-3 flex gap-2">
                    <button className="btn-danger flex-1 py-2 text-sm" onClick={() => setDisputeTarget({ contributionId: n.data.contribution_id, notifId: n.id })}>Contester</button>
                    <button className="btn-primary flex-1 py-2 text-sm" onClick={() => setConfirmTarget({ contributionId: n.data.contribution_id, notifId: n.id })}>Confirmer la réception</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Friction volontaire avant l'action financière */}
      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Confirmer la réception ?"
        actions={<>
          <button className="btn-ghost" onClick={() => setConfirmTarget(null)}>Annuler</button>
          <button className="btn-primary" onClick={doConfirm} disabled={confirm.isPending}>{confirm.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : "Oui, j'ai bien reçu"}</button>
        </>}>
        Vérifiez d'abord votre solde Mobile Money réel. Cette action valide définitivement la cotisation.
      </Modal>

      <Modal open={!!disputeTarget} onClose={() => setDisputeTarget(null)} title="Signaler une anomalie"
        actions={<>
          <button className="btn-ghost" onClick={() => setDisputeTarget(null)}>Annuler</button>
          <button className="btn-danger" onClick={doDispute} disabled={!motif.trim() || dispute.isPending}>{dispute.isPending ? <Spinner className="h-5 w-5" /> : 'Signaler'}</button>
        </>}>
        <p className="mb-3">Décrivez le problème (ex. aucun virement reçu). Un litige sera ouvert et le payeur gelé le temps de l'investigation.</p>
        <textarea className="input min-h-[90px]" value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
