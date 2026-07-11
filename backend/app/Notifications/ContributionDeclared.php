<?php

namespace App\Notifications;

use App\Models\Contribution;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifie l'admin du groupe qu'un membre a declare un depot : il doit verifier
 * le depot reel (Mobile Money) puis valider ou contester la cotisation.
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
            'message' => "{$payeur->prenom} {$payeur->nom} a déclaré un dépôt de {$this->contribution->montant} FCFA. Vérifiez puis validez.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payeur = $this->contribution->user;

        return (new MailMessage)
            ->subject('TontineSecure — Dépôt déclaré à valider')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line("{$payeur->prenom} {$payeur->nom} a déclaré un dépôt de {$this->contribution->montant} FCFA (réf. {$this->contribution->reference_transaction}).")
            ->line('Vérifiez le dépôt réel puis validez ou contestez la cotisation dans l\'application.');
    }
}
