<?php

namespace App\Notifications;

use App\Models\Contribution;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Transparence : quand une cotisation est validee, TOUS les membres du groupe
 * (sauf le payeur) sont informes que telle personne a paye, avec le montant, la
 * methode, la reference et l'horodatage.
 */
class CotisationPayee extends Notification
{
    use Queueable;

    public function __construct(public readonly Contribution $contribution)
    {
    }

    public function via(object $notifiable): array
    {
        // Canal in-app uniquement : on evite d'inonder les boites mail.
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $c = $this->contribution;
        $payeur = $c->user;
        $groupe = $c->cycle->group;
        $quand = ($c->valide_le ?? now())->locale('fr')->translatedFormat('d/m/Y \à H\hi');
        $methodes = ['wave' => 'Wave', 'orange_money' => 'Orange Money', 'mock' => 'Test'];
        $methode = $methodes[$c->methode_paiement] ?? $c->methode_paiement;

        $montant = number_format((float) $c->montant, 0, ',', ' ');

        return [
            'type' => 'cotisation_payee',
            'contribution_id' => $c->id,
            'cycle_id' => $c->cycle_id,
            'group_id' => $groupe->id,
            'payeur' => trim("{$payeur->prenom} {$payeur->nom}"),
            'montant' => $c->montant,
            'methode' => $methode,
            'reference' => $c->reference_transaction,
            'message' => "{$payeur->prenom} {$payeur->nom} a payé sa cotisation de {$montant} FCFA ({$methode}, réf. {$c->reference_transaction}) pour « {$groupe->nom} » le {$quand}.",
        ];
    }
}
