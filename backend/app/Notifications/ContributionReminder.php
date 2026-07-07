<?php

namespace App\Notifications;

use App\Models\Cycle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Rappel d'échéance de cotisation (US-14 : J-3, J-1, Jour J). */
class ContributionReminder extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Cycle $cycle,
        public readonly int $joursRestants,
    ) {
    }

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    private function libelleEcheance(): string
    {
        return match (true) {
            $this->joursRestants <= 0 => "aujourd'hui",
            $this->joursRestants === 1 => 'demain',
            default => "dans {$this->joursRestants} jours",
        };
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'rappel_cotisation',
            'cycle_id' => $this->cycle->id,
            'group_id' => $this->cycle->group_id,
            'jours_restants' => $this->joursRestants,
            'montant' => $this->cycle->group->montant_cotisation,
            'message' => "Échéance de cotisation {$this->libelleEcheance()} : {$this->cycle->group->montant_cotisation} FCFA.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Rappel de cotisation')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line("Votre cotisation de {$this->cycle->group->montant_cotisation} FCFA pour le groupe « {$this->cycle->group->nom} » est due {$this->libelleEcheance()}.");
    }
}
