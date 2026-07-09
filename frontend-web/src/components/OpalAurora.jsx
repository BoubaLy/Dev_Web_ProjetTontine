import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * ARRIÈRE-PLAN VIVANT « Opal Aurora » — Aurora UI 2026.
 * 5 blobs en radial-gradient fortement floutés (couleurs Opal) qui dérivent
 * lentement + un grain SVG (feTurbulence) pour casser la froideur d'un dégradé
 * lisse. Couche de vignette douce pour garder la lisibilité du texte au-dessus.
 *
 * Perf : transform/opacity/filter UNIQUEMENT ; animation coupée hors-écran
 * (IntersectionObserver) ; désactivée si prefers-reduced-motion.
 *
 * Variantes : "hero" (fond clair + opacité plus forte), "section" (subtil),
 * "dark" (dégradés adaptés au fond sombre bg-deep).
 *
 * À poser en `absolute inset-0` derrière le hero et les sections suivantes.
 */
export default function OpalAurora({ className = '', variant = 'hero' }) {
  const ref = useRef(null);
  const [onScreen, setOnScreen] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const play = onScreen && !reduce ? 'running' : 'paused';

  const isDark = variant === 'dark';
  const grainBlend = isDark ? 'mix-blend-screen' : 'mix-blend-multiply';
  const grainOpacity = isDark ? 'opacity-[0.04]' : 'opacity-[0.06]';

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* === Blobs Aurora (5 couches superposées) === */}
      <span className={`aurora-blob aurora-a ${isDark ? 'aurora-dark-a' : ''}`} style={{ animationPlayState: play }} />
      <span className={`aurora-blob aurora-b ${isDark ? 'aurora-dark-b' : ''}`} style={{ animationPlayState: play }} />
      <span className={`aurora-blob aurora-c ${isDark ? 'aurora-dark-c' : ''}`} style={{ animationPlayState: play }} />
      <span className={`aurora-blob aurora-d ${isDark ? 'aurora-dark-d' : ''}`} style={{ animationPlayState: play }} />
      {/* Blob e : couche supplémentaire pour l'Aurora UI 2026 (accent chaud) */}
      <span className={`aurora-blob aurora-e ${isDark ? 'aurora-dark-e' : ''}`} style={{ animationPlayState: play }} />

      {/* Grain tactile (SVG feTurbulence — performance native) */}
      <svg className={`absolute inset-0 h-full w-full ${grainOpacity} ${grainBlend}`} aria-hidden>
        <filter id="opalGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#opalGrain)" />
      </svg>

      {/* Vignette douce (radial) pour garder le texte lisible */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 70% 60% at 50% 100%, transparent 0%, rgba(15,30,28,0.4) 100%)'
            : 'radial-gradient(ellipse 80% 70% at 50% 0%, transparent 30%, rgba(246,248,247,0.6) 100%)',
        }}
      />
    </div>
  );
}
