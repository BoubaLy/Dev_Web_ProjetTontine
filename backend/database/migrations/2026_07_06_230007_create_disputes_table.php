<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('signale_par')->constrained('users')->cascadeOnDelete();
            // Membre concerné par le litige (ex. payeur d'une cotisation contestée).
            $table->foreignId('concerne_user_id')->nullable()->constrained('users')->nullOnDelete();
            // Cotisation à l'origine du litige (contestation de validation croisée).
            $table->foreignId('contribution_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description');
            $table->enum('statut', ['ouvert', 'en_investigation', 'clos'])->default('ouvert');
            $table->text('resolution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
