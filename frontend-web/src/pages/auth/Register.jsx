import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner } from '../../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ prenom: '', nom: '', telephone: '', email: '', password: '', password_confirmation: '' });
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null); setLoading(true);
    try {
      const data = await register(f);
      navigate('/otp', { state: { telephone: f.telephone, email: f.email, otpHint: data.otp_hint } });
    } catch (err) {
      const apiErr = err.response?.data?.errors;
      setErreur(apiErr ? Object.values(apiErr)[0][0] : err.response?.data?.message ?? 'Inscription impossible.');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-2xl font-semibold text-ink">Créez votre compte</h1>
        <p className="mb-6 text-center text-sm text-ink-soft">Rejoignez vos tontines en toute confiance.</p>
        <form onSubmit={submit} className="card p-6">
          <div className="flex gap-3">
            <Field label="Prénom"><input className="input" value={f.prenom} onChange={set('prenom')} /></Field>
            <Field label="Nom"><input className="input" value={f.nom} onChange={set('nom')} /></Field>
          </div>
          <Field label="Téléphone" hint="Format : +221XXXXXXXXX"><input className="input font-mono" placeholder="+221771234567" value={f.telephone} onChange={set('telephone')} /></Field>
          <Field label="Email" hint="Vous y recevrez votre code de vérification."><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Mot de passe" hint="8+ caractères, majuscule, minuscule, chiffre."><input className="input" type="password" value={f.password} onChange={set('password')} /></Field>
          <Field label="Confirmer le mot de passe" error={erreur}><input className="input" type="password" value={f.password_confirmation} onChange={set('password_confirmation')} /></Field>
          <button className="btn-primary w-full" disabled={loading}>{loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : "S'inscrire"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">Déjà un compte ? <Link to="/login" className="font-medium text-primary">Se connecter</Link></p>
      </div>
    </div>
  );
}
