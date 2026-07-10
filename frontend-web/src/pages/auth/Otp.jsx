import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui';
import AuthLayout from '../../components/AuthLayout';
import OtpInput from '../../components/OtpInput';
import { duration, easing } from '../../motion/tokens';

export default function Otp() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { state } = useLocation();
  const { telephone, email, otpHint } = state ?? {};
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [success, setSuccess] = useState(false);

  const doVerify = async (value) => {
    const c = value ?? code;
    setErreur(null);
    if (!/^\d{6}$/.test(c)) { setErreur('Le code doit contenir 6 chiffres.'); setShake((s) => s + 1); return; }
    setLoading(true);
    try {
      await verifyOtp(telephone, c);
      // Mini-moment signature (court) avant la redirection.
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { telephone } }), reduce ? 250 : 900);
    } catch (err) {
      setErreur(err.response?.data?.message ?? 'Code invalide ou expiré.');
      setShake((s) => s + 1);
      setCode('');
    } finally { setLoading(false); }
  };

  const submit = (e) => { e.preventDefault(); doVerify(); };

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <motion.div className="grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success"
            initial={reduce ? {} : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: duration.base, ease: easing.bounce }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <motion.path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: easing.standard, delay: 0.1 }} />
            </svg>
          </motion.div>
          <h1 className="text-xl font-semibold text-ink">Compte vérifié 🎉</h1>
          <p className="text-sm text-ink-soft">Redirection vers la connexion…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink">Vérification</h1>
      <p className="mt-1 text-sm text-ink-soft">Saisissez le code à 6 chiffres envoyé par email{email ? ` à ${email}` : ''}.</p>

      {otpHint && (
        <div className="mt-4 rounded-card bg-gold-soft px-4 py-2 text-center text-sm text-ink-soft">
          Mode démo : code = <span className="font-mono font-semibold text-ink">{otpHint}</span>
        </div>
      )}

      <form onSubmit={submit} className="mt-6">
        <div className={shake ? 'shake' : ''} key={shake}>
          <OtpInput value={code} onChange={setCode} onComplete={(v) => doVerify(v)} disabled={loading} />
        </div>
        {erreur && <p className="mt-2 text-center text-xs text-danger">{erreur}</p>}
        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : 'Vérifier'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft"><Link to="/login" className="font-medium text-primary">Retour à la connexion</Link></p>
    </AuthLayout>
  );
}
