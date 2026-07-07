<?php

namespace App\Policies;

use App\Models\Contribution;
use App\Models\User;

/**
 * Autorisations du cycle financier (§9) : un membre n'agit que sur ses propres
 * cotisations ; seul le bénéficiaire du tour valide/conteste une déclaration.
 */
class ContributionPolicy
{
    /** Confirmer ou contester : réservé au bénéficiaire du tour concerné. */
    public function valider(User $user, Contribution $contribution): bool
    {
        return $contribution->cycle->beneficiaire_id === $user->id;
    }

    /** Consulter le tableau de bord d'un cycle : réservé à l'admin du groupe. */
    public function dashboard(User $user, Contribution $contribution): bool
    {
        return $contribution->cycle->group->admin_id === $user->id;
    }
}
