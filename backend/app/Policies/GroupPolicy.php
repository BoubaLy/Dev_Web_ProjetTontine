<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\User;

class GroupPolicy
{
    /** Voir un groupe : en être membre (adhésion) ou l'administrateur. */
    public function view(User $user, Group $group): bool
    {
        if ($group->admin_id === $user->id) {
            return true;
        }

        return $group->adhesions()->where('user_id', $user->id)->exists();
    }

    /** Gérer le groupe (inviter, valider adhésions, démarrer le cycle). */
    public function manage(User $user, Group $group): bool
    {
        return $group->admin_id === $user->id;
    }
}
