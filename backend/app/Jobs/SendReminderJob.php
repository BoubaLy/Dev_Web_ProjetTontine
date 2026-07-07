<?php

namespace App\Jobs;

use App\Models\Cycle;
use App\Notifications\ContributionReminder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * US-14 — Rappels d'échéance de cotisation (J-3, J-1, Jour J).
 *
 * Parcourt les cycles en cours, calcule le nombre de jours restants avant la
 * date de fin et notifie les membres n'ayant pas encore déclaré leur cotisation.
 * Destiné à être planifié quotidiennement.
 */
class SendReminderJob implements ShouldQueue
{
    use Queueable;

    /** Jalons de rappel avant l'échéance. */
    private const JALONS = [3, 1, 0];

    public function handle(): void
    {
        $cycles = Cycle::with('group.adhesions.user', 'contributions', 'beneficiaire')
            ->where('statut', 'en_cours')
            ->get();

        foreach ($cycles as $cycle) {
            $joursRestants = (int) round(now()->startOfDay()->diffInDays($cycle->date_fin->startOfDay(), false));

            if (! in_array($joursRestants, self::JALONS, true)) {
                continue;
            }

            // Payeurs actifs (hors bénéficiaire) n'ayant pas encore déclaré.
            $dejaDeclare = $cycle->contributions
                ->whereIn('statut', ['declare_paye', 'valide'])
                ->pluck('user_id')
                ->all();

            $destinataires = $cycle->group->adhesions
                ->where('statut', 'actif')
                ->reject(fn ($m) => $m->user_id === $cycle->beneficiaire_id || in_array($m->user_id, $dejaDeclare, true))
                ->pluck('user')
                ->filter();

            if ($destinataires->isNotEmpty()) {
                Notification::send($destinataires, new ContributionReminder($cycle, $joursRestants));
                Log::info('[Rappel] Envoyé', [
                    'cycle_id' => $cycle->id,
                    'jours_restants' => $joursRestants,
                    'destinataires' => $destinataires->count(),
                ]);
            }
        }
    }
}
