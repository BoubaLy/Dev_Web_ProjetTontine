<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Module Notifications (MVP) — expose les notifications in-app stockées via le
 * canal `database` de Laravel Notifications. C'est le point d'entrée du
 * bénéficiaire pour la validation croisée (US-11.b) et des rappels (US-14).
 */
class NotificationController extends Controller
{
    use ApiResponse;

    /** Liste des notifications de l'utilisateur (les plus récentes d'abord). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $raw = $user->notifications()->latest()->limit(50)->get();

        // État RÉEL des cotisations liées (pour savoir si l'action est encore requise,
        // indépendamment du statut lu/non-lu de la notification).
        $contributionIds = $raw->map(fn ($n) => $n->data['contribution_id'] ?? null)->filter()->unique()->all();
        $statuts = \App\Models\Contribution::whereIn('id', $contributionIds)->pluck('statut', 'id');

        $notifications = $raw->map(function ($n) use ($statuts) {
            $type = $n->data['type'] ?? $n->type;
            $cId = $n->data['contribution_id'] ?? null;
            $cStatut = $cId ? ($statuts[$cId] ?? null) : null;

            return [
                'id' => $n->id,
                'type' => $type,
                'data' => $n->data,
                'lu' => $n->read_at !== null,
                'created_at' => $n->created_at,
                // Validation croisée : état réel de la cotisation + action encore à faire ?
                'contribution_statut' => $cStatut,
                'action_requise' => $type === 'contribution_declaree' && $cStatut === 'declare_paye',
            ];
        });

        // « Non lues » pertinentes = actions encore à faire + notifs non lues.
        $aValider = $notifications->where('action_requise', true)->count();

        return $this->success([
            'notifications' => $notifications->values(),
            'non_lues' => $user->unreadNotifications()->count(),
            'actions_requises' => $aValider,
        ], 'Vos notifications.');
    }

    /** Marque une notification comme lue. */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return $this->error('Notification introuvable.', null, 404);
        }

        $notification->markAsRead();

        return $this->success(null, 'Notification marquée comme lue.');
    }
}
