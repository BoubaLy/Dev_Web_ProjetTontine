<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Jeu de données de démonstration reproductible.
     * Tous les comptes utilisent le mot de passe : « password ».
     */
    public function run(): void
    {
        // --- Super-Admin (modération globale) ---
        User::create([
            'nom' => 'Support',
            'prenom' => 'TontineSecure',
            'telephone' => '+221770000000',
            'email' => 'admin@tontinesecure.sn',
            'telephone_verifie_le' => now(),
            'password' => Hash::make('password'),
            'statut_kyc' => 'verifie',
            'role' => 'super_admin',
        ]);

        // --- Administrateur de groupe (KYC validé) ---
        $admin = User::create([
            'nom' => 'Diop',
            'prenom' => 'Awa',
            'telephone' => '+221771111111',
            'email' => 'awa.diop@example.sn',
            'telephone_verifie_le' => now(),
            'password' => Hash::make('password'),
            'statut_kyc' => 'verifie',
            'role' => 'membre',
        ]);

        // --- Membres avec KYC validé (prêts à rejoindre / cotiser) ---
        $membresVerifies = User::factory()->count(4)->create();

        // --- Membre en attente de KYC (ne peut pas encore rejoindre, RG-01) ---
        User::factory()->kycEnAttente()->create([
            'nom' => 'Fall', 'prenom' => 'Modou', 'telephone' => '+221772222222',
            'email' => 'modou.fall@example.sn',
        ]);

        // --- Membre au KYC rejeté ---
        User::factory()->kycRejete()->create([
            'nom' => 'Sow', 'prenom' => 'Bineta', 'telephone' => '+221773333333',
            'email' => 'bineta.sow@example.sn',
        ]);

        // --- Un groupe rotatif ouvert, prêt à accueillir des membres ---
        $group = Group::create([
            'admin_id' => $admin->id,
            'nom' => 'Tontine des Amis',
            'description' => 'Tontine rotative mensuelle entre amis proches.',
            'type' => 'rotative',
            'montant_cotisation' => 25000,
            'frequence' => 'mensuelle',
            'nb_membres_max' => 5,
            'penalite_pourcentage' => 2.0,
            'delai_grace_jours' => 3,
            'methode_rotation' => 'aleatoire',
            'statut' => 'ouvert',
            'code_invitation' => Str::upper(Str::random(8)),
        ]);

        // L'admin est membre actif de son propre groupe.
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $admin->id,
            'statut' => 'actif',
            'date_adhesion' => now(),
        ]);

        // Deux membres déjà validés + un en attente de validation d'adhésion.
        foreach ($membresVerifies->take(2) as $membre) {
            GroupMember::create([
                'group_id' => $group->id,
                'user_id' => $membre->id,
                'statut' => 'valide',
                'date_adhesion' => now(),
            ]);
        }

        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $membresVerifies->last()->id,
            'statut' => 'en_attente',
            'date_adhesion' => now(),
        ]);

        $this->command->info('Seed démo OK — comptes clés (mot de passe : password) :');
        $this->command->info('  Super-Admin      : +221770000000');
        $this->command->info('  Admin de groupe  : +221771111111 (groupe « Tontine des Amis »)');
        $this->command->info("  Code d'invitation: {$group->code_invitation}");
    }
}
