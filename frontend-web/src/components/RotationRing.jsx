import { motion, useReducedMotion } from 'framer-motion';
import { duration, easing } from '../motion/tokens';

/**
 * ÉLÉMENT SIGNATURE — « Cercle de Rotation ».
 * Membres en couronne, arc de progression (dégradé shimmer), bénéficiaire mis en
 * avant. `animate` (landing) : les avatars apparaissent en stagger, l'arc se
 * dessine (stroke-dashoffset), une lueur orbite en continu. Sans `animate` (app) :
 * rendu statique inchangé.
 */
export default function RotationRing({
  members = [], progress = 0, beneficiaryIndex = 0, centerLabel, centerValue, size = 340, animate = false,
}) {
  const reduce = useReducedMotion();
  const doAnim = animate && !reduce;

  const n = Math.max(members.length, 1);
  const R = size / 2;
  const stroke = Math.max(size * 0.028, 6);
  const av = Math.max(Math.min(size * 0.085, 22), 12);
  const arcR = R - av - 4;
  const circ = 2 * Math.PI * arcR;
  const dash = circ * Math.min(Math.max(progress, 0), 1);

  const initials = (name) => name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <div className="absolute rounded-full bg-primary/5 blur-2xl" style={{ inset: size * 0.08 }} />

      {/* Lueur qui orbite (mode animé) */}
      {doAnim && (
        <div className="absolute inset-0" style={{ animation: 'spin 9s linear infinite' }}>
          <div className="absolute rounded-full bg-gold blur-md"
            style={{ width: av, height: av, left: R - av / 2, top: R - arcR - av / 2, opacity: 0.5 }} />
        </div>
      )}

      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="ringShimmer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8DA9C4" />
            <stop offset="0.5" stopColor="#2B6E64" />
            <stop offset="1" stopColor="#C6974F" />
          </linearGradient>
        </defs>
        <circle cx={R} cy={R} r={arcR} fill="none" stroke="#EAF0EF" strokeWidth={stroke} />
        {doAnim ? (
          <motion.circle
            cx={R} cy={R} r={arcR} fill="none" stroke="url(#ringShimmer)" strokeWidth={stroke} strokeLinecap="round"
            transform={`rotate(-90 ${R} ${R})`} strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: duration.slow + 0.3, ease: easing.standard, delay: 0.2 }}
          />
        ) : (
          <circle
            cx={R} cy={R} r={arcR} fill="none" stroke="url(#ringShimmer)" strokeWidth={stroke} strokeLinecap="round"
            transform={`rotate(-90 ${R} ${R})`} strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }}
          />
        )}
      </svg>

      {members.map((m, i) => {
        const a = (-90 + i * (360 / n)) * (Math.PI / 180);
        const cx = R + arcR * Math.cos(a);
        const cy = R + arcR * Math.sin(a);
        const isBenef = i === beneficiaryIndex;
        const Slot = doAnim ? motion.div : 'div';
        const animProps = doAnim
          ? { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, transition: { duration: duration.base, ease: easing.standard, delay: 0.35 + i * 0.09 } }
          : {};
        return (
          <Slot key={i} className="absolute flex items-center justify-center"
            style={{ left: cx - av, top: cy - av, width: av * 2, height: av * 2 }} {...animProps}>
            {isBenef && <span className="absolute inset-0 rounded-full bg-gold/25 animate-ping" style={{ animationDuration: '2.4s' }} />}
            <div className={`relative grid place-items-center rounded-full border-2 font-semibold shadow-soft ${
              isBenef ? 'border-gold bg-gold text-white' : 'border-line bg-surface text-ink-soft'
            }`} style={{ width: av * 2, height: av * 2, fontSize: av * 0.6 }}>
              {initials(m.name)}
            </div>
          </Slot>
        );
      })}

      <div className="absolute inset-0 grid place-items-center">
        <div className="grid place-items-center rounded-full bg-surface text-center shadow-lift"
          style={{ width: arcR * 1.42, height: arcR * 1.42 }}>
          {centerLabel && <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{centerLabel}</span>}
          {centerValue && <span className="mt-1 font-mono text-2xl font-semibold text-primary">{centerValue}</span>}
        </div>
      </div>
    </div>
  );
}
