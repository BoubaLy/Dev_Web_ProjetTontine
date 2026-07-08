<?php

use App\Http\Middleware\EnsureKycVerified;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Derrière un reverse-proxy/load-balancer (Docker, PaaS) : faire
        // confiance aux en-têtes X-Forwarded-* pour détecter HTTPS et l'IP réelle.
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        $middleware->alias([
            'kyc.verified' => EnsureKycVerified::class,
            'role' => EnsureRole::class,
        ]);

        // En-têtes de sécurité sur toutes les réponses de l'API.
        $middleware->api(append: [SecurityHeaders::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Réponses JSON standardisées pour l'API (format §8).
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les données fournies sont invalides.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié.',
                ], 401);
            }
        });
    })->create();
