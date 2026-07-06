<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends Model
{
    protected $fillable = [
        'group_id',
        'code',
        'expire_le',
    ];

    protected function casts(): array
    {
        return [
            'expire_le' => 'datetime',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function estExpiree(): bool
    {
        return $this->expire_le !== null && $this->expire_le->isPast();
    }
}
