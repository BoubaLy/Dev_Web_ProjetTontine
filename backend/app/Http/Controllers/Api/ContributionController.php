<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contribution\DeclareContributionRequest;
use App\Models\Contribution;
use App\Models\Cycle;
use App\Services\CloseCycleService;
use App\Services\ContributionService;
use App\Services\RotationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Module Cotisations & Cycle Financier (v3).
 *
 * Flux : le membre declare son depot -> l'admin verifie et valide (ou conteste)
 * -> (rotative) tirage au sort une fois 100 % valide -> cloture avec recu.
 * Controleur fin : la logique metier est dans les Services.
 */
class ContributionController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ContributionService $service)
    {
    }

    /** Declarer une cotisation (membre) -> statut `declare_paye` (en attente). */
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

        return $this->success($contribution, 'Cotisation déclarée. En attente de validation de l\'administrateur.', 201);
    }

    /** L'admin valide un depot reel -> statut `valide`. */
    public function validate(Request $request, Contribution $contribution): JsonResponse
    {
        if (! $request->user()->can('valider', $contribution)) {
            return $this->error('Seul l\'administrateur du groupe peut valider cette cotisation.', null, 403);
        }

        try {
            $contribution = $this->service->valider($contribution, $request->user());
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success($contribution, 'Cotisation validée.');
    }

    /** L'admin conteste une declaration (depot introuvable) -> `litige`. */
    public function dispute(Request $request, Contribution $contribution): JsonResponse
    {
        if (! $request->user()->can('valider', $contribution)) {
            return $this->error('Seul l\'administrateur du groupe peut contester cette cotisation.', null, 403);
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

    /** Rotative : tirage au sort du beneficiaire apres collecte complete (admin). */
    public function draw(Request $request, Cycle $cycle, RotationService $rotation): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut lancer le tirage.', null, 403);
        }

        try {
            $gagnant = $rotation->tirer($cycle);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success(
            $cycle->fresh()->load('beneficiaire:id,nom,prenom,telephone'),
            "Tirage effectué : {$gagnant->prenom} {$gagnant->nom} reçoit le pot de ce tour.",
        );
    }

    /** Tableau de bord paiements du tour (admin du groupe). */
    public function dashboard(Request $request, Cycle $cycle): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut consulter ce tableau de bord.', null, 403);
        }

        $cycle->load('beneficiaire:id,nom,prenom,telephone', 'group.adhesions.user:id,nom,prenom,telephone');
        $contributions = $cycle->contributions()->get()->keyBy('user_id');

        $membres = $cycle->group->adhesions
            ->where('statut', 'actif')
            ->map(function ($adhesion) use ($contributions) {
                $contribution = $contributions->get($adhesion->user_id);

                return [
                    'user_id' => $adhesion->user_id,
                    'contribution_id' => $contribution->id ?? null,
                    'nom' => trim("{$adhesion->user->prenom} {$adhesion->user->nom}"),
                    'statut' => $contribution->statut ?? 'en_attente',
                    'montant_penalite' => $contribution->montant_penalite ?? 0,
                    'reference_transaction' => $contribution->reference_transaction ?? null,
                ];
            })
            ->values();

        $attendus = $membres->count();
        $valides = $membres->where('statut', 'valide')->count();
        $estAccumulative = $cycle->group->estAccumulative();
        $collecteComplete = $attendus > 0 && $valides === $attendus;

        return $this->success([
            'cycle' => $cycle->only(['id', 'numero_periode', 'date_debut', 'date_fin', 'statut', 'tirage_effectue_le']),
            'type' => $cycle->group->type,
            'beneficiaire' => $cycle->beneficiaire,
            'taux_collecte' => $attendus > 0 ? round($valides / $attendus * 100, 1) : 0,
            'collecte_complete' => $collecteComplete,
            'tirage_effectue' => $cycle->tirageEffectue(),
            // Rotative : on peut tirer une fois 100 % valide et avant tout tirage.
            'peut_tirer' => ! $estAccumulative && $collecteComplete && ! $cycle->tirageEffectue(),
            // Rotative : cloture possible une fois le beneficiaire tire au sort.
            'peut_cloturer' => ! $estAccumulative && $collecteComplete && $cycle->tirageEffectue(),
            // Accumulative : on peut avancer d'une periode une fois tout valide.
            'peut_avancer' => $estAccumulative && $collecteComplete,
            'membres' => $membres,
        ], 'Tableau de bord du tour.');
    }

    /** Rotative : cloturer le tour + verser le pot au gagnant, avec le recu (admin). */
    public function close(Request $request, Cycle $cycle, CloseCycleService $closeCycle): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut clôturer le tour.', null, 403);
        }

        $request->validate([
            'recu' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ], [
            'recu.required' => 'Le reçu du transfert au bénéficiaire est obligatoire pour clôturer.',
        ]);

        $recuPath = $request->file('recu')->store('recus', 'public');

        try {
            $payout = $closeCycle->cloturerRotative($cycle, $recuPath);
        } catch (RuntimeException $e) {
            // On evite de garder un fichier orphelin si la cloture echoue.
            Storage::disk('public')->delete($recuPath);

            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success(
            $payout,
            'Tour clôturé. Le versement au bénéficiaire est en cours (SLA 24h).',
            201
        );
    }

    /** Accumulative : cloturer la periode courante et ouvrir la suivante (admin). */
    public function advance(Request $request, Cycle $cycle, CloseCycleService $closeCycle): JsonResponse
    {
        if ($cycle->group->admin_id !== $request->user()->id) {
            return $this->error('Seul l\'administrateur du groupe peut clôturer la période.', null, 403);
        }

        try {
            $suivant = $closeCycle->avancerPeriodeAccumulative($cycle);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success($suivant, 'Période clôturée. La période suivante est ouverte.', 201);
    }

    /** Historique personnel des cotisations et versements recus. */
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
