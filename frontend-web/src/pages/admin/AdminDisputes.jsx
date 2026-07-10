import { useState } from 'react';
import { Gavel, Search } from 'lucide-react';
import { useDisputes, useInvestigateDispute, useResolveDispute } from '../../lib/queries';
import { DISPUTE_STATUS } from '../../lib/status';
import { Loading, EmptyState, Modal, Toast, Spinner } from '../../components/ui';
import AmbientMesh from '../../components/AmbientMesh';

export default function AdminDisputes() {
  const { data: disputes, isLoading } = useDisputes();
  const investigate = useInvestigateDispute();
  const resolve = useResolveDispute();
  const [toast, setToast] = useState(null);
  const [target, setTarget] = useState(null);
  const [resolution, setResolution] = useState('');
  const [liberer, setLiberer] = useState(true);
  const [valider, setValider] = useState(false);

  if (isLoading) return <Loading />;
  const list = disputes ?? [];

  const onInvestigate = async (id) => {
    try { await investigate.mutateAsync(id); setToast('Litige en investigation. Compte concerné gelé.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
  };
  const submitResolve = async () => {
    if (!resolution.trim()) return;
    try { await resolve.mutateAsync({ id: target.id, resolution: resolution.trim(), liberer_compte: liberer, valider_cotisation: valider }); setToast('Litige clôturé.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
    finally { setTarget(null); setResolution(''); setLiberer(true); setValider(false); }
  };

  return (
    <div className="relative isolate space-y-6">
      <AmbientMesh variant="soft" />
      <h1 className="text-2xl font-semibold text-ink">Litiges — arbitrage</h1>
      {list.length === 0 ? (
        <div className="card"><EmptyState icon="⚖️" title="Aucun litige" message="Les signalements à arbitrer apparaîtront ici." /></div>
      ) : (
        <div className="space-y-3">
          {list.map((d) => {
            const s = DISPUTE_STATUS[d.statut] ?? DISPUTE_STATUS.ouvert;
            return (
              <div key={d.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{d.group?.nom ?? 'Groupe'}</p>
                    <p className="text-xs text-ink-faint">{d.concerne ? `Concerne ${d.concerne.prenom} ${d.concerne.nom}` : `Signalé par ${d.signaleur?.prenom ?? '—'}`}</p>
                  </div>
                  <span className={`pill ${s.cls}`}>{s.label}</span>
                </div>
                <p className="text-sm text-ink-soft">{d.description}</p>
                {d.resolution && <p className="text-xs text-success">Décision : {d.resolution}</p>}
                {d.statut !== 'clos' && (
                  <div className="flex gap-2">
                    {d.statut === 'ouvert' && <button className="btn-secondary flex-1 py-2 text-sm" onClick={() => onInvestigate(d.id)} disabled={investigate.isPending}><Search size={16} /> Investiguer</button>}
                    <button className="btn-primary flex-1 py-2 text-sm" onClick={() => setTarget(d)}><Gavel size={16} /> Clôturer</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title="Clôturer le litige"
        actions={<>
          <button className="btn-ghost" onClick={() => setTarget(null)}>Annuler</button>
          <button className="btn-primary" onClick={submitResolve} disabled={!resolution.trim() || resolve.isPending}>{resolve.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Clôturer'}</button>
        </>}>
        <label className="label">Décision / résolution</label>
        <textarea className="input mb-3 min-h-[80px]" value={resolution} onChange={(e) => setResolution(e.target.value)} />
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={liberer} onChange={(e) => setLiberer(e.target.checked)} /> Libérer le compte gelé</label>
        {target?.contribution_id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={valider} onChange={(e) => setValider(e.target.checked)} /> Valider la cotisation contestée</label>}
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
