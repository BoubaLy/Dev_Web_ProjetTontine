<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS)
|--------------------------------------------------------------------------
| Restreint les origines autorisées à appeler l'API. En production, définir
| CORS_ALLOWED_ORIGINS (liste séparée par des virgules) avec les domaines du
| front (app web / EAS). En dev, « * » reste pratique.
*/

$origins = env('CORS_ALLOWED_ORIGINS');

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins ? explode(',', $origins) : ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
