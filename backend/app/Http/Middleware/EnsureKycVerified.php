<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RG-01 — Bloque l'accès aux ressources nécessitant un KYC validé
 * tant que statut_kyc n'est pas 'verifie'.
 */
class EnsureKycVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->estKycVerifie()) {
            return response()->json([
                'success' => false,
                'message' => 'Votre identité (KYC) doit être validée pour effectuer cette action.',
                'errors' => ['kyc' => ["statut_kyc doit être 'verifie'"]],
            ], 403);
        }

        return $next($request);
    }
}
