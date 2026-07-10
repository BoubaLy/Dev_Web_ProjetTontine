import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * FOND AMBIANT DU SITE — « Opal Aurora » décliné par contexte.
 * Même système partout (blobs flous des classes `.aurora-*`, grain SVG, dérive lente
 * via les mêmes keyframes/durées désynchronisées), mais la COMPOSITION change selon
 * la densité de la page (brief « Site Vivant » §1) :
 *   - `light`    : pages de contenu (dashboard, détail de groupe) — 3 blobs, discret.
 *   - `soft`     : pages denses en données (historique, admin, notifications) — 2 blobs,
 *                  très atténué (la lisibilité prime).
 *   - `showcase` : moments d'accroche (panneau auth) — 5 blobs, intensité marquée.
 *   - `deep`     : overlays sur `bg-deep` (célébration de cycle).
 *
 * Garde-fous (checklist §3) : `pointer-events-none`, couche `absolute inset-0` en `-z-10`
 * SOUS le contenu — le parent doit porter `relative isolate` (isolation = le fond reste
 * derrière le contenu de la page sans jamais passer devant, ni fuir derrière la sidebar).
 * **`overflow-hidden` porté par le composant lui-même** → aucun blob ne crée de scroll
 * horizontal. PAS de vignette dure (source de la « délimitation » visible précédemment).
 * Animation coupée hors-écran (IntersectionObserver) et gelée si `prefers-reduced-motion`.
 */

const COMPOSITIONS = {
  light: { blobs: ['a', 'b', 'c'], dark: false, opacity: 0.5, grain: 0.05 },
  soft: { blobs: ['a', 'c'], dark: false, opacity: 0.3, grain: 0.04 },
  showcase: { blobs: ['a', 'b', 'c', 'd', 'e'], dark: false, opacity: 0.95, grain: 0.06 },
  deep: { blobs: ['a', 'b', 'c', 'd'], dark: true, opacity: 0.85, grain: 0.05 },
};

export default function AmbientMesh({ variant = 'light', className = '' }) {
  const ref = useRef(null);
  const [onScreen, setOnScreen] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const play = onScreen && !reduce ? 'running' : 'paused';
  const c = COMPOSITIONS[variant] ?? COMPOSITIONS.light;
  const grainBlend = c.dark ? 'mix-blend-screen' : 'mix-blend-multiply';

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ opacity: c.opacity }}
    >
      {c.blobs.map((k) => (
        <span
          key={k}
          className={`aurora-blob aurora-${k} ${c.dark ? `aurora-dark-${k}` : ''}`}
          style={{ animationPlayState: play }}
        />
      ))}

      {/* Grain tactile (feTurbulence natif — pas de coût JS) */}
      <svg className={`absolute inset-0 h-full w-full ${grainBlend}`} style={{ opacity: c.grain }} aria-hidden>
        <filter id={`grain-${variant}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${variant})`} />
      </svg>
    </div>
  );
}
