import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner } from '../../components/ui';

export default function Otp() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { telephone, email, otpHint } = state ?? {};
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null);
    if (!/^\d{6}$/.test(code)) return setErreur('Le code doit contenir 6 chiffres.');
    setLoading(true);
    try {
      await verifyOtp(telephone, code);
      navigate('/login', { state: { telephone } });
    } catch (err) {
      setErreur(err.response?.data?.message ?? 'Code invalide ou expiré.');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-sheet bg-hero text-white shadow-raised"><ShieldCheck size={30} /></div>
          <h1 className="font-display text-2xl font-semibold text-ink">Vérification</h1>
          <p className="mt-1 text-sm text-ink-soft">Saisissez le code à 6 chiffres envoyé par email{email ? ` à ${email}` : ''}.</p>
        </div>
        {otpHint && (
          <div className="mb-4 rounded-card bg-gold-soft px-4 py-2 text-center text-sm text-ink-soft">
            Mode démo : code = <span className="font-mono font-semibold text-ink">{otpHint}</span>
          </div>
        )}
        <form onSubmit={submit} className="card p-6">
          <Field label="Code OTP" error={erreur}>
            <input className="input text-center font-mono text-lg tracking-[0.4em]" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <button className="btn-primary w-full" disabled={loading}>{loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Vérifier'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft"><Link to="/login" className="font-medium text-primary">Retour à la connexion</Link></p>
      </div>
    </div>
  );
}
