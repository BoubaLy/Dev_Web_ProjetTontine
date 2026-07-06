<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table cotisations — système P2P déclaratif avec validation croisée (v2.1).
     */
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->decimal('montant_penalite', 12, 2)->default(0);
            $table->enum('statut', [
                'en_attente',   // rien déclaré
                'declare_paye', // payeur a saisi la référence de transaction
                'valide',       // bénéficiaire a confirmé la réception
                'en_retard',    // délai de grâce dépassé sans déclaration
                'litige',       // bénéficiaire a contesté
            ])->default('en_attente');
            $table->enum('methode_paiement', ['mock', 'wave', 'orange_money'])->nullable();
            // Référence SMS Mobile Money — requise au passage en declare_paye,
            // unique par cycle pour limiter les déclarations dupliquées (§9).
            $table->string('reference_transaction')->nullable();
            // Bénéficiaire ayant confirmé/contesté la réception.
            $table->foreignId('valide_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('declare_le')->nullable();
            $table->timestamp('valide_le')->nullable();
            $table->timestamp('paye_le')->nullable();
            $table->timestamps();

            $table->unique(['cycle_id', 'user_id']);
            $table->unique(['cycle_id', 'reference_transaction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contributions');
    }
};
