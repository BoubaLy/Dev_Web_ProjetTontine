import OpalAurora from '../components/OpalAurora';

/** Démo isolée de l'arrière-plan « Opal Aurora » (validation avant intégration). */
export default function AuroraDemo() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <OpalAurora />
      <div className="relative grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Motion system · démo isolée</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold">Opal Aurora</h1>
          <p className="mt-4 text-ink-soft">
            Arrière-plan vivant : quatre blobs en dégradé (teal · lavande · or) qui dérivent
            lentement, floutés, à faible opacité, avec un grain SVG discret. Le texte reste
            parfaitement lisible. Animation coupée hors-écran et si <span className="font-mono">prefers-reduced-motion</span>.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-pill border border-line bg-surface/70 px-5 py-2.5 text-sm text-ink-soft backdrop-blur">
            <span className="font-mono text-primary">450 000 FCFA</span> en rotation — lisibilité conservée
          </div>
        </div>
      </div>
    </div>
  );
}
