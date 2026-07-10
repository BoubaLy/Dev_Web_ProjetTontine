import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Users, CircleCheck } from 'lucide-react';
import { duration, easing } from '../motion/tokens';
import AmbientMesh from './AmbientMesh';
import RotationRing from './RotationRing';

/**
 * PANNEAU NARRATIF DES PAGES AUTH (brief « Site Vivant » §2.1).
 * Cercle de Rotation amplifié + fond Opal Aurora en intensité `showcase`, avec une
 * mini-scène en boucle DOUCE : les membres rejoignent, l'arc se remplit, une légende
 * décrit l'action en cours. C'est un moment d'accroche, pas un écran de travail.
 *
 * `compact` : version bandeau (mobile, en haut du formulaire).
 * `step` : optionnel — synchronise l'arc sur l'étape d'un wizard (inscription §2.2).
 * reduced-motion : ring plein figé, aucune boucle.
 */

const DEMO = [
  { name: 'Awa Ndiaye' },
  { name: 'Modou Fall' },
  { name: 'Fatou Sow' },
  { name: 'Cheikh Ba' },
  { name: 'Bineta Diop' },
];

const CAPTIONS = [
  { Icon: Users, text: 'Awa crée la tontine et invite ses proches.' },
  { Icon: Users, text: 'Modou rejoint le groupe avec le code d’invitation.' },
  { Icon: CircleCheck, text: 'Fatou déclare sa cotisation — validation croisée.' },
  { Icon: CircleCheck, text: 'Cheikh reçoit et confirme le versement du tour.' },
  { Icon: ShieldCheck, text: 'Chaque paiement est tracé, chaque membre en confiance.' },
];

export default function AuthShowcase({ compact = false, step = null }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? DEMO.length - 1 : 0);

  // Boucle douce (désactivée si un `step` externe pilote la scène, ou reduced-motion).
  useEffect(() => {
    if (reduce || step != null) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % DEMO.length), 2600);
    return () => clearInterval(id);
  }, [reduce, step]);

  const active = step != null ? Math.min(step, DEMO.length - 1) : i;
  const shown = active + 1;                       // membres visibles dans la couronne
  const members = DEMO.slice(0, shown);
  const progress = shown / DEMO.length;
  const ringSize = compact ? 120 : 300;

  return (
    <div className={`relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden bg-night ${compact ? 'rounded-sheet py-6' : 'px-8 py-12'}`}>
      <AmbientMesh variant="deep" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {!compact && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            className="mb-8"
          >
            <h2 className="font-display text-3xl font-semibold text-ink-inverse">La tontine, en confiance.</h2>
            <p className="mt-2 max-w-sm text-sm text-ink-inverse/70">
              Épargne rotative traçable, validation croisée des paiements, score de fiabilité.
            </p>
          </motion.div>
        )}

        <RotationRing
          key={reduce ? 'static' : `k-${shown}`}
          members={members.length ? members : DEMO.slice(0, 1)}
          progress={progress}
          beneficiaryIndex={0}
          centerLabel={compact ? undefined : 'Tour'}
          centerValue={compact ? undefined : `${shown}/${DEMO.length}`}
          size={ringSize}
          animate={!reduce}
        />

        {!compact && (
          <div className="mt-8 h-12">
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                className="flex items-center gap-2 text-sm font-medium text-ink-inverse/85"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? {} : { opacity: 0, y: -8 }}
                transition={{ duration: duration.fast, ease: easing.standard }}
              >
                {(() => { const C = CAPTIONS[active].Icon; return <C size={16} className="text-gold" />; })()}
                {CAPTIONS[active].text}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
