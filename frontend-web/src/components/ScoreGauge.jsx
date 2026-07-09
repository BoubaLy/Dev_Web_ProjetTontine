import { motion, useReducedMotion } from 'framer-motion';
import { duration, easing } from '../motion/tokens';
import { AnimatedNumber } from './motion';

/**
 * JAUGE DE SCORE DE FIABILITÉ (brief §3.5).
 * Anneau qui se remplit, teinte interpolée `opal-accent` → `opal-gold` selon le
 * niveau. JAMAIS de rouge, même pour un score bas : on n'humilie pas l'utilisateur
 * (le rouge reste réservé aux erreurs système). Le chiffre monte en count-up
 * synchronisé avec l'arc. reduced-motion : arc plein figé + chiffre direct
 * (géré par AnimatedNumber).
 */

// Interpolation accent(#8DA9C4) → teal(#2B6E64) → gold(#C6974F) selon le score.
function scoreColor(score) {
  const s = Math.max(0, Math.min(100, score)) / 100;
  const stops = [
    [141, 169, 196], // accent (bas)
    [43, 110, 100],  // teal (moyen)
    [198, 151, 79],  // gold (haut)
  ];
  const seg = s < 0.5 ? 0 : 1;
  const t = s < 0.5 ? s / 0.5 : (s - 0.5) / 0.5;
  const [a, b] = [stops[seg], stops[seg + 1]];
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export default function ScoreGauge({ score = 0, size = 96, label = 'Fiabilité' }) {
  const reduce = useReducedMotion();
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const stroke = Math.max(size * 0.09, 7);
  const R = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * R;
  const color = scoreColor(s);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="#EAF0EF" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cx} r={R} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={reduce ? { strokeDashoffset: circ * (1 - s / 100) } : { strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - s / 100) }}
          transition={reduce ? { duration: 0 } : { duration: duration.slow, ease: easing.standard }}
        />
      </svg>
      <div className="text-center leading-none">
        <span className="font-mono text-xl font-semibold" style={{ color }}>
          <AnimatedNumber value={s} format={(v) => Math.round(v)} />
        </span>
        <span className="text-sm font-medium" style={{ color }}>%</span>
        {label && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>}
      </div>
    </div>
  );
}
