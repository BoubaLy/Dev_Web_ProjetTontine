<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restreint l'accès à un rôle donné (ex. 'super_admin').
 * Usage : ->middleware('role:super_admin')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user() || $request->user()->role !== $role) {
            return response()->json([
                'success' => false,
                'message' => "Action réservée au rôle « {$role} ».",
            ], 403);
        }

        return $next($request);
    }
}
