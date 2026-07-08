import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useJoinGroup } from '../lib/queries';
import { Field, Spinner } from '../components/ui';

export default function JoinGroup() {
  const navigate = useNavigate();
  const join = useJoinGroup();
  const [code, setCode] = useState('');
  const [accepte, setAccepte] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null); setMessage(null);
    if (!code.trim()) return setErreur("Saisissez un code d'invitation.");
    if (!accepte) return setErreur('Vous devez accepter le règlement intérieur.');
    try {
      await join.mutateAsync({ code: code.trim().toUpperCase() });
      setMessage("Demande envoyée. En attente de validation de l'administrateur.");
      setTimeout(() => navigate('/groupes'), 1400);
    } catch (err) {
      setErreur(err.response?.data?.message ?? 'Impossible de rejoindre ce groupe.');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link to="/groupes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary"><ArrowLeft size={16} /> Mes tontines</Link>
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary"><UserPlus size={28} /></div>
        <h1 className="text-2xl font-semibold text-ink">Rejoindre une tontine</h1>
        <p className="mt-1 text-sm text-ink-soft">Saisissez le code partagé par l'administrateur (WhatsApp / SMS).</p>
      </div>

      <form onSubmit={submit} className="card p-6">
        <Field label="Code d'invitation"><input className="input font-mono uppercase" placeholder="Ex. A1B2C3D4" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <label className="mb-3 flex items-center gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} />
          J'accepte le règlement intérieur du groupe.
        </label>
        {erreur && <p className="mb-3 text-xs text-danger">{erreur}</p>}
        {message && <p className="mb-3 rounded-card bg-success-soft p-3 text-xs text-success">{message}</p>}
        <button className="btn-primary w-full" disabled={join.isPending}>{join.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Envoyer la demande'}</button>
      </form>
    </div>
  );
}
