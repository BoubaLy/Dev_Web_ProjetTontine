<?php

namespace App\Services;

use App\Models\Cycle;
use App\Models\Group;
use Illuminate\Support\Carbon;

/**
 * Calcul des pénalités de retard (RG-04).
 *
 * Une pénalité s'applique uniquement lorsqu'une cotisation est déclarée après
 * l'expiration du délai de grâce, défini à la création du groupe. Le montant est
 * un pourcentage (1 % à 2,5 %) du montant de cotisation fixe (RG-07).
 */
class PenaltyCalculatorService
{
    /** Date limite de paiement sans pénalité = fin de période + délai de grâce. */
    public function dateLimiteSansPenalite(Cycle $cycle): Carbon
    {
        return $cycle->date_fin->copy()->addDays($cycle->group->delai_grace_jours);
    }

    /** Une déclaration à cette date est-elle en retard (délai de grâce dépassé) ? */
    public function estEnRetard(Cycle $cycle, ?Carbon $date = null): bool
    {
        return ($date ?? now())->greaterThan($this->dateLimiteSansPenalite($cycle));
    }

    /**
     * Montant de la pénalité applicable à une cotisation déclarée à `$date`.
     * Retourne 0 tant que le délai de grâce n'est pas dépassé.
     */
    public function calculer(Group $group, Cycle $cycle, ?Carbon $date = null): float
    {
        if (! $this->estEnRetard($cycle, $date)) {
            return 0.0;
        }

        return round(
            (float) $group->montant_cotisation * ((float) $group->penalite_pourcentage / 100),
            2
        );
    }
}
