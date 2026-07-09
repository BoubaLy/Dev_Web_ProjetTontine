import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion, useReducedMotion, duration, easing, ParticleBurst, haptic, useAutoDismiss } from './shared';

/**
 * MOMENT ① — « Cotisation validée » (brief §5.1, ~1.2 s).
 * Coche SVG qui se DESSINE (path, §3.4) + onde `opal-gold` qui part du centre et
 * se dissipe vers les bords + éclat de particules sobre + vibreur court sur mobile.
 * PAS de confettis (réservés à la clôture de cycle) — hiérarchie des célébrations.
 *
 * reduced-motion : carte de succès figée (coche pleine, pas d'onde/particules/vibreur).
 */
export default function CotisationSuccessMotion({
  open,
  title = 'Cotisation validée',
  subtitle = 'Les deux membres sont d’accord — le paiement est scellé.',
  onDone,
  holdMs = 2200,
}) {
  const reduce = useReducedMotion();
  useAutoDismiss(open, holdMs, onDone);
  useEffect(() => { if (open) haptic(18, reduce); }, [open, reduce]);

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/15 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: duration.fast }}
      onClick={() => onDone?.()}
      role="status" aria-live="polite"
    >
      <motion.div
        className="relative grid place-items-center"
        initial={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={reduce ? { duration: duration.fast } : { duration: duration.base, ease: easing.bounce }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Onde « opal-gold » qui se dissipe vers les bords */}
        {!reduce && [0, 0.28].map((d, i) => (
          <motion.span
            key={i}
            className="absolute h-36 w-36 rounded-full"
            style={{ boxShadow: '0 0 0 2px rgba(198,151,79,0.5)' }}
            initial={{ scale: 0.35, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.2, ease: easing.gentle, delay: d }}
          />
        ))}

        {!reduce && <ParticleBurst count={16} spread={110} />}

        <div className="relative flex flex-col items-center gap-3 rounded-card bg-surface px-8 py-7 text-center shadow-lift">
          {/* Coche qui se dessine (path animation SVG, ~450 ms) */}
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <motion.path
                d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.6"
                strokeLinecap="round" strokeLinejoin="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.45, ease: easing.standard, delay: 0.15 }}
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <p className="max-w-xs text-sm text-ink-soft">{subtitle}</p>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
