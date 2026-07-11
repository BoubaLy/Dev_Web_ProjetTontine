<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tontine rotative : le beneficiaire n'est plus connu d'avance, il est tire au
 * sort APRES la collecte complete. On horodate le tirage (preuve/tracabilite).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cycles', function (Blueprint $table) {
            $table->timestamp('tirage_effectue_le')->nullable()->after('date_fin');
        });
    }

    public function down(): void
    {
        Schema::table('cycles', function (Blueprint $table) {
            $table->dropColumn('tirage_effectue_le');
        });
    }
};
