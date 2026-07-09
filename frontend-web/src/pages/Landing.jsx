import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Coins, Star, Plus, Minus } from 'lucide-react';
import RotationRing from '../components/RotationRing';
import OpalAurora from '../components/OpalAurora';
import HowItWorksStory from '../components/HowItWorksStory';
import { Avatar } from '../components/ui';
import { Magnetic } from '../components/motion';
import { duration, easing } from '../motion/tokens';

const TITLE_WORDS = ['Votre', 'tontine', 'mérite', 'mieux', "qu'un"];

const RING_MEMBERS = [
  { name: 'Awa Diop' }, { name: 'Modou Fall' }, { name: 'Bineta Sow' },
  { name: 'Ousmane Ndiaye' }, { name: 'Fatou Ba' }, { name: 'Cheikh Diallo' },
];

const TEMOIGNAGES = [
  { name: 'Awa Diop', ville: 'Dakar', txt: "Avant, on notait tout sur un carnet et il y avait toujours un doute. Là, chaque versement est confirmé par deux personnes. Plus de disputes." },
  { name: 'Modou Fall', ville: 'Thiès', txt: "J'ai reçu mon tour à temps, et tout le groupe a vu que j'avais bien reçu les fonds. C'est transparent, on se fait confiance." },
  { name: 'Bineta Sow', ville: 'Saint-Louis', txt: "Notre tontine de quartier tourne sans stress. Le score de fiabilité motive tout le monde à cotiser à temps." },
];

const FAQ = [
  ['Que se passe-t-il en cas de litige ?', "N'importe quel membre peut signaler une anomalie. L'administrateur du groupe (ou le support) arbitre, et le compte concerné est gelé le temps de l'investigation — il ne peut ni cotiser ni recevoir tant que ce n'est pas résolu."],
  ['Mes données sont-elles en sécurité ?', "Oui. La connexion est protégée, vos pièces d'identité sont chiffrées et leur accès est réservé au support. On ne collecte que le nécessaire."],
  ['Est-ce que ça marche avec Wave et Orange Money ?', "Oui. Vous effectuez votre transfert comme d'habitude, puis vous déclarez la référence reçue par SMS. Le bénéficiaire confirme la réception."],
  ['Dois-je payer un abonnement ?', "Non, l'application est gratuite (projet académique)."],
  ['Comment rejoindre une tontine existante ?', "Avec un code d'invitation que l'administrateur du groupe vous partage (WhatsApp / SMS). Vous le saisissez dans « Rejoindre »."],
];

