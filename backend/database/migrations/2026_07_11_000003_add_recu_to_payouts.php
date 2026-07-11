<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cloture d'un tour : l'admin televerse le recu du transfert reel au gagnant
 * (piece justificative infalsifiable, conservee avec le versement).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->string('recu_path')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropColumn('recu_path');
        });
    }
};
