import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { duration, easing } from '../motion/tokens';

/**
 * MOMENT SIGNATURE ④ (a) — transitions de page.
 * Chaque route s'anime à l'entrée (fondu + légère montée), re-montée via la clé
 * = pathname. Animation d'entrée seule : robuste avec <Outlet> (pas de flash de
 * contenu). transform/opacity uniquement. Neutralisé si prefers-reduced-motion.
 */
export default function PageTransition() {
  const reduce = useReducedMotion();
  const location = useLocation();
  const outlet = useOutlet();

  if (reduce) return outlet;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easing.standard }}
    >
      {outlet}
    </motion.div>
  );
}
