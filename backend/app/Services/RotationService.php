<?php

namespace App\Services;

use App\Models\Cycle;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RotationService
{
    /**
     * Attribue l'ordre de rotation aux membres actifs/validés d'un groupe.
     *
     * - aléatoire : tirage au sort scellé et journalisé (traçabilité / preuve).
     * - manuelle  : ordre d'adhésion (l'admin pourra l'ajuster en V1.5).
     *
     * @return array<int,int> map user_id => ordre_rotation
     */
    public function genererOrdre(Group $group): array
    {
        $membres = $group->adhesions()
            ->whereIn('statut', ['valide', 'actif'])
            ->orderBy('date_adhesion')
            ->get();

        $userIds = $membres->pluck('user_id')->all();

        if ($group->methode_rotation === 'aleatoire') {
            $userIds = Arr::shuffle($userIds);
            Log::info('[Rotation] Tirage aléatoire scellé', [
                'group_id' => $group->id,
                'ordre' => $userIds,
                'scelle_le' => now()->toIso8601String(),
            ]);
        }

        $map = [];
        foreach ($userIds as $index => $userId) {
            $ordre = $index + 1;
            $map[$userId] = $ordre;
            GroupMember::where('group_id', $group->id)
                ->where('user_id', $userId)
                ->update(['ordre_rotation' => $ordre, 'statut' => 'actif']);
        }

        return $map;
    }

    /**
     * Démarre le groupe : génère l'ordre de rotation et crée le premier cycle.
     */
    public function demarrerPremierCycle(Group $group): Cycle
    {
        return DB::transaction(function () use ($group) {
            $ordre = $this->genererOrdre($group);

            // Bénéficiaire du 1er tour = membre à l'ordre 1.
            $premierBeneficiaireId = array_search(1, $ordre, true) ?: null;

            $dateDebut = now();
            $dateFin = $group->frequence === 'hebdomadaire'
                ? $dateDebut->copy()->addWeek()
                : $dateDebut->copy()->addMonth();

            $cycle = Cycle::create([
                'group_id' => $group->id,
                'numero_periode' => 1,
                'beneficiaire_id' => $premierBeneficiaireId,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => 'en_cours',
            ]);

            $group->update(['statut' => 'en_cours']);

            Log::info('[Rotation] Cycle #1 démarré', [
                'group_id' => $group->id,
                'cycle_id' => $cycle->id,
                'beneficiaire_id' => $premierBeneficiaireId,
            ]);

            return $cycle;
        });
    }
}
