import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * ARRIÈRE-PLAN VIVANT « Opal Aurora ».
 * 4 blobs en radial-gradient fortement floutés (couleurs Opal, faible opacité)
 * qui dérivent lentement + un grain SVG (feTurbulence) pour casser la platitude.
 * Perf : transform/opacity/filter uniquement ; animation coupée hors-écran
 * (IntersectionObserver) ; désactivée si prefers-reduced-motion.
 *
 * À poser en `absolute inset-0` derrière le hero et les 1-2 sections suivantes.
 */
export default function OpalAurora({ className = '' }) {
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

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <span className="aurora-blob aurora-a" style={{ animationPlayState: play }} />
      <span className="aurora-blob aurora-b" style={{ animationPlayState: play }} />
      <span className="aurora-blob aurora-c" style={{ animationPlayState: play }} />
      <span className="aurora-blob aurora-d" style={{ animationPlayState: play }} />

      {/* Grain tactile (très discret sur fond clair) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply">
        <filter id="opalGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#opalGrain)" />
      </svg>
    </div>
  );
}
