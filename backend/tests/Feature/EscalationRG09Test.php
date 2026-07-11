<?php

namespace Tests\Feature;

use App\Jobs\EscalateUnvalidatedContributionJob;
use App\Models\Contribution;
use App\Notifications\ValidationOverdueAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** RG-09 — Escalade admin si une déclaration n'est ni validée ni contestée sous 48h. */
class EscalationRG09Test extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_la_declaration_planifie_le_job_d_escalade(): void
    {
        Bus::fake();
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();

        Sanctum::actingAs($members->first());
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-RG09',
        ])->assertCreated();

        Bus::assertDispatched(EscalateUnvalidatedContributionJob::class);
    }

    public function test_le_job_n_alerte_pas_avant_48h(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();
        $contribution = Contribution::create([
            'cycle_id' => $cycle->id, 'user_id' => $members->first()->id, 'montant' => 10000,
            'statut' => 'declare_paye', 'reference_transaction' => 'RECENT', 'declare_le' => now()->subHour(),
        ]);

        (new EscalateUnvalidatedContributionJob($contribution->id))->handle();

        Notification::assertNothingSent();
    }

    public function test_le_job_alerte_l_admin_apres_48h(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $contribution = Contribution::create([
            'cycle_id' => $cycle->id, 'user_id' => $members->first()->id, 'montant' => 10000,
            'statut' => 'declare_paye', 'reference_transaction' => 'VIEUX', 'declare_le' => now()->subHours(50),
        ]);

        (new EscalateUnvalidatedContributionJob($contribution->id))->handle();

        Notification::assertSentTo($admin, ValidationOverdueAlert::class);
    }
}
