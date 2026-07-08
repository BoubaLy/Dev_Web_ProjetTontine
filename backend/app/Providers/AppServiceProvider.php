<?php

namespace App\Providers;

use App\Contracts\SmsSender;
use App\Services\Sms\LogSmsSender;
use App\Services\Sms\OrangeSmsSender;
use App\Services\Sms\TwilioSmsSender;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Sélection du pilote SMS selon la config (log/orange/twilio).
        $this->app->singleton(SmsSender::class, function ($app) {
            $sms = $app['config']->get('services.sms');

            return match ($sms['driver']) {
                'orange' => new OrangeSmsSender($sms['orange']['token'], $sms['orange']['sender_url'], $sms['sender_name']),
                'twilio' => new TwilioSmsSender($sms['twilio']['sid'], $sms['twilio']['token'], $sms['twilio']['from']),
                default => new LogSmsSender(),
            };
        });
    }

    public function boot(): void
    {
        // En production, forcer HTTPS pour toute URL générée (liens signés,
        // notifications, redirections) — cf. §9 « HTTPS obligatoire ».
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Limiteur anti brute-force sur les endpoints d'authentification,
        // borné par téléphone + IP pour ne pas pénaliser un réseau partagé.
        RateLimiter::for('auth', function (Request $request) {
            $cle = (string) $request->input('telephone').'|'.$request->ip();

            return [
                Limit::perMinute(10)->by($cle),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });
    }
}
