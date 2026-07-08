<?php

use App\Jobs\CloseCycleJob;
use App\Jobs\SendReminderJob;
use App\Models\Cycle;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Tâches planifiées (US-14, US-11)
|--------------------------------------------------------------------------
| Exécutées par le conteneur `scheduler` (php artisan schedule:work).
*/

// Rappels d'échéance de cotisation (J-3 / J-1 / Jour J).
Schedule::job(new SendReminderJob())->dailyAt('09:00');

// Clôture automatique des cycles échus dont la collecte est complète (RG-05/08).
Schedule::call(function () {
    Cycle::where('statut', 'en_cours')
        ->whereDate('date_fin', '<=', now())
        ->pluck('id')
        ->each(fn ($id) => CloseCycleJob::dispatch($id));
})->dailyAt('10:00')->name('cloture-cycles-echus')->withoutOverlapping();
