import { useState } from 'react';
import Celebration from '../components/Celebration';

/** Démo isolée du moment ③ « célébration » (validation avant câblage réel). */
export default function CelebrationDemo() {
  const [show, setShow] = useState(null); // 'cotisation' | 'cycle' | null

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 text-center">
      <div className="max-w-lg">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Motion system · démo isolée</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">Célébration</h1>
        <p className="mt-4 text-ink-soft">
          Déclenchée quand une cotisation est validée ou qu’un cycle est clôturé : pulse
          « opal shimmer », éclat de particules fait main (transform/opacity, <span className="font-mono">pas</span> de
          confetti.js) et compteur de score animé. Coupée si <span className="font-mono">prefers-reduced-motion</span>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={() => setShow('cotisation')}>Cotisation validée</button>
          <button className="btn-secondary" onClick={() => setShow('cycle')}>Cycle clôturé</button>
        </div>
      </div>

      <Celebration
        open={show === 'cotisation'}
        variant="cotisation"
        score={87}
        scoreDelta={4}
        onDone={() => setShow(null)}
      />
      <Celebration
        open={show === 'cycle'}
        variant="cycle"
        onDone={() => setShow(null)}
      />
    </div>
  );
}
