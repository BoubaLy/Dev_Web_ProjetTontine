<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Gestion des codes OTP (2FA).
 *
 * En environnement de développement (APP_DEBUG=true), le code est fixé à
 * "123456" et journalisé, afin d'éviter les coûts SMS réels (§9). En
 * production, brancher un vrai fournisseur (Twilio, Orange SMS API) ici.
 */
class OtpService
{
    public const DEV_CODE = '123456';

    public function generateAndSend(User $user): string
    {
        $code = config('app.debug') ? self::DEV_CODE : (string) random_int(100000, 999999);

        $user->forceFill([
            'otp_code' => $code,
            'otp_expire_le' => now()->addMinutes(10),
        ])->save();

        // Canal simulé : le code apparaît dans storage/logs/laravel.log.
        Log::info("[OTP] {$user->telephone} => {$code}");

        return $code;
    }

    public function verify(User $user, string $code): bool
    {
        if ($user->otp_code === null || $user->otp_expire_le === null) {
            return false;
        }

        if ($user->otp_expire_le->isPast()) {
            return false;
        }

        if (! hash_equals($user->otp_code, $code)) {
            return false;
        }

        $user->forceFill([
            'otp_code' => null,
            'otp_expire_le' => null,
            'telephone_verifie_le' => now(),
        ])->save();

        return true;
    }
}
