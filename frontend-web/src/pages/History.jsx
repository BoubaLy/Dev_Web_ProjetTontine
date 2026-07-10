import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useMyHistory, formatFCFA } from '../lib/queries';
import { Loading, EmptyState, StatusPill } from '../components/ui';

const sum = (arr, pred) => arr.filter(pred).reduce((t, x) => t + Number(x.montant || 0), 0);

export default function History() {
  const { data, isLoading } = useMyHistory();
  const [tab, setTab] = useState('cotisations');
  const reduce = useReducedMotion();

  const cotisations = data?.cotisations ?? [];
  const versements = data?.versements ?? [];

  // Écran de vérification (l'utilisateur scanne vite un chiffre) : sobriété volontaire.
  // SEULE animation autorisée : highlight `primary/8%` qui s'estompe en ~1 s sur une
  // ligne réellement NOUVELLE (arrivée temps-réel), jamais au simple changement d'onglet.
  const seen = useRef(null);
  const [recent, setRecent] = useState(() => new Set());
  useEffect(() => {
    if (!data) return undefined;
    const all = new Set([
      ...cotisations.map((c) => `c-${c.id}`),
      ...versements.map((v) => `v-${v.id}`),
    ]);
    if (seen.current === null) { seen.current = all; return undefined; }   // 1er chargement : on mémorise sans highlight
    const fresh = [...all].filter((id) => !seen.current.has(id));
    seen.current = new Set([...seen.current, ...all]);
    if (fresh.length === 0) return undefined;
    setRecent((prev) => new Set([...prev, ...fresh]));
    const t = setTimeout(() => {
      setRecent((prev) => { const n = new Set(prev); fresh.forEach((x) => n.delete(x)); return n; });
    }, 1200);
    return () => clearTimeout(t);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loading />;

  const items = tab === 'cotisations' ? cotisations : versements;

  return (
    <div className="relative isolate space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Mon historique</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4"><p className="text-xs text-ink-soft">Total cotisé</p><p className="mt-1 font-mono font-semibold text-ink">{formatFCFA(sum(cotisations, (c) => c.statut === 'valide'))}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-soft">Total reçu</p><p className="mt-1 font-mono font-semibold text-success">{formatFCFA(sum(versements, (v) => v.statut === 'verse'))}</p></div>
      </div>

      <div className="flex gap-2 rounded-pill bg-surface-alt p-1">
        {[['cotisations', 'Cotisations'], ['versements', 'Versements']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-pill py-2 text-sm font-medium ${tab === k ? 'bg-primary text-white' : 'text-ink-soft'}`}>{l}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card"><EmptyState icon=""title={tab === 'cotisations'? 'Aucune cotisation': 'Aucun versement'} message="Votre historique apparaîtra ici au fil des cycles."/></div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const versement = tab === 'versements';
            const key = `${versement ? 'v' : 'c'}-${it.id}`;
            const isNew = recent.has(key) && !reduce;
            return (
              <motion.div
                key={it.id}
                className="card flex items-center gap-3 p-3"
                initial={isNew ? { backgroundColor: 'rgba(43,110,100,0.08)' } : false}
                animate={isNew ? { backgroundColor: 'rgba(255,255,255,1)' } : {}}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-full ${versement ? 'bg-success-soft text-success' : 'bg-surface-alt text-ink-soft'}`}>
                  {versement ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{it.cycle?.group?.nom ?? 'Tontine'}</p>
                  <p className="text-xs text-ink-faint">Tour {it.cycle?.numero_periode ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${versement ? 'text-success' : 'text-ink'}`}>{versement ? '+' : ''}{formatFCFA(it.montant)}</p>
                  {versement
                    ? <span className={`pill ${it.statut === 'verse' ? 'bg-success-soft text-success' : 'bg-gold-soft text-gold'}`}>{it.statut === 'verse' ? 'Versé' : 'En attente'}</span>
                    : <StatusPill status={it.statut} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
