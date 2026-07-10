import { useState } from 'react';
import { ShieldCheck, Upload, FileCheck2 } from 'lucide-react';
import { useMyKyc, useUploadKyc } from '../lib/queries';
import { Loading, EmptyState, Toast, Spinner } from '../components/ui';
import AmbientMesh from '../components/AmbientMesh';

const STATUT = {
  en_attente: { label: 'En attente', cls: 'bg-gold-soft text-gold' },
  valide: { label: 'Validé', cls: 'bg-success-soft text-success' },
  rejete: { label: 'Rejeté', cls: 'bg-danger-soft text-danger' },
};

export default function Kyc() {
  const { data: docs, isLoading } = useMyKyc();
  const upload = useUploadKyc();
  const [type, setType] = useState('cni');
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setToast("Sélectionnez d'abord une pièce.");
    const form = new FormData();
    form.append('type_document', type);
    form.append('document', file);
    try { await upload.mutateAsync(form); setFile(null); setToast('Pièce envoyée. En attente de validation.'); }
    catch (err) { setToast(err.response?.data?.message ?? 'Envoi impossible.'); }
  };

  return (
    <div className="relative isolate space-y-6">
      <AmbientMesh variant="soft" />
      <h1 className="text-2xl font-semibold text-ink">Vérification d'identité (KYC)</h1>

      <div className="flex items-center gap-3 rounded-card bg-surface-alt p-4 text-sm text-ink-soft">
        <ShieldCheck size={20} className="text-primary" />
        Déposez une pièce d'identité (CNI ou passeport). Un administrateur la validera. Vos documents restent confidentiels et chiffrés.
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div className="flex gap-2 rounded-pill bg-surface-alt p-1">
          {[['cni', "Carte d'identité"], ['passeport', 'Passeport']].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setType(v)} className={`flex-1 rounded-pill py-1.5 text-sm font-medium ${type === v ? 'bg-primary text-white' : 'text-ink-soft'}`}>{l}</button>
          ))}
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line py-8 text-center">
          {file ? <FileCheck2 size={26} className="text-success" /> : <Upload size={26} className="text-primary" />}
          <span className="text-sm font-medium text-ink">{file ? file.name : 'Choisir une pièce'}</span>
          <span className="text-xs text-ink-faint">JPG, PNG ou PDF · max 5 Mo</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button className="btn-primary w-full" disabled={upload.isPending || !file}>{upload.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><Upload size={18} /> Envoyer pour validation</>}</button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Mes pièces</h2>
        {isLoading ? <Loading /> : (docs ?? []).length === 0 ? (
          <div className="card"><EmptyState icon="🗂️" title="Aucune pièce déposée" message="Ajoutez une pièce ci-dessus pour lancer la vérification." /></div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const s = STATUT[d.statut] ?? STATUT.en_attente;
              return (
                <div key={d.id} className="card flex items-center gap-3 p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-card bg-primary-soft text-primary"><FileCheck2 size={18} /></div>
                  <div className="flex-1"><p className="text-sm font-medium text-ink">{d.type_document === 'cni' ? "Carte d'identité" : 'Passeport'}</p><p className="text-xs text-ink-faint">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p></div>
                  <span className={`pill ${s.cls}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
