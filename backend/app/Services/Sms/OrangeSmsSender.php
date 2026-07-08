<?php

namespace App\Services\Sms;

use App\Contracts\SmsSender;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pilote Orange SMS API (Sénégal). Envoi via l'endpoint OMS avec un token
 * OAuth. Les échecs sont journalisés sans interrompre le flux d'inscription.
 */
class OrangeSmsSender implements SmsSender
{
    public function __construct(
        private readonly ?string $token,
        private readonly ?string $senderUrl,
        private readonly string $senderName,
    ) {
    }

    public function send(string $telephone, string $message): void
    {
        if (! $this->token || ! $this->senderUrl) {
            Log::warning('[SMS:orange] Configuration manquante — SMS non envoyé.', ['to' => $telephone]);

            return;
        }

        try {
            $response = Http::withToken($this->token)
                ->acceptJson()
                ->post($this->senderUrl, [
                    'outboundSMSMessageRequest' => [
                        'address' => "tel:{$telephone}",
                        'senderAddress' => "tel:{$this->senderName}",
                        'outboundSMSTextMessage' => ['message' => $message],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('[SMS:orange] Échec envoi', ['to' => $telephone, 'status' => $response->status()]);
            }
        } catch (\Throwable $e) {
            Log::error('[SMS:orange] Exception envoi', ['to' => $telephone, 'error' => $e->getMessage()]);
        }
    }
}
