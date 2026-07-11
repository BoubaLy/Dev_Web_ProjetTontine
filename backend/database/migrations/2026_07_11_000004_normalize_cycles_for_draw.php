<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Mise en coherence des donnees creees avant le passage au tirage au sort.
 *
 * Ancienne logique : le beneficiaire d'un tour etait pre-attribue par l'ordre de
 * rotation des le demarrage. Nouvelle logique : il est tire au sort APRES la
 * collecte (marque par `tirage_effectue_le`).
 *
 *  - Tours EN COURS avec un beneficiaire mais sans tirage reel -> on remet le
 *    beneficiaire a null : le tour repart en simple collecte, le gagnant sera
 *    tire au sort. (Aucune donnee financiere n'est touchee.)
 *  - Tours DEJA CLOTURES avec un beneficiaire -> ils sont historises comme
 *    "tires au sort" (on renseigne la date pour un affichage coherent).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('cycles')
            ->where('statut', 'en_cours')
            ->whereNotNull('beneficiaire_id')
            ->whereNull('tirage_effectue_le')
            ->update(['beneficiaire_id' => null]);

        DB::table('cycles')
            ->where('statut', 'cloture')
            ->whereNotNull('beneficiaire_id')
            ->whereNull('tirage_effectue_le')
            ->update(['tirage_effectue_le' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        // Normalisation de donnees : rien a restaurer.
    }
};
