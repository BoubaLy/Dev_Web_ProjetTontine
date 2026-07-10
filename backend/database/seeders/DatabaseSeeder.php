<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Jeu de données de démonstration reproductible (sans factory -> fonctionne
     * aussi en image de production `--no-dev`). Voir {@see DemoSeeder}.
     */
    public function run(): void
    {
        $this->call(DemoSeeder::class);
    }
}
