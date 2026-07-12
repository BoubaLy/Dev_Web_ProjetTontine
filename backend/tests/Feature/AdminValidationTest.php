<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Notifications\ContributionValidated;
use App\Notifications\CotisationPayee;
use App\Notifications\DisputeOpened;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** Validation par l'admin : il verifie le depot reel puis valide ou conteste. */
class AdminValidationTest extends TestCase
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

    public function test_l_admin_valide_une_cotisation(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $payeur = $members->first();
        $contribution = $this->declarer($cycle, $payeur);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/validate")
            ->assertOk()
            ->assertJsonPath('data.statut', 'valide');

        $this->assertDatabaseHas('contributions', [
            'id' => $contribution->id,
            'statut' => 'valide',
            'valide_par' => $admin->id,
        ]);
        Notification::assertSentTo($payeur, ContributionValidated::class);

        // Transparence : les autres membres sont informés du paiement, pas le payeur.
        Notification::assertSentTo($members->get(1), CotisationPayee::class);
        Notification::assertSentTo($admin, CotisationPayee::class);
        Notification::assertNotSentTo($payeur, CotisationPayee::class);
    }

    public function test_un_membre_ne_peut_pas_valider(): void
    {
        ['cycle' => $cycle, 'members' => $members] = $this->bootTontine();
        $contribution = $this->declarer($cycle, $members->first());

        // Un autre membre (pas l'admin) tente de valider.
        Sanctum::actingAs($members->get(1));
        $this->patchJson("/api/v1/contributions/{$contribution->id}/validate")
            ->assertStatus(403);

        $this->assertDatabaseHas('contributions', [
            'id' => $contribution->id,
            'statut' => 'declare_paye',
        ]);
    }

    public function test_l_admin_conteste_et_ouvre_un_litige(): void
    {
        Notification::fake();
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $payeur = $members->first();
        $contribution = $this->declarer($cycle, $payeur);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/dispute", [
            'description' => 'Aucun depot retrouve sur le compte de collecte.',
        ])->assertCreated();

        $this->assertDatabaseHas('contributions', ['id' => $contribution->id, 'statut' => 'litige']);
        $this->assertDatabaseHas('disputes', [
            'contribution_id' => $contribution->id,
            'concerne_user_id' => $payeur->id,
            'signale_par' => $admin->id,
            'statut' => 'ouvert',
        ]);
        // Le membre mis en cause est gele et informe de l'ouverture du litige.
        $this->assertTrue($payeur->fresh()->est_gele);
        Notification::assertSentTo($payeur, DisputeOpened::class);
    }

    public function test_valider_une_cotisation_non_declaree_est_refuse(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine();
        $contribution = $this->declarer($cycle, $members->first());
        $contribution->update(['statut' => 'valide']); // deja traitee

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/contributions/{$contribution->id}/validate")
            ->assertStatus(422);
    }
}
