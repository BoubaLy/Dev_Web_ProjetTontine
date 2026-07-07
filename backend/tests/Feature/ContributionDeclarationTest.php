<?php

namespace Tests\Feature;

use App\Notifications\ContributionDeclared;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** US-10 — Déclaration d'une cotisation (payeur) → statut `declare_paye`. */
class ContributionDeclarationTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_un_payeur_declare_sa_cotisation(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire, 'payers' => $payers] = $this->bootTontine();
        $payeur = $payers->first();

        Sanctum::actingAs($payeur);
        $response = $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave',
            'reference_transaction' => 'TX-WAVE-001',
        ]);

        $response->assertCreated()->assertJsonPath('data.statut', 'declare_paye');
        $this->assertDatabaseHas('contributions', [
            'cycle_id' => $cycle->id,
            'user_id' => $payeur->id,
            'statut' => 'declare_paye',
            'reference_transaction' => 'TX-WAVE-001',
        ]);

        // Le bénéficiaire du tour est notifié pour validation croisée (US-11.b).
        Notification::assertSentTo($beneficiaire, ContributionDeclared::class);
    }

    public function test_la_reference_de_transaction_est_obligatoire(): void
    {
        ['cycle' => $cycle, 'payers' => $payers] = $this->bootTontine();
        Sanctum::actingAs($payers->first());

        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave',
        ])->assertStatus(422)->assertJsonValidationErrors('reference_transaction');
    }

    public function test_reference_dupliquee_dans_le_meme_cycle_refusee(): void
    {
        ['cycle' => $cycle, 'payers' => $payers] = $this->bootTontine();

        Sanctum::actingAs($payers->first());
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'DOUBLON',
        ])->assertCreated();

        Sanctum::actingAs($payers->get(1));
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'DOUBLON',
        ])->assertStatus(422)->assertJsonValidationErrors('reference_transaction');
    }

    public function test_un_membre_gele_ne_peut_pas_cotiser(): void
    {
        ['cycle' => $cycle, 'payers' => $payers] = $this->bootTontine();
        $payeur = $payers->first();
        $payeur->update(['est_gele' => true]);

        Sanctum::actingAs($payeur);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-GEL',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('contributions', ['user_id' => $payeur->id]);
    }

    public function test_le_beneficiaire_ne_cotise_pas_envers_lui_meme(): void
    {
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire] = $this->bootTontine();

        Sanctum::actingAs($beneficiaire);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-BENEF',
        ])->assertStatus(422);
    }

    public function test_un_non_membre_ne_peut_pas_cotiser(): void
    {
        ['cycle' => $cycle] = $this->bootTontine();
        $intrus = \App\Models\User::factory()->create();

        Sanctum::actingAs($intrus);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-INTRUS',
        ])->assertStatus(422);
    }
}
