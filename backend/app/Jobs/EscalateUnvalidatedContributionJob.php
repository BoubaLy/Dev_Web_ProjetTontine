<?php

namespace App\Jobs;

use App\Models\Contribution;
use App\Notifications\ValidationOverdueAlert;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * RG-09 — Si une déclaration reste au statut `declare_paye` (ni validée ni
 * contestée) 48h après sa soumission, une alerte est envoyée à l'administrateur
 * du groupe pour arbitrage.
 */
class EscalateUnvalidatedContributionJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $contributionId)
    {
    }

    public function handle(): void
    {
        $contribution = Contribution::with('cycle.group.admin')->find($this->contributionId);

        // Ne remonter que les déclarations toujours en attente de validation.
        if (! $contribution || $contribution->statut !== 'declare_paye') {
            return;
        }

        // Garde-fou : le délai de 48h doit être réellement écoulé. Rend le job
        // robuste même sous un driver de queue qui ignore ->delay() (ex. sync).
        if ($contribution->declare_le && $contribution->declare_le->greaterThan(now()->subHours(48))) {
            return;
        }

        $admin = $contribution->cycle->group->admin;
        if (! $admin) {
            return;
        }

        Log::warning('[RG-09] Déclaration non validée sous 48h — escalade admin', [
            'contribution_id' => $contribution->id,
            'admin_id' => $admin->id,
        ]);

        $admin->notify(new ValidationOverdueAlert($contribution));
    }
}
