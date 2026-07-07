<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Notifications\ContributionDeclared;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** Module Notifications — listing in-app et marquage comme lu. */
class NotificationListTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_le_beneficiaire_liste_ses_notifications(): void
    {
        ['cycle' => $cycle, 'beneficiaire' => $beneficiaire, 'payers' => $payers] = $this->bootTontine();
        $contribution = Contribution::create([
            'cycle_id' => $cycle->id, 'user_id' => $payers->first()->id, 'montant' => 10000,
            'statut' => 'declare_paye', 'reference_transaction' => 'TX-N', 'declare_le' => now(),
        ]);
        $beneficiaire->notify(new ContributionDeclared($contribution));

        Sanctum::actingAs($beneficiaire);
        $response = $this->getJson('/api/v1/notifications')->assertOk();

        $response->assertJsonPath('data.non_lues', 1)
            ->assertJsonPath('data.notifications.0.type', 'contribution_declaree');

        $id = $response->json('data.notifications.0.id');
        $this->patchJson("/api/v1/notifications/{$id}/read")->assertOk();
        $this->assertEquals(0, $beneficiaire->unreadNotifications()->count());
    }
}
