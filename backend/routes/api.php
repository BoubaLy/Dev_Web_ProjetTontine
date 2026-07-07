<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContributionController;
use App\Http\Controllers\Api\GroupController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — TontineSecure
|--------------------------------------------------------------------------
| Base URL : /api/v1 — Auth : Bearer Token (Laravel Sanctum).
*/

Route::prefix('v1')->group(function () {
    // --- Authentification (public) ---
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);

    // --- Routes authentifiées ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        // --- Groupes & rotation ---
        Route::get('groups', [GroupController::class, 'index']);
        Route::post('groups', [GroupController::class, 'store'])->middleware('kyc.verified');
        Route::post('groups/join/{code}', [GroupController::class, 'join'])->middleware('kyc.verified');
        Route::get('groups/{group}', [GroupController::class, 'show']);
        Route::post('groups/{group}/invite', [GroupController::class, 'invite']);
        Route::patch('groups/{group}/members/{userId}/validate', [GroupController::class, 'validateMember']);
        Route::post('groups/{group}/start-cycle', [GroupController::class, 'startCycle']);
        Route::get('groups/{group}/cycles/current', [GroupController::class, 'currentCycle']);

        // --- Cotisations & cycle financier (P2P déclaratif, validation croisée) ---
        Route::get('me/contributions', [ContributionController::class, 'myHistory']);
        Route::post('cycles/{cycle}/contributions', [ContributionController::class, 'store']);
        Route::get('cycles/{cycle}/dashboard', [ContributionController::class, 'dashboard']);
        Route::post('cycles/{cycle}/close', [ContributionController::class, 'close']);
        Route::patch('contributions/{contribution}/confirm', [ContributionController::class, 'confirm']);
        Route::patch('contributions/{contribution}/dispute', [ContributionController::class, 'dispute']);
    });
});
