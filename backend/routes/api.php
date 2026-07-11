<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContributionController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — TontineSecure
|--------------------------------------------------------------------------
| Base URL : /api/v1 — Auth : Bearer Token (Laravel Sanctum).
*/

Route::prefix('v1')->group(function () {
    // --- Authentification (public, protégée contre le brute-force) ---
    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/login', [AuthController::class, 'login']);
        Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);
    });

    // --- Routes authentifiées ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        // --- KYC (dépôt & validation des pièces d'identité) ---
        Route::post('kyc/upload', [KycController::class, 'upload']);
        Route::get('kyc', [KycController::class, 'mine']);
        Route::get('kyc/pending', [KycController::class, 'pending'])->middleware('role:super_admin');
        Route::get('kyc/{kyc}/file', [KycController::class, 'download']);
        Route::patch('kyc/{kyc}/validate', [KycController::class, 'validateDocument'])->middleware('role:super_admin');

        // --- Groupes & tontine ---
        Route::get('groups', [GroupController::class, 'index']);
        Route::post('groups', [GroupController::class, 'store'])->middleware('kyc.verified');
        Route::post('groups/join/{code}', [GroupController::class, 'join'])->middleware('kyc.verified');
        Route::get('groups/{group}', [GroupController::class, 'show']);
        Route::post('groups/{group}/invite', [GroupController::class, 'invite']);
        Route::patch('groups/{group}/members/{userId}/validate', [GroupController::class, 'validateMember']);
        Route::post('groups/{group}/start-cycle', [GroupController::class, 'startCycle']);
        Route::get('groups/{group}/cycles/current', [GroupController::class, 'currentCycle']);
        // Accumulative : restitution a l'echeance (chaque membre recupere ses versements).
        Route::post('groups/{group}/settle', [GroupController::class, 'settle']);

        // --- Cotisations & cycle financier (declaratif, validation par l'admin) ---
        Route::get('me/contributions', [ContributionController::class, 'myHistory']);
        Route::post('cycles/{cycle}/contributions', [ContributionController::class, 'store']);
        Route::get('cycles/{cycle}/dashboard', [ContributionController::class, 'dashboard']);
        // Rotative : tirage au sort du beneficiaire apres collecte, puis cloture avec recu.
        Route::post('cycles/{cycle}/draw', [ContributionController::class, 'draw']);
        Route::post('cycles/{cycle}/close', [ContributionController::class, 'close']);
        // Accumulative : cloturer la periode et ouvrir la suivante.
        Route::post('cycles/{cycle}/advance', [ContributionController::class, 'advance']);
        Route::patch('contributions/{contribution}/validate', [ContributionController::class, 'validate']);
        Route::patch('contributions/{contribution}/dispute', [ContributionController::class, 'dispute']);

        // --- Notifications in-app (canal database) ---
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);

        // --- Litiges (signalement, investigation, résolution) ---
        Route::get('disputes', [DisputeController::class, 'index']);
        Route::post('disputes', [DisputeController::class, 'store']);
        Route::patch('disputes/{dispute}/investigate', [DisputeController::class, 'investigate']);
        Route::patch('disputes/{dispute}/resolve', [DisputeController::class, 'resolve']);

        // --- Score de fiabilité ---
        Route::get('users/{user}/reliability-score', [UserController::class, 'reliabilityScore']);

        // --- Modération des comptes (Super-Admin) ---
        Route::get('users', [UserController::class, 'index'])->middleware('role:super_admin');
        Route::patch('users/{user}/freeze', [UserController::class, 'setFreeze'])->middleware('role:super_admin');
    });
});
