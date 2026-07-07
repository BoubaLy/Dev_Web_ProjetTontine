<?php

namespace App\Jobs;

use App\Models\Cycle;
use App\Services\CloseCycleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Clôture automatique d'un cycle arrivé à échéance (US-11).
 * Peut être planifié quotidiennement ou déclenché manuellement par l'admin.
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

        try {
            $service->cloturer($cycle);
        } catch (RuntimeException $e) {
            // Taux de collecte < 100% (RG-05/08) : on réessaiera au prochain passage.
            Log::info('[CloseCycleJob] Clôture différée', [
                'cycle_id' => $cycle->id,
                'raison' => $e->getMessage(),
            ]);
        }
    }
}
