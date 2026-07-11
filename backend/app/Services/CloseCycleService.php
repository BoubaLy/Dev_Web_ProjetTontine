<?php

namespace App\Services;

use App\Jobs\ProcessPayoutJob;
use App\Models\Cycle;
use App\Models\Group;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Cloture des tours et versements.
 *
 * Logique v3 :
 *  - Rotative : la collecte concerne TOUS les membres actifs. Une fois 100 %
 *    valide par l'admin puis le beneficiaire tire au sort, l'admin transfere le
 *    pot, televerse le recu, ce qui cloture le tour et ouvre le suivant.
 *  - Accumulative (coffre-fort) : chaque periode est cloturee sans versement ;
 *    a l'echeance, chaque membre recupere exactement le total de SES versements.
 */
class CloseCycleService
{
    public function __construct(private readonly ReliabilityScoreService $scores)
    {
    }

    /** Membres actifs devant cotiser sur la periode : desormais TOUS les membres. */
    public function payeursAttendus(Cycle $cycle): Collection
    {
        return $cycle->group->adhesions()
            ->where('statut', 'actif')
            ->pluck('user_id');
    }

    /** La collecte du tour est-elle complete (toutes les cotisations `valide`) ? */
    public function collecteComplete(Cycle $cycle): bool
    {
        $attendus = $this->payeursAttendus($cycle);

        $valides = $cycle->contributions()
            ->where('statut', 'valide')
            ->whereIn('user_id', $attendus)
            ->count();

        return $attendus->count() > 0 && $valides === $attendus->count();
    }

    /**
     * Cloture d'un tour rotatif : verse le pot au gagnant tire au sort, avec le
     * recu du transfert, puis ouvre le tour suivant.
     *
     * @throws RuntimeException si les conditions de cloture ne sont pas remplies.
     */
    public function cloturerRotative(Cycle $cycle, ?string $recuPath = null): Payout
    {
        $cycle->loadMissing('group', 'beneficiaire');

        if ($cycle->group->estAccumulative()) {
            throw new RuntimeException('Utilisez la restitution a l\'echeance pour une tontine accumulative.');
        }

        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('Ce tour est deja cloture.');
        }

        if (! $cycle->tirageEffectue()) {
            throw new RuntimeException('Cloture impossible : le beneficiaire n\'a pas encore ete tire au sort.');
        }

        if (! $this->collecteComplete($cycle)) {
            throw new RuntimeException('Cloture impossible : toutes les cotisations doivent etre validees (100 %).');
        }

        // Un beneficiaire gele (litige en cours) ne peut pas recevoir le pot.
        if ($cycle->beneficiaire?->est_gele) {
            throw new RuntimeException('Le beneficiaire est gele (litige en cours) : versement bloque jusqu\'a resolution.');
        }

