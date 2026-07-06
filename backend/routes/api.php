<?php

use App\Http\Controllers\Api\AuthController;
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
    });
});
