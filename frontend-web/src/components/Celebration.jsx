import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, animate } from 'framer-motion';
import { CircleCheck, PartyPopper } from 'lucide-react';
import { duration, easing } from '../motion/tokens';

/**
 * MOMENT SIGNATURE ③ — la célébration.
 * Se déclenche quand une cotisation est validée ou qu'un cycle est clôturé :
 * pulse « opal shimmer », éclat de particules (fait main, transform/opacity —
 * PAS de confetti.js) et compteur de score animé.
 *
 * Garde-fous : transform/opacity/filter uniquement ; auto-dismiss ; si
 * prefers-reduced-motion → carte de succès sobre, sans particules ni pulse,
 * score affiché directement. Overlay fermable au clic.
 */

const PARTICLE_COLORS = ['#2B6E64', '#8DA9C4', '#C6974F', '#4C9A6A'];

const PRESETS = {
  cotisation: {
    Icon: CircleCheck,
    title: 'Cotisation validée',
    subtitle: 'Les deux membres sont d’accord — le paiement est scellé.',
    accent: 'text-success',
    ring: 'border-success',
  },
  cycle: {
    Icon: PartyPopper,
    title: 'Cycle clôturé',
    subtitle: 'Versement au bénéficiaire en cours. La rotation avance.',
    accent: 'text-gold',
    ring: 'border-gold',
  },
};

/** Compteur qui monte (transform/opacity only côté DOM ; valeur via motion). */
function CountUp({ from = 0, to = 0, suffix = '', reduce }) {
  const [val, setVal] = useState(reduce ? to : from);
  useEffect(() => {
    if (reduce) { setVal(to); return; }
    const controls = animate(from, to, {
      duration: duration.slow + 0.4,
      ease: easing.standard,
      delay: 0.25,
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [from, to, reduce]);
  return <span className="font-mono tabular-nums">{val}{suffix}</span>;
}

function Particles() {
  const bits = useMemo(
    () => Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 90;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 6 + Math.random() * 7,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        rot: Math.random() * 360,
        delay: Math.random() * 0.12,
        round: Math.random() > 0.5,
      };
    }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute"
          style={{ width: b.size, height: b.size, background: b.color, borderRadius: b.round ? '9999px' : '2px' }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: b.y, scale: 1, opacity: 0, rotate: b.rot }}
          transition={{ duration: 1.15, ease: easing.standard, delay: b.delay }}
        />
      ))}
    </div>
  );
}

export default function Celebration({ open, variant = 'cotisation', title, subtitle, score, scoreDelta = 1, onDone, duration: holdMs = 2800 }) {
  const reduce = useReducedMotion();
  const preset = PRESETS[variant] ?? PRESETS.cotisation;
  const Icon = preset.Icon;

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => onDone?.(), holdMs);
    return () => clearTimeout(t);
  }, [open, holdMs, onDone]);

  const showScore = typeof score === 'number';
  const fromScore = Math.max(0, score - scoreDelta);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/15 px-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          onClick={() => onDone?.()}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="relative grid place-items-center"
            initial={reduce ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={reduce ? { duration: duration.fast } : { duration: duration.base, ease: easing.bounce }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulses « opal shimmer » qui émanent */}
            {!reduce && [0, 0.35].map((d, i) => (
              <motion.span
                key={i}
                className={`absolute h-40 w-40 rounded-full border-2 ${preset.ring}`}
                initial={{ scale: 0.3, opacity: 0.55 }}
                animate={{ scale: 2.3, opacity: 0 }}
                transition={{ duration: 1.4, ease: easing.gentle, delay: d, repeat: 1, repeatDelay: 0.2 }}
              />
            ))}

            {!reduce && <Particles />}

            {/* Carte de succès */}
            <div className="relative flex flex-col items-center gap-3 rounded-card bg-surface px-8 py-7 text-center shadow-lift">
              <motion.div
                className={`grid h-16 w-16 place-items-center rounded-full bg-bg ${preset.accent}`}
                initial={reduce ? {} : { scale: 0, rotate: -20 }}
                animate={reduce ? {} : { scale: 1, rotate: 0 }}
                transition={{ duration: duration.base, ease: easing.bounce, delay: 0.1 }}
              >
                <Icon size={34} strokeWidth={2.2} />
              </motion.div>

              <h3 className="text-xl font-semibold text-ink">{title ?? preset.title}</h3>
              <p className="max-w-xs text-sm text-ink-soft">{subtitle ?? preset.subtitle}</p>

              {showScore && (
                <div className="mt-1 inline-flex items-center gap-2 rounded-pill bg-success-soft px-4 py-1.5 text-sm font-semibold text-success">
                  Score de fiabilité
                  <CountUp from={fromScore} to={score} suffix="%" reduce={reduce} />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
