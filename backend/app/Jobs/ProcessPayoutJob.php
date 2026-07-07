<?php

namespace App\Jobs;

use App\Models\Payout;
use App\Notifications\PayoutReceived;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Exécute le versement au bénéficiaire du tour après clôture du cycle.
 * Simule le SLA de 24h de l'agrégateur Mobile Money (US-11.3).
 */
class ProcessPayoutJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $payoutId)
    {
    }

    public function handle(): void
    {
        $payout = Payout::with('beneficiaire')->find($this->payoutId);

        if (! $payout || $payout->statut !== 'en_attente') {
            return;
        }

        $payout->update(['statut' => 'verse', 'verse_le' => now()]);

        Log::info('[Payout] Versement effectué', [
            'payout_id' => $payout->id,
            'beneficiaire_id' => $payout->user_id,
            'montant' => $payout->montant,
        ]);

        $payout->beneficiaire?->notify(new PayoutReceived($payout));
    }
}
