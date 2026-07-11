<?php

namespace Tests\Feature;

use App\Notifications\PayoutReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/**
 * Tour rotatif : tirage au sort apres collecte complete, puis cloture avec recu
 * et versement du pot au gagnant, enfin ouverture du tour suivant.
 */
class CloseCycleTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    public function test_tirage_bloque_si_la_collecte_n_est_pas_complete(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members] = $this->bootTontine(3);

        // Seuls 2 des 4 membres (admin inclus) sont valides -> collecte incomplete.
        $this->cotisationValidee($cycle, $members->get(0), $admin);
        $this->cotisationValidee($cycle, $members->get(1), $admin);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/draw")->assertStatus(422);

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'beneficiaire_id' => null]);
    }

    public function test_flux_complet_tirage_puis_cloture_versement_et_tour_suivant(): void
    {
        Notification::fake();
        Storage::fake('public');
        ['group' => $group, 'cycle' => $cycle, 'admin' => $admin, 'allMembers' => $all] = $this->bootTontine(3);

        foreach ($all as $membre) {
            $this->cotisationValidee($cycle, $membre, $admin);
        }

        Sanctum::actingAs($admin);

        // 1) Tirage au sort du beneficiaire.
        $this->postJson("/api/v1/cycles/{$cycle->id}/draw")->assertOk();
        $gagnantId = $cycle->fresh()->beneficiaire_id;
        $this->assertNotNull($gagnantId);

        // 2) Cloture avec recu du transfert.
        $this->postJson("/api/v1/cycles/{$cycle->id}/close", [
            'recu' => UploadedFile::fake()->image('recu.jpg'),
        ])->assertCreated();

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'cloture']);

        // Pot = 4 membres × 10000, verse au gagnant, avec recu.
        $this->assertDatabaseHas('payouts', [
            'cycle_id' => $cycle->id,
            'user_id' => $gagnantId,
            'statut' => 'verse',
            'montant' => 40000,
        ]);
        $this->assertNotNull($cycle->fresh()->payout->recu_path);
        Notification::assertSentTo($all->firstWhere('id', $gagnantId), PayoutReceived::class);

        // Tour suivant ouvert (beneficiaire null, a tirer plus tard).
        $this->assertDatabaseHas('cycles', [
            'group_id' => $group->id,
            'numero_periode' => 2,
            'beneficiaire_id' => null,
            'statut' => 'en_cours',
        ]);
    }

    public function test_cloture_bloquee_sans_tirage(): void
    {
        Storage::fake('public');
        ['cycle' => $cycle, 'admin' => $admin, 'allMembers' => $all] = $this->bootTontine(3);
        foreach ($all as $membre) {
            $this->cotisationValidee($cycle, $membre, $admin);
        }

        Sanctum::actingAs($admin);
        // Pas de tirage effectue -> cloture refusee (malgre 100 % valide et recu fourni).
        $this->postJson("/api/v1/cycles/{$cycle->id}/close", [
            'recu' => UploadedFile::fake()->image('recu.jpg'),
        ])->assertStatus(422);

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'en_cours']);
        $this->assertDatabaseCount('payouts', 0);
    }

    public function test_le_recu_est_obligatoire_pour_cloturer(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members, 'allMembers' => $all] = $this->bootTontine(3);
        foreach ($all as $membre) {
            $this->cotisationValidee($cycle, $membre, $admin);
        }
        $cycle->update(['beneficiaire_id' => $members->first()->id, 'tirage_effectue_le' => now()]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/close")
            ->assertStatus(422)
            ->assertJsonValidationErrors('recu');
    }

    public function test_cloture_bloquee_si_le_beneficiaire_est_gele(): void
    {
        Storage::fake('public');
        ['cycle' => $cycle, 'admin' => $admin, 'members' => $members, 'allMembers' => $all] = $this->bootTontine(3);
        foreach ($all as $membre) {
            $this->cotisationValidee($cycle, $membre, $admin);
        }

        // Gagnant impose puis gele (litige en cours) -> versement bloque.
        $gagnant = $members->first();
        $cycle->update(['beneficiaire_id' => $gagnant->id, 'tirage_effectue_le' => now()]);
        $gagnant->update(['est_gele' => true]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/close", [
            'recu' => UploadedFile::fake()->image('recu.jpg'),
        ])->assertStatus(422);

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'en_cours']);
        $this->assertDatabaseCount('payouts', 0);
    }
}
