<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\KycRequis;
use App\Notifications\OtpCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** US-01 — Inscription + vérification OTP par EMAIL (canal gratuit). */
class RegistrationOtpTest extends TestCase
{
    use RefreshDatabase;

    private array $payload = [
        'nom' => 'Diop', 'prenom' => 'Awa', 'telephone' => '+221781234567',
        'email' => 'awa@example.sn', 'password' => 'Password123', 'password_confirmation' => 'Password123',
    ];

    public function test_l_inscription_envoie_le_code_par_email(): void
    {
        config(['services.otp.channel' => 'email']);
        Notification::fake();

        $this->postJson('/api/v1/auth/register', $this->payload)
            ->assertCreated()
            ->assertJsonPath('data.user.telephone', '+221781234567');

        $user = User::where('telephone', '+221781234567')->first();
        Notification::assertSentTo($user, OtpCode::class);
    }

    public function test_l_inscription_rappelle_de_verifier_le_kyc(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', $this->payload)->assertCreated();

        $user = User::where('telephone', '+221781234567')->first();
        Notification::assertSentTo($user, KycRequis::class);
    }

    public function test_l_email_est_obligatoire(): void
    {
        $payload = $this->payload;
        unset($payload['email']);

        $this->postJson('/api/v1/auth/register', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_verification_du_code_marque_le_compte_verifie(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/register', $this->payload)->assertCreated();

        $user = User::where('telephone', '+221781234567')->first();
        $code = $user->otp_code; // récupéré directement (canal email simulé en test)

        $this->postJson('/api/v1/auth/verify-otp', ['telephone' => $user->telephone, 'code' => $code])
            ->assertOk();

        $this->assertNotNull($user->fresh()->telephone_verifie_le);
    }
}
