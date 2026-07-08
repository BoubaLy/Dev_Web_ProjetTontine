<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Notifications\PayoutReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** US-11 — Clôture du cycle, versement (RG-05/08) et enchaînement du tour suivant. */
class CloseCycleTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    private function cotisationValide($cycle, $payeur): void
    {
        Contribution::create([
            'cycle_id' => $cycle->id,
            'user_id' => $payeur->id,
            'montant' => 10000,
            'statut' => 'valide',
            'methode_paiement' => 'wave',
            'reference_transaction' => 'OK-'.$payeur->id,
            'declare_le' => now(),
            'valide_par' => $cycle->beneficiaire_id,
            'valide_le' => now(),
            'paye_le' => now(),
        ]);
    }

    public function test_cloture_bloquee_si_tout_n_est_pas_valide(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine(3);

        // Seulement 2 des 3 payeurs sont validés → RG-08 non satisfaite.
        $this->cotisationValide($cycle, $payers->get(0));
        $this->cotisationValide($cycle, $payers->get(1));

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/close")->assertStatus(422);

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'en_cours']);
        $this->assertDatabaseCount('payouts', 0);
    }

    public function test_cloture_complete_declenche_versement_et_cycle_suivant(): void
    {
        Notification::fake();
        ['group' => $group, 'cycle' => $cycle, 'admin' => $admin, 'beneficiaire' => $beneficiaire, 'payers' => $payers]
            = $this->bootTontine(3);

        foreach ($payers as $payeur) {
            $this->cotisationValide($cycle, $payeur);
        }

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/close")->assertCreated();

        // Cycle clôturé.
        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'cloture']);

        // Versement créé et exécuté par ProcessPayoutJob (queue sync) : 3 × 10000.
        $this->assertDatabaseHas('payouts', [
            'cycle_id' => $cycle->id,
            'user_id' => $beneficiaire->id,
            'statut' => 'verse',
            'montant' => 30000,
        ]);
        Notification::assertSentTo($beneficiaire, PayoutReceived::class);

        // Cycle suivant créé pour le bénéficiaire de l'ordre 2 (premier payeur).
        $this->assertDatabaseHas('cycles', [
            'group_id' => $group->id,
            'numero_periode' => 2,
            'beneficiaire_id' => $payers->first()->id,
            'statut' => 'en_cours',
        ]);

        // Score de fiabilité recalculé (cotisation validée à temps → 100%).
        $this->assertEquals(100.0, (float) $payers->first()->fresh()->score_fiabilite);
    }

    public function test_cloture_bloquee_si_le_beneficiaire_est_gele_rg06(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'beneficiaire' => $beneficiaire, 'payers' => $payers] = $this->bootTontine(3);
        foreach ($payers as $payeur) {
            $this->cotisationValide($cycle, $payeur);
        }
        // RG-06 : le bénéficiaire est gelé (litige en cours) → versement bloqué.
        $beneficiaire->update(['est_gele' => true]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/close")->assertStatus(422);

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'en_cours']);
        $this->assertDatabaseCount('payouts', 0);
    }
}
