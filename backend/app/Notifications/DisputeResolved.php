<?php

namespace App\Notifications;

use App\Models\Dispute;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Informe les parties qu'un litige a été clôturé avec une décision (US-16). */
class DisputeResolved extends Notification
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
            'type' => 'litige_resolu',
            'dispute_id' => $this->dispute->id,
            'group_id' => $this->dispute->group_id,
            'resolution' => $this->dispute->resolution,
            'message' => 'Le litige vous concernant a été clôturé : '.$this->dispute->resolution,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TontineSecure — Litige clôturé')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line('Un litige vous concernant a été clôturé par l\'administrateur.')
            ->line("Décision : {$this->dispute->resolution}");
    }
}
