<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained()->cascadeOnDelete();
            // Bénéficiaire du versement du tour.
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->enum('statut', ['en_attente', 'verse', 'echoue'])->default('en_attente');
            $table->timestamp('verse_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
