import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateGroup } from '../lib/queries';
import { Field, Spinner } from '../components/ui';

const Seg = ({ value, onChange, options }) => (
  <div className="flex gap-2 rounded-pill bg-surface-alt p-1">
    {options.map(([v, l]) => (
      <button type="button" key={v} onClick={() => onChange(v)} className={`flex-1 rounded-pill py-1.5 text-xs font-medium ${value === v ? 'bg-primary text-white' : 'text-ink-soft'}`}>{l}</button>
    ))}
  </div>
);

export default function CreateGroup() {
  const navigate = useNavigate();
  const create = useCreateGroup();
  const [f, setF] = useState({ nom: '', description: '', type: 'rotative', montant_cotisation: '', frequence: 'mensuelle', nb_membres_max: '', penalite_pourcentage: '2', delai_grace_jours: '3', methode_rotation: 'aleatoire' });
  const [erreur, setErreur] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bornes = f.type === 'accumulative' ? '3 à 50' : '5 à 30';

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null);
    try {
      const g = await create.mutateAsync({
        ...f,
        montant_cotisation: Number(f.montant_cotisation),
        nb_membres_max: Number(f.nb_membres_max),
        penalite_pourcentage: Number(f.penalite_pourcentage),
        delai_grace_jours: Number(f.delai_grace_jours),
      });
      navigate(`/groupes/${g.id}`);
    } catch (err) {
      const apiErr = err.response?.data?.errors;
      setErreur(apiErr ? Object.values(apiErr)[0][0] : err.response?.data?.message ?? 'Création impossible.');
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/groupes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary"><ArrowLeft size={16} /> Mes tontines</Link>
      <h1 className="text-2xl font-semibold text-ink">Créer une tontine</h1>

      <form onSubmit={submit} className="card space-y-1 p-6">
        <Field label="Nom du groupe"><input className="input" placeholder="Ex. Tontine des Amis" value={f.nom} onChange={(e) => set('nom', e.target.value)} /></Field>
        <Field label="Description (optionnel)"><textarea className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Type de tontine"><Seg value={f.type} onChange={(v) => set('type', v)} options={[['rotative', 'Rotative'], ['accumulative', 'Accumulative']]} /></Field>
        <Field label="Cotisation par tour (FCFA)"><input className="input font-mono" type="number" value={f.montant_cotisation} onChange={(e) => set('montant_cotisation', e.target.value)} /></Field>
        <Field label="Fréquence"><Seg value={f.frequence} onChange={(v) => set('frequence', v)} options={[['hebdomadaire', 'Hebdomadaire'], ['mensuelle', 'Mensuelle']]} /></Field>
        <Field label="Nombre de membres max" hint={`${bornes} selon le type`}><input className="input" type="number" value={f.nb_membres_max} onChange={(e) => set('nb_membres_max', e.target.value)} /></Field>
        <div className="flex gap-3">
          <Field label="Pénalité (%)" hint="1 à 2,5"><input className="input" type="number" step="0.5" value={f.penalite_pourcentage} onChange={(e) => set('penalite_pourcentage', e.target.value)} /></Field>
          <Field label="Délai de grâce (jours)"><input className="input" type="number" value={f.delai_grace_jours} onChange={(e) => set('delai_grace_jours', e.target.value)} /></Field>
        </div>
        <Field label="Méthode de rotation" error={erreur}><Seg value={f.methode_rotation} onChange={(v) => set('methode_rotation', v)} options={[['aleatoire', 'Aléatoire'], ['manuelle', 'Manuelle']]} /></Field>
        <button className="btn-primary mt-2 w-full" disabled={create.isPending}>{create.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Créer la tontine'}</button>
      </form>
    </div>
  );
}
