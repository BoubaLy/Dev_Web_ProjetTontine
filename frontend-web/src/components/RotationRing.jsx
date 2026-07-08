/**
 * ÉLÉMENT SIGNATURE — « Cercle de Rotation ».
 * Les membres d'une tontine en couronne ; un arc (dégradé shimmer) montre la
 * progression du cycle ; le bénéficiaire du tour est mis en avant (halo doux).
 * Réutilisable : landing (hero) et app connectée.
 *
 * @param members         [{ name }]
 * @param progress        0..1 — remplissage de l'arc
 * @param beneficiaryIndex index du membre mis en avant
 * @param centerLabel      ligne haute au centre
 * @param centerValue      montant / valeur (mono)
 * @param size             diamètre en px
 */
export default function RotationRing({
  members = [], progress = 0, beneficiaryIndex = 0, centerLabel, centerValue, size = 340,
}) {
  const n = Math.max(members.length, 1);
  const R = size / 2;
  const stroke = Math.max(size * 0.02, 5);
  const av = Math.max(Math.min(size * 0.11, 40), 22); // rayon avatar
  const arcR = R - av - 6;
  const circ = 2 * Math.PI * arcR;
  const dash = circ * Math.min(Math.max(progress, 0), 1);

  const initials = (name) => name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {/* Halo de profondeur */}
      <div className="absolute rounded-full bg-primary/5 blur-2xl"
        style={{ inset: size * 0.08 }} />

      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="ringShimmer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8DA9C4" />
            <stop offset="0.5" stopColor="#2B6E64" />
            <stop offset="1" stopColor="#C6974F" />
          </linearGradient>
        </defs>
        {/* Piste */}
        <circle cx={R} cy={R} r={arcR} fill="none" stroke="#EAF0EF" strokeWidth={stroke} />
        {/* Arc de progression */}
        <circle
          cx={R} cy={R} r={arcR} fill="none" stroke="url(#ringShimmer)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${R} ${R})`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>

      {/* Avatars */}
      {members.map((m, i) => {
        const a = (-90 + i * (360 / n)) * (Math.PI / 180);
        const cx = R + arcR * Math.cos(a);
        const cy = R + arcR * Math.sin(a);
        const isBenef = i === beneficiaryIndex;
        return (
          <div key={i} className="absolute flex items-center justify-center"
            style={{ left: cx - av, top: cy - av, width: av * 2, height: av * 2 }}>
            {isBenef && <span className="absolute inset-0 rounded-full bg-gold/25 animate-ping" style={{ animationDuration: '2.4s' }} />}
            <div className={`relative grid place-items-center rounded-full border-2 font-semibold shadow-soft ${
              isBenef ? 'border-gold bg-gold text-white' : 'border-line bg-surface text-ink-soft'
            }`} style={{ width: av * 2, height: av * 2, fontSize: av * 0.6 }}>
              {initials(m.name)}
            </div>
          </div>
        );
      })}

      {/* Centre : disque + montant */}
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
