import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { motion, useReducedMotion, duration, easing, haptic, useAutoDismiss } from './shared';

/**
 * MOMENT ③ — « Montée de score à un palier » (brief §5.3).
 * Toast élégant en HAUT de l'écran (pas une modale bloquante) : le badge fait un
 * scale + glow bref, le toast glisse depuis le haut puis se dissipe après ~3 s.
 * Registre plus léger que les moments ① et ② — une montée de palier n'égale pas
 * un cycle entier clôturé.
 *
 * reduced-motion : apparition/disparition simple, pas de glow pulsé.
 */
export default function ScoreLevelUpMotion({
  open,
  level = 'Excellent',
  score,
  onDone,
  holdMs = 3000,
}) {
  const reduce = useReducedMotion();
  useAutoDismiss(open, holdMs, onDone);
  useEffect(() => { if (open) haptic(14, reduce); }, [open, reduce]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4" aria-hidden={!open}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-elevated pointer-events-auto flex items-center gap-3 rounded-pill py-2.5 pl-2.5 pr-5 shadow-lift"
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            role="status" aria-live="polite"
            onClick={() => onDone?.()}
          >
            <motion.span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-white shadow-glow-gold"
              initial={reduce ? {} : { scale: 0.4 }}
              animate={reduce ? {} : { scale: [0.4, 1.18, 1] }}
              transition={{ duration: 0.5, ease: easing.bounce, delay: 0.05 }}
            >
              <TrendingUp size={18} />
            </motion.span>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink">Score : niveau « {level} » 🎉</p>
              <p className="text-xs text-ink-soft">
                {typeof score === 'number' ? `Votre fiabilité atteint ${Math.round(score)}%.` : 'Votre fiabilité progresse.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
