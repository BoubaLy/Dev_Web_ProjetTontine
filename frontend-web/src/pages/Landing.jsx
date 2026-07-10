import { useRef, useState, lazy, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion, AnimatePresence, useReducedMotion,
  useScroll, useTransform, useSpring,
} from 'framer-motion';
import { ArrowRight, ArrowDown, Coins, Star, Plus, Minus, ChevronRight } from 'lucide-react';
import RotationRing from '../components/RotationRing';
import OpalAurora from '../components/OpalAurora';
/* GSAP chargé en diff après le hero — Lighthouse mobile */
const HowItWorksStory = lazy(() => import('../components/HowItWorksStory'));
import { Avatar } from '../components/ui';
import { Magnetic, AnimatedNumber } from '../components/motion';
import { duration, easing, variants, viewport } from '../motion/tokens';

/* ================================================================
   CONSTANTES
   ================================================================ */
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

/* ================================================================
   COMPOSANTS RÉUTILISABLES
   ================================================================ */

/** Scroll reveal — wrapper qui applique fadeUp via Framer avec viewport once. */
function Reveal({ children, delay = 0, className = '', variant = 'fadeUp' }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={viewport.once}
      transition={{ duration: duration.base, delay, ease: easing.standard }}
    >
      {children}
    </motion.div>
  );
}

/** Accordéon FAQ — hauteur animée + icône rotate. */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-ink">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: duration.fast, ease: easing.standard }}
          className="shrink-0"
        >
          <Plus size={18} className={open ? 'text-primary' : 'text-ink-faint'} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: duration.fast, ease: easing.standard }}
            style={{ overflow: 'hidden' }}
          >
            <p className="px-5 pb-5 pt-0 text-sm text-ink-soft leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Stat card avec AnimatedNumber déclenché au scroll. */
function StatCard({ value, label, delay = 0 }) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const numericVal = parseFloat(value.replace(/[^\d.]/g, ''));
  const suffix = value.replace(/[\d\s.]/g, '');

  return (
    <motion.div
      ref={ref}
      className="rounded-sheet border border-white/10 bg-white/5 p-5 text-center card-glow"
      variants={variants.scaleIn}
      initial="hidden"
      whileInView="show"
      viewport={viewport.once}
      transition={{ duration: duration.base, delay }}
    >
      <p className="font-mono text-2xl font-semibold text-gold sm:text-3xl tabular-nums">
        {inView ? <AnimatedNumber value={numericVal} format={(v) => `${Math.round(v).toLocaleString('fr-FR')}${suffix}`} /> : `0${suffix}`}
      </p>
      <p className="mt-1 text-xs text-ink-inverse/60">{label}</p>
    </motion.div>
  );
}

/** Curseur glow — suit la souris (desktop seulement). */
function CursorGlow() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 80, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 80, damping: 18, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [reduce, x, y]);

  if (reduce || typeof window === 'undefined') return null;

  return (
    <motion.div
      ref={ref}
      className="cursor-glow"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      aria-hidden
    />
  );
}

/* ================================================================
   PAGE PRINCIPALE
   ================================================================ */
