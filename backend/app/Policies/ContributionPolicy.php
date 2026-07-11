<?php

namespace App\Policies;

use App\Models\Contribution;
use App\Models\User;

/**
 * Autorisations du cycle financier (v3) : la validation des depots est
 * centralisee sur l'administrateur du groupe (verification du depot reel).
 */
class ContributionPolicy
{
    /** Valider ou contester une cotisation : reserve a l'admin du groupe. */
    public function valider(User $user, Contribution $contribution): bool
    {
        return $contribution->cycle->group->admin_id === $user->id;
    }

    /** Consulter le tableau de bord d'un cycle : réservé à l'admin du groupe. */
    public function dashboard(User $user, Contribution $contribution): bool
    {
        return $contribution->cycle->group->admin_id === $user->id;
    }
}
