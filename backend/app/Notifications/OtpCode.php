<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Code de vérification OTP envoyé par email (2FA gratuit, remplace le SMS).
 * Canal `mail` uniquement — le code n'est jamais stocké en base de notifications.
 */
class OtpCode extends Notification
{
    use Queueable;

    public function __construct(public readonly string $code)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Code de vérification')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line('Votre code de vérification TontineSecure est :')
            ->line("**{$this->code}**")
            ->line('Ce code est valable 10 minutes.')
            ->line("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.");
    }
}
