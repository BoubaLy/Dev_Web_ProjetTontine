<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tontine accumulative (coffre-fort) : date d'echeance finale (ex. la Tabaski)
 * a laquelle chaque membre recupere exactement ses propres versements.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->date('date_echeance')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('date_echeance');
        });
    }
};
