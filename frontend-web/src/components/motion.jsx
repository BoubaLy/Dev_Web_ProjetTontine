import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, animate } from 'framer-motion';
import { duration, easing, amplitude } from '../motion/tokens';

/**
 * SYSTÈME DE MICRO-INTERACTIONS — primitives réutilisables, toutes câblées sur
 * les tokens de mouvement. transform/opacity uniquement ; chaque primitive a un
 * comportement neutre si prefers-reduced-motion.
 */

/* ================================================================
   MAGNETIC — bouton attiré vers le curseur (CTA clés, desktop)
   Sur mobile/tactile : comportement standard (pas de simulation).
   ================================================================ */
export function Magnetic({ children, strength = amplitude.magneticPull, className = '' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = useCallback((e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(Math.max(-1, Math.min(1, px)) * strength);
    y.set(Math.max(-1, Math.min(1, py)) * strength);
  }, [reduce, strength, x, y]);

  const reset = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileTap={{ scale: amplitude.pressScale }}
    >
      {children}
    </motion.span>
  );
}

/* ================================================================
   ANIMATED NUMBER — compteur qui monte à l'apparition
   (chiffres financiers, scores, stats).
   ================================================================ */
export function AnimatedNumber({
  value = 0,
  format = (v) => Math.round(v).toLocaleString('fr-FR'),
  className = '',
  delay = 0,
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setDisplay(value); return undefined; }
    const controls = animate(0, value, {
      duration: duration.slow + 0.2,
      ease: easing.standard,
      delay,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduce, delay]);

  return <span className={`tabular-nums ${className}`}>{format(display)}</span>;
}

/* ================================================================
   SKELETON — état de chargement avec balayage shimmer.
   ================================================================ */
export function Skeleton({ className = '', rounded = 'rounded-card' }) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}

/* ================================================================
   HOVER CARD — lift + subtle shadow glow au survol.
   Utilisable comme wrapper autour d'une card existante.
   ================================================================ */
export function HoverCard({ children, className = '', lift = true }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={lift ? { y: amplitude.hoverLift, transition: { duration: duration.fast, ease: easing.standard } } : undefined}
      whileTap={{ scale: amplitude.pressScale, transition: { duration: duration.instant } }}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================
   PRESS BUTTON — enfoncement au clic avec retour élastique.
   Wrapper autour d'un <button> ou <a> existant.
   ================================================================ */
export function PressButton({ children, className = '', onClick, ...props }) {
  const reduce = useReducedMotion();
  if (reduce) return <button className={className} onClick={onClick} {...props}>{children}</button>;
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileTap={{ scale: amplitude.pressScale, transition: { duration: duration.instant, ease: easing.standard } }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ================================================================
   STAGGER LIST — liste dont les enfants apparaissent en cascade.
   Usage : <StaggerList items={[...]} render={(item) => <Card item={item} />} />
   ================================================================ */
export function StaggerList({ items = [], render, className = '', gap = 'gap-4' }) {
  const reduce = useReducedMotion();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
  };
  return (
    <motion.ul
      className={`list-none p-0 m-0 ${gap} ${className}`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {items.map((it, i) => (
        <motion.li key={i} variants={item}>
          {render(it, i)}
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ================================================================
   STAGGER / STAGGER ITEM — apparition en cascade d'une liste au montage
   (quand les données arrivent). Wrappers legers, transform/opacity only,
   neutres si prefers-reduced-motion. Conserve le layout du conteneur
   (grid/flex/space-y) : on ne fait qu'envelopper chaque élément.
   ================================================================ */
export function Stagger({ children, className = '', gap = 0.05, as = 'div' }) {
  const reduce = useReducedMotion();
  const M = motion[as] ?? motion.div;
  return (
    <M
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : gap, delayChildren: 0.03 } } }}
      initial="hidden"
      animate="show"
    >
      {children}
    </M>
  );
}

export function StaggerItem({ children, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================
   GLOW BUTTON — bouton avec halo lumineux animé au hover.
   Réservé aux CTA principaux (pas sur tous les éléments).
   ================================================================ */
export function GlowButton({ children, className = '', onClick, color = '#2B6E64', ...props }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      onHoverStart={() => !reduce && setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: amplitude.pressScale, transition: { duration: duration.instant } }}
      {...props}
    >
      {/* Halo interne */}
      {!reduce && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: duration.fast }}
          style={{
            background: `radial-gradient(circle at 50% 120%, ${color}33 0%, transparent 70%)`,
          }}
        />
      )}
      {children}
    </motion.button>
  );
}

/* ================================================================
   REVEAL SECTION — scroll reveal réutilisable (fadeUp par défaut).
   ================================================================ */
export function Reveal({ children, delay = 0, className = '', y = 20 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: duration.base, delay, ease: easing.standard }}
    >
      {children}
    </motion.div>
  );
}
