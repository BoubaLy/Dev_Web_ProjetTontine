import OpalAurora from './OpalAurora';

/**
 * FOND AMBIANT DE L'APP — « respiration ».
 * Couche fixe, plein écran, DERRIÈRE le contenu (pointer-events-none). Réutilise
 * le moteur `OpalAurora` (mesh gradient dérivant très lent + grain) mais l'atténue
 * fortement : dans l'app connectée le fond ne doit JAMAIS capter le regard pendant
 * qu'on lit un montant. Section 2.2 du brief : mouvement de 20-40 s, opacité faible.
 *
 * Placement : premier enfant d'une page ; envelopper le contenu dans `relative z-10`.
 * Variantes :
 *   - "light" → pages claires (dashboard, détail de groupe) — très discret.
 *   - "deep"  → sections/overlays sur bg-deep (célébration de cycle).
 *
 * Accessibilité : `prefers-reduced-motion` est géré en interne par OpalAurora
 * (blobs figés) ; ici on ne fait qu'atténuer et fixer la couche.
 */
export default function AmbientMesh({ variant = 'light', className = '' }) {
  const isDeep = variant === 'deep';
  // Atténuation app : ~55 % de l'intensité de la landing → présence périphérique,
  // jamais un point d'attention. La couche est `fixed` pour rester ambiante au scroll.
  const damp = isDeep ? 'opacity-70' : 'opacity-[0.55]';

  return (
    <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${damp} ${className}`} aria-hidden>
      <OpalAurora variant={isDeep ? 'dark' : 'section'} />
    </div>
  );
}
