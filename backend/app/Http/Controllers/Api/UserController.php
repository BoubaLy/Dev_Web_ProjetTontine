<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReliabilityScoreService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    /** US-17 — Score de fiabilité d'un membre + badge (🟢/🟡/🔴). */
    public function reliabilityScore(User $user): JsonResponse
    {
        $score = (float) $user->score_fiabilite;

        return $this->success([
            'user_id' => $user->id,
            'score' => $score,
            'badge' => ReliabilityScoreService::badge($score),
        ], 'Score de fiabilité.');
    }

    /**
     * US-16 — Liste des comptes (Super-Admin) pour la modération globale.
     * Réservé au rôle super_admin via le middleware `role:super_admin`.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->select('id', 'nom', 'prenom', 'telephone', 'email', 'role', 'statut_kyc', 'score_fiabilite', 'est_gele')
            ->orderBy('nom')
            ->get();

        return $this->success($users, 'Comptes utilisateurs.');
    }

    /**
     * US-16 / RG-06 — Geler ou dégeler un compte (Super-Admin).
     * Un compte gelé ne peut ni cotiser, ni recevoir de versement, ni se connecter.
     */
    public function setFreeze(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['gele' => ['required', 'boolean']]);

        if ($user->estSuperAdmin()) {
            return $this->error('Impossible de geler un compte Super-Administrateur.', null, 422);
        }

        $user->update(['est_gele' => $data['gele']]);

        return $this->success(
            $user->only(['id', 'est_gele']),
            $data['gele'] ? 'Compte gelé.' : 'Compte dégelé.'
        );
    }
}
