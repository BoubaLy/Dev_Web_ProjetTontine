<?php

namespace App\Services;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Notifications\OtpCode;
use Illuminate\Support\Facades\Log;

/**
 * Gestion des codes OTP (2FA).
 *
 * Canal de transmission configurable via OTP_CHANNEL (`email` par défaut en
 * production — gratuit ; `sms` pour un agrégateur payant ; `log` en dev). En
 * développement (APP_DEBUG=true) le code est fixé à "123456" et journalisé.
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

        $this->transmettre($user, $code);

        return $code;
    }

    /** Envoie le code selon le canal configuré (email par défaut). */
    private function transmettre(User $user, string $code): void
    {
        $canal = config('services.otp.channel') ?? (config('app.debug') ? 'log' : 'email');

        match ($canal) {
            'sms' => $this->sms->send($user->telephone, "TontineSecure : votre code de vérification est {$code}. Valable 10 minutes."),
            'email' => $user->notify(new OtpCode($code)),
            default => Log::info("[OTP] {$user->email} => {$code}"),
        };
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
