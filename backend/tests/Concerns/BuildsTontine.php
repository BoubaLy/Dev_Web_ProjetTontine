<?php

namespace Tests\Concerns;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use App\Services\RotationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Monte une tontine rotative démarrée pour les tests de la Phase 4 :
 * un administrateur (bénéficiaire du tour 1) + des payeurs actifs, avec un
 * cycle #1 en cours. Rotation `manuelle` = ordre déterministe (date d'adhésion).
 */
trait BuildsTontine
{
    /**
     * @return array{group: Group, cycle: \App\Models\Cycle, admin: User, beneficiaire: User, payers: Collection<int,User>}
     */
    protected function bootTontine(int $membres = 3, array $groupAttrs = []): array
    {
        $admin = User::factory()->create();

        $group = Group::create(array_merge([
            'admin_id' => $admin->id,
            'nom' => 'Tontine des Tests',
            'type' => 'rotative',
            'montant_cotisation' => 10000,
            'frequence' => 'mensuelle',
            'nb_membres_max' => 30,
            'penalite_pourcentage' => 2.0,
            'delai_grace_jours' => 3,
            'methode_rotation' => 'manuelle',
            'statut' => 'ouvert',
            'code_invitation' => Str::upper(Str::random(8)),
        ], $groupAttrs));

        // L'admin adhère en premier → ordre 1 → bénéficiaire du tour 1.
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $admin->id,
            'statut' => 'actif',
            'date_adhesion' => now()->subDays($membres + 1),
        ]);

        $payers = collect();
        for ($i = 0; $i < $membres; $i++) {
            $membre = User::factory()->create();
            GroupMember::create([
                'group_id' => $group->id,
                'user_id' => $membre->id,
                'statut' => 'actif',
                'date_adhesion' => now()->subDays($membres - $i),
            ]);
            $payers->push($membre);
        }

        $cycle = app(RotationService::class)->demarrerPremierCycle($group->fresh());

        return [
            'group' => $group->fresh(),
            'cycle' => $cycle,
            'admin' => $admin,
            'beneficiaire' => $admin,
            'payers' => $payers,
        ];
    }
}
