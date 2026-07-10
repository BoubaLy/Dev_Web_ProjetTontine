import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * FOND AMBIANT DU SITE — « motif discret » (remplace les anciens blobs colorés qui
 * concurrençaient le texte). UNE seule teinte très peu opaque sur `bg` propre :
 *   - grille de points qui « respire » (opacity),
 *   - vagues SVG tracées en `stroke` (pas de `fill`) qui dérivent lentement.
 *
 * Jamais concurrent du texte : opacité basse (≈ 5-10 % effectif), teinte unique,
 * transform/opacity uniquement. Couche `absolute inset-0 -z-10` (parent en
 * `relative isolate`), `pointer-events-none`, `overflow-hidden` interne → 0 scroll
 * horizontal. Animation coupée hors-écran (IntersectionObserver) et gelée si
 * `prefers-reduced-motion`.
 *
 * Variantes selon la densité de la page :
 *   light (dashboard, groupe) · soft (pages denses) · hero (landing) · deep (panneau sombre).
 */

const VARIANTS = {
  // App connectée : trame de points STATIQUE, sans vagues → pro & épuré, zéro mouvement.
  light: { tint: '#2B6E64', opacity: 0.4, waves: 0, dot: 28, still: true },
  soft: { tint: '#2B6E64', opacity: 0.3, waves: 0, dot: 30, still: true },
  // Landing / auth : motif complet vivant (points qui respirent + vagues).
  hero: { tint: '#2B6E64', opacity: 0.55, waves: 3, dot: 24 },
  deep: { tint: '#8FE0D3', opacity: 0.4, waves: 3, dot: 26 },
};

const WAVES = [
  { top: 12, periods: 3, amp: 34, cls: 'pattern-wave-1' },
  { top: 44, periods: 4, amp: 26, cls: 'pattern-wave-2' },
  { top: 70, periods: 2, amp: 30, cls: 'pattern-wave-3' },
];

// Onde sinusoïdale sur 2000 unités = 2 copies identiques (période entière) → boucle
// sans couture avec translateX(-50%).
function sine(amp, periods) {
  const W = 2000;
  const yBase = 100;
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const x = (W / 120) * i;
    const y = yBase + amp * Math.sin((x / W) * periods * 2 * 2 * Math.PI);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d.trim();
}

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

  const v = VARIANTS[variant] ?? VARIANTS.light;
  const play = onScreen && !reduce ? 'running' : 'paused';
  const waves = WAVES.slice(0, v.waves);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ color: v.tint, opacity: v.opacity }}
    >
      {/* Grille de points — respire (landing) ou statique (app connectée, `still`) */}
      <svg className={`${v.still ? '' : 'pattern-dots'} absolute inset-0 h-full w-full`} style={{ animationPlayState: play }}>
        <defs>
          <pattern id={`dg-${variant}`} width={v.dot} height={v.dot} patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1.3" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dg-${variant})`} />
      </svg>

      {/* Vagues (stroke) qui dérivent lentement, à différentes vitesses/sens */}
      {waves.map((w, i) => (
        <svg
          key={i}
          className={`pattern-wave ${w.cls} absolute`}
          viewBox="0 0 2000 200"
          preserveAspectRatio="none"
          style={{ top: `${w.top}%`, left: 0, width: '200%', height: '28%', animationPlayState: play }}
        >
          <path d={sine(w.amp, w.periods)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.55" />
        </svg>
      ))}
    </div>
  );
}
