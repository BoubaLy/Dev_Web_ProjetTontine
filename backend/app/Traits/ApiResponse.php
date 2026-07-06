<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Format de réponse API standard (cf. §8 du cahier des charges) :
 *   { "success": bool, "message": string, "data"|"errors": ... }
 */
trait ApiResponse
{
    protected function success(mixed $data = null, string $message = '', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    protected function error(string $message, mixed $errors = null, int $code = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
