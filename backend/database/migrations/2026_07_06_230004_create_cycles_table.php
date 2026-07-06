<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('numero_periode');
            // Bénéficiaire du tour (défini par l'ordre de rotation).
            $table->foreignId('beneficiaire_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['en_cours', 'cloture'])->default('en_cours');
            $table->timestamps();

            $table->unique(['group_id', 'numero_periode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycles');
    }
};
