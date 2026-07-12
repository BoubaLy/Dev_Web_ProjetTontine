<?php

namespace App\Services;

use App\Jobs\EscalateUnvalidatedContributionJob;
use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\Dispute;
use App\Models\User;
use App\Notifications\ContributionDeclared;
use App\Notifications\ContributionValidated;
use App\Notifications\CotisationPayee;
use App\Notifications\DisputeOpened;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use RuntimeException;

/**
 * Cycle financier (v3) : declaration par le membre, VALIDATION PAR L'ADMIN.
 *
 * Chaque membre declare son depot (reference Mobile Money). L'admin verifie le
 * depot reel puis passe la cotisation de « en attente » a « validee » (ou la
 * conteste -> litige). Historique infalsifiable qui remplace le carnet papier.
 */
class ContributionService
{
    public function __construct(
        private readonly PenaltyCalculatorService $penalites,
        private readonly ReliabilityScoreService $scores,
    ) {
    }

    /**
     * Declaration d'une cotisation par un membre -> statut `declare_paye`.
     *
     * @throws RuntimeException regle metier violee (gel, doublon, tour clos...).
     */
    public function declarer(Cycle $cycle, User $payeur, string $methode, string $reference): Contribution
    {
        $cycle->loadMissing('group');

        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('La periode de collecte de ce tour est close.');
        }

        // Rotative : plus aucune declaration une fois le beneficiaire tire au sort.
        if (! $cycle->group->estAccumulative() && $cycle->tirageEffectue()) {
            throw new RuntimeException('La collecte de ce tour est close (le beneficiaire a ete tire au sort).');
        }

        if ($payeur->est_gele) {
            throw new RuntimeException('Compte gele : vous ne pouvez pas cotiser tant qu\'un litige est en cours.');
        }

        $estMembreActif = $cycle->group->adhesions()
            ->where('user_id', $payeur->id)
            ->where('statut', 'actif')
            ->exists();

        if (! $estMembreActif) {
            throw new RuntimeException('Vous n\'etes pas un membre actif de ce groupe.');
        }

        $existante = $cycle->contributions()->where('user_id', $payeur->id)->first();
        if ($existante && in_array($existante->statut, ['declare_paye', 'valide'], true)) {
            throw new RuntimeException('Vous avez deja declare votre cotisation pour cette periode.');
        }

        return DB::transaction(function () use ($cycle, $payeur, $methode, $reference) {
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

            Log::info('[Cotisation] Declaree', [
                'contribution_id' => $contribution->id,
                'cycle_id' => $cycle->id,
                'payeur_id' => $payeur->id,
                'penalite' => $penalite,
            ]);

            // Notifie l'admin du groupe : un depot est a verifier puis a valider.
            if ($admin = $cycle->group->admin) {
                $admin->notify(new ContributionDeclared($contribution));
            }

            // Rappel a l'admin si la cotisation n'est pas validee sous 48h.
            EscalateUnvalidatedContributionJob::dispatch($contribution->id)
                ->delay(now()->addHours(48));

            return $contribution;
        });
    }

    /** L'admin verifie le depot reel et valide la cotisation -> `valide`. */
    public function valider(Contribution $contribution, User $admin): Contribution
    {
        $this->assurerAValider($contribution);

        return DB::transaction(function () use ($contribution, $admin) {
            $contribution->update([
                'statut' => 'valide',
                'valide_par' => $admin->id,
                'valide_le' => now(),
                'paye_le' => now(),
            ]);

            $this->scores->recalculer($contribution->user);

            Log::info('[Cotisation] Validee par l\'admin', [
                'contribution_id' => $contribution->id,
                'admin_id' => $admin->id,
            ]);

            $contribution->user->notify(new ContributionValidated($contribution));

            // Transparence : tous les autres membres actifs sont informes du paiement.
            $autres = $contribution->cycle->group->adhesions()
                ->where('statut', 'actif')
                ->where('user_id', '!=', $contribution->user_id)
                ->with('user')
                ->get()
                ->pluck('user')
                ->filter();

            Notification::send($autres, new CotisationPayee($contribution));

            return $contribution->fresh();
        });
    }

    /** L'admin conteste une declaration (depot introuvable) -> `litige`. */
    public function contester(Contribution $contribution, User $admin, string $motif): Dispute
    {
        $this->assurerAValider($contribution);

        return DB::transaction(function () use ($contribution, $admin, $motif) {
            $contribution->update([
                'statut' => 'litige',
                'valide_par' => $admin->id,
                'valide_le' => now(),
            ]);

            // Le membre mis en cause est gele le temps de l'investigation.
            $contribution->user->update(['est_gele' => true]);

            $dispute = Dispute::create([
                'group_id' => $contribution->cycle->group_id,
                'signale_par' => $admin->id,
                'concerne_user_id' => $contribution->user_id,
                'contribution_id' => $contribution->id,
                'description' => $motif,
                'statut' => 'ouvert',
            ]);

            Log::warning('[Cotisation] Contestee par l\'admin — litige ouvert', [
                'contribution_id' => $contribution->id,
                'dispute_id' => $dispute->id,
                'admin_id' => $admin->id,
            ]);

            // Informe le membre concerne de l'ouverture du litige.
            $contribution->user->notify(new DisputeOpened($dispute));

            return $dispute;
        });
    }

    /** Garde-fou : la cotisation doit etre en attente de validation. */
    private function assurerAValider(Contribution $contribution): void
    {
        if ($contribution->statut !== 'declare_paye') {
            throw new RuntimeException('Cette cotisation n\'est pas en attente de validation.');
        }
    }
}
