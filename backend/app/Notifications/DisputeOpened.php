<?php

namespace App\Notifications;

use App\Models\Dispute;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Alerte l'administrateur du groupe qu'un litige a été ouvert (à arbitrer). */
class DisputeOpened extends Notification
{
    use Queueable;

    public function __construct(public readonly Dispute $dispute)
    {
    }

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'litige_ouvert',
            'dispute_id' => $this->dispute->id,
            'group_id' => $this->dispute->group_id,
            'contribution_id' => $this->dispute->contribution_id,
            'message' => 'Un litige a été signalé sur une cotisation et requiert votre arbitrage.',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Litige à arbitrer')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line('Un litige a été signalé sur une cotisation de votre groupe.')
            ->line("Motif : {$this->dispute->description}")
            ->line('Merci de le traiter depuis votre tableau de bord administrateur.');
    }
}
