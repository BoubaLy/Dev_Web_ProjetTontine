import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner } from '../../components/ui';
import AuthLayout from '../../components/AuthLayout';
import PasswordStrength, { pwScore, PW_RULES } from '../../components/PasswordStrength';
import { duration, easing } from '../../motion/tokens';

const STEPS = ['Identité', 'Contact', 'Sécurité'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [f, setF] = useState({ prenom: '', nom: '', telephone: '', email: '', password: '', password_confirmation: '' });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    if (step === 0 && (!f.prenom.trim() || !f.nom.trim())) return 'Indiquez votre prénom et votre nom.';
    if (step === 1) {
      if (!/^\+?\d{8,}$/.test(f.telephone.trim())) return 'Numéro de téléphone invalide (format +221XXXXXXXXX).';
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Adresse email invalide.';
    }
    return null;
  };

  const next = () => {
    const v = validate();
    if (v) { setErreur(v); return; }
    setErreur(null); setDir(1); setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => { setErreur(null); setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async (e) => {
    e.preventDefault();
    if (pwScore(f.password) < PW_RULES.length) return setErreur('Le mot de passe ne remplit pas tous les critères.');
    if (f.password !== f.password_confirmation) return setErreur('Les mots de passe ne correspondent pas.');
    setErreur(null); setLoading(true);
    try {
      const data = await register(f);
      if (data.otp_required === false) {
        // MVP sans OTP : deja connecte -> direction le tableau de bord.
        navigate('/tableau-de-bord');
      } else {
        navigate('/otp', { state: { telephone: f.telephone, email: f.email, otpHint: data.otp_hint } });
      }
    } catch (err) {
      const apiErr = err.response?.data?.errors;
      setErreur(apiErr ? Object.values(apiErr)[0][0] : err.response?.data?.message ?? 'Inscription impossible.');
    } finally { setLoading(false); }
  };

  const slide = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 36 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -36 }),
  };

  return (
    <AuthLayout showcaseStep={step}>
      <h1 className="text-2xl font-semibold text-ink">Créez votre compte</h1>
      <p className="mt-1 text-sm text-ink-soft">Rejoignez vos tontines en toute confiance.</p>

      {/* Barre d'étapes */}
      <div className="mt-5 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div className="h-1 overflow-hidden rounded-pill bg-surface-alt">
              <motion.div className="h-full rounded-pill bg-primary" animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: duration.base, ease: easing.standard }} />
            </div>
            <span className={`text-[11px] font-medium ${i <= step ? 'text-primary' : 'text-ink-soft'}`}>{i + 1}. {label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: duration.fast, ease: easing.standard }}>
            {step === 0 && (
              <div className="flex gap-3">
                <Field label="Prénom" error={erreur}><input className="input" value={f.prenom} onChange={set('prenom')} autoFocus /></Field>
                <Field label="Nom"><input className="input" value={f.nom} onChange={set('nom')} /></Field>
              </div>
            )}
            {step === 1 && (
              <>
                <Field label="Téléphone" hint="Format : +221XXXXXXXXX"><input className="input font-mono" placeholder="+221771234567" value={f.telephone} onChange={set('telephone')} autoFocus /></Field>
                <Field label="Email" hint="Vous y recevrez votre code de vérification." error={erreur}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
              </>
            )}
            {step === 2 && (
              <>
                <Field label="Mot de passe">
                  <input className="input" type="password" value={f.password} onChange={set('password')} autoFocus />
                  <PasswordStrength value={f.password} />
                </Field>
                <Field label="Confirmer le mot de passe" error={erreur}><input className="input" type="password" value={f.password_confirmation} onChange={set('password_confirmation')} /></Field>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex gap-3">
          {step > 0 && <button type="button" className="btn-ghost" onClick={prev}><ArrowLeft size={16} /> Retour</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary ml-auto" onClick={next}>Suivant <ArrowRight size={16} /></button>
          ) : (
            <button type="submit" className="btn-primary ml-auto" disabled={loading}>
              {loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <><UserPlus size={18} /> Créer mon compte</>}
            </button>
          )}
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">Déjà un compte ? <Link to="/login" className="font-medium text-primary">Se connecter</Link></p>
    </AuthLayout>
  );
}
