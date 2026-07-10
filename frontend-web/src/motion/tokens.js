/**
 * TOKENS DE MOUVEMENT — source unique du langage d'animation de TontineSecure.
 * Interdiction d'improviser une durée ou un easing dans un composant : tout
 * puise ici (comme les tokens de couleur). Utilisés par Framer Motion (JS) et,
 * par cohérence, par les keyframes CSS de l'arrière-plan ambiant.
 *
 * Hiérarchie :
 * "moment signature"-> durées slow/ambient, easing bounce/gentle
 * "micro-interaction"-> durées instant/fast, easing standard
 */

export const duration = {
  instant: 0.12,  // feedback de clic, toggle, flash
  fast: 0.25,     // hover, petits éléments, accordéon
  base: 0.45,     // apparition de card, transition de section
  slow: 0.8,      // hero, transitions de page
  xslow: 1.2,     // célébration, éléments de scène
  ambient: 12,    // cycle d'un blob d'arrière-plan (secondes, boucle lente)
};

export const easing = {
  standard: [0.22, 1, 0.36, 1],    // easeOutExpo-like — easing signature, par défaut partout
  bounce: [0.68, -0.4, 0.32, 1.4], // réservé aux célébrations (cotisation validée)
  gentle: [0.4, 0, 0.2, 1],        // scroll reveals, mouvement ambiant, Aurora
  snap: [0.85, 0, 0.15, 1],        // transitions brusques-précises (tabs, step indicator)
};

export const amplitude = {
  hoverLift: -4,       // px, translateY au hover d'une card
  pressScale: 0.97,    // scale au clic (tout btn)
  magneticPull: 18,    // px, déplacement max d'un bouton « magnétique »
  cardTilt: 6,         // degrés, tilt 3D réservé aux cards testimoniaux (pas partout !)
};

/**
 * VARIANTES FRAMER MOTION réutilisables, câblées sur les tokens.
 * Import pattern : `import { variants } from '../motion/tokens';`
 * Usage : `<motion.div variants={variants.fadeUp} initial="hidden" whileInView="show" />`
 */
export const variants = {
  /* Apparition bas -> haut (scroll reveal standard) */
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
  },
  /* Apparition droite -> gauche */
  fadeLeft: {
    hidden: { opacity: 0, x: 24 },
    show: { opacity: 1, x: 0, transition: { duration: duration.base, ease: easing.standard } },
  },
  /* Scale de 0.92 -> 1 (cards, modales) */
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.standard } },
  },
  /* Scale depuis 0 avec bounce (célébrations, icônes) */
  popIn: {
    hidden: { opacity: 0, scale: 0.4 },
    show: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.bounce } },
  },
  /* Conteneur stagger — à combiner avec fadeUp sur les enfants */
  staggerContainer: {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
  },
  /* Stagger plus rapide (listes denses) */
  staggerFast: {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  },
  /* Feedback tap : léger enfoncement */
  press: {
    scale: amplitude.pressScale,
    transition: { duration: duration.instant, ease: easing.standard },
  },
  /* Hover lift : montée douce */
  lift: {
    y: amplitude.hoverLift,
    transition: { duration: duration.fast, ease: easing.standard },
  },
};

/**
 * VIEWPORT OPTIONS — partagées pour cohérence des scroll reveals.
 * Usage : `whileInView="show" viewport={viewport.once}`
 */
export const viewport = {
  once: { once: true, margin: '-80px' },
  repeat: { once: false, margin: '-60px' },
};

export default { duration, easing, amplitude, variants, viewport };
