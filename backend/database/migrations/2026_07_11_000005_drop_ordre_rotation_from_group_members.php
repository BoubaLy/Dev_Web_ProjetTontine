<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * L'ordre de passage pre-etabli n'existe plus (le beneficiaire est tire au sort).
 * On retire la colonne devenue morte pour eviter toute incoherence.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('group_members', 'ordre_rotation')) {
            Schema::table('group_members', function (Blueprint $table) {
                $table->dropColumn('ordre_rotation');
            });
        }
    }

    public function down(): void
    {
        Schema::table('group_members', function (Blueprint $table) {
            $table->unsignedInteger('ordre_rotation')->nullable()->after('user_id');
        });
    }
};
