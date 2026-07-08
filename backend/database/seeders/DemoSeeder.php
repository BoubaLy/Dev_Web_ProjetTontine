<?php

namespace Database\Seeders;

use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\Dispute;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Payout;
use App\Models\User;
use App\Notifications\ContributionDeclared;
use App\Notifications\ContributionReminder;
use App\Notifications\DisputeOpened;
use App\Notifications\PayoutReceived;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Jeu de démonstration « soutenance » — riche, déterministe et SANS factory
 * (fonctionne aussi en image de production `--no-dev`). Peuple tous les écrans :
 * dashboard, historique, notifications, cercle de rotation, litiges.
 *
 * Comptes (mot de passe : « password ») :
 *   Super-Admin (support) : +221770000000
 *   Awa Diop (admin/démo)  : +221771111111  ← compte à présenter
 *   Modou Fall             : +221772222222  (bénéficiaire du tour en cours)
 *   Bineta Sow             : +221773333333
 *   Ousmane Ndiaye         : +221774444444  (a déclaré, en attente de validation)
 *   Fatou Ba               : +221775555555  (en retard → litige)
 *   Cheikh Diallo          : +221776666666
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $mk = fn (string $tel, string $prenom, string $nom, float $score = 100, array $extra = []) => User::create(array_merge([
            'nom' => $nom, 'prenom' => $prenom, 'telephone' => $tel,
            'email' => Str::lower("{$prenom}.{$nom}@example.sn"),
            'telephone_verifie_le' => now(), 'password' => Hash::make('password'),
            'statut_kyc' => 'verifie', 'score_fiabilite' => $score, 'role' => 'membre',
        ], $extra));

        $support = $mk('+221770000000', 'Support', 'TontineSecure', 100, ['role' => 'super_admin', 'email' => 'support@tontinesecure.sn']);
        $awa = $mk('+221771111111', 'Awa', 'Diop', 96);
        $modou = $mk('+221772222222', 'Modou', 'Fall', 88);
        $bineta = $mk('+221773333333', 'Bineta', 'Sow', 100);
        $ousmane = $mk('+221774444444', 'Ousmane', 'Ndiaye', 74);
        $fatou = $mk('+221775555555', 'Fatou', 'Ba', 61);
        $cheikh = $mk('+221776666666', 'Cheikh', 'Diallo', 92);

        // === Groupe 1 : « Tontine des Amis » (Awa admin, en cours, cycle 2) ===
        $g1 = Group::create([
            'admin_id' => $awa->id, 'nom' => 'Tontine des Amis',
            'description' => 'Tontine rotative mensuelle entre amis de Dakar.',
            'type' => 'rotative', 'montant_cotisation' => 25000, 'frequence' => 'mensuelle',
            'nb_membres_max' => 8, 'penalite_pourcentage' => 2.0, 'delai_grace_jours' => 3,
            'methode_rotation' => 'aleatoire', 'statut' => 'en_cours', 'code_invitation' => 'AMIS2026',
        ]);

        $ordre1 = [$awa, $modou, $bineta, $ousmane, $fatou];
        foreach ($ordre1 as $i => $u) {
            GroupMember::create([
                'group_id' => $g1->id, 'user_id' => $u->id, 'ordre_rotation' => $i + 1,
                'statut' => 'actif', 'date_adhesion' => now()->subMonths(3)->addDays($i),
            ]);
        }

        // Cycle 1 — clôturé, versement effectué à Awa (ordre 1).
        $c1 = Cycle::create([
            'group_id' => $g1->id, 'numero_periode' => 1, 'beneficiaire_id' => $awa->id,
            'date_debut' => now()->subMonths(2), 'date_fin' => now()->subMonth(), 'statut' => 'cloture',
        ]);
        foreach ([$modou, $bineta, $ousmane, $fatou] as $u) {
            Contribution::create([
                'cycle_id' => $c1->id, 'user_id' => $u->id, 'montant' => 25000, 'statut' => 'valide',
                'methode_paiement' => 'wave', 'reference_transaction' => 'WV-'.Str::upper(Str::random(6)),
                'valide_par' => $awa->id, 'declare_le' => now()->subMonth(), 'valide_le' => now()->subMonth(), 'paye_le' => now()->subMonth(),
            ]);
        }
        $payout1 = Payout::create([
            'cycle_id' => $c1->id, 'user_id' => $awa->id, 'montant' => 100000,
            'statut' => 'verse', 'verse_le' => now()->subMonth(),
        ]);

        // Cycle 2 — en cours, bénéficiaire Modou (ordre 2).
        $c2 = Cycle::create([
            'group_id' => $g1->id, 'numero_periode' => 2, 'beneficiaire_id' => $modou->id,
            'date_debut' => now()->subDays(6), 'date_fin' => now()->addDays(9), 'statut' => 'en_cours',
        ]);
        // Awa & Bineta ont payé (validé) ; Ousmane a déclaré (à valider) ; Fatou n'a rien fait.
        foreach ([$awa, $bineta] as $u) {
            Contribution::create([
                'cycle_id' => $c2->id, 'user_id' => $u->id, 'montant' => 25000, 'statut' => 'valide',
                'methode_paiement' => 'wave', 'reference_transaction' => 'WV-'.Str::upper(Str::random(6)),
                'valide_par' => $modou->id, 'declare_le' => now()->subDays(3), 'valide_le' => now()->subDays(2), 'paye_le' => now()->subDays(2),
            ]);
        }
        $decl = Contribution::create([
            'cycle_id' => $c2->id, 'user_id' => $ousmane->id, 'montant' => 25000, 'statut' => 'declare_paye',
            'methode_paiement' => 'orange_money', 'reference_transaction' => 'OM-8H2K3P', 'declare_le' => now()->subHours(5),
        ]);

        // === Groupe 2 : « Natt du Marché » (Modou admin, en cours) — Awa membre ===
        $g2 = Group::create([
            'admin_id' => $modou->id, 'nom' => 'Natt du Marché',
            'description' => 'Tontine hebdomadaire des commerçantes du marché Sandaga.',
            'type' => 'rotative', 'montant_cotisation' => 50000, 'frequence' => 'hebdomadaire',
            'nb_membres_max' => 10, 'penalite_pourcentage' => 1.5, 'delai_grace_jours' => 2,
            'methode_rotation' => 'aleatoire', 'statut' => 'en_cours', 'code_invitation' => 'NATT2026',
        ]);
        foreach ([$modou, $awa, $bineta, $cheikh] as $i => $u) {
            GroupMember::create(['group_id' => $g2->id, 'user_id' => $u->id, 'ordre_rotation' => $i + 1, 'statut' => 'actif', 'date_adhesion' => now()->subWeeks(2)->addDays($i)]);
        }
        $c3 = Cycle::create(['group_id' => $g2->id, 'numero_periode' => 1, 'beneficiaire_id' => $modou->id, 'date_debut' => now()->subDays(3), 'date_fin' => now()->addDays(4), 'statut' => 'en_cours']);
        Contribution::create([
            'cycle_id' => $c3->id, 'user_id' => $awa->id, 'montant' => 50000, 'statut' => 'valide',
            'methode_paiement' => 'wave', 'reference_transaction' => 'WV-'.Str::upper(Str::random(6)),
            'valide_par' => $modou->id, 'declare_le' => now()->subDays(2), 'valide_le' => now()->subDay(), 'paye_le' => now()->subDay(),
        ]);

        // === Groupe 3 : « Femmes Battantes » (Bineta admin, ouvert) — Awa membre ===
        $g3 = Group::create([
            'admin_id' => $bineta->id, 'nom' => 'Femmes Battantes',
            'description' => 'Épargne accumulative pour un projet commun.',
            'type' => 'accumulative', 'montant_cotisation' => 15000, 'frequence' => 'mensuelle',
            'nb_membres_max' => 12, 'penalite_pourcentage' => 1.0, 'delai_grace_jours' => 5,
            'methode_rotation' => 'manuelle', 'statut' => 'ouvert', 'code_invitation' => 'FEMMES26',
        ]);
        GroupMember::create(['group_id' => $g3->id, 'user_id' => $bineta->id, 'statut' => 'actif', 'date_adhesion' => now()->subWeek()]);
        GroupMember::create(['group_id' => $g3->id, 'user_id' => $awa->id, 'statut' => 'valide', 'date_adhesion' => now()->subDays(4)]);
        GroupMember::create(['group_id' => $g3->id, 'user_id' => $fatou->id, 'statut' => 'en_attente', 'date_adhesion' => now()->subDay()]);

        // === Litige ouvert (Tontine des Amis) : Modou signale Fatou (retard) ===
        $dispute = Dispute::create([
            'group_id' => $g1->id, 'signale_par' => $modou->id, 'concerne_user_id' => $fatou->id,
            'description' => "Fatou n'a pas encore versé sa cotisation du tour en cours malgré les rappels.",
            'statut' => 'ouvert',
        ]);

        // === Notifications (canal database) pour peupler l'onglet ===
        $modou->notify(new ContributionDeclared($decl));       // Ousmane a déclaré → Modou (bénéficiaire)
        $awa->notify(new PayoutReceived($payout1));             // Awa a reçu son versement (tour 1)
        $awa->notify(new ContributionReminder($c2, 9));         // Rappel d'échéance
        $awa->notify(new DisputeOpened($dispute));              // Awa (admin g1) alertée du litige

        $this->command?->info('Démo « soutenance » chargée. Compte à présenter : +221771111111 / password (Awa Diop).');
    }
}
