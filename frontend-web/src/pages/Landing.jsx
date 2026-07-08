import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Coins } from 'lucide-react';
import RotationRing from '../components/RotationRing';

const RING_MEMBERS = [
  { name: 'Awa Diop' }, { name: 'Modou Fall' }, { name: 'Bineta Sow' },
  { name: 'Ousmane Ndiaye' }, { name: 'Fatou Ba' }, { name: 'Cheikh Diallo' },
];

export default function Landing() {
  const reduce = useReducedMotion();
  const stagger = (i) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] } });
  const ringIn = reduce ? {} : { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Nav sobre */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-card bg-shimmer text-white"><Coins size={16} /></span>
            <span className="font-fraunces text-lg font-semibold">TontineSecure</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Se connecter</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm">S'inscrire</Link>
          </nav>
        </div>
      </header>

      {/* HERO — le Cercle EST le visuel */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div className="max-w-xl">
          <motion.span {...stagger(0)} className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            Épargne rotative · Natt · Mbotaay
          </motion.span>

          <motion.h1 {...stagger(1)} className="mt-5 font-fraunces text-[clamp(2.75rem,6vw,5.25rem)] font-medium leading-[1.05] tracking-tight">
            Votre tontine mérite mieux qu'un <em className="italic text-primary">carnet</em>.
          </motion.h1>

          <motion.p {...stagger(2)} className="mt-6 text-lg leading-relaxed text-ink-soft">
            Créez ou rejoignez une tontine, cotisez en Mobile Money, et laissez chaque paiement
            se confirmer <span className="font-medium text-ink">entre deux personnes</span> avant
            d'être validé. La confiance de toujours, la clarté du numérique.
          </motion.p>

          <motion.div {...stagger(3)} className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-3 text-base shadow-soft">
              Créer ma tontine <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              ou rejoindre avec un code
            </Link>
          </motion.div>

          <motion.p {...stagger(4)} className="mt-8 flex items-center gap-2 text-sm text-ink-faint">
            <span className="font-mono text-ink">450 000 FCFA</span> déjà en rotation dans la démo · 0 litige non résolu
          </motion.p>
        </div>

        {/* Cercle de Rotation */}
        <motion.div {...ringIn} className="flex justify-center md:justify-end">
          <div className="hidden md:block"><RotationRing members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={400} /></div>
          <div className="md:hidden"><RotationRing members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={300} /></div>
        </motion.div>
      </section>

      {/* Repère : reste de la page à venir après validation du hero */}
      <div className="mx-auto max-w-6xl px-5 pb-16 text-center text-xs text-ink-faint">
        ↓ La suite de la page (problème · comment ça marche · confiance · score · témoignages · FAQ · CTA) arrive après validation du hero.
      </div>
    </div>
  );
}
