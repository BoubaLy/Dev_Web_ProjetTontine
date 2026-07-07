<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contribution\DeclareContributionRequest;
use App\Models\Contribution;
use App\Models\Cycle;
use App\Services\CloseCycleService;
use App\Services\ContributionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Module Cotisations & Cycle Financier (v2.1) — système P2P déclaratif avec
 * validation croisée. Contrôleur fin : la logique métier est dans les Services.
 */
class ContributionController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ContributionService $service)
    {
    }

    /** US-10 — Déclarer une cotisation (payeur) → statut `declare_paye`. */
    public function store(DeclareContributionRequest $request, Cycle $cycle): JsonResponse
    {
        try {
            $contribution = $this->service->declarer(
                $cycle,
                $request->user(),
                $request->validated('methode_paiement'),
                $request->validated('reference_transaction'),
            );
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success($contribution, 'Cotisation déclarée. En attente de validation du bénéficiaire.', 201);
    }

    /** US-11.b — Confirmer la réception (bénéficiaire) → statut `valide`. */
    public function confirm(Request $request, Contribution $contribution): JsonResponse
    {
        if (! $request->user()->can('valider', $contribution)) {
            return $this->error('Seul le bénéficiaire du tour peut confirmer cette cotisation.', null, 403);
        }

        try {
            $contribution = $this->service->confirmer($contribution, $request->user());
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success($contribution, 'Réception confirmée. Cotisation validée.');
    }

    /** US-11.b — Signaler une anomalie (bénéficiaire) → statut `litige` + litige. */
    public function dispute(Request $request, Contribution $contribution): JsonResponse
    {
        if (! $request->user()->can('valider', $contribution)) {
            return $this->error('Seul le bénéficiaire du tour peut contester cette cotisation.', null, 403);
        }

        $data = $request->validate([
            'description' => ['required', 'string', 'max:2000'],
        ]);

        try {
            $dispute = $this->service->contester($contribution, $request->user(), $data['description']);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success($dispute, 'Anomalie signalée. Un litige a été ouvert.', 201);
    }

    /** US-13 — Tableau de bord paiements du cycle (admin du groupe). */
    public function dashboard(Request $request, Cycle $cycle): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut consulter ce tableau de bord.', null, 403);
        }

        $cycle->load('beneficiaire:id,nom,prenom,telephone', 'group.adhesions.user:id,nom,prenom,telephone');
        $contributions = $cycle->contributions()->get()->keyBy('user_id');

        $membres = $cycle->group->adhesions
            ->where('statut', 'actif')
            ->map(function ($adhesion) use ($cycle, $contributions) {
                $estBeneficiaire = $adhesion->user_id === $cycle->beneficiaire_id;
                $contribution = $contributions->get($adhesion->user_id);

                return [
                    'user_id' => $adhesion->user_id,
                    'nom' => trim("{$adhesion->user->prenom} {$adhesion->user->nom}"),
                    'ordre_rotation' => $adhesion->ordre_rotation,
                    'est_beneficiaire' => $estBeneficiaire,
                    'statut' => $estBeneficiaire ? 'beneficiaire' : ($contribution->statut ?? 'en_attente'),
                    'montant_penalite' => $contribution->montant_penalite ?? 0,
                    'reference_transaction' => $contribution->reference_transaction ?? null,
                ];
            })
            ->values();

        $payeursAttendus = $membres->where('est_beneficiaire', false)->count();
        $valides = $membres->where('statut', 'valide')->count();

        return $this->success([
            'cycle' => $cycle->only(['id', 'numero_periode', 'date_debut', 'date_fin', 'statut']),
            'beneficiaire' => $cycle->beneficiaire,
            'taux_collecte' => $payeursAttendus > 0 ? round($valides / $payeursAttendus * 100, 1) : 0,
            'peut_cloturer' => $payeursAttendus > 0 && $valides === $payeursAttendus,
            'membres' => $membres,
        ], 'Tableau de bord du cycle.');
    }

    /** US-11 — Clôturer le cycle et déclencher le versement (admin du groupe). */
    public function close(Request $request, Cycle $cycle, CloseCycleService $closeCycle): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut clôturer le cycle.', null, 403);
        }

        try {
            $payout = $closeCycle->cloturer($cycle);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success(
            $payout,
            'Cycle clôturé. Le versement au bénéficiaire est en cours (SLA 24h).',
            201
        );
    }

    /** US-12 — Historique personnel des cotisations et versements reçus. */
    public function myHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        $cotisations = $user->contributions()
            ->with('cycle:id,group_id,numero_periode', 'cycle.group:id,nom')
            ->latest()
            ->get();

        $versements = $user->payouts()
            ->with('cycle:id,group_id,numero_periode', 'cycle.group:id,nom')
            ->latest()
            ->get();

        return $this->success([
            'cotisations' => $cotisations,
            'versements' => $versements,
            'score_fiabilite' => $user->score_fiabilite,
        ], 'Votre historique.');
    }
}
