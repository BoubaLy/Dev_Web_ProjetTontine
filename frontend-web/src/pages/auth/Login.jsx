import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner } from '../../components/ui';
import AuthLayout from '../../components/AuthLayout';

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
      navigate('/tableau-de-bord');
    } catch (err) {
      setErreur(err.response?.data?.message ?? 'Connexion impossible. Réessayez.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink">Bon retour </h1>
      <p className="mt-1 text-sm text-ink-soft">Connectez-vous pour retrouver vos tontines.</p>

      <form onSubmit={submit} className="mt-6">
        <Field label="Téléphone">
          <input className="input font-mono" placeholder="+221 77 123 45 67" autoComplete="username" value={telephone} onChange={(e) => setTel(e.target.value)} />
        </Field>
        <Field label="Mot de passe" error={erreur}>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPwd(e.target.value)} />
        </Field>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><LogIn size={18} /> Se connecter</>}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Pas encore de compte ? <Link to="/register" className="font-medium text-primary">S'inscrire</Link>
      </p>
    </AuthLayout>
  );
}
