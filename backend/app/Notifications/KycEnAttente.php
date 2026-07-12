<?php

namespace App\Notifications;

use App\Models\KycDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Alerte le(s) super-admin(s) qu'une piece d'identite vient d'etre deposee et
 * attend une validation KYC.
 */
class KycEnAttente extends Notification
{
    use Queueable;

    public function __construct(public readonly KycDocument $document)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $membre = $this->document->user;
        $types = ['cni' => 'CNI', 'passeport' => 'passeport'];
        $type = $types[$this->document->type_document] ?? $this->document->type_document;

        return [
            'type' => 'kyc_en_attente',
            'kyc_id' => $this->document->id,
            'user_id' => $membre->id,
            'membre' => trim("{$membre->prenom} {$membre->nom}"),
            'message' => "{$membre->prenom} {$membre->nom} a soumis une pièce d'identité ({$type}) : validation KYC en attente.",
        ];
    }
}