function Reveal({ children, delay = 0, className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}


export default function Landing() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  // Parallax léger du Cercle dans le hero (l'utilisateur « pilote » l'objet).
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const ringY = useTransform(heroScroll, [0, 1], [0, -48]);
  const ringRot = useTransform(heroScroll, [0, 1], [0, 4]);
  const wordAnim = (i) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: duration.base, delay: 0.15 + i * 0.07, ease: easing.standard } });

  const stagger = (i) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] } });
  const ringIn = reduce ? {} : { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-card bg-hero text-white"><Coins size={16} /></span>
            <span className="font-display text-lg font-semibold">TontineSecure</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Se connecter</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm">S'inscrire</Link>
          </nav>
        </div>
      </header>

      {/* Fond vivant « Opal Aurora » derrière le hero + le problème */}
      <div className="relative overflow-hidden">
      <OpalAurora />
      {/* ① HERO */}
      <section ref={heroRef} className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div className="max-w-xl">
          <motion.span {...stagger(0)} className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-3 py-1 text-xs font-medium text-primary">Épargne rotative · Natt · Mbotaay</motion.span>
          <h1 className="mt-5 font-display text-[clamp(2.75rem,6vw,5.25rem)] font-medium leading-[1.05] tracking-tight">
            {TITLE_WORDS.map((w, i) => (<motion.span key={i} {...wordAnim(i)} className="mr-[0.28em] inline-block">{w}</motion.span>))}
            <motion.span {...wordAnim(TITLE_WORDS.length)} className="inline-block shimmer-text">carnet</motion.span>.
          </h1>
          <motion.p {...stagger(2)} className="mt-6 text-lg leading-relaxed text-ink-soft">
            Créez ou rejoignez une tontine, cotisez en Mobile Money, et laissez chaque paiement se confirmer <span className="font-medium text-ink">entre deux personnes</span> avant d'être validé. La confiance de toujours, la clarté du numérique.
          </motion.p>
          <motion.div {...stagger(3)} className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic><Link to="/register" className="btn-primary px-6 py-3 text-base shadow-soft">Créer ma tontine <ArrowRight size={18} /></Link></Magnetic>
            <Link to="/register" className="text-sm font-medium text-primary underline-offset-4 hover:underline">ou rejoindre avec un code</Link>
          </motion.div>
          <motion.p {...stagger(4)} className="mt-8 flex items-center gap-2 text-sm text-ink-faint"><span className="font-mono text-ink">450 000 FCFA</span> déjà en rotation dans la démo · 0 litige non résolu</motion.p>
        </div>
        <motion.div {...ringIn} style={reduce ? {} : { y: ringY, rotate: ringRot }} className="flex justify-center md:justify-end">
          <div className="hidden md:block"><RotationRing animate members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={400} /></div>
          <div className="md:hidden"><RotationRing animate members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={300} /></div>
        </motion.div>
      </section>

      {/* ② LE PROBLÈME */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 text-center md:py-24">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Le vrai problème</p>
          <p className="mt-4 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-snug">
            Une tontine repose sur la <em className="italic text-primary">confiance</em>. Mais un carnet s'égare, une somme est contestée, et personne ne peut prouver qui a payé.
          </p>
          <p className="mt-5 text-ink-soft">TontineSecure garde la mémoire de chaque cotisation et de chaque versement — pour que la confiance ne repose plus sur la mémoire de quelqu'un.</p>
        </Reveal>
      </section>
      </div>{/* fin du fond Opal Aurora */}

      {/* ③ COMMENT ÇA MARCHE — scroll storytelling GSAP (seul scroll-jacking) */}
      <HowItWorksStory />

      {/* ④ CONFIANCE — unique section sombre */}
      <section className="bg-bg-deep text-ink-inverse">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <Reveal>
              <p className="text-sm font-medium uppercase tracking-wide text-gold">La validation croisée</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-medium leading-tight">Deux personnes se font confiance <em className="italic text-gold">et se contrôlent</em>.</h2>
              <p className="mt-5 text-ink-inverse/70">C'est l'esprit même de la tontine : celui qui paie déclare son versement, celui qui reçoit le confirme. Aucun paiement n'est validé unilatéralement. La technologie ne remplace pas la confiance — elle la protège.</p>
              <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-pill bg-gold px-6 py-3 font-semibold text-bg-deep hover:opacity-90">Commencer <ArrowRight size={18} /></Link>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-3 gap-4">
                {[['450 000', 'FCFA en rotation'], ['12', 'cycles clôturés'], ['100%', 'des litiges résolus']].map(([v, l]) => (
                  <div key={l} className="rounded-sheet border border-white/10 bg-white/5 p-5 text-center">
                    <p className="font-mono text-2xl font-semibold text-gold sm:text-3xl">{v}</p>
                    <p className="mt-1 text-xs text-ink-inverse/60">{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ⑤ SCORE DE FIABILITÉ */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Score de fiabilité</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">Cotisez à temps, gagnez la <em className="italic text-primary">confiance</em>.</h2>
            <p className="mt-5 text-ink-soft">Chaque cotisation validée à temps fait grimper votre score. Ce n'est pas une punition — c'est une réputation qui vous ouvre les portes des meilleurs groupes.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold"><Star size={18} className="text-gold" fill="#C6974F" /> Votre score</span>
                <span className="pill bg-success text-white">🟢 Fiable</span>
              </div>
              <p className="my-3 font-mono text-4xl font-semibold">96 %</p>
              <div className="h-2 overflow-hidden rounded-pill bg-surface-alt"><div className="h-full rounded-pill bg-success" style={{ width: '96%' }} /></div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                {[['🟢', 'Fiable', '≥ 90%'], ['🟡', 'Correct', '70-89%'], ['🔴', 'À risque', '< 70%']].map(([e, l, r]) => (
                  <div key={l} className="rounded-card bg-surface-alt py-3"><div>{e}</div><div className="mt-1 font-medium text-ink">{l}</div><div className="font-mono text-ink-faint">{r}</div></div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ⑥ TÉMOIGNAGES */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="mb-12 text-center"><h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">Ils ont digitalisé leur tontine</h2></Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {TEMOIGNAGES.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="card h-full p-6">
                <blockquote className="text-ink-soft">« {t.txt} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={t.name} size={40} />
                  <div><p className="text-sm font-semibold text-ink">{t.name}</p><p className="text-xs text-ink-faint">{t.ville}</p></div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ⑦ FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <Reveal className="mb-10 text-center"><h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">Questions fréquentes</h2></Reveal>
        <div className="divide-y divide-line rounded-sheet border border-line bg-surface">
          {FAQ.map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
        </div>
      </section>

      {/* ⑧ CTA FINAL */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="overflow-hidden rounded-sheet bg-hero p-8 text-white shadow-lift md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-tight">Prêt à faire tourner votre tontine ?</h2>
              <p className="mt-3 max-w-md text-white/85">Créez votre compte en une minute. Gratuit, transparent, entre vous.</p>
              <form onSubmit={(e) => { e.preventDefault(); navigate('/register'); }} className="mt-6 flex flex-wrap gap-3">
                <input className="min-w-[9rem] flex-1 rounded-pill border-0 px-4 py-3 text-ink outline-none" placeholder="Votre prénom" />
                <input className="min-w-[11rem] flex-1 rounded-pill border-0 px-4 py-3 font-mono text-ink outline-none" placeholder="+221 77 …" />
                <button className="rounded-pill bg-bg-deep px-6 py-3 font-semibold text-white hover:opacity-90">Créer ma tontine</button>
              </form>
            </div>
            <div className="hidden justify-self-center md:block"><RotationRing members={RING_MEMBERS.slice(0, 5)} progress={0.7} beneficiaryIndex={0} centerLabel="Rejoignez" centerValue="6 000+" size={220} /></div>
          </div>
        </div>
      </section>

      {/* ⑨ FOOTER */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-ink-soft sm:flex-row">
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-card bg-hero text-white"><Coins size={14} /></span><span className="font-display font-semibold text-ink">TontineSecure</span></div>
          <p className="text-center text-xs text-ink-faint">Natt · Mbotaay, digitalisées sans perdre l'esprit — projet académique DIC1, Développement Web.</p>
          <div className="flex gap-4 text-xs"><a className="hover:text-primary" href="#">Confidentialité</a><a className="hover:text-primary" href="#">Conditions</a></div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-medium text-ink">{q}</span>
        {open ? <Minus size={18} className="shrink-0 text-primary" /> : <Plus size={18} className="shrink-0 text-ink-faint" />}
      </button>
      {open && <p className="px-5 pb-5 text-sm text-ink-soft">{a}</p>}
    </div>
  );
}
