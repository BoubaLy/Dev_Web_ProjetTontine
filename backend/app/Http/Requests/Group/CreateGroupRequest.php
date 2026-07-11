<?php

namespace App\Http\Requests\Group;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class CreateGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', 'in:rotative,accumulative'],
            'montant_cotisation' => ['required', 'numeric', 'min:1'],
            'frequence' => ['required', 'in:hebdomadaire,mensuelle'],
            'nb_membres_max' => ['required', 'integer'],
            // Pénalité de retard : entre 1% et 2.5% (US-05).
            'penalite_pourcentage' => ['required', 'numeric', 'min:1', 'max:2.5'],
            'delai_grace_jours' => ['required', 'integer', 'min:0', 'max:30'],
            // Le beneficiaire est desormais tire au sort apres collecte : champ
            // conserve pour compatibilite mais optionnel (toujours aleatoire).
            'methode_rotation' => ['nullable', 'in:manuelle,aleatoire'],
            // Accumulative (coffre-fort) : date d'echeance finale obligatoire.
            'date_echeance' => ['required_if:type,accumulative', 'nullable', 'date', 'after:today'],
        ];
    }

    /**
     * Bornes du nombre de membres dépendantes du type :
     * rotative 5–30, accumulative 3–50 (US-05).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('type');
            $nb = (int) $this->input('nb_membres_max');

            [$min, $max] = $type === 'accumulative' ? [3, 50] : [5, 30];

            if ($type && ($nb < $min || $nb > $max)) {
                $validator->errors()->add(
                    'nb_membres_max',
                    "Pour un groupe {$type}, le nombre de membres doit être entre {$min} et {$max}."
                );
            }
        });
    }
}
