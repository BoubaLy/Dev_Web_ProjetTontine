<?php

namespace Tests\Feature;

use App\Models\GroupMember;
use App\Models\User;
use App\Notifications\ContributionDeclared;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** Declaration d'une cotisation (membre) -> statut `declare_paye` (en attente). */
class ContributionDeclarationTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_un_membre_declare_sa_cotisation(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $payeur = $members->first();

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

        // L'admin du groupe est notifie pour verifier puis valider le depot.
        Notification::assertSentTo($admin, ContributionDeclared::class);
    }

    public function test_la_reference_de_transaction_est_obligatoire(): void
    {
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();
        Sanctum::actingAs($members->first());

        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave',
        ])->assertStatus(422)->assertJsonValidationErrors('reference_transaction');
    }

    public function test_reference_dupliquee_dans_le_meme_cycle_refusee(): void
    {
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();

        Sanctum::actingAs($members->get(0));
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'DOUBLON',
        ])->assertCreated();

        Sanctum::actingAs($members->get(1));
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'DOUBLON',
        ])->assertStatus(422)->assertJsonValidationErrors('reference_transaction');
    }

    public function test_un_membre_gele_ne_peut_pas_cotiser(): void
    {
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();
        $payeur = $members->first();
        $payeur->update(['est_gele' => true]);

        Sanctum::actingAs($payeur);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-GEL',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('contributions', ['user_id' => $payeur->id]);
    }

    public function test_l_admin_est_aussi_un_membre_cotisant(): void
    {
        // Nouvelle logique : tout le monde cotise, y compris l'admin (gagnant possible).
        ['cycle' => $cycle, 'admin' => $admin] = $this->bootTontine();

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-ADMIN',
        ])->assertCreated()->assertJsonPath('data.statut', 'declare_paye');
    }

    public function test_declaration_bloquee_apres_tirage(): void
    {
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();

        // Le beneficiaire est tire au sort : la collecte du tour est close.
        $cycle->update(['beneficiaire_id' => $members->first()->id, 'tirage_effectue_le' => now()]);

        $retardataire = User::factory()->create();
        GroupMember::create([
            'group_id' => $cycle->group_id, 'user_id' => $retardataire->id,
            'statut' => 'actif', 'date_adhesion' => now(),
        ]);

        Sanctum::actingAs($retardataire);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-TARD',
        ])->assertStatus(422);
    }

    public function test_un_non_membre_ne_peut_pas_cotiser(): void
    {
        ['cycle' => $cycle] = $this->bootTontine();
        $intrus = User::factory()->create();

        Sanctum::actingAs($intrus);
        $this->postJson("/api/v1/cycles/{$cycle->id}/contributions", [
            'methode_paiement' => 'wave', 'reference_transaction' => 'TX-INTRUS',
        ])->assertStatus(422);
    }
}
