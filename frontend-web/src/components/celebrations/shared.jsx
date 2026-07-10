import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, animate } from 'framer-motion';
import { duration, easing } from '../../motion/tokens';

/**
 * SOCLE PARTAGÉ DES 3 MOMENTS DE CÉLÉBRATION (brief §5).
 * Les effets « spectaculaires » (onde, confettis, glow) vivent UNIQUEMENT ici et
 * ne sont importés que par CotisationSuccessMotion / CycleCompleteMotion /
 * ScoreLevelUpMotion. Le reste de l'app n'y a pas accès — c'est cette rareté qui
 * rend les 3 moments mémorables.
 *
 * Contraintes transverses : transform/opacity/filter uniquement ; auto-dismiss ;
 * si prefers-reduced-motion -> version sobre (pas de particules/onde/vibreur).
 */

// Palette imposée — jamais de multicolore criard (teal, lavande, or, vert).
export const PALETTE = ['#2B6E64', '#8DA9C4', '#C6974F', '#4C9A6A'];

/** Vibration tactile courte (mobile only, silencieuse si non supporté / reduced-motion). */
export function haptic(pattern = 18, reduce = false) {
  if (reduce) return;
  try { navigator.vibrate?.(pattern); } catch { /* non supporté */ }
}

/** Ferme automatiquement après `ms` ; renvoie une fonction de nettoyage. */
export function useAutoDismiss(open, ms, onDone) {
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => onDone?.(), ms);
    return () => clearTimeout(t);
  }, [open, ms, onDone]);
}

/** Compteur qui monte (valeur animée via Framer, rendu tabulaire mono). */
export function CountUp({ from = 0, to = 0, format = (v) => Math.round(v), reduce, delay = 0.2, className = '' }) {
  const [val, setVal] = useState(reduce ? to : from);
  useEffect(() => {
    if (reduce) { setVal(to); return undefined; }
    const controls = animate(from, to, {
      duration: duration.slow + 0.2, ease: easing.standard, delay,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [from, to, reduce, delay]);
  return <span className={`font-mono tabular-nums ${className}`}>{format(val)}</span>;
}

/**
 * ÉCLAT DE PARTICULES (fait main). `count` réglable : ~18 pour une validation,
 * ~40 pour une clôture de cycle. `spread` = distance de projection.
 */
export function ParticleBurst({ count = 18, spread = 120, colors = PALETTE }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = spread * (0.6 + Math.random() * 0.7);
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        rot: Math.random() * 360,
        delay: Math.random() * 0.12,
        round: Math.random() > 0.5,
      };
    }),
    [count, spread, colors],
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

/**
 * PLUIE DE CONFETTIS — réservée à la clôture de cycle (§5.2), 2 s max, ~40 pièces,
 * couleurs de la palette. Tombent depuis le haut avec dérive + rotation.
 */
export function ConfettiRain({ count = 40, colors = PALETTE }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      drift: (Math.random() - 0.5) * 28,
      rot: 180 + Math.random() * 360,
      delay: Math.random() * 0.5,
      dur: 1.4 + Math.random() * 0.6,
      round: Math.random() > 0.5,
    })),
    [count, colors],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute -top-4"
          style={{ left: `${p.left}%`, width: p.size, height: p.size, background: p.color, borderRadius: p.round ? '9999px' : '2px' }}
          initial={{ y: '-10%', x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rot }}
          transition={{ duration: p.dur, ease: 'easeIn', delay: p.delay }}
        />
      ))}
    </div>
  );
}

export { motion, useReducedMotion, duration, easing };
