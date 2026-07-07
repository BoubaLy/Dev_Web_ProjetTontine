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
