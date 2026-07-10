import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useDisputes, useCreateDispute, useGroups } from '../lib/queries';
import { DISPUTE_STATUS } from '../lib/status';
import { Loading, EmptyState, Modal, Toast, Spinner } from '../components/ui';
import { Stagger, StaggerItem } from '../components/motion';

export default function Disputes() {
  const { data: disputes, isLoading } = useDisputes();
  const { data: groups } = useGroups();
  const create = useCreateDispute();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [desc, setDesc] = useState('');
  const [toast, setToast] = useState(null);

  if (isLoading) return <Loading />;
  const list = disputes ?? [];
  const mesGroupes = groups ?? [];

  const submit = async () => {
    if (!groupId || !desc.trim()) return setToast('Choisissez un groupe et décrivez le problème.');
    try { await create.mutateAsync({ group_id: Number(groupId), description: desc.trim() }); setOpen(false); setDesc(''); setToast('Litige signalé. L\'administrateur a été notifié.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Signalement impossible.'); }
  };

  return (
    <div className="relative isolate space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Litiges</h1>
        <button className="btn-danger" onClick={() => setOpen(true)}><TriangleAlert size={18} /> Signaler</button>
      </div>

      {list.length === 0 ? (
        <div className="card"><EmptyState icon=""title="Aucun litige"message="Vos signalements et leur suivi apparaîtront ici."/></div>
      ) : (
        <Stagger className="space-y-3">
          {list.map((d) => {
            const s = DISPUTE_STATUS[d.statut] ?? DISPUTE_STATUS.ouvert;
            return (
              <StaggerItem key={d.id} className="card space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{d.group?.nom ?? 'Groupe'}</p>
                    <p className="text-xs text-ink-faint">{d.concerne ? `Concerne ${d.concerne.prenom} ${d.concerne.nom}` : `Signalé par ${d.signaleur?.prenom ?? '—'}`}</p>
                  </div>
                  <span className={`pill ${s.cls}`}>{s.label}</span>
                </div>
                <p className="text-sm text-ink-soft">{d.description}</p>
                {d.resolution && <p className="text-xs text-success">Décision : {d.resolution}</p>}
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Signaler un litige"
        actions={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button className="btn-danger" onClick={submit} disabled={create.isPending}>{create.isPending ? <Spinner className="h-5 w-5" /> : 'Envoyer'}</button>
        </>}>
        <label className="label">Groupe concerné</label>
        <select className="input mb-3" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">— Choisir —</option>
          {mesGroupes.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
        </select>
        <label className="label">Description</label>
        <textarea className="input min-h-[90px]" placeholder="Ex. Je n'ai reçu aucun virement de ce membre." value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
