<?php

namespace App\Notifications;

use App\Models\Contribution;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Informe le payeur que le bénéficiaire a confirmé la réception de sa cotisation. */
class ContributionValidated extends Notification
{
    use Queueable;

    public function __construct(public readonly Contribution $contribution)
    {
    }

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'cotisation_validee',
            'contribution_id' => $this->contribution->id,
            'cycle_id' => $this->contribution->cycle_id,
            'montant' => $this->contribution->montant,
            'message' => "Votre cotisation de {$this->contribution->montant} FCFA a été confirmée par le bénéficiaire.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Cotisation confirmée')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line("Votre cotisation de {$this->contribution->montant} FCFA a été confirmée. Merci !");
    }
}
