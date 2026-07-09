import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { duration, easing } from '../motion/tokens';
import { formatFCFA } from '../lib/queries';

/**
 * FRISE DE FIABILITÉ (brief §3.5) — petite frise temporelle des cotisations qui
 * construisent le score. Chaque point = une cotisation ; sa couleur porte le sens
 * (validé = success, en retard/litige = danger, à payer = gold). JAMAIS de rouge
 * d'ambiance : le danger n'apparaît que sur un point réellement problématique.
 * Hover / focus clavier → tooltip glassmorphism avec le détail du cycle concerné.
 *
 * Alimentée par les données réelles (`useMyHistory`) — pas de score/point inventé.
 */

const DOT = {
  valide: 'bg-success',
  declare_paye: 'bg-gold',
  en_attente: 'bg-gold',
  a_payer: 'bg-gold',
  en_retard: 'bg-danger',
  litige: 'bg-danger',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function ScoreTimeline({ cotisations = [] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);

  // 14 dernières cotisations, ordre chronologique (les plus anciennes à gauche).
  const points = [...cotisations]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-14);

  if (points.length === 0) {
    return <p className="text-xs text-ink-faint">Vos cotisations apparaîtront ici au fil des tours.</p>;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 overflow-visible py-2">
        {/* Ligne de fond */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" aria-hidden />

        {points.map((c, i) => {
          const tone = DOT[c.statut] ?? 'bg-surface-alt';
          const isActive = active === i;
          return (
            <div key={c.id ?? i} className="relative z-10 flex-1">
              <motion.button
                type="button"
                className={`mx-auto block h-3.5 w-3.5 rounded-full ring-2 ring-surface ${tone} ${isActive ? 'scale-150' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((v) => (v === i ? null : v))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((v) => (v === i ? null : v))}
                onClick={() => setActive((v) => (v === i ? null : i))}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={reduce ? false : { scale: isActive ? 1.5 : 1, opacity: 1 }}
                transition={{ duration: duration.fast, ease: easing.standard, delay: reduce ? 0 : i * 0.03 }}
                aria-label={`Cotisation du ${fmtDate(c.created_at)}, ${formatFCFA(c.montant)}`}
              />

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="glass-elevated absolute bottom-6 left-1/2 z-20 w-40 -translate-x-1/2 rounded-card p-2.5 text-center shadow-lift"
                    initial={{ opacity: 0, y: 6, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: duration.fast, ease: easing.standard }}
                    role="tooltip"
                  >
                    <p className="font-mono text-sm font-semibold text-ink">{formatFCFA(c.montant)}</p>
                    <p className="truncate text-xs text-ink-soft">{c.cycle?.group?.nom ?? 'Tontine'} · tour {c.cycle?.numero_periode ?? '—'}</p>
                    <p className="text-[11px] text-ink-faint">{fmtDate(c.created_at)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
