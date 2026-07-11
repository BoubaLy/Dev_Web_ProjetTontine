<?php

namespace Tests\Feature;

use App\Notifications\PayoutReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTontine;
use Tests\TestCase;

/** Tontine accumulative (coffre-fort) : avance des periodes puis restitution. */
class AccumulativeTest extends TestCase
{
    use RefreshDatabase, BuildsTontine;

    private function bootAccu(int $membres = 3): array
    {
        return $this->bootTontine($membres, [
            'type' => 'accumulative',
            'date_echeance' => now()->addMonths(3),
        ]);
    }

    public function test_le_tirage_est_refuse_pour_une_accumulative(): void
    {
        ['cycle' => $cycle, 'admin' => $admin, 'allMembers' => $all] = $this->bootAccu(3);
        foreach ($all as $m) {
            $this->cotisationValidee($cycle, $m, $admin);
        }

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/draw")->assertStatus(422);
    }

    public function test_avancer_ouvre_la_periode_suivante_sans_versement(): void
    {
        ['group' => $group, 'cycle' => $cycle, 'admin' => $admin, 'allMembers' => $all] = $this->bootAccu(3);
        foreach ($all as $m) {
            $this->cotisationValidee($cycle, $m, $admin);
        }

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/advance")->assertCreated();

        $this->assertDatabaseHas('cycles', ['id' => $cycle->id, 'statut' => 'cloture']);
        $this->assertDatabaseHas('cycles', [
            'group_id' => $group->id, 'numero_periode' => 2, 'beneficiaire_id' => null, 'statut' => 'en_cours',
        ]);
        // Aucun versement lors d'une simple avance de periode.
        $this->assertDatabaseCount('payouts', 0);
    }

    public function test_restitution_rembourse_chaque_membre_de_ses_propres_versements(): void
    {
        Notification::fake();
        ['group' => $group, 'cycle' => $cycle, 'admin' => $admin, 'members' => $members, 'allMembers' => $all] = $this->bootAccu(3);

        // Periode 1 : tout le monde depose (4 membres × 10000).
        foreach ($all as $m) {
            $this->cotisationValidee($cycle, $m, $admin);
        }

        // Avance vers la periode 2.
        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/cycles/{$cycle->id}/advance")->assertCreated();
        $cycle2 = $group->cycles()->where('numero_periode', 2)->first();

        // Periode 2 : seul un membre depose a nouveau -> il aura cotise 2 fois.
        $doubleur = $members->first();
        $this->cotisationValidee($cycle2, $doubleur, $admin);

        // Restitution a l'echeance.
        $this->postJson("/api/v1/groups/{$group->id}/settle")->assertCreated();

        $this->assertDatabaseHas('groups', ['id' => $group->id, 'statut' => 'cloture']);
        // Le membre qui a depose 2 fois recupere 20000 ; les autres 10000.
        $this->assertDatabaseHas('payouts', ['user_id' => $doubleur->id, 'montant' => 20000, 'statut' => 'verse']);
        foreach ($all->where('id', '!=', $doubleur->id) as $m) {
            $this->assertDatabaseHas('payouts', ['user_id' => $m->id, 'montant' => 10000, 'statut' => 'verse']);
        }
        Notification::assertSentTo($doubleur, PayoutReceived::class);
    }
}
