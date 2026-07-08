<?php

namespace App\Services;

use App\Contracts\SmsSender;
use App\Models\User;

/**
 * Gestion des codes OTP (2FA).
 *
 * Le code est transmis via le {@see SmsSender} configuré (log en dev, Orange/
 * Twilio en prod). En développement (APP_DEBUG=true) le code est fixé à "123456"
 * pour éviter les coûts SMS ; en production il est aléatoire à 6 chiffres (§9).
 */
class OtpService
{
    public const DEV_CODE = '123456';

    public function __construct(private readonly SmsSender $sms)
    {
    }

    public function generateAndSend(User $user): string
    {
        $code = config('app.debug') ? self::DEV_CODE : (string) random_int(100000, 999999);

        $user->forceFill([
            'otp_code' => $code,
            'otp_expire_le' => now()->addMinutes(10),
        ])->save();

        $this->sms->send(
            $user->telephone,
            "TontineSecure : votre code de vérification est {$code}. Valable 10 minutes."
        );

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
