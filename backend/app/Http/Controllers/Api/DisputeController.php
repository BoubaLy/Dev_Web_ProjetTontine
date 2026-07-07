<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Models\Group;
use App\Models\User;
use App\Notifications\DisputeOpened;
use App\Notifications\DisputeResolved;
use App\Services\ReliabilityScoreService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Module Litiges (MVP) — signalement (US-15), consultation, gel de compte le
 * temps de l'investigation et clôture avec décision (US-16, RG-06).
 */
class DisputeController extends Controller
{
    use ApiResponse;

    private const AVEC = ['group:id,nom,admin_id', 'signaleur:id,nom,prenom', 'concerne:id,nom,prenom,est_gele', 'contribution:id,statut,montant'];

    /** US-16 — Consulter les litiges pertinents pour l'utilisateur. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Dispute::with(self::AVEC)->latest();

        if (! $user->estSuperAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('group', fn ($g) => $g->where('admin_id', $user->id))
                    ->orWhere('signale_par', $user->id)
                    ->orWhere('concerne_user_id', $user->id);
            });
        }

        return $this->success($query->get(), 'Litiges.');
    }

    /** US-15 — Signaler un litige (membre du groupe concerné). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'group_id' => ['required', 'exists:groups,id'],
            'description' => ['required', 'string', 'max:2000'],
            'concerne_user_id' => ['nullable', 'exists:users,id'],
            'contribution_id' => ['nullable', 'exists:contributions,id'],
        ]);

        $user = $request->user();
        $group = Group::findOrFail($data['group_id']);

        $estMembre = $group->admin_id === $user->id
            || $group->adhesions()->where('user_id', $user->id)->exists();

        if (! $estMembre) {
            return $this->error('Vous devez être membre du groupe pour signaler un litige.', null, 403);
        }

        $dispute = Dispute::create([
            'group_id' => $group->id,
            'signale_par' => $user->id,
            'concerne_user_id' => $data['concerne_user_id'] ?? null,
            'contribution_id' => $data['contribution_id'] ?? null,
            'description' => $data['description'],
            'statut' => 'ouvert',
        ]);

        // Alerte l'administrateur du groupe (sauf s'il est lui-même le signaleur).
        if ($group->admin && $group->admin_id !== $user->id) {
            $group->admin->notify(new DisputeOpened($dispute));
        }

        return $this->success($dispute->load(self::AVEC), 'Litige signalé.', 201);
    }

    /** US-16 — Passer en investigation et geler le compte mis en cause (RG-06). */
    public function investigate(Request $request, Dispute $dispute): JsonResponse
    {
        if (! $this->peutArbitrer($request->user(), $dispute)) {
            return $this->error('Seul l\'administrateur du groupe ou le support peut arbitrer ce litige.', null, 403);
        }

        if ($dispute->statut !== 'ouvert') {
            return $this->error('Ce litige n\'est plus ouvert.', null, 422);
        }

        DB::transaction(function () use ($dispute) {
            $dispute->update(['statut' => 'en_investigation']);
            $dispute->concerne?->update(['est_gele' => true]);
        });

        return $this->success($dispute->load(self::AVEC), 'Litige en investigation. Compte concerné gelé.');
    }

    /** US-16 — Clôturer le litige avec une décision (dégel du compte, RG-06). */
    public function resolve(Request $request, Dispute $dispute, ReliabilityScoreService $scores): JsonResponse
    {
        if (! $this->peutArbitrer($request->user(), $dispute)) {
            return $this->error('Seul l\'administrateur du groupe ou le support peut clôturer ce litige.', null, 403);
        }

        if ($dispute->statut === 'clos') {
            return $this->error('Ce litige est déjà clôturé.', null, 422);
        }

        $data = $request->validate([
            'resolution' => ['required', 'string', 'max:2000'],
            'liberer_compte' => ['sometimes', 'boolean'],
            'valider_cotisation' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($dispute, $data, $scores) {
            $dispute->update(['statut' => 'clos', 'resolution' => $data['resolution']]);

            // Décision en faveur du payeur : la cotisation contestée est validée.
            if (($data['valider_cotisation'] ?? false) && $dispute->contribution?->statut === 'litige') {
                $dispute->contribution->update([
                    'statut' => 'valide',
                    'valide_le' => now(),
                    'paye_le' => now(),
                ]);
                if ($payeur = $dispute->contribution->user) {
                    $scores->recalculer($payeur);
                }
            }

            // Dégel du compte (par défaut) une fois l'investigation close.
            if (($data['liberer_compte'] ?? true) && $dispute->concerne) {
                $dispute->concerne->update(['est_gele' => false]);
            }
        });

        // Notifie les parties de la décision.
        foreach (array_filter([$dispute->concerne, $dispute->signaleur]) as $partie) {
            $partie->notify(new DisputeResolved($dispute));
        }

        return $this->success($dispute->load(self::AVEC), 'Litige clôturé.');
    }

    /** Peut arbitrer : administrateur du groupe concerné ou Super-Admin (support). */
    private function peutArbitrer(User $user, Dispute $dispute): bool
    {
        return $user->estSuperAdmin() || $dispute->group->admin_id === $user->id;
    }
}