        return DB::transaction(function () use ($cycle, $recuPath) {
            $total = (float) $cycle->contributions()
                ->where('statut', 'valide')
                ->sum(DB::raw('montant + montant_penalite'));

            $payout = Payout::create([
                'cycle_id' => $cycle->id,
                'user_id' => $cycle->beneficiaire_id,
                'montant' => $total,
                'statut' => 'en_attente',
                'recu_path' => $recuPath,
            ]);

            $cycle->update(['statut' => 'cloture']);

            foreach ($this->payeursAttendus($cycle) as $userId) {
                if ($user = User::find($userId)) {
                    $this->scores->recalculer($user);
                }
            }

            $this->ouvrirTourSuivant($cycle);

            Log::info('[Tontine] Tour rotatif cloture', [
                'cycle_id' => $cycle->id,
                'group_id' => $cycle->group_id,
                'payout_id' => $payout->id,
                'montant' => $total,
                'recu' => $recuPath,
            ]);

            ProcessPayoutJob::dispatch($payout->id)->delay(now()->addSeconds(5));

            return $payout;
        });
    }

    /**
     * Accumulative : cloture la periode courante (sans versement) et ouvre la
     * suivante, tant que l'echeance n'est pas atteinte.
     */
    public function avancerPeriodeAccumulative(Cycle $cycle): Cycle
    {
        $cycle->loadMissing('group');

        if (! $cycle->group->estAccumulative()) {
            throw new RuntimeException('Cette action ne concerne que les tontines accumulatives.');
        }

        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('Cette periode est deja cloturee.');
        }

        return DB::transaction(function () use ($cycle) {
            $cycle->update(['statut' => 'cloture']);

            foreach ($this->payeursAttendus($cycle) as $userId) {
                if ($user = User::find($userId)) {
                    $this->scores->recalculer($user);
                }
            }

            $suivant = Cycle::create([
                'group_id' => $cycle->group_id,
                'numero_periode' => $cycle->numero_periode + 1,
                'beneficiaire_id' => null,
                'date_debut' => now(),
                'date_fin' => $cycle->group->frequence === 'hebdomadaire'
                    ? now()->addWeek()
                    : now()->addMonth(),
                'statut' => 'en_cours',
            ]);

            Log::info('[Tontine] Periode accumulative avancee', [
                'group_id' => $cycle->group_id,
                'periode' => $suivant->numero_periode,
            ]);

            return $suivant;
        });
    }

    /**
     * Restitution a l'echeance (coffre-fort) : chaque membre recupere EXACTEMENT
     * le total de ses propres versements valides. Un mois manque n'impacte que lui.
     *
     * @return Collection<int,Payout>
     */
    public function restituerAccumulative(Group $group): Collection
    {
        if (! $group->estAccumulative()) {
            throw new RuntimeException('La restitution ne concerne que les tontines accumulatives.');
        }

        if ($group->statut !== 'en_cours') {
            throw new RuntimeException('Ce groupe n\'est pas en cours : restitution impossible.');
        }

        $dernierCycle = $group->cycles()->orderByDesc('numero_periode')->first();
        if (! $dernierCycle) {
            throw new RuntimeException('Aucune periode a restituer.');
        }

        // Total valide par membre, sur toutes les periodes du groupe.
        $totauxParMembre = $group->cycles()
            ->with(['contributions' => fn ($q) => $q->where('statut', 'valide')])
            ->get()
            ->pluck('contributions')
            ->flatten()
            ->groupBy('user_id')
            ->map(fn ($lignes) => (float) $lignes->sum(fn ($c) => (float) $c->montant));

        if ($totauxParMembre->isEmpty()) {
            throw new RuntimeException('Aucun versement valide a restituer.');
        }

        return DB::transaction(function () use ($group, $dernierCycle, $totauxParMembre) {
            $payouts = collect();

            foreach ($totauxParMembre as $userId => $total) {
                if ($total <= 0) {
                    continue;
                }

                $payout = Payout::create([
                    'cycle_id' => $dernierCycle->id,
                    'user_id' => $userId,
                    'montant' => $total,
                    'statut' => 'en_attente',
                ]);

                $payouts->push($payout);
                ProcessPayoutJob::dispatch($payout->id)->delay(now()->addSeconds(5));
            }

            $dernierCycle->update(['statut' => 'cloture']);
            $group->update(['statut' => 'cloture']);

            Log::info('[Tontine] Restitution accumulative effectuee', [
                'group_id' => $group->id,
                'nb_membres_servis' => $payouts->count(),
            ]);

            return $payouts;
        });
    }

    /**
     * Ouvre le tour suivant pour la rotative. Quand tous les membres ont gagne,
     * la tontine est terminee.
     */
    private function ouvrirTourSuivant(Cycle $cycle): ?Cycle
    {
        $group = $cycle->group;

        $nbMembres = $group->adhesions()->where('statut', 'actif')->count();
        $nbGagnants = $group->cycles()->whereNotNull('beneficiaire_id')->count();

        if ($nbGagnants >= $nbMembres) {
            $group->update(['statut' => 'cloture']);
            Log::info('[Tontine] Rotative terminee (tous les membres ont gagne)', [
                'group_id' => $group->id,
            ]);

            return null;
        }

        return Cycle::create([
            'group_id' => $group->id,
            'numero_periode' => $cycle->numero_periode + 1,
            'beneficiaire_id' => null,
            'date_debut' => now(),
            'date_fin' => $group->frequence === 'hebdomadaire'
                ? now()->addWeek()
                : now()->addMonth(),
            'statut' => 'en_cours',
        ]);
    }
}
