<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contribution extends Model
{
    protected $fillable = [
        'cycle_id',
        'user_id',
        'montant',
        'montant_penalite',
        'statut',
        'methode_paiement',
        'reference_transaction',
        'valide_par',
        'declare_le',
        'valide_le',
        'paye_le',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'montant_penalite' => 'decimal:2',
            'declare_le' => 'datetime',
            'valide_le' => 'datetime',
            'paye_le' => 'datetime',
        ];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Bénéficiaire ayant confirmé/contesté la réception (validation croisée). */
    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par');
    }
}
