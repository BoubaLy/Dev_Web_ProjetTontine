import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner } from '../../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [telephone, setTel] = useState('');
  const [password, setPwd] = useState('');
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null); setLoading(true);
    try {
      await login(telephone.trim(), password);
      navigate('/');
    } catch (err) {
      setErreur(err.response?.data?.message ?? 'Connexion impossible. Réessayez.');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-sheet bg-hero text-white shadow-raised"><Coins size={30} /></div>
          <h1 className="font-display text-3xl font-semibold text-ink">TontineSecure</h1>
          <p className="mt-1 text-sm text-ink-soft">Épargnez en confiance, ensemble.</p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <Field label="Téléphone">
            <input className="input font-mono" placeholder="+221 77 123 45 67" value={telephone} onChange={(e) => setTel(e.target.value)} />
          </Field>
          <Field label="Mot de passe" error={erreur}>
            <input className="input" type="password" value={password} onChange={(e) => setPwd(e.target.value)} />
          </Field>
          <button className="btn-primary w-full" disabled={loading}>{loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Se connecter'}</button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Pas encore de compte ? <Link to="/register" className="font-medium text-primary">S'inscrire</Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-faint">
          Démo : <span className="font-mono">+221771111111</span> / <span className="font-mono">password</span>
        </p>
      </div>
    </div>
  );
}
