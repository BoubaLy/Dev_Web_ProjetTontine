<?php

namespace Tests\Feature;

use App\Models\KycDocument;
use App\Models\User;
use App\Notifications\KycEnAttente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Module KYC (US-02) — dépôt, validation Super-Admin, accès restreint, chiffrement. */
class KycTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_membre_depose_une_piece(): void
    {
        Storage::fake('local');
        $user = User::factory()->kycEnAttente()->create();

        Sanctum::actingAs($user);
        $response = $this->postJson('/api/v1/kyc/upload', [
            'type_document' => 'cni',
            'document' => UploadedFile::fake()->image('cni.jpg'),
        ])->assertCreated();

        $doc = KycDocument::first();
        $this->assertNotNull($doc);
        Storage::disk('local')->assertExists($doc->chemin_fichier);
        // Le chemin est chiffré en base (jamais en clair, §9).
        $this->assertNotEquals($doc->chemin_fichier, $doc->getRawOriginal('chemin_fichier'));
        // Le chemin n'est pas exposé dans la réponse.
        $response->assertJsonMissingPath('data.chemin_fichier');
    }

    public function test_le_depot_alerte_le_super_admin(): void
    {
        Notification::fake();
        Storage::fake('local');
        $super = User::factory()->create(['role' => 'super_admin']);
        $membre = User::factory()->kycEnAttente()->create();

        Sanctum::actingAs($membre);
        $this->postJson('/api/v1/kyc/upload', [
            'type_document' => 'cni',
            'document' => UploadedFile::fake()->image('cni.jpg'),
        ])->assertCreated();

        Notification::assertSentTo($super, KycEnAttente::class);
    }

    public function test_le_super_admin_valide_et_met_a_jour_le_kyc(): void
    {
        Storage::fake('local');
        $membre = User::factory()->kycEnAttente()->create();
        $doc = KycDocument::create([
            'user_id' => $membre->id, 'type_document' => 'cni',
            'chemin_fichier' => 'kyc/x/cni.jpg', 'statut' => 'en_attente',
        ]);
        $super = User::factory()->superAdmin()->create();

        Sanctum::actingAs($super);
        $this->patchJson("/api/v1/kyc/{$doc->id}/validate", ['decision' => 'valide'])
            ->assertOk();

        $this->assertEquals('valide', $doc->fresh()->statut);
        $this->assertEquals('verifie', $membre->fresh()->statut_kyc);
    }

    public function test_un_membre_ne_peut_pas_valider(): void
    {
        $doc = KycDocument::create([
            'user_id' => User::factory()->create()->id, 'type_document' => 'cni',
            'chemin_fichier' => 'kyc/x/cni.jpg', 'statut' => 'en_attente',
        ]);

        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/v1/kyc/{$doc->id}/validate", ['decision' => 'valide'])
            ->assertStatus(403);
    }

    public function test_acces_au_fichier_restreint(): void
    {
        Storage::fake('local');
        $proprietaire = User::factory()->create();
        Sanctum::actingAs($proprietaire);
        $this->postJson('/api/v1/kyc/upload', [
            'type_document' => 'cni',
            'document' => UploadedFile::fake()->image('cni.jpg'),
        ])->assertCreated();
        $doc = KycDocument::first();

        // Un autre membre ne peut pas télécharger la pièce.
        Sanctum::actingAs(User::factory()->create());
        $this->get("/api/v1/kyc/{$doc->id}/file")->assertStatus(403);

        // Le propriétaire, si.
        Sanctum::actingAs($proprietaire);
        $this->get("/api/v1/kyc/{$doc->id}/file")->assertOk();
    }
}