export default function Landing() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);

  /* Glassmorphism navbar au scroll */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Parallax léger du Cercle dans le hero. */
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const ringY = useTransform(heroScroll, [0, 1], [0, -48]);
  const ringRot = useTransform(heroScroll, [0, 1], [0, 4]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  /* Animation de chaque mot du titre (cinétique) */
  const wordAnim = (i) => reduce ? {} : {
    initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: duration.base, delay: 0.1 + i * 0.07, ease: easing.standard },
  };

  /* Stagger hero général */
  const heroStagger = (i) => reduce ? {} : {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.base, delay: 0.08 + i * 0.12, ease: easing.standard },
  };

  const ringIn = reduce ? {} : {
    initial: { opacity: 0, scale: 0.88 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: duration.slow, delay: 0.3, ease: easing.standard },
  };

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* Curseur glow — desktop uniquement */}
      <CursorGlow />

      {/* ===== NAV ===== */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          navScrolled
            ? 'glass border-b border-line/50 shadow-soft'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <motion.div
            className="flex items-center gap-2"
            initial={reduce ? {} : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: duration.base, ease: easing.standard }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-card bg-hero text-white shadow-soft">
              <Coins size={16} />
            </span>
            <span className="font-display text-lg font-semibold">TontineSecure</span>
          </motion.div>

          <nav className="flex items-center gap-2">
            <motion.div
              initial={reduce ? {} : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: duration.base, delay: 0.1, ease: easing.standard }}
              className="flex items-center gap-2"
            >
              <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Se connecter</Link>
              <Magnetic>
                <Link to="/register" className="btn-primary px-4 py-2 text-sm btn-primary-glow">
                  S'inscrire
                </Link>
              </Magnetic>
            </motion.div>
          </nav>
        </div>
      </header>

      <main>
      {/* ===== FOND VIVANT « Opal Aurora » (hero + problème) ===== */}
      <div className="relative overflow-hidden">
        <OpalAurora />

        {/* ① HERO */}
        <section
          ref={heroRef}
          className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-28"
        >
          {/* Colonne gauche : texte */}
          <motion.div
            className="max-w-xl"
            style={reduce ? {} : { opacity: heroOpacity }}
          >
            {/* Badge */}
            <motion.span
              {...heroStagger(0)}
              className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Épargne rotative · Natt · Mbotaay
            </motion.span>

            {/* Titre cinétique — chaque mot apparaît avec blur → net */}
            <h1 className="mt-5 font-display text-[clamp(2.75rem,6vw,5.25rem)] font-medium leading-[1.05] tracking-tight hero-glow">
              {TITLE_WORDS.map((w, i) => (
                <motion.span key={i} {...wordAnim(i)} className="mr-[0.28em] inline-block">
                  {w}
                </motion.span>
              ))}
              {/* "carnet" = shimmer cinétique */}
              <motion.span
                {...wordAnim(TITLE_WORDS.length)}
                className="inline-block shimmer-text"
              >
                carnet
              </motion.span>
              <motion.span
                {...wordAnim(TITLE_WORDS.length + 1)}
                className="inline-block ml-[0.05em]"
              >
                .
              </motion.span>
            </h1>

            {/* Sous-titre */}
            <motion.p {...heroStagger(2)} className="mt-6 text-lg leading-relaxed text-ink-soft">
              Créez ou rejoignez une tontine, cotisez en Mobile Money, et laissez chaque paiement
              se confirmer{' '}
              <span className="font-medium text-ink">entre deux personnes</span> avant d'être
              validé. La confiance de toujours, la clarté du numérique.
            </motion.p>

            {/* CTA */}
            <motion.div {...heroStagger(3)} className="mt-8 flex flex-wrap items-center gap-4">
              <Magnetic>
                <Link
                  to="/register"
                  className="btn-primary px-7 py-3.5 text-base shadow-raised btn-primary-glow"
                >
                  Créer ma tontine <ArrowRight size={18} />
                </Link>
              </Magnetic>
              <Link
                to="/register"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                ou rejoindre avec un code <ChevronRight size={14} />
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.p
              {...heroStagger(4)}
              className="mt-8 flex items-center gap-2 text-sm text-ink-faint"
            >
              <span className="font-mono text-ink">450 000 FCFA</span>
              déjà en rotation dans la démo · 0 litige non résolu
            </motion.p>
          </motion.div>

          {/* Colonne droite : RotationRing avec parallax */}
          <motion.div
            {...ringIn}
            style={reduce ? {} : { y: ringY, rotate: ringRot }}
            className="flex justify-center md:justify-end"
          >
            <div className="hidden md:block">
              <RotationRing animate members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={400} />
            </div>
            <div className="md:hidden">
              <RotationRing animate members={RING_MEMBERS} progress={0.55} beneficiaryIndex={1} centerLabel="Pot du tour" centerValue="450 000" size={280} />
            </div>
          </motion.div>
        </section>

        {/* Indicateur de scroll */}
        {!reduce && (
          <motion.div
            className="relative z-10 flex justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: duration.base }}
          >
            <span className="scroll-indicator flex flex-col items-center gap-1 text-ink-faint">
              <ArrowDown size={18} />
              <span className="text-xs">Scroller</span>
            </span>
          </motion.div>
        )}

        {/* ② LE PROBLÈME */}
        <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 text-center md:py-24">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Le vrai problème</p>
            <p className="mt-4 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-snug">
              Une tontine repose sur la{' '}
              <em className="italic text-primary">confiance</em>. Mais un carnet s'égare, une
              somme est contestée, et personne ne peut prouver qui a payé.
            </p>
            <p className="mt-5 text-ink-soft">
              TontineSecure garde la mémoire de chaque cotisation et de chaque versement — pour
              que la confiance ne repose plus sur la mémoire de quelqu'un.
            </p>
          </Reveal>
        </section>
      </div>{/* fin du fond Opal Aurora */}

      {/* ③ COMMENT ÇA MARCHE — scroll storytelling GSAP (seul scroll-jacking) */}
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <HowItWorksStory />
      </Suspense>

      {/* ④ CONFIANCE — section sombre avec Aurora variant dark */}
      <section className="relative bg-bg-deep text-ink-inverse overflow-hidden">
        <OpalAurora variant="dark" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <Reveal>
              <p className="text-sm font-medium uppercase tracking-wide text-gold">La validation croisée</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-medium leading-tight">
                Deux personnes se font confiance{' '}
                <em className="italic text-gold">et se contrôlent</em>.
              </h2>
              <p className="mt-5 text-ink-inverse/70">
                C'est l'esprit même de la tontine : celui qui paie déclare son versement, celui qui
                reçoit le confirme. Aucun paiement n'est validé unilatéralement. La technologie ne
                remplace pas la confiance — elle la protège.
              </p>
              <Magnetic>
                <Link
                  to="/register"
                  className="mt-8 inline-flex items-center gap-2 rounded-pill bg-gold px-6 py-3 font-semibold text-bg-deep hover:opacity-90 transition-opacity"
                >
                  Commencer <ArrowRight size={18} />
                </Link>
              </Magnetic>
            </Reveal>

            {/* Stats avec AnimatedNumber */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              variants={variants.staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport.once}
            >
              {[
                { value: '450 000', label: 'FCFA en rotation' },
                { value: '12', label: 'cycles clôturés' },
                { value: '100%', label: 'des litiges résolus' },
              ].map(({ value, label }, i) => (
                <StatCard key={label} value={value} label={label} delay={i * 0.1} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ⑤ SCORE DE FIABILITÉ */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Score de fiabilité</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">
              Cotisez à temps, gagnez la{' '}
              <em className="italic text-primary">confiance</em>.
            </h2>
            <p className="mt-5 text-ink-soft">
              Chaque cotisation validée à temps fait grimper votre score. Ce n'est pas une
              punition — c'est une réputation qui vous ouvre les portes des meilleurs groupes.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card card-glow p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <Star size={18} className="text-gold" fill="#C6974F" /> Votre score
                </span>
                <span className="pill bg-success/10 text-success">🟢 Fiable</span>
              </div>
              <p className="my-3 font-mono text-4xl font-semibold">96 %</p>

              {/* Barre de progression avec shimmer */}
              <div className="h-2.5 overflow-hidden rounded-pill bg-surface-alt progress-shimmer">
                <motion.div
                  className="h-full rounded-pill bg-success"
                  initial={{ width: 0 }}
                  whileInView={{ width: '96%' }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.slow + 0.2, ease: easing.gentle, delay: 0.2 }}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                {[['🟢', 'Fiable', '≥ 90%'], ['🟡', 'Correct', '70-89%'], ['🔴', 'À risque', '< 70%']].map(([e, l, r]) => (
                  <div key={l} className="rounded-card bg-surface-alt py-3">
                    <div>{e}</div>
                    <div className="mt-1 font-medium text-ink">{l}</div>
                    <div className="font-mono text-ink-faint">{r}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ⑥ TÉMOIGNAGES */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">
            Ils ont digitalisé leur tontine
          </h2>
        </Reveal>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={variants.staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport.once}
        >
          {TEMOIGNAGES.map((t) => (
            <motion.figure
              key={t.name}
              className="card card-glow h-full p-6"
              variants={variants.fadeUp}
              whileHover={{ y: -4, transition: { duration: duration.fast, ease: easing.standard } }}
            >
              {/* Guillemets décoratifs */}
              <span className="mb-2 block font-display text-4xl leading-none text-primary/20" aria-hidden>
                "
              </span>
              <blockquote className="text-ink-soft leading-relaxed">« {t.txt} »</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar name={t.name} size={40} />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-faint">{t.ville}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </section>

      {/* ⑦ FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium">
            Questions fréquentes
          </h2>
        </Reveal>
        <motion.div
          className="rounded-sheet border border-line bg-surface shadow-soft overflow-hidden"
          variants={variants.scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={viewport.once}
        >
          {FAQ.map(([q, a], i) => (
            <FaqItem key={i} q={q} a={a} />
          ))}
        </motion.div>
      </section>

      {/* ⑧ CTA FINAL — arrière-plan vivant */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-sheet bg-hero p-8 text-white shadow-lift md:p-12">
          {/* Aurora interne (très subtile) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-sheet">
            <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 right-8 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          </div>

          <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <Reveal>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-tight">
                Prêt à faire tourner votre tontine ?
              </h2>
              <p className="mt-3 max-w-md text-white/85">
                Créez votre compte en une minute. Gratuit, transparent, entre vous.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); navigate('/register'); }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <input
                  className="min-w-[9rem] flex-1 rounded-pill border-0 bg-white/15 px-4 py-3 text-white placeholder-white/50 outline-none backdrop-blur-sm focus:bg-white/25 transition-colors"
                  placeholder="Votre prénom"
                />
                <input
                  className="min-w-[11rem] flex-1 rounded-pill border-0 bg-white/15 px-4 py-3 font-mono text-white placeholder-white/50 outline-none backdrop-blur-sm focus:bg-white/25 transition-colors"
                  placeholder="+221 77 …"
                />
                <Magnetic>
                  <button className="rounded-pill bg-bg-deep px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
                    Créer ma tontine
                  </button>
                </Magnetic>
              </form>
            </Reveal>

            <div className="hidden justify-self-center md:block">
              <RotationRing
                members={RING_MEMBERS.slice(0, 5)}
                progress={0.7}
                beneficiaryIndex={0}
                centerLabel="Rejoignez"
                centerValue="6 000+"
                size={220}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ⑨ FOOTER */}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-ink-soft sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-card bg-hero text-white">
              <Coins size={14} />
            </span>
            <span className="font-display font-semibold text-ink">TontineSecure</span>
          </div>
          <p className="text-center text-xs text-ink-faint">
            Natt · Mbotaay, digitalisées sans perdre l'esprit — projet académique DIC1, Développement Web.
          </p>
          <div className="flex gap-4 text-xs">
            <a className="hover:text-primary transition-colors" href="#">Confidentialité</a>
            <a className="hover:text-primary transition-colors" href="#">Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
