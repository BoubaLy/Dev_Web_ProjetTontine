import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCreateGroup, formatFCFA } from '../lib/queries';
import { Field, Spinner } from '../components/ui';
import { duration, easing } from '../motion/tokens';
import RotationRing from '../components/RotationRing';

const Seg = ({ value, onChange, options }) => (
  <div className="flex gap-2 rounded-pill bg-surface-alt p-1">
    {options.map(([v, l]) => (
      <button type="button" key={v} onClick={() => onChange(v)} className={`flex-1 rounded-pill py-1.5 text-xs font-medium ${value === v ? 'bg-primary text-white' : 'text-ink-soft'}`}>{l}</button>
    ))}
  </div>
);

const STEPS = ['Identité', 'Format', 'Règles', 'Finalisation'];

// Date par defaut (dans 5 mois) pour l'echeance d'une epargne accumulative.
const defaultEcheance = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 5);
  return d.toISOString().slice(0, 10);
};

export default function CreateGroup() {
  const navigate = useNavigate();
  const create = useCreateGroup();
  const reduce = useReducedMotion();
  const [f, setF] = useState({ nom: '', description: '', type: 'rotative', montant_cotisation: '', frequence: 'mensuelle', nb_membres_max: '', penalite_pourcentage: '2', delai_grace_jours: '3', methode_rotation: 'aleatoire', date_echeance: defaultEcheance() });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);          // sens de la transition (slide)
  const [erreur, setErreur] = useState(null);
  const [born, setBorn] = useState(false);    // moment « naissance du groupe »

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bornes = f.type === 'accumulative' ? '3 à 50' : '5 à 30';
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  // Validation par étape — barre de progression réelle, pas de spinner abstrait.
  const validate = () => {
    if (step === 0 && !f.nom.trim()) return 'Donnez un nom à votre tontine.';
    if (step === 1 && !(Number(f.montant_cotisation) > 0)) return 'Indiquez un montant de cotisation valide.';
    if (step === 2 && !(Number(f.nb_membres_max) > 0)) return `Indiquez un nombre de membres (${bornes}).`;
    return null;
  };

  const next = () => {
    const v = validate();
    if (v) { setErreur(v); return; }
    setErreur(null); setDir(1); setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => { setErreur(null); setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setErreur(null);
    if (f.type === 'accumulative' && !f.date_echeance) return setErreur("Indiquez la date d'échéance de l'épargne.");
    try {
      const g = await create.mutateAsync({
        ...f,
        montant_cotisation: Number(f.montant_cotisation),
        nb_membres_max: Number(f.nb_membres_max),
        penalite_pourcentage: Number(f.penalite_pourcentage),
        delai_grace_jours: Number(f.delai_grace_jours),
        date_echeance: f.type === 'accumulative' ? f.date_echeance : null,
      });
      // Moment §3.2 : le Cercle de Rotation se dessine (naissance du groupe) puis redirection.
      setBorn(true);
      setTimeout(() => navigate(`/groupes/${g.id}`), reduce ? 300 : 1600);
    } catch (err) {
      const apiErr = err.response?.data?.errors;
      setErreur(apiErr ? Object.values(apiErr)[0][0] : err.response?.data?.message ?? 'Création impossible.');
    }
  };

  // Écran « naissance » : couronne de places (arc qui se trace, avatars en stagger).
  if (born) {
    const slots = Array.from({ length: Math.max(Number(f.nb_membres_max) || 5, 2) }, () => ({ name: '? ?' }));
    return (
      <div className="relative isolate mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
        <RotationRing members={slots} progress={1} beneficiaryIndex={-1} centerLabel="Nouvelle" centerValue="tontine" size={260} animate />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: duration.base, ease: easing.standard }}>
          <h2 className="font-display text-xl font-semibold text-ink">« {f.nom} » est née </h2>
          <p className="mt-1 text-sm text-ink-soft">Invitez vos membres pour lancer le premier tour…</p>
        </motion.div>
      </div>
    );
  }

  const slide = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -40 }),
  };

  return (
    <div className="relative isolate mx-auto max-w-lg space-y-6">
      <Link to="/groupes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary"><ArrowLeft size={16} /> Mes tontines</Link>

      <div>
        <h1 className="text-2xl font-semibold text-ink">Créer une tontine</h1>
        {/* Barre de progression réelle + libellés d'étape */}
        <div className="mt-3 flex items-center justify-between text-xs font-medium">
          {STEPS.map((label, i) => (
            <span key={label} className={i <= step ? 'text-primary' : 'text-ink-soft'}>
              {i < step ? <Check size={13} className="mr-0.5 inline" /> : `${i + 1}. `}{label}
            </span>
          ))}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-alt">
          <motion.div className="h-full rounded-pill bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: duration.base, ease: easing.standard }} />
        </div>
        <p className="mt-1 text-right text-[11px] text-ink-faint">{progress}%</p>
      </div>

      <div className="card overflow-hidden p-6">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: duration.fast, ease: easing.standard }}
            className="space-y-1"
          >
            {step === 0 && (
              <>
                <Field label="Nom du groupe" error={erreur}><input className="input" placeholder="Ex. Tontine des Amis" value={f.nom} onChange={(e) => set('nom', e.target.value)} autoFocus /></Field>
                <Field label="Description (optionnel)"><textarea className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label="Type de tontine">
                  <Seg value={f.type} onChange={(v) => set('type', v)} options={[['rotative', 'Rotative'], ['accumulative', 'Accumulative']]} />
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {f.type === 'rotative'
                      ? 'Rotative : à chaque tour, tout le monde cotise et un membre est tiré au sort pour recevoir le pot. Chacun gagne une fois.'
                      : 'Accumulative (coffre-fort) : chacun épargne à son rythme jusqu’à une date d’échéance, puis récupère exactement le total de ses propres versements. Pas de tirage.'}
                  </p>
                </Field>
                <Field label={f.type === 'accumulative' ? 'Dépôt par période (FCFA)' : 'Cotisation par tour (FCFA)'} error={erreur}><input className="input font-mono" type="number" placeholder="Ex. 50000" value={f.montant_cotisation} onChange={(e) => set('montant_cotisation', e.target.value)} /></Field>
                <Field label="Fréquence"><Seg value={f.frequence} onChange={(v) => set('frequence', v)} options={[['hebdomadaire', 'Hebdomadaire'], ['mensuelle', 'Mensuelle']]} /></Field>
              </>
            )}
            {step === 2 && (
              <>
                <Field label="Nombre de membres max" hint={`${bornes} selon le type`} error={erreur}><input className="input" type="number" value={f.nb_membres_max} onChange={(e) => set('nb_membres_max', e.target.value)} /></Field>
                <div className="flex gap-3">
                  <Field label="Pénalité de retard (%)" hint="Entre 1 % et 2,5 % (plafond fixé par les règles)"><input className="input" type="number" step="0.5" min="1" max="2.5" value={f.penalite_pourcentage} onChange={(e) => set('penalite_pourcentage', e.target.value)} /></Field>
                  <Field label="Délai de grâce (jours)"><input className="input" type="number" value={f.delai_grace_jours} onChange={(e) => set('delai_grace_jours', e.target.value)} /></Field>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                {f.type === 'accumulative' ? (
                  <Field label="Date d'échéance (restitution)" error={erreur} hint="Date de la fête / du projet : l'épargne est bloquée jusque-là">
                    <input className="input" type="date" value={f.date_echeance} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set('date_echeance', e.target.value)} />
                    <p className="mt-1.5 text-xs text-ink-soft">À l'échéance, chaque membre récupère exactement le total de ses propres dépôts (un mois manqué n'impacte que lui).</p>
                  </Field>
                ) : (
                  <div className="rounded-card bg-surface-alt p-4 text-sm text-ink-soft">
                    <p className="mb-1 font-semibold text-ink">Tirage au sort transparent</p>
                    À chaque tour, une fois toutes les cotisations validées par l'administrateur, le bénéficiaire est <b>tiré au sort</b> parmi les membres n'ayant pas encore gagné. Équitable et scellé : personne ne connaît le gagnant à l'avance.
                  </div>
                )}
                {/* Récapitulatif avant création */}
                <div className="mt-3 rounded-card bg-surface-alt p-4 text-sm">
                  <p className="mb-2 font-semibold text-ink">Récapitulatif</p>
                  <dl className="space-y-1 text-ink-soft">
                    <Recap k="Nom" v={f.nom || '—'} />
                    <Recap k="Type" v={f.type === 'accumulative' ? 'Coffre-fort' : 'Rotative'} />
                    <Recap k={f.type === 'accumulative' ? 'Dépôt' : 'Cotisation'} v={f.montant_cotisation ? formatFCFA(Number(f.montant_cotisation)) : '—'} />
                    <Recap k="Fréquence" v={f.frequence} />
                    <Recap k="Membres max" v={f.nb_membres_max || '—'} />
                    {f.type === 'accumulative'
                      ? <Recap k="Échéance" v={f.date_echeance || '—'} />
                      : <Recap k="Bénéficiaire" v="Tirage au sort" />}
                  </dl>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-5 flex gap-3">
          {step > 0 && <button type="button" className="btn-ghost" onClick={prev}><ArrowLeft size={16} /> Retour</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary ml-auto" onClick={next}>Suivant <ArrowRight size={16} /></button>
          ) : (
            <button type="button" className="btn-primary ml-auto" onClick={submit} disabled={create.isPending}>
              {create.isPending ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <>Créer la tontine <Check size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Recap({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{k}</dt>
      <dd className="font-medium capitalize text-ink">{v}</dd>
    </div>
  );
}
