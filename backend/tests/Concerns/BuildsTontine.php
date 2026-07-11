<?php

namespace Tests\Concerns;

use App\Models\Contribution;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use App\Services\RotationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Monte une tontine demarree pour les tests du cycle financier (v3).
 *
 * Logique : plus d'ordre pre-etabli. Un admin + des membres, tous actifs et
 * TOUS cotisants. Un 1er tour de collecte est ouvert (beneficiaire null : il
 * sera tire au sort apres validation des cotisations par l'admin).
 */
trait BuildsTontine
{
    /**
     * @return array{
     *   group: Group, cycle: \App\Models\Cycle, admin: User,
     *   members: Collection<int,User>, allMembers: Collection<int,User>
     * }
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
            'methode_rotation' => 'aleatoire',
            'statut' => 'ouvert',
            'code_invitation' => Str::upper(Str::random(8)),
        ], $groupAttrs));

        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $admin->id,
            'statut' => 'actif',
            'date_adhesion' => now()->subDays($membres + 1),
        ]);

        $members = collect();
        for ($i = 0; $i < $membres; $i++) {
            $membre = User::factory()->create();
            GroupMember::create([
                'group_id' => $group->id,
                'user_id' => $membre->id,
                'statut' => 'actif',
                'date_adhesion' => now()->subDays($membres - $i),
            ]);
            $members->push($membre);
        }

        $cycle = app(RotationService::class)->demarrerPremierCycle($group->fresh());

        return [
            'group' => $group->fresh(),
            'cycle' => $cycle,
            'admin' => $admin,
            'members' => $members,
            'allMembers' => collect([$admin])->concat($members),
        ];
    }

    /** Cree une cotisation deja validee (raccourci pour les tests de cloture). */
    protected function cotisationValidee($cycle, User $payeur, User $admin): Contribution
    {
        return Contribution::create([
            'cycle_id' => $cycle->id,
            'user_id' => $payeur->id,
            'montant' => 10000,
            'statut' => 'valide',
            'methode_paiement' => 'wave',
            'reference_transaction' => 'OK-'.$payeur->id,
            'declare_le' => now(),
            'valide_par' => $admin->id,
            'valide_le' => now(),
            'paye_le' => now(),
        ]);
    }
}
