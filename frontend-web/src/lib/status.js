// Statuts de cotisation → libellé + classes Tailwind (couleur = sens, jamais déco).
export const CONTRIB_STATUS = {
  a_payer: { label: 'À payer', cls: 'bg-gold-soft text-gold' },
  en_attente: { label: 'À payer', cls: 'bg-gold-soft text-gold' },
  declare_paye: { label: 'Déclaré · à valider', cls: 'bg-gold-soft text-gold' },
  valide: { label: 'Validé', cls: 'bg-success-soft text-success' },
  en_retard: { label: 'En retard', cls: 'bg-danger-soft text-danger' },
  litige: { label: 'En litige', cls: 'bg-danger-soft text-danger' },
  beneficiaire: { label: 'Bénéficiaire du tour', cls: 'bg-primary-soft text-primary' },
};

export const GROUP_STATUS = {
  ouvert: { label: 'Ouvert aux adhésions', cls: 'bg-gold-soft text-gold' },
  en_cours: { label: 'En cours', cls: 'bg-primary-soft text-primary' },
  cloture: { label: 'Clôturé', cls: 'bg-surface-alt text-ink-faint' },
};

export const DISPUTE_STATUS = {
  ouvert: { label: 'Ouvert', cls: 'bg-gold-soft text-gold' },
  en_investigation: { label: 'En investigation', cls: 'bg-danger-soft text-danger' },
  clos: { label: 'Clôturé', cls: 'bg-surface-alt text-ink-faint' },
};

export function scoreBadge(score) {
  const s = Number(score);
  if (s >= 90) return { label: 'Fiable', cls: 'bg-success text-white' };
  if (s >= 70) return { label: 'Correct', cls: 'bg-gold text-white' };
  return { label: 'À risque', cls: 'bg-danger text-white' };
}
