<?php

namespace App\Notifications;

use App\Models\Payout;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Notifie le bénéficiaire du tour que son versement a été effectué (US-11.3). */
class PayoutReceived extends Notification
{
    use Queueable;

    public function __construct(public readonly Payout $payout)
    {
    }

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'versement_recu',
            'payout_id' => $this->payout->id,
            'cycle_id' => $this->payout->cycle_id,
            'montant' => $this->payout->montant,
            'message' => "Votre versement de {$this->payout->montant} FCFA a été effectué.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Versement reçu')
            ->greeting("Félicitations {$notifiable->prenom} !")
            ->line("Vous avez reçu le versement de votre tour : {$this->payout->montant} FCFA.");
    }
}
