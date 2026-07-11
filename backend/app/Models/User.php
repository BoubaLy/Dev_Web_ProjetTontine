<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'email',
        'telephone_verifie_le',
        'password',
        'photo',
        'statut_kyc',
        'score_fiabilite',
        'est_gele',
        'role',
        'otp_code',
        'otp_expire_le',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
    ];

    protected function casts(): array
    {
        return [
            'telephone_verifie_le' => 'datetime',
            'otp_expire_le' => 'datetime',
            'password' => 'hashed',
            'est_gele' => 'boolean',
            'score_fiabilite' => 'decimal:2',
        ];
    }

    // --- Helpers de rôle / état -------------------------------------------

    public function estKycVerifie(): bool
    {
        return $this->statut_kyc === 'verifie';
    }

    public function estSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    // --- Relations --------------------------------------------------------

    public function kycDocuments(): HasMany
    {
        return $this->hasMany(KycDocument::class);
    }

    /** Groupes dont l'utilisateur est l'administrateur. */
    public function groupesAdministres(): HasMany
    {
        return $this->hasMany(Group::class, 'admin_id');
    }

    /** Lignes d'adhésion (pivot enrichi). */
    public function adhesions(): HasMany
    {
        return $this->hasMany(GroupMember::class);
    }

    /** Groupes auxquels l'utilisateur participe. */
    public function groupes(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_members')
            ->withPivot(['statut', 'date_adhesion'])
            ->withTimestamps();
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }

    /** Versements reçus en tant que bénéficiaire. */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function litigesSignales(): HasMany
    {
        return $this->hasMany(Dispute::class, 'signale_par');
    }
}
