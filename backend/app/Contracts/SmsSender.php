<?php

namespace App\Contracts;

/**
 * Abstraction d'envoi de SMS (OTP, alertes). Permet de brancher un fournisseur
 * réel (Orange SMS API, Twilio) en production tout en gardant un pilote « log »
 * simulé en développement — sans coût SMS (§9). Le pilote est choisi par config.
 */
interface SmsSender
{
    public function send(string $telephone, string $message): void;
}
