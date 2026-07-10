import { useState } from 'react';
import { Eye, Check, X } from 'lucide-react';
import api from '../../lib/api';
import { useKycPending, useValidateKyc } from '../../lib/queries';
import { Loading, EmptyState, Avatar, Toast, Spinner } from '../../components/ui';
import { Stagger, StaggerItem } from '../../components/motion';

export default function AdminKyc() {
  const { data: docs, isLoading } = useKycPending();
  const validate = useValidateKyc();
  const [toast, setToast] = useState(null);

  const voir = async (id) => {
    try {
      const res = await api.get(`/kyc/${id}/file`, { responseType: 'blob' });
      window.open(URL.createObjectURL(res.data), '_blank');
    } catch { setToast('Document indisponible (exemple de démo).'); }
  };
  const decider = async (id, decision) => {
    try { await validate.mutateAsync({ id, decision }); setToast(decision === 'valide' ? 'KYC validé.' : 'KYC rejeté.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative isolate space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Vérifications KYC</h1>
      {(docs ?? []).length === 0 ? (
        <div className="card"><EmptyState icon="✅" title="Aucune pièce en attente" message="Toutes les vérifications d'identité sont à jour." /></div>
      ) : (
        <Stagger className="space-y-3">
          {docs.map((d) => {
            const nom = `${d.user?.prenom ?? ''} ${d.user?.nom ?? ''}`.trim();
            return (
              <StaggerItem key={d.id} className="card space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={nom} size={44} />
                  <div className="flex-1"><p className="font-semibold text-ink">{nom}</p><p className="text-xs text-ink-soft">{d.type_document === 'cni' ? "Carte d'identité" : 'Passeport'} · {d.user?.telephone}</p></div>
                  <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => voir(d.id)}><Eye size={15} /> Voir</button>
                </div>
                <div className="flex gap-2">
                  <button className="btn-danger flex-1 py-2 text-sm" onClick={() => decider(d.id, 'rejete')}><X size={16} /> Rejeter</button>
                  <button className="btn-primary flex-1 py-2 text-sm" onClick={() => decider(d.id, 'valide')} disabled={validate.isPending}><Check size={16} /> Valider</button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
