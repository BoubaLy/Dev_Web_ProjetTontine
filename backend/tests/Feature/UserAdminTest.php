<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** US-16 — Modération des comptes réservée au Super-Administrateur. */
class UserAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_super_admin_liste_les_comptes(): void
    {
        User::factory()->count(3)->create();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_un_membre_ne_peut_pas_lister_les_comptes(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/users')->assertStatus(403);
    }

    public function test_le_super_admin_gele_et_degele_un_compte(): void
    {
        $membre = User::factory()->create(['est_gele' => false]);
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->patchJson("/api/v1/users/{$membre->id}/freeze", ['gele' => true])->assertOk();
        $this->assertTrue($membre->fresh()->est_gele);

        $this->patchJson("/api/v1/users/{$membre->id}/freeze", ['gele' => false])->assertOk();
        $this->assertFalse($membre->fresh()->est_gele);
    }

    public function test_un_membre_ne_peut_pas_geler(): void
    {
        $cible = User::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/users/{$cible->id}/freeze", ['gele' => true])->assertStatus(403);
        $this->assertFalse($cible->fresh()->est_gele);
    }

    public function test_on_ne_peut_pas_geler_un_super_admin(): void
    {
        $autreSuper = User::factory()->superAdmin()->create();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->patchJson("/api/v1/users/{$autreSuper->id}/freeze", ['gele' => true])->assertStatus(422);
    }
}
