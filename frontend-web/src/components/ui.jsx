import { useEffect, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Inbox } from 'lucide-react';
import { CONTRIB_STATUS } from '../lib/status';
import { duration, easing, variants } from '../motion/tokens';

export function Spinner({ className = '' }) {
  return (
    <div className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary ${className}`} />
  );
}

export function Loading({ label = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-soft">
      <Spinner /><span className="text-sm">{label}</span>
    </div>
  );
}

export function Pill({ children, className = '' }) {
  return <span className={`pill ${className}`}>{children}</span>;
}

export function StatusPill({ status }) {
  const s = CONTRIB_STATUS[status] ?? CONTRIB_STATUS.a_payer;
  return <span key={status} className={`pill badge-pop ${s.cls}`}>{s.label}</span>;
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2 py-14 text-center"
      variants={variants.fadeUp}
      initial="hidden"
      animate="show"
    >
      <div className="mb-1 grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
        {isValidElement(icon) ? icon : <Inbox size={26} strokeWidth={1.8} />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-sm text-sm text-ink-soft">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  );
}

export function Field({ label, error, hint, children }) {
  // Élément <label> englobant -> association implicite avec le contrôle de formulaire
  // qu'il contient (accessibilité : inputs correctement étiquetés, AA).
  return (
    <label className="mb-4 block">
      {label && <span className="label">{label}</span>}
      {children}
      {(error || hint) && (
        <AnimatePresence>
          {(error || hint) && (
            <motion.span
              key={error || hint}
              className={`mt-1 block text-xs ${error ? 'text-danger' : 'text-ink-soft'}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.fast, ease: easing.standard }}
            >
              {error || hint}
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </label>
  );
}

/**
 * Modal glassmorphism animée — scale + opacity à l'entrée/sortie.
 * Overlay : backdrop-blur. Panneau : glass-elevated (multi-layer blur).
 */
export function Modal({ open, onClose, title, children, actions }) {
  /* Fermeture au clavier Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />

          {/* Panneau */}
          <motion.div
            className="relative w-full max-w-md glass-elevated rounded-sheet p-6"
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-card text-ink-faint hover:bg-surface-alt hover:text-ink transition-colors"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            {title && <h3 className="mb-3 pr-8 text-xl font-semibold text-ink">{title}</h3>}
            <div className="text-sm text-ink-soft">{children}</div>
            {actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProgressBar({ value = 0, tone = 'bg-primary' }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-alt progress-shimmer">
      <motion.div
        className={`h-full rounded-pill ${tone}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: duration.slow, ease: easing.gentle }}
      />
    </div>
  );
}

export function Avatar({ name = '?', size = 40 }) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const tones = ['bg-primary', 'bg-accent', 'bg-gold', 'bg-success', 'bg-danger'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % tones.length;
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${tones[Math.abs(h)]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

/**
 * Toast glassmorphism — glisse depuis le bas avec backdrop-blur.
 * Variantes : success (vert), error (rouge), info (défaut sombre).
 */
export function Toast({ message, variant = 'info', onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  const toastCls = {
    info: 'bg-ink text-white',
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
  }[variant] ?? 'bg-ink text-white';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            className={`pointer-events-auto flex items-center gap-3 rounded-pill px-5 py-3 text-sm shadow-raised ${toastCls} glass-elevated`}
            initial={{ opacity: 0, y: 24, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.93 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            role="status"
            aria-live="polite"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
