<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    protected $fillable = [
        'admin_id',
        'nom',
        'description',
        'type',
        'montant_cotisation',
        'frequence',
        'nb_membres_max',
        'penalite_pourcentage',
        'delai_grace_jours',
        'methode_rotation',
        'statut',
        'code_invitation',
        'date_echeance',
    ];

    protected function casts(): array
    {
        return [
            'montant_cotisation' => 'decimal:2',
            'penalite_pourcentage' => 'decimal:2',
            'nb_membres_max' => 'integer',
            'delai_grace_jours' => 'integer',
            'date_echeance' => 'date',
        ];
    }

    /** Tontine « coffre-fort » : epargne bloquee jusqu'a l'echeance, sans tirage. */
    public function estAccumulative(): bool
    {
        return $this->type === 'accumulative';
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function adhesions(): HasMany
    {
        return $this->hasMany(GroupMember::class);
    }

    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot(['statut', 'date_adhesion'])
            ->withTimestamps();
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(Cycle::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function litiges(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }

    /** Cycle actuellement en cours (le plus récent non clôturé). */
    public function cycleCourant(): HasMany
    {
        return $this->cycles()->where('statut', 'en_cours');
    }
}
