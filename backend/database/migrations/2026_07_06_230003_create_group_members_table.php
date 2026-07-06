<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('ordre_rotation')->nullable();
            $table->enum('statut', ['en_attente', 'valide', 'refuse', 'actif'])->default('en_attente');
            $table->timestamp('date_adhesion')->nullable();
            $table->timestamps();

            // Un utilisateur ne peut adhérer qu'une fois à un même groupe.
            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_members');
    }
};
