<?php

namespace App\Jobs;

use App\Models\Cycle;
use App\Services\CloseCycleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Traitement des tours arrives a echeance (planifie quotidiennement).
 *
 *  - Accumulative : on avance automatiquement d'une periode une fois toutes les
 *    cotisations validees (l'epargne continue jusqu'a la date d'echeance finale).
 *  - Rotative : la cloture reste MANUELLE (elle exige le tirage au sort puis le
 *    recu televerse par l'admin). On ne fait donc que journaliser.
 */
class CloseCycleJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $cycleId)
    {
    }

    public function handle(CloseCycleService $service): void
    {
        $cycle = Cycle::with('group')->find($this->cycleId);

        if (! $cycle || $cycle->statut !== 'en_cours') {
            return;
        }

        // La rotative se cloture a la main (tirage + recu) : rien a automatiser.
        if (! $cycle->group->estAccumulative()) {
            return;
        }

        if (! $service->collecteComplete($cycle)) {
            Log::info('[CloseCycleJob] Avance differee (collecte incomplete)', [
                'cycle_id' => $cycle->id,
            ]);

            return;
        }

        try {
            $service->avancerPeriodeAccumulative($cycle);
        } catch (RuntimeException $e) {
            Log::info('[CloseCycleJob] Avance differee', [
                'cycle_id' => $cycle->id,
                'raison' => $e->getMessage(),
            ]);
        }
    }
}
