<?php

namespace App\Services\Sms;

use App\Contracts\SmsSender;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pilote Twilio (REST API, sans SDK). Utilise l'authentification Basic
 * SID:token. Les échecs sont journalisés sans interrompre le flux.
 */
class TwilioSmsSender implements SmsSender
{
    public function __construct(
        private readonly ?string $sid,
        private readonly ?string $token,
        private readonly ?string $from,
    ) {
    }

    public function send(string $telephone, string $message): void
    {
        if (! $this->sid || ! $this->token || ! $this->from) {
            Log::warning('[SMS:twilio] Configuration manquante — SMS non envoyé.', ['to' => $telephone]);

            return;
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($this->sid, $this->token)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json", [
                    'To' => $telephone,
                    'From' => $this->from,
                    'Body' => $message,
                ]);

            if ($response->failed()) {
                Log::error('[SMS:twilio] Échec envoi', ['to' => $telephone, 'status' => $response->status()]);
            }
        } catch (\Throwable $e) {
            Log::error('[SMS:twilio] Exception envoi', ['to' => $telephone, 'error' => $e->getMessage()]);
        }
    }
}
