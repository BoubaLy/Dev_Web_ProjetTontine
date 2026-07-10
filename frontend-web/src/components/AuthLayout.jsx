import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { duration, easing } from '../motion/tokens';
import AmbientMesh from './AmbientMesh';
import AuthShowcase from './AuthShowcase';

/**
 * GABARIT DES PAGES AUTH — split-screen (brief « Site Vivant » §2.1).
 * Desktop (lg+) : formulaire à gauche, panneau narratif vivant à droite.
 * Mobile : bandeau `AuthShowcase compact` en haut + formulaire dessous (jamais supprimé,
 * juste réduit). Fond `AmbientMesh soft` derrière le formulaire, scrim implicite via la
 * surface de la carte. Safe-areas respectées.
 *
 * `showcaseStep` : optionnel — pilote l'arc du panneau depuis un wizard (inscription).
 */
export default function AuthLayout({ children, showcaseStep = null }) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row">
      {/* ===== Panneau formulaire (landmark <main>) ===== */}
      <main className="relative isolate flex flex-1 flex-col justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-12"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <AmbientMesh variant="soft" />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-sm"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.standard }}
        >
          {/* Logo (toujours visible) */}
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 lg:justify-start">
            <span className="grid h-9 w-9 place-items-center rounded-card bg-hero text-white shadow-soft"><Coins size={18} /></span>
            <span className="font-display text-lg font-semibold text-ink">TontineSecure</span>
          </Link>

          {/* Bandeau visuel compact — mobile/tablette uniquement */}
          <div className="mb-6 lg:hidden">
            <AuthShowcase compact step={showcaseStep} />
          </div>

          {children}
        </motion.div>
      </main>

      {/* ===== Panneau narratif — desktop uniquement ===== */}
      <div className="relative hidden flex-1 lg:block">
        <AuthShowcase step={showcaseStep} />
      </div>
    </div>
  );
}
