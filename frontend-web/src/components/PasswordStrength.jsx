import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { duration, easing } from '../motion/tokens';

/**
 * INDICATEUR DE FORCE DE MOT DE PASSE (brief §2.2).
 * Barre qui progresse de façon FLUIDE (largeur animée, pas un saut de couleur) +
 * critères qui se cochent (coche qui se dessine). Teinte danger→gold→success selon
 * le niveau. reduced-motion : transitions instantanées.
 *
 * Critères alignés sur la validation backend : 8+ caractères, majuscule, minuscule, chiffre.
 */
export const PW_RULES = [
  { key: 'len', label: '8 caractères ou plus', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Une majuscule', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Une minuscule', test: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Un chiffre', test: (v) => /\d/.test(v) },
];

export function pwScore(v) {
  return PW_RULES.reduce((n, r) => n + (r.test(v) ? 1 : 0), 0);
}

const TONE = ['bg-line', 'bg-danger', 'bg-gold', 'bg-gold', 'bg-success'];
const LABEL = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];

export default function PasswordStrength({ value = '' }) {
  const reduce = useReducedMotion();
  const score = pwScore(value);
  const pct = (score / PW_RULES.length) * 100;

  if (!value) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-alt">
          <motion.div
            className={`h-full rounded-pill ${TONE[score]}`}
            animate={{ width: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { duration: duration.base, ease: easing.standard }}
          />
        </div>
        <span className="w-10 text-right text-[11px] font-medium text-ink-soft">{LABEL[score]}</span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {PW_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.key} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-success' : 'text-ink-soft'}`}>
              <span className={`grid h-3.5 w-3.5 place-items-center rounded-full ${ok ? 'bg-success text-white' : 'bg-surface-alt'}`}>
                {ok && (
                  <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ duration: duration.fast, ease: easing.bounce }}>
                    <Check size={9} strokeWidth={3} />
                  </motion.span>
                )}
              </span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
