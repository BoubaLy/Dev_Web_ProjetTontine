<?php

namespace App\Notifications;

use App\Models\Contribution;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * RG-09 — Alerte l'administrateur qu'une déclaration n'a été ni validée ni
 * contestée par le bénéficiaire sous 48h, et requiert son arbitrage.
 */
class ValidationOverdueAlert extends Notification
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
        $beneficiaire = $this->contribution->cycle->beneficiaire;

        return [
            'type' => 'validation_en_retard',
            'contribution_id' => $this->contribution->id,
            'cycle_id' => $this->contribution->cycle_id,
            'payeur' => trim("{$payeur->prenom} {$payeur->nom}"),
            'beneficiaire' => $beneficiaire ? trim("{$beneficiaire->prenom} {$beneficiaire->nom}") : null,
            'message' => "Une déclaration de {$payeur->prenom} {$payeur->nom} n'a pas été validée sous 48h. Arbitrage requis (RG-09).",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payeur = $this->contribution->user;

        return (new MailMessage)
            ->subject('TontineSecure — Validation en retard (arbitrage requis)')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line("La déclaration de {$payeur->prenom} {$payeur->nom} (réf. {$this->contribution->reference_transaction}) n'a pas été validée par le bénéficiaire sous 48h.")
            ->line('Merci de procéder à un arbitrage depuis votre tableau de bord.');
    }
}
