import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { duration, easing } from '../motion/tokens';
import AmbientMesh from './AmbientMesh';
import AuthShowcase from './AuthShowcase';

/**
 * GABARIT DES PAGES AUTH — split-screen (brief « Site Vivant » §2 + correction #3).
 * Desktop (lg+) : formulaire à gauche, panneau narratif vivant à droite.
 * Mobile : bandeau `AuthShowcase compact` en haut + formulaire dessous.
 *
 * Correction #3 : UN SEUL fond clair continu (`opal-bg`) sur toute la page + un motif
 * unique plus présent à droite (côté visuel) qui s'estompe en dégradé vers le formulaire.
 * Plus de bloc sombre collé au formulaire → aucune coupure verticale : les deux zones
 * font partie du même espace continu.
 *
 * `showcaseStep` : optionnel — pilote l'arc du panneau depuis un wizard (inscription).
 */
export default function AuthLayout({ children, showcaseStep = null }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-bg lg:flex-row">
      {/* Fond continu : motif sur toute la page… */}
      <AmbientMesh variant="hero" />
      {/* …estompé en dégradé vers la gauche (formulaire) → « trace atténuée » qui s'invite
          depuis le panneau visuel, sans ligne de démarcation. Sert aussi de scrim (AA). */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(100deg, #F6F8F7 0%, rgba(246,248,247,0.72) 34%, rgba(246,248,247,0.28) 55%, rgba(246,248,247,0) 72%)' }}
        aria-hidden
      />

      {/* ===== Panneau formulaire (landmark <main>) ===== */}
      <main className="relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-8 lg:px-12"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
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

      {/* ===== Panneau narratif — desktop uniquement (transparent, même fond continu) ===== */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        <AuthShowcase step={showcaseStep} />
      </div>
    </div>
  );
}
