<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Cycle extends Model
{
    protected $fillable = [
        'group_id',
        'numero_periode',
        'beneficiaire_id',
        'date_debut',
        'date_fin',
        'tirage_effectue_le',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'numero_periode' => 'integer',
            'date_debut' => 'date',
            'date_fin' => 'date',
            'tirage_effectue_le' => 'datetime',
        ];
    }

    /** Le tirage au sort du beneficiaire a-t-il deja eu lieu pour ce tour ? */
    public function tirageEffectue(): bool
    {
        return $this->beneficiaire_id !== null;
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function beneficiaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beneficiaire_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }

    public function payout(): HasOne
    {
        return $this->hasOne(Payout::class);
    }

    /** Versements du cycle : 1 (rotative) ou N par membre (restitution accumulative). */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }
}
