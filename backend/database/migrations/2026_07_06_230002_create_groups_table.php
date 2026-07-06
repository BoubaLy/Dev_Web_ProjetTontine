<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->enum('type', ['rotative', 'accumulative']);
            $table->decimal('montant_cotisation', 12, 2);
            $table->enum('frequence', ['hebdomadaire', 'mensuelle']);
            $table->unsignedInteger('nb_membres_max');
            $table->decimal('penalite_pourcentage', 4, 2)->default(0);
            $table->unsignedInteger('delai_grace_jours')->default(0);
            $table->enum('methode_rotation', ['manuelle', 'aleatoire'])->default('aleatoire');
            $table->enum('statut', ['ouvert', 'en_cours', 'cloture'])->default('ouvert');
            $table->string('code_invitation')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
