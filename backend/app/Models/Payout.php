<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    protected $fillable = [
        'cycle_id',
        'user_id',
        'montant',
        'statut',
        'verse_le',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'verse_le' => 'datetime',
        ];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    /** Bénéficiaire du versement. */
    public function beneficiaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
