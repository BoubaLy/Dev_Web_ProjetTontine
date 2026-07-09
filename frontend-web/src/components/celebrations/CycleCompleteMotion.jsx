import { AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import {
  motion, useReducedMotion, duration, easing,
  ConfettiRain, CountUp, haptic, useAutoDismiss,
} from './shared';
import { useEffect } from 'react';

/**
 * MOMENT ② — « Cycle clôturé sans litige » (brief §5.2). LE moment le plus fort.
 * L'arc de progression fait un TOUR COMPLET (~1.5 s), pluie de confettis palette
 * (~40, 2 s max), total du pot en grand `Fraunces` (font-display) avec count-up.
 * Modal `glass-deep` posée sur un fond sombre (bg-deep). Seul écran de l'app à
 * utiliser les confettis.
 *
 * reduced-motion : modal sobre, arc plein figé, total affiché directement, pas de
 * confettis.
 */
export default function CycleCompleteMotion({
  open,
  total,
  format = (v) => `${Math.round(v).toLocaleString('fr-FR')} FCFA`,
  title = 'Cycle clôturé 🎉',
  subtitle = 'Versement au bénéficiaire en cours. La rotation avance sereinement.',
  onDone,
  holdMs = 3800,
}) {
  const reduce = useReducedMotion();
  useAutoDismiss(open, holdMs, onDone);
  useEffect(() => { if (open) haptic([16, 40, 16], reduce); }, [open, reduce]);

  const R = 62;
  const circ = 2 * Math.PI * R;
  const showTotal = typeof total === 'number';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-bg-deep/80 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          onClick={() => onDone?.()}
          role="status" aria-live="polite"
        >
          {!reduce && <ConfettiRain count={40} />}

          <motion.div
            className="glass-dark relative flex w-full max-w-sm flex-col items-center gap-4 rounded-sheet px-8 py-9 text-center shadow-lift"
            initial={reduce ? { opacity: 0 } : { scale: 0.75, opacity: 0, y: 16 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={reduce ? { duration: duration.fast } : { duration: duration.base, ease: easing.bounce }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arc qui fait un tour complet (~1.5 s) */}
            <div className="relative grid place-items-center">
              <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden>
                <defs>
                  <linearGradient id="cycleShimmer" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8DA9C4" />
                    <stop offset="0.5" stopColor="#6FBEB4" />
                    <stop offset="1" stopColor="#C6974F" />
                  </linearGradient>
                </defs>
                <circle cx="75" cy="75" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                <motion.circle
                  cx="75" cy="75" r={R} fill="none" stroke="url(#cycleShimmer)" strokeWidth="8"
                  strokeLinecap="round" transform="rotate(-90 75 75)" strokeDasharray={circ}
                  initial={reduce ? { strokeDashoffset: 0 } : { strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 1.5, ease: easing.standard, delay: 0.1 }}
                />
              </svg>
              <div className="absolute grid h-14 w-14 place-items-center rounded-full bg-gold text-white">
                <PartyPopper size={26} />
              </div>
            </div>

            <h3 className="font-display text-2xl font-semibold text-ink-inverse">{title}</h3>

            {showTotal && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-inverse/60">Total du pot versé</p>
                <p className="font-display text-3xl font-semibold text-gold">
                  <CountUp from={0} to={total} format={format} reduce={reduce} delay={0.4} />
                </p>
              </div>
            )}

            <p className="max-w-xs text-sm text-ink-inverse/70">{subtitle}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
