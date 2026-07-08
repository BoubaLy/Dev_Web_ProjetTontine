<?php

namespace App\Services;

use App\Jobs\ProcessPayoutJob;
use App\Models\Cycle;
use App\Models\GroupMember;
use App\Models\Payout;
use RuntimeException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Clôture d'un cycle et enchaînement du tour suivant (US-11).
 *
 * Règles appliquées :
 *  - RG-05 : le versement n'est déclenché que si le taux de collecte atteint 100 %.
 *  - RG-08 : la clôture à 100 % exige que toutes les cotisations soient au statut
 *            définitif `valide` (une déclaration non validée bloque la clôture).
 */
class CloseCycleService
{
    public function __construct(private readonly ReliabilityScoreService $scores)
    {
    }

    /** Membres actifs devant cotiser sur la période (tous sauf le bénéficiaire du tour). */
    public function payeursAttendus(Cycle $cycle): \Illuminate\Support\Collection
    {
        return $cycle->group->adhesions()
            ->where('statut', 'actif')
            ->where('user_id', '!=', $cycle->beneficiaire_id)
            ->pluck('user_id');
    }

    /** Le cycle est-il clôturable ? (toutes les cotisations attendues sont `valide`). */
    public function peutCloturer(Cycle $cycle): bool
    {
        $attendus = $this->payeursAttendus($cycle);

        $valides = $cycle->contributions()
            ->where('statut', 'valide')
            ->whereIn('user_id', $attendus)
            ->count();

        return $attendus->count() > 0 && $valides === $attendus->count();
    }

    /**
     * Clôture le cycle : crée le versement (SLA simulé 24h), passe au tour suivant
     * et recalcule les scores de fiabilité des cotisants.
     *
     * @throws RuntimeException si le taux de collecte n'atteint pas 100 % (RG-05/08).
     */
    public function cloturer(Cycle $cycle): Payout
    {
        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('Ce cycle est déjà clôturé.');
        }

        if (! $this->peutCloturer($cycle)) {
            throw new RuntimeException(
                'Clôture impossible : toutes les cotisations doivent être validées (RG-08).'
            );
        }

        // RG-06 — un bénéficiaire gelé (litige en cours) ne peut pas recevoir le
        // versement tant que le litige n'est pas clos.
        if ($cycle->beneficiaire?->est_gele) {
            throw new RuntimeException(
                'Le bénéficiaire du tour est gelé (litige en cours) : le versement est bloqué jusqu\'à résolution (RG-06).'
            );
        }

        return DB::transaction(function () use ($cycle) {
            $cycle->loadMissing('group', 'contributions');

            $total = (float) $cycle->contributions()
                ->where('statut', 'valide')
                ->sum(DB::raw('montant + montant_penalite'));

            $payout = Payout::create([
                'cycle_id' => $cycle->id,
                'user_id' => $cycle->beneficiaire_id,
                'montant' => $total,
                'statut' => 'en_attente',
            ]);

            $cycle->update(['statut' => 'cloture']);

            // Recalcul des scores de fiabilité des cotisants du tour.
            foreach ($this->payeursAttendus($cycle) as $userId) {
                if ($user = \App\Models\User::find($userId)) {
                    $this->scores->recalculer($user);
                }
            }

            $this->creerCycleSuivant($cycle);

            Log::info('[Cycle] Clôture', [
                'cycle_id' => $cycle->id,
                'group_id' => $cycle->group_id,
                'payout_id' => $payout->id,
                'montant' => $total,
            ]);

            // Versement asynchrone au bénéficiaire (SLA simulé de 24h — US-11.3).
            ProcessPayoutJob::dispatch($payout->id)->delay(now()->addSeconds(5));

            return $payout;
        });
    }

    /**
     * Crée le cycle suivant pour le prochain bénéficiaire de l'ordre de rotation.
     * Si tous les membres ont été servis, le groupe passe au statut `cloture`.
     */
    private function creerCycleSuivant(Cycle $cycle): ?Cycle
    {
        $group = $cycle->group;

        $membres = $group->adhesions()
            ->where('statut', 'actif')
            ->whereNotNull('ordre_rotation')
            ->orderBy('ordre_rotation')
            ->get();

        $prochainOrdre = $cycle->numero_periode + 1;

        // Tous les tours effectués : la tontine est terminée.
        if ($prochainOrdre > $membres->count()) {
            $group->update(['statut' => 'cloture']);
            Log::info('[Cycle] Tontine terminée', ['group_id' => $group->id]);

            return null;
        }

        $beneficiaire = $membres->firstWhere('ordre_rotation', $prochainOrdre);

        $dateDebut = now();
        $dateFin = $group->frequence === 'hebdomadaire'
            ? $dateDebut->copy()->addWeek()
            : $dateDebut->copy()->addMonth();

        return Cycle::create([
            'group_id' => $group->id,
            'numero_periode' => $prochainOrdre,
            'beneficiaire_id' => $beneficiaire?->user_id,
            'date_debut' => $dateDebut,
            'date_fin' => $dateFin,
            'statut' => 'en_cours',
        ]);
    }
}
