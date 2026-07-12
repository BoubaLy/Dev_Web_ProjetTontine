<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Souhaite la bienvenue a un nouvel inscrit (ou rappelle a un membre non verifie)
 * qu'il doit valider son identite (KYC) pour creer ou rejoindre des tontines.
 */
class KycRequis extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'kyc_requis',
            'message' => "Bienvenue sur TontineSecure ! Vérifiez votre identité (KYC) depuis votre profil pour pouvoir créer ou rejoindre des tontines.",
        ];
    }
}
