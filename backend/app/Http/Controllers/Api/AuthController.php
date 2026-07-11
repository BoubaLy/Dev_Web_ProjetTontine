<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly OtpService $otp)
    {
    }

    /** US-01 — Inscription + envoi de l'OTP de vérification. */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->only(['nom', 'prenom', 'telephone', 'email', 'password']));

        $otpEnabled = (bool) config('services.otp.enabled', true);

        if ($otpEnabled) {
            $this->otp->generateAndSend($user);
            $message = 'Compte créé. Un code de vérification a été envoyé à votre email.';
        } else {
            // MVP : pas d'étape OTP -> compte vérifié directement.
            $user->forceFill(['telephone_verifie_le' => now()])->save();
            $message = 'Compte créé. Vous êtes connecté.';
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'otp_required' => $otpEnabled,
            'otp_hint' => ($otpEnabled && config('app.debug')) ? OtpService::DEV_CODE : null,
        ], $message, 201);
    }

    /** US-01 — Vérification du code OTP reçu par SMS (simulé en dev). */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $user = User::where('telephone', $request->telephone)->firstOrFail();

        if (! $this->otp->verify($user, $request->code)) {
            return $this->error('Code OTP invalide ou expiré.', ['code' => ['Le code fourni est invalide ou expiré.']], 422);
        }

        return $this->success(['user' => $user->fresh()], 'Téléphone vérifié avec succès.');
    }

    /** US-03 — Connexion téléphone + mot de passe. */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('telephone', $request->telephone)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->error('Identifiants incorrects.', null, 401);
        }

        if ($user->est_gele) {
            return $this->error('Votre compte est gelé. Contactez le support.', null, 403);
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return $this->success(['user' => $user, 'token' => $token], 'Connexion réussie.');
    }

    /** Déconnexion — révoque le token courant. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Déconnexion réussie.');
    }

    /** Profil de l'utilisateur authentifié. */
    public function me(Request $request): JsonResponse
    {
        return $this->success(['user' => $request->user()], 'Profil récupéré.');
    }
}
