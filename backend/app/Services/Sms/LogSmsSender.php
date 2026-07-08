<?php

namespace App\Services\Sms;

use App\Contracts\SmsSender;
use Illuminate\Support\Facades\Log;

/** Pilote simulé : journalise le SMS au lieu de l'envoyer (dev / académique). */
class LogSmsSender implements SmsSender
{
    public function send(string $telephone, string $message): void
    {
        Log::info("[SMS:log] {$telephone} => {$message}");
    }
}
