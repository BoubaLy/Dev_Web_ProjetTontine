import { useState } from 'react';
import { CotisationSuccessMotion, CycleCompleteMotion, ScoreLevelUpMotion } from '../components/celebrations';

/** Démo isolée des 3 moments de célébration (brief §5) — validation avant/après câblage. */
export default function CelebrationDemo() {
  const [show, setShow] = useState(null); // 'cotisation' | 'cycle' | 'score' | null

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 text-center">
      <div className="max-w-lg">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Motion system · démo isolée</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">Les 3 célébrations</h1>
        <p className="mt-4 text-ink-soft">
          Les SEULS effets « spectaculaires » de l’app (onde, confettis, glow) vivent ici.
          Coche qui se dessine, arc qui boucle, badge qui grimpe — tout en transform/opacity,
          coupé si <span className="font-mono">prefers-reduced-motion</span>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={() => setShow('cotisation')}>① Cotisation validée</button>
          <button className="btn-secondary" onClick={() => setShow('cycle')}>② Cycle clôturé</button>
          <button className="btn-secondary" onClick={() => setShow('score')}>③ Palier de score</button>
        </div>
      </div>

      <CotisationSuccessMotion open={show === 'cotisation'} onDone={() => setShow(null)} />
      <CycleCompleteMotion open={show === 'cycle'} total={250000} onDone={() => setShow(null)} />
      <ScoreLevelUpMotion open={show === 'score'} level="Excellent" score={92} onDone={() => setShow(null)} />
    </div>
  );
}
