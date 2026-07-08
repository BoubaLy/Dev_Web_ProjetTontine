import { CONTRIB_STATUS } from '../lib/status';

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
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="mb-1 grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-2xl">{icon}</div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-sm text-sm text-ink-soft">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      {children}
      {(error || hint) && <p className={`mt-1 text-xs ${error ? 'text-danger' : 'text-ink-faint'}`}>{error || hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-sheet bg-surface p-6 shadow-raised" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="mb-3 text-xl font-semibold text-ink">{title}</h3>}
        <div className="text-sm text-ink-soft">{children}</div>
        {actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ value = 0, tone = 'bg-primary' }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-alt">
      <div className={`h-full rounded-pill ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name = '?', size = 40 }) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const tones = ['bg-primary', 'bg-accent', 'bg-gold', 'bg-success', 'bg-danger'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % tones.length;
  return (
    <div className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${tones[Math.abs(h)]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}

/** Toast simple (message éphémère). */
export function Toast({ message, onDone }) {
  if (!message) return null;
  setTimeout(onDone, 3200);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-ink px-5 py-2.5 text-sm text-white shadow-raised">
      {message}
    </div>
  );
}
