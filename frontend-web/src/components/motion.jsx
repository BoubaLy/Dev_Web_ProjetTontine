import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, animate } from 'framer-motion';
import { duration, easing, amplitude } from '../motion/tokens';

/**
 * SYSTÈME DE MICRO-INTERACTIONS — primitives réutilisables, toutes câblées sur
 * les tokens de mouvement. transform/opacity uniquement ; chaque primitive a un
 * comportement neutre si prefers-reduced-motion.
 */

/** Enveloppe « magnétique » : l'élément est attiré vers le curseur (CTA clés). */
export function Magnetic({ children, strength = amplitude.magneticPull, className = '' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(Math.max(-1, Math.min(1, px)) * strength);
    y.set(Math.max(-1, Math.min(1, py)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.span>
  );
}

/** Compteur qui monte à l'apparition (chiffres financiers, scores, stats). */
export function AnimatedNumber({ value = 0, format = (v) => Math.round(v).toLocaleString('fr-FR'), className = '' }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setDisplay(value); return undefined; }
    const controls = animate(0, value, {
      duration: duration.slow + 0.2,
      ease: easing.standard,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span className={`tabular-nums ${className}`}>{format(display)}</span>;
}

/** Bloc squelette avec balayage shimmer (états de chargement). */
export function Skeleton({ className = '', rounded = 'rounded-card' }) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}
