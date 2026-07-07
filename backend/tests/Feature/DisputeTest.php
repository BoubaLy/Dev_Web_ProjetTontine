<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Models\Dispute;
use App\Notifications\DisputeOpened;
use App\Notifications\DisputeResolved;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** Module Litiges (US-15/16, RG-06). */
class DisputeTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_un_membre_signale_un_litige(): void
    {
        Notification::fake();
        ['group' => $group, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine();
        $signaleur = $payers->first();

        Sanctum::actingAs($signaleur);
        $this->postJson('/api/v1/disputes', [
            'group_id' => $group->id,
            'description' => 'Paiement non reconnu par le bénéficiaire.',
        ])->assertCreated()->assertJsonPath('data.statut', 'ouvert');

        $this->assertDatabaseHas('disputes', [
            'group_id' => $group->id,
            'signale_par' => $signaleur->id,
            'statut' => 'ouvert',
        ]);
        Notification::assertSentTo($admin, DisputeOpened::class);
    }

    public function test_un_non_membre_ne_peut_pas_signaler(): void
    {
        ['group' => $group] = $this->bootTontine();
        $intrus = \App\Models\User::factory()->create();

        Sanctum::actingAs($intrus);
        $this->postJson('/api/v1/disputes', [
            'group_id' => $group->id,
            'description' => 'Test',
        ])->assertStatus(403);
    }

    public function test_admin_met_en_investigation_et_gele_le_compte(): void
    {
        ['group' => $group, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine();
        $concerne = $payers->first();
        $dispute = Dispute::create([
            'group_id' => $group->id, 'signale_par' => $admin->id,
            'concerne_user_id' => $concerne->id, 'description' => 'Litige', 'statut' => 'ouvert',
        ]);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/disputes/{$dispute->id}/investigate")
            ->assertOk()->assertJsonPath('data.statut', 'en_investigation');

        $this->assertTrue($concerne->fresh()->est_gele);
    }

    public function test_seul_un_arbitre_peut_resoudre(): void
    {
        ['group' => $group, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine();
        $dispute = Dispute::create([
            'group_id' => $group->id, 'signale_par' => $admin->id,
            'description' => 'Litige', 'statut' => 'ouvert',
        ]);

        Sanctum::actingAs($payers->first()); // simple membre
        $this->patchJson("/api/v1/disputes/{$dispute->id}/resolve", [
            'resolution' => 'RAS',
        ])->assertStatus(403);
    }

    public function test_resolution_cloture_degele_et_valide_la_cotisation(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'group' => $group, 'admin' => $admin, 'payers' => $payers] = $this->bootTontine();
        $concerne = $payers->first();
        $concerne->update(['est_gele' => true]);

        $contribution = Contribution::create([
            'cycle_id' => $cycle->id, 'user_id' => $concerne->id, 'montant' => 10000,
            'statut' => 'litige', 'reference_transaction' => 'LIT-1', 'declare_le' => now(),
        ]);
        $dispute = Dispute::create([
            'group_id' => $group->id, 'signale_par' => $admin->id, 'concerne_user_id' => $concerne->id,
            'contribution_id' => $contribution->id, 'description' => 'Contestation', 'statut' => 'en_investigation',
        ]);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/disputes/{$dispute->id}/resolve", [
            'resolution' => 'Preuve de paiement fournie, cotisation validée.',
            'valider_cotisation' => true,
            'liberer_compte' => true,
        ])->assertOk()->assertJsonPath('data.statut', 'clos');

        $this->assertFalse($concerne->fresh()->est_gele);
        $this->assertDatabaseHas('contributions', ['id' => $contribution->id, 'statut' => 'valide']);
        Notification::assertSentTo($concerne, DisputeResolved::class);
    }

    public function test_un_litige_deja_clos_ne_se_resout_pas_deux_fois(): void
    {
        ['group' => $group, 'admin' => $admin] = $this->bootTontine();
        $dispute = Dispute::create([
            'group_id' => $group->id, 'signale_par' => $admin->id,
            'description' => 'Litige', 'statut' => 'clos', 'resolution' => 'Déjà traité',
        ]);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/disputes/{$dispute->id}/resolve", ['resolution' => 'x'])
            ->assertStatus(422);
    }
}
