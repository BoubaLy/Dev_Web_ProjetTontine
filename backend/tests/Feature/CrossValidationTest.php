<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Notifications\ContributionValidated;
use App\Notifications\DisputeOpened;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** US-11.b — Validation croisée : le bénéficiaire confirme ou conteste. */
class CrossValidationTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    private function declarer($cycle, $payeur, string $ref = 'TX-1'): Contribution
    {
        return Contribution::create([
            'cycle_id' => $cycle->id,
            'user_id' => $payeur->id,
            'montant' => 10000,
            'statut' => 'declare_paye',
            'methode_paiement' => 'wave',
            'reference_transaction' => $ref,
            'declare_le' => now(),
        ]);
    }

    public function test_le_beneficiaire_confirme_la_reception(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire, 'payers' => $payers] = $this->bootTontine();
        $payeur = $payers->first();
        $contribution = $this->declarer($cycle, $payeur);

        Sanctum::actingAs($beneficiaire);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.statut', 'valide');

        $this->assertDatabaseHas('contributions', [
            'id' => $contribution->id,
            'statut' => 'valide',
            'valide_par' => $beneficiaire->id,
        ]);
        Notification::assertSentTo($payeur, ContributionValidated::class);
    }

    public function test_un_tiers_ne_peut_pas_confirmer(): void
    {
        ['cycle' => $cycle, 'payers' => $payers] = $this->bootTontine();
        $contribution = $this->declarer($cycle, $payers->first());

        // Un autre payeur (pas le bénéficiaire du tour) tente de confirmer.
        Sanctum::actingAs($payers->get(1));
        $this->patchJson("/api/v1/contributions/{$contribution->id}/confirm")
            ->assertStatus(403);

        $this->assertDatabaseHas('contributions', [
            'id' => $contribution->id,
            'statut' => 'declare_paye',
        ]);
    }

    public function test_le_beneficiaire_conteste_et_ouvre_un_litige(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine();
        $payeur = $payers->first();
        $contribution = $this->declarer($cycle, $payeur);

        Sanctum::actingAs($beneficiaire);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/dispute", [
            'description' => 'Aucun virement reçu sur mon compte Wave.',
        ])->assertCreated();

        $this->assertDatabaseHas('contributions', ['id' => $contribution->id, 'statut' => 'litige']);
        $this->assertDatabaseHas('disputes', [
            'contribution_id' => $contribution->id,
            'concerne_user_id' => $payeur->id,
            'signale_par' => $beneficiaire->id,
            'statut' => 'ouvert',
        ]);
        // RG-06 — le payeur mis en cause est gelé.
        $this->assertTrue($payeur->fresh()->est_gele);
        // L'administrateur du groupe est alerté pour arbitrage.
        Notification::assertSentTo($admin, DisputeOpened::class);
    }

    public function test_confirmer_une_cotisation_non_declaree_est_refuse(): void
    {
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire, 'payers' => $payers] = $this->bootTontine();
        $contribution = $this->declarer($cycle, $payers->first());
        $contribution->update(['statut' => 'valide']); // déjà traitée

        Sanctum::actingAs($beneficiaire);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/confirm")
            ->assertStatus(422);
    }
}
