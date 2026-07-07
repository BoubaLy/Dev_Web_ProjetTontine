<?php

namespace App\Notifications;

use App\Models\Contribution;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifie le bénéficiaire du tour qu'un membre a déclaré un paiement à son
 * encontre : il doit vérifier son solde Mobile Money puis valider ou contester.
 */
class ContributionDeclared extends Notification
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
        $payeur = $this->contribution->user;

        return [
            'type' => 'contribution_declaree',
            'contribution_id' => $this->contribution->id,
            'cycle_id' => $this->contribution->cycle_id,
            'payeur' => trim("{$payeur->prenom} {$payeur->nom}"),
            'montant' => $this->contribution->montant,
            'reference' => $this->contribution->reference_transaction,
            'message' => "{$payeur->prenom} {$payeur->nom} a déclaré un paiement de {$this->contribution->montant} FCFA. Confirmez la réception.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payeur = $this->contribution->user;

        return (new MailMessage)
            ->subject('TontineSecure — Paiement déclaré à valider')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line("{$payeur->prenom} {$payeur->nom} a déclaré un paiement de {$this->contribution->montant} FCFA (réf. {$this->contribution->reference_transaction}).")
            ->line('Vérifiez votre solde Mobile Money puis confirmez ou contestez la réception dans l\'application.');
    }
}
