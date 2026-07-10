import { useEffect, useRef } from 'react';

/**
 * SAISIE OTP — 6 cases individuelles (brief §2.3).
 * Focus séquentiel (chaque case s'illumine au passage), saisie chiffre-par-chiffre,
 * Backspace intelligent, collage d'un code complet, navigation clavier (flèches).
 * `error` déclenche un shake (géré par le parent via classe .shake sur le conteneur).
 * `onComplete` appelé quand les 6 chiffres sont saisis.
 */
export default function OtpInput({ value = '', onChange, length = 6, onComplete, disabled }) {
  const refs = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  const setAt = (idx, char) => {
    const next = digits.slice();
    next[idx] = char;
    onChange(next.join('').replace(/\s/g, ''));
  };

  const onKey = (idx) => (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[idx]) setAt(idx, '');
      else if (idx > 0) { setAt(idx - 1, ''); refs.current[idx - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    else if (e.key === 'ArrowRight' && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const onInput = (idx) => (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setAt(idx, ''); return; }
    // Collage : répartit sur les cases suivantes.
    if (raw.length > 1) {
      const next = digits.slice();
      raw.split('').forEach((ch, k) => { if (idx + k < length) next[idx + k] = ch; });
      onChange(next.join(''));
      refs.current[Math.min(idx + raw.length, length - 1)]?.focus();
      return;
    }
    setAt(idx, raw);
    if (idx < length - 1) refs.current[idx + 1]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digits[idx]}
          onChange={onInput(idx)}
          onKeyDown={onKey(idx)}
          onFocus={(e) => e.target.select()}
          aria-label={`Chiffre ${idx + 1}`}
          className={`h-14 w-full min-w-0 rounded-card border-2 bg-surface text-center font-mono text-2xl font-semibold text-ink transition-all duration-200 outline-none
            ${digits[idx] ? 'border-primary shadow-[0_0_0_3px_rgba(43,110,100,0.10)]' : 'border-line'}
            focus:border-primary focus:shadow-[0_0_0_4px_rgba(43,110,100,0.15)] focus:scale-105`}
        />
      ))}
    </div>
  );
}
