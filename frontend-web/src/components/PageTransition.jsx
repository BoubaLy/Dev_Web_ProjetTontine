import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { duration, easing } from '../motion/tokens';

/**
 * MOMENT SIGNATURE ④ — transitions de page.
 *
 * Chaque route entre avec un fondu + légère montée (y: 16 → 0) câblé sur les
 * tokens de durée/easing. Animation d'entrée seule (robuste avec <Outlet>).
 * La sortie est omise intentionnellement (évite les artefacts de layout
 * quand on navigue vers une page de taille différente).
 *
 * Neutralisé si prefers-reduced-motion.
 */
export default function PageTransition() {
  const reduce = useReducedMotion();
  const location = useLocation();
  const outlet = useOutlet();

  if (reduce) return outlet;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 14, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: duration.base, ease: easing.standard }}
    >
      {outlet}
    </motion.div>
  );
}
