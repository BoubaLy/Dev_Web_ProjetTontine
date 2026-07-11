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

    public function test_l_admin_liste_ses_notifications(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $contribution = Contribution::create([
            'cycle_id' => $cycle->id, 'user_id' => $members->first()->id, 'montant' => 10000,
            'statut' => 'declare_paye', 'reference_transaction' => 'TX-N', 'declare_le' => now(),
        ]);
        $admin->notify(new ContributionDeclared($contribution));

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/v1/notifications')->assertOk();

        $response->assertJsonPath('data.non_lues', 1)
            ->assertJsonPath('data.notifications.0.type', 'contribution_declaree');

        $id = $response->json('data.notifications.0.id');
        $this->patchJson("/api/v1/notifications/{$id}/read")->assertOk();
        $this->assertEquals(0, $admin->unreadNotifications()->count());
    }
}
