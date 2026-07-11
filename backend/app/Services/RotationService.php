<?php

namespace App\Services;

use App\Models\Cycle;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Ouverture de la collecte et TIRAGE AU SORT du beneficiaire.
 *
 * Nouvelle logique (v3) : plus d'ordre de passage pre-etabli. A chaque tour,
 * tout le monde cotise dans un pot, l'admin valide les depots reels, puis le
 * beneficiaire est tire au sort APRES la collecte complete, parmi les membres
 * qui n'ont pas encore gagne. Le tirage est scelle et journalise (preuve).
 */
class RotationService
{
    public function __construct(private readonly CloseCycleService $cloture)
    {
    }

    /**
     * Demarre le groupe : cree le 1er tour de collecte (sans beneficiaire).
     * Vaut pour la rotative comme pour l'accumulative (coffre-fort).
     */
    public function demarrerPremierCycle(Group $group): Cycle
    {
        return DB::transaction(function () use ($group) {
            // Les membres valides passent actifs pour toute la duree de la tontine.
            $group->adhesions()
                ->whereIn('statut', ['valide', 'actif'])
                ->update(['statut' => 'actif']);

            $cycle = $this->creerCycle($group, 1);
            $group->update(['statut' => 'en_cours']);

            Log::info('[Tontine] Collecte du tour #1 ouverte', [
                'group_id' => $group->id,
                'cycle_id' => $cycle->id,
                'type' => $group->type,
            ]);

            return $cycle;
        });
    }

    /**
     * Tirage au sort du beneficiaire du tour (rotative uniquement), APRES que
     * la collecte soit complete a 100 % (toutes les cotisations validees).
     *
     * @throws RuntimeException si le contexte ne permet pas le tirage.
     */
    public function tirer(Cycle $cycle): User
    {
        $cycle->loadMissing('group');

        if ($cycle->group->estAccumulative()) {
            throw new RuntimeException('Une tontine accumulative (coffre-fort) ne fait pas de tirage au sort.');
        }

        if ($cycle->statut !== 'en_cours') {
            throw new RuntimeException('Ce tour est deja cloture.');
        }

        if ($cycle->tirageEffectue()) {
            throw new RuntimeException('Le beneficiaire de ce tour a deja ete tire au sort.');
        }

        if (! $this->cloture->collecteComplete($cycle)) {
            throw new RuntimeException('Tirage bloque : toutes les cotisations doivent d\'abord etre validees (100 %).');
        }

        // Candidats : membres actifs non geles qui n'ont pas encore gagne ce cycle.
        $dejaGagnants = $cycle->group->cycles()
            ->whereNotNull('beneficiaire_id')
            ->pluck('beneficiaire_id')
            ->all();

        $candidats = $cycle->group->adhesions()
            ->where('statut', 'actif')
            ->whereNotIn('user_id', $dejaGagnants)
            ->pluck('user_id')
            ->all();

        $candidats = User::whereIn('id', $candidats)
            ->where('est_gele', false)
            ->pluck('id')
            ->all();

        if (empty($candidats)) {
            throw new RuntimeException('Aucun membre eligible au tirage (tous ont deja gagne ou sont geles).');
        }

        return DB::transaction(function () use ($cycle, $candidats) {
            $gagnantId = Arr::random($candidats);

            $cycle->update([
                'beneficiaire_id' => $gagnantId,
                'tirage_effectue_le' => now(),
            ]);

            Log::info('[Tontine] Tirage au sort scelle', [
                'cycle_id' => $cycle->id,
                'group_id' => $cycle->group_id,
                'gagnant_id' => $gagnantId,
                'candidats' => $candidats,
                'scelle_le' => now()->toIso8601String(),
            ]);

            return User::find($gagnantId);
        });
    }

    /** Cree un tour de collecte (beneficiaire tire plus tard, ou jamais si coffre-fort). */
    public function creerCycle(Group $group, int $numero): Cycle
    {
        $dateDebut = now();
        $dateFin = $group->frequence === 'hebdomadaire'
            ? $dateDebut->copy()->addWeek()
            : $dateDebut->copy()->addMonth();

        return Cycle::create([
            'group_id' => $group->id,
            'numero_periode' => $numero,
            'beneficiaire_id' => null,
            'date_debut' => $dateDebut,
            'date_fin' => $dateFin,
            'statut' => 'en_cours',
        ]);
    }
}
