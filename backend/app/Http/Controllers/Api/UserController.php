<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReliabilityScoreService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

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
}
