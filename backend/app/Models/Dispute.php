<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    protected $fillable = [
        'group_id',
        'signale_par',
        'concerne_user_id',
        'contribution_id',
        'description',
        'statut',
        'resolution',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function signaleur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signale_par');
    }

    public function concerne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'concerne_user_id');
    }

    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }
}
