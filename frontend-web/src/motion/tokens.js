/**
 * Tokens de mouvement — source unique du langage d'animation de TontineSecure.
 * Interdiction d'improviser une durée ou un easing dans un composant : tout
 * puise ici (comme les tokens de couleur). Utilisés par Framer Motion (JS) et,
 * par cohérence, par les keyframes CSS de l'arrière-plan ambiant.
 */

export const duration = {
  instant: 0.12, // feedback de clic, toggle
  fast: 0.25, // hover, petits éléments
  base: 0.45, // apparition de card, transition de section
  slow: 0.8, // hero, transitions de page
  ambient: 12, // cycle d'un blob d'arrière-plan (secondes, boucle lente)
};

export const easing = {
  standard: [0.22, 1, 0.36, 1], // easeOutExpo-like — easing signature, par défaut partout
  bounce: [0.68, -0.4, 0.32, 1.4], // réservé aux célébrations (cotisation validée)
  gentle: [0.4, 0, 0.2, 1], // scroll reveals, mouvement ambiant
};

export const amplitude = {
  hoverLift: -4, // px, translateY au hover d'une card
  pressScale: 0.97, // scale au clic
  magneticPull: 18, // px, déplacement max d'un bouton « magnétique »
};

// Variantes Framer Motion réutilisables, câblées sur les tokens.
export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
  },
  press: { scale: amplitude.pressScale, transition: { duration: duration.instant, ease: easing.standard } },
  lift: { y: amplitude.hoverLift, transition: { duration: duration.fast, ease: easing.standard } },
};

export default { duration, easing, amplitude, variants };
