<?php

namespace App\Services;

use App\Models\Contribution;
use App\Models\User;

/**
 * Score de fiabilité (US-17).
 *
 *   score = (cotisations validées à temps / cotisations dues) × 100
 *
 * Recalculé après chaque cotisation validée et après chaque clôture de cycle.
 * Un membre sans historique conserve le score par défaut de 100.
 */
class ReliabilityScoreService
{
    /** Statuts considérés comme « dus » (cotisation attendue sur une période). */
    private const STATUTS_DUS = ['declare_paye', 'valide', 'en_retard', 'litige'];

    /**
     * Badge de fiabilité associé à un score (US-17) :
     * Fiable ≥ 90, Correct 70-89, À risque < 70.
     *
     * @return array{niveau: string, label: string, couleur: string}
     */
    public static function badge(float $score): array
    {
        return match (true) {
            $score >= 90 => ['niveau' => 'fiable', 'label' => 'Fiable', 'couleur' => '#1B7A43'],
            $score >= 70 => ['niveau' => 'correct', 'label' => 'Correct', 'couleur' => '#C79A3A'],
            default => ['niveau' => 'a_risque', 'label' => 'À risque', 'couleur' => '#B3261E'],
        };
    }

    public function recalculer(User $user): float
    {
        $cotisations = Contribution::query()
            ->where('user_id', $user->id)
            ->whereIn('statut', self::STATUTS_DUS)
            ->get();

        $dues = $cotisations->count();

        if ($dues === 0) {
            return (float) $user->score_fiabilite;
        }

        // « À temps » = validée par le bénéficiaire, sans pénalité de retard.
        $aTemps = $cotisations
            ->where('statut', 'valide')
            ->where('montant_penalite', '<=', 0)
            ->count();

        $score = round(($aTemps / $dues) * 100, 2);

        $user->update(['score_fiabilite' => $score]);

        return $score;
    }
}
