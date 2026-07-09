import { useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Wallet, ArrowUpRight } from 'lucide-react';
import RotationRing from './RotationRing';
import { duration, easing } from '../motion/tokens';

gsap.registerPlugin(ScrollTrigger);

const MEMBERS = [
  { name: 'Awa Diop' }, { name: 'Modou Fall' }, { name: 'Bineta Sow' },
  { name: 'Ousmane Ndiaye' }, { name: 'Fatou Ba' }, { name: 'Cheikh Diallo' },
];

const STEPS = [
  { n: '01', t: 'Créez ou rejoignez un groupe', d: "Lancez votre tontine (montant, fréquence, rotation) ou entrez dans une existante avec un code d'invitation." },
  { n: '02', t: 'Déclarez votre cotisation', d: "Faites votre transfert Wave / Orange Money, puis saisissez la référence reçue par SMS. Aucune saisie de solde, aucune fausse info." },
  { n: '03', t: 'Le bénéficiaire confirme', d: "La personne qui reçoit vérifie son solde et confirme — ou conteste. Un paiement n'est validé que si deux personnes sont d'accord." },
];

function Fragment({ step }) {
  if (step === 0) {
    return (
      <div className="card w-full max-w-sm p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-card bg-primary-soft text-primary"><Users size={18} /></div>
          <div className="flex-1"><p className="font-semibold">Tontine des Amis</p><p className="text-xs text-ink-soft">rotative · mensuelle</p></div>
          <span className="pill bg-primary-soft text-primary">Ouvert</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-alt"><div className="h-full w-3/5 rounded-pill bg-primary" /></div>
        <p className="mt-1 text-right text-xs text-ink-faint">3/6 membres · <span className="font-mono">25 000 FCFA</span></p>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="card w-full max-w-sm p-5">
        <p className="text-xs text-ink-soft">Montant à transférer à Modou Fall</p>
        <p className="font-mono text-2xl font-semibold">25 000 FCFA</p>
        <div className="mt-3 rounded-card border border-line px-3 py-2 font-mono text-sm">WV-8H2K3P</div>
        <div className="mt-3 grid place-items-center rounded-pill bg-primary py-2.5 text-sm font-semibold text-white">Déclarer le paiement</div>
        <p className="mt-3 text-center"><span className="pill bg-gold-soft text-gold">Déclaré · en attente de validation</span></p>
      </div>
    );
  }
  return (
    <div className="card w-full max-w-sm p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft text-gold"><Wallet size={18} /></div>
        <p className="text-sm">Ousmane a déclaré <span className="font-mono">25 000 FCFA</span>. Vérifiez votre solde puis confirmez.</p>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1 grid place-items-center rounded-pill border border-danger py-2 text-xs font-semibold text-danger">Je n'ai rien reçu</div>
        <div className="flex-1 grid place-items-center rounded-pill bg-primary py-2 text-xs font-semibold text-white">J'ai bien reçu</div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-success"><ArrowUpRight size={14} /> Cotisation validée · score +1</p>
    </div>
  );
}

export default function HowItWorksStory() {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=2200',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => setProgress(self.progress),
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  // Fallback sans mouvement : les 3 étapes empilées, lisibles, sans pin.
  if (reduce) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-20">
        <h2 className="mb-12 text-center font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">Comment ça marche</h2>
        <div className="space-y-10">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="flex-1"><span className="font-mono text-sm text-gold">{s.n}</span><h3 className="mt-1 text-xl font-semibold">{s.t}</h3><p className="mt-2 max-w-md text-ink-soft">{s.d}</p></div>
              <Fragment step={i} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const active = Math.min(Math.floor(progress * 3 + 0.001), 2);
  const ringFill = 0.12 + progress * 0.85;

  return (
    <section ref={sectionRef} className="relative bg-bg">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-16">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">Comment ça marche</h2>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-pill transition-all duration-300 ${i === active ? 'w-8 bg-primary' : 'w-4 bg-surface-alt'}`} />)}
          </div>
        </div>
        <p className="mb-10 text-ink-soft">Le flux P2P déclaratif se déroule sous vos yeux — continuez à scroller.</p>

        <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
          {/* Étapes : l'active est mise en avant */}
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="transition-all duration-500" style={{ opacity: i === active ? 1 : 0.32, transform: i === active ? 'translateX(0)' : 'translateX(-6px)' }}>
                <span className="font-mono text-sm text-gold">{s.n}</span>
                <h3 className="mt-1 text-2xl font-semibold">{s.t}</h3>
                {i === active && <p className="mt-2 max-w-md text-ink-soft">{s.d}</p>}
              </div>
            ))}
          </div>

          {/* Fragment d'UI (crossfade) + Cercle qui se remplit */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative h-64 w-full max-w-sm">
              <AnimatePresence mode="wait">
                <motion.div key={active}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.97 }}
                  transition={{ duration: duration.base, ease: easing.standard }}
                  className="absolute inset-0 flex items-center justify-center">
                  <Fragment step={active} />
                </motion.div>
              </AnimatePresence>
            </div>
            <RotationRing members={MEMBERS} progress={ringFill} beneficiaryIndex={1} centerLabel="Progression" centerValue={`${Math.round(ringFill * 100)}%`} size={220} />
          </div>
        </div>
      </div>
    </section>
  );
}
