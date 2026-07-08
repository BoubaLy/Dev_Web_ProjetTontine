<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kyc\KycUploadRequest;
use App\Models\KycDocument;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Module KYC (US-02) — dépôt de pièces d'identité et validation manuelle par le
 * Super-Admin. Fichiers stockés sur un disque privé, chemin chiffré au repos ;
 * accès aux pièces restreint au propriétaire et au support (§9).
 */
class KycController extends Controller
{
    use ApiResponse;

    /** Disque de stockage des pièces (privé par défaut : storage/app/private). */
    private function disk(): string
    {
        return config('filesystems.default') === 's3' ? 's3' : 'local';
    }

    /** US-02 — Déposer une pièce d'identité (passe le KYC en attente). */
    public function upload(KycUploadRequest $request): JsonResponse
    {
        $user = $request->user();

        $chemin = $request->file('document')->store("kyc/{$user->id}", $this->disk());

        $document = KycDocument::create([
            'user_id' => $user->id,
            'type_document' => $request->validated('type_document'),
            'chemin_fichier' => $chemin,
            'statut' => 'en_attente',
        ]);

        // Le membre repasse « en attente » de vérification tant qu'un doc est en cours.
        if ($user->statut_kyc !== 'verifie') {
            $user->update(['statut_kyc' => 'en_attente']);
        }

        return $this->success($document, 'Pièce déposée. En attente de validation.', 201);
    }

    /** Mes pièces déposées. */
    public function mine(Request $request): JsonResponse
    {
        return $this->success(
            $request->user()->kycDocuments()->latest()->get(),
            'Vos pièces KYC.'
        );
    }

    /** Support — pièces en attente de validation. */
    public function pending(): JsonResponse
    {
        $documents = KycDocument::with('user:id,nom,prenom,telephone')
            ->where('statut', 'en_attente')
            ->latest()
            ->get();

        return $this->success($documents, 'Pièces en attente de validation.');
    }

    /** US-02 — Valider ou rejeter une pièce (Super-Admin), met à jour le KYC du membre. */
    public function validateDocument(Request $request, KycDocument $kyc): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', 'in:valide,rejete'],
        ]);

        if ($kyc->statut !== 'en_attente') {
            return $this->error('Cette pièce a déjà été traitée.', null, 422);
        }

        $kyc->update(['statut' => $data['decision'], 'valide_par' => $request->user()->id]);

        $kyc->user->update([
            'statut_kyc' => $data['decision'] === 'valide' ? 'verifie' : 'rejete',
        ]);

        return $this->success($kyc->fresh(), "Pièce {$data['decision']}e.");
    }

    /** Télécharger une pièce — réservé au propriétaire et au Super-Admin (§9). */
    public function download(Request $request, KycDocument $kyc): StreamedResponse|JsonResponse
    {
        $user = $request->user();

        if ($kyc->user_id !== $user->id && ! $user->estSuperAdmin()) {
            return $this->error('Accès à cette pièce non autorisé.', null, 403);
        }

        $disk = Storage::disk($this->disk());

        if (! $disk->exists($kyc->chemin_fichier)) {
            return $this->error('Fichier introuvable.', null, 404);
        }

        return $disk->download($kyc->chemin_fichier);
    }
}
