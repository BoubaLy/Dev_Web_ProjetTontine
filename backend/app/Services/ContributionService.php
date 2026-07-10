<?php

namespace App\Services;

use App\Jobs\EscalateUnvalidatedContributionJob;
use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\Dispute;
use App\Models\User;
use App\Notifications\ContributionDeclared;
use App\Notifications\ContributionValidated;
use App\Notifications\DisputeOpened;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Cœur du système P2P déclaratif avec validation croisée (v2.1).
 *
 * Le payeur déclare sa transaction (référence SMS Mobile Money), puis le
 * bénéficiaire du tour la confirme (-> `valide`) ou la conteste (-> `litige`).
 */
class ContributionService
{
    public function __construct(
        private readonly PenaltyCalculatorService $penalites,
        private readonly ReliabilityScoreService $scores,
    ) {
    }

    /**
     * US-10 — Déclaration d'une cotisation par le payeur.
     *
     * @throws RuntimeException règle métier violée (gel, bénéficiaire, doublon…).
     */
    public function declarer(Cycle $cycle, User $payeur, string $methode, string $reference): Contribution
    {
        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('La période de collecte de ce cycle est close.');
        }

        if ($payeur->est_gele) {
            throw new RuntimeException('Compte gelé : vous ne pouvez pas cotiser tant qu\'un litige est en cours (RG-06).');
        }

        if ($cycle->beneficiaire_id === $payeur->id) {
            throw new RuntimeException('Le bénéficiaire du tour ne cotise pas envers lui-même.');
        }

        $estMembreActif = $cycle->group->adhesions()
            ->where('user_id', $payeur->id)
            ->where('statut', 'actif')
            ->exists();

        if (! $estMembreActif) {
            throw new RuntimeException('Vous n\'êtes pas un membre actif de ce groupe.');
        }

        $existante = $cycle->contributions()->where('user_id', $payeur->id)->first();
        if ($existante && in_array($existante->statut, ['declare_paye', 'valide'], true)) {
            throw new RuntimeException('Vous avez déjà déclaré votre cotisation pour cette période.');
        }

        return DB::transaction(function () use ($cycle, $payeur, $methode, $reference, $existante) {
            $penalite = $this->penalites->calculer($cycle->group, $cycle);

            $contribution = Contribution::updateOrCreate(
                ['cycle_id' => $cycle->id, 'user_id' => $payeur->id],
                [
                    'montant' => $cycle->group->montant_cotisation,
                    'montant_penalite' => $penalite,
                    'statut' => 'declare_paye',
                    'methode_paiement' => $methode,
                    'reference_transaction' => $reference,
                    'declare_le' => now(),
                    'valide_par' => null,
                    'valide_le' => null,
                ]
            );

            Log::info('[Cotisation] Déclarée', [
                'contribution_id' => $contribution->id,
                'cycle_id' => $cycle->id,
                'payeur_id' => $payeur->id,
                'penalite' => $penalite,
            ]);

            // Notifie le bénéficiaire pour validation croisée (US-11.b).
            if ($beneficiaire = $cycle->beneficiaire) {
                $beneficiaire->notify(new ContributionDeclared($contribution));
            }

            // RG-09 — alerte l'admin si non validée sous 48h.
            EscalateUnvalidatedContributionJob::dispatch($contribution->id)
                ->delay(now()->addHours(48));

            return $contribution;
        });
    }

    /** US-11.b — Le bénéficiaire confirme la réception des fonds. */
    public function confirmer(Contribution $contribution, User $beneficiaire): Contribution
    {
        $this->assujettirBeneficiaire($contribution, $beneficiaire);

        return DB::transaction(function () use ($contribution, $beneficiaire) {
            $contribution->update([
                'statut' => 'valide',
                'valide_par' => $beneficiaire->id,
                'valide_le' => now(),
                'paye_le' => now(),
            ]);

            $this->scores->recalculer($contribution->user);

            Log::info('[Cotisation] Validée', [
                'contribution_id' => $contribution->id,
                'beneficiaire_id' => $beneficiaire->id,
            ]);

            $contribution->user->notify(new ContributionValidated($contribution));

            return $contribution->fresh();
        });
    }

    /** US-11.b — Le bénéficiaire conteste la déclaration : ouverture d'un litige. */
    public function contester(Contribution $contribution, User $beneficiaire, string $motif): Dispute
    {
        $this->assujettirBeneficiaire($contribution, $beneficiaire);

        return DB::transaction(function () use ($contribution, $beneficiaire, $motif) {
            $contribution->update([
                'statut' => 'litige',
                'valide_par' => $beneficiaire->id,
                'valide_le' => now(),
            ]);

            // RG-06 — le payeur mis en cause est gelé le temps de l'investigation.
            $contribution->user->update(['est_gele' => true]);

            $dispute = Dispute::create([
                'group_id' => $contribution->cycle->group_id,
                'signale_par' => $beneficiaire->id,
                'concerne_user_id' => $contribution->user_id,
                'contribution_id' => $contribution->id,
                'description' => $motif,
                'statut' => 'ouvert',
            ]);

            Log::warning('[Cotisation] Contestée — litige ouvert', [
                'contribution_id' => $contribution->id,
                'dispute_id' => $dispute->id,
                'beneficiaire_id' => $beneficiaire->id,
            ]);

            // Notifie l'administrateur du groupe pour arbitrage.
            if ($admin = $contribution->cycle->group->admin) {
                $admin->notify(new DisputeOpened($dispute));
            }

            return $dispute;
        });
    }

    /** Garde-fou : seul le bénéficiaire du tour agit sur une déclaration le concernant. */
    private function assujettirBeneficiaire(Contribution $contribution, User $beneficiaire): void
    {
        if ($contribution->cycle->beneficiaire_id !== $beneficiaire->id) {
            throw new RuntimeException('Seul le bénéficiaire du tour peut valider ou contester cette cotisation.');
        }

        if ($contribution->statut !== 'declare_paye') {
            throw new RuntimeException('Cette cotisation n\'est pas en attente de validation.');
        }
    }
}
