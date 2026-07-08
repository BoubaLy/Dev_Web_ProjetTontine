<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KycDocument extends Model
{
    protected $fillable = [
        'user_id',
        'type_document',
        'chemin_fichier',
        'statut',
        'valide_par',
    ];

    protected $hidden = [
        // Le chemin de stockage n'est jamais exposé dans les réponses API (§9).
        'chemin_fichier',
    ];

    protected function casts(): array
    {
        return [
            // Chiffrement au repos du chemin du document sensible (§9).
            'chemin_fichier' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par');
    }
}
