<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kyc_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type_document', ['cni', 'passeport']);
            // Chemin de stockage chiffré au repos (encrypted cast, §9) → text.
            $table->text('chemin_fichier');
            $table->enum('statut', ['en_attente', 'valide', 'rejete'])->default('en_attente');
            // Super-Admin ayant validé/rejeté le document (validation manuelle MVP).
            $table->foreignId('valide_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kyc_documents');
    }
};
