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

        $notifications = $user->notifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? $n->type,
                'data' => $n->data,
                'lu' => $n->read_at !== null,
                'created_at' => $n->created_at,
            ]);

        return $this->success([
            'notifications' => $notifications,
            'non_lues' => $user->unreadNotifications()->count(),
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
