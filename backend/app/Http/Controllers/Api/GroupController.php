<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Group\CreateGroupRequest;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Invitation;
use App\Services\RotationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GroupController extends Controller
{
    use ApiResponse;

    /** Liste des groupes de l'utilisateur (admin ou membre). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $groupes = Group::query()
            ->where('admin_id', $user->id)
            ->orWhereHas('adhesions', fn ($q) => $q->where('user_id', $user->id))
            ->withCount(['adhesions as membres_actifs_count' => fn ($q) => $q->whereIn('statut', ['valide', 'actif'])])
            ->latest()
            ->get();

        return $this->success($groupes, 'Vos groupes.');
    }

    /** US-05 — Créer un groupe de tontine (nécessite KYC validé). */
    public function store(CreateGroupRequest $request): JsonResponse
    {
        $user = $request->user();

        $group = Group::create([
            ...$request->validated(),
            'admin_id' => $user->id,
            'statut' => 'ouvert',
            'code_invitation' => $this->genererCodeUnique(),
        ]);

        // Le créateur est membre actif de son propre groupe.
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'statut' => 'actif',
            'date_adhesion' => now(),
        ]);

        return $this->success($group->fresh(), 'Groupe créé avec succès.', 201);
    }

    /** US-05 — Détails d'un groupe (réservé aux membres). */
    public function show(Request $request, Group $group): JsonResponse
    {
        if (! $request->user()->can('view', $group)) {
            return $this->error("Vous n'êtes pas membre de ce groupe.", null, 403);
        }

        $group->load([
            'admin:id,nom,prenom,telephone',
            'adhesions.user:id,nom,prenom,telephone,score_fiabilite',
            'cycleCourant',
        ]);

        return $this->success($group, 'Détails du groupe.');
    }

    /** US-06 — Générer une invitation (lien/code) partageable. */
    public function invite(Request $request, Group $group): JsonResponse
    {
        if (! $request->user()->can('manage', $group)) {
            return $this->error('Seul l\'administrateur peut inviter des membres.', null, 403);
        }

        $invitation = Invitation::create([
            'group_id' => $group->id,
            'code' => $this->genererCodeUnique(),
            'expire_le' => now()->addDays(7),
        ]);

        return $this->success([
            'code' => $invitation->code,
            'expire_le' => $invitation->expire_le,
            'lien' => url("/api/v1/groups/join/{$invitation->code}"),
        ], 'Invitation générée (valable 7 jours).', 201);
    }

    /** US-07 — Rejoindre un groupe via code (nécessite KYC validé). */
    public function join(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'reglement_accepte' => ['required', 'accepted'],
        ], [
            'reglement_accepte.accepted' => 'Vous devez accepter le règlement intérieur.',
        ]);

        $group = $this->resoudreGroupeParCode($code);

        if (! $group) {
            return $this->error('Code d\'invitation invalide ou expiré.', null, 404);
        }

        if ($group->statut !== 'ouvert') {
            return $this->error('Ce groupe n\'accepte plus de nouvelles adhésions.', null, 422);
        }

        $user = $request->user();

        if ($group->adhesions()->where('user_id', $user->id)->exists()) {
            return $this->error('Vous avez déjà une adhésion en cours dans ce groupe.', null, 422);
        }

        $membresCount = $group->adhesions()->whereIn('statut', ['valide', 'actif', 'en_attente'])->count();
        if ($membresCount >= $group->nb_membres_max) {
            return $this->error('Ce groupe est complet.', null, 422);
        }

        $adhesion = GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'statut' => 'en_attente',
            'date_adhesion' => now(),
        ]);

        return $this->success($adhesion, 'Demande d\'adhésion envoyée. En attente de validation de l\'administrateur.', 201);
    }

    /** US-08 — Valider ou refuser une demande d'adhésion. */
    public function validateMember(Request $request, Group $group, int $userId): JsonResponse
    {
        if (! $request->user()->can('manage', $group)) {
            return $this->error('Seul l\'administrateur peut valider les adhésions.', null, 403);
        }

        $data = $request->validate([
            'decision' => ['required', 'in:valide,refuse'],
        ]);

        $adhesion = $group->adhesions()->where('user_id', $userId)->first();

        if (! $adhesion) {
            return $this->error('Adhésion introuvable pour cet utilisateur.', null, 404);
        }

        if ($adhesion->statut !== 'en_attente') {
            return $this->error('Cette adhésion a déjà été traitée.', null, 422);
        }

        $adhesion->update(['statut' => $data['decision']]);

        return $this->success($adhesion, "Adhésion {$data['decision']} avec succès.");
    }

    /** US-09 — Démarrer le cycle (RG-02 : groupe suffisamment rempli). */
    public function startCycle(Request $request, Group $group, RotationService $rotation): JsonResponse
    {
        if (! $request->user()->can('manage', $group)) {
            return $this->error('Seul l\'administrateur peut démarrer le cycle.', null, 403);
        }

        if ($group->statut !== 'ouvert') {
            return $this->error('Le cycle de ce groupe a déjà démarré ou est clôturé.', null, 422);
        }

        $membresActifs = $group->adhesions()->whereIn('statut', ['valide', 'actif'])->count();
        $minRequis = $group->type === 'accumulative' ? 3 : 5;

        if ($membresActifs < $minRequis) {
            return $this->error(
                "Le groupe doit compter au moins {$minRequis} membres validés pour démarrer (actuellement {$membresActifs}).",
                null,
                422
            );
        }

        $cycle = $rotation->demarrerPremierCycle($group);

        return $this->success(
            $cycle->load('beneficiaire:id,nom,prenom,telephone'),
            'Cycle démarré. L\'ordre de rotation a été généré.',
            201
        );
    }

    /** Cycle en cours d'un groupe. */
    public function currentCycle(Request $request, Group $group): JsonResponse
    {
        if (! $request->user()->can('view', $group)) {
            return $this->error("Vous n'êtes pas membre de ce groupe.", null, 403);
        }

        $cycle = $group->cycles()
            ->where('statut', 'en_cours')
            ->with('beneficiaire:id,nom,prenom,telephone')
            ->latest('numero_periode')
            ->first();

        if (! $cycle) {
            return $this->error('Aucun cycle en cours pour ce groupe.', null, 404);
        }

        $user = $request->user();
        $estBeneficiaire = $cycle->beneficiaire_id === $user->id;

        // Statut clair de la cotisation du membre courant pour CE tour (US-12).
        $maCotisation = $cycle->contributions()->where('user_id', $user->id)->first();

        // Enrichit la réponse pour que le membre sache immédiatement quoi faire.
        $data = $cycle->toArray();
        $data['montant_cotisation'] = $group->montant_cotisation;
        $data['est_beneficiaire'] = $estBeneficiaire;
        $data['ma_cotisation_statut'] = $estBeneficiaire ? 'beneficiaire' : ($maCotisation->statut ?? 'a_payer');
        $data['ma_cotisation'] = $maCotisation;

        return $this->success($data, 'Cycle en cours.');
    }

    // --- Helpers ----------------------------------------------------------

    private function genererCodeUnique(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (
            Group::where('code_invitation', $code)->exists()
            || Invitation::where('code', $code)->exists()
        );

        return $code;
    }

    private function resoudreGroupeParCode(string $code): ?Group
    {
        // Priorité à une invitation valide et non expirée…
        $invitation = Invitation::where('code', $code)
            ->where(fn ($q) => $q->whereNull('expire_le')->orWhere('expire_le', '>', now()))
            ->first();

        if ($invitation) {
            return $invitation->group;
        }

        // …sinon le code permanent du groupe.
        return Group::where('code_invitation', $code)->first();
    }
}
