<?php

namespace App\Http\Requests\Contribution;

use Illuminate\Foundation\Http\FormRequest;

/**
 * US-10 / §9 — La référence de transaction Mobile Money est obligatoire et
 * unique par cycle pour limiter les déclarations dupliquées.
 */
class DeclareContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $cycleId = $this->route('cycle')?->id;

        return [
            'methode_paiement' => ['required', 'in:mock,wave,orange_money'],
            'reference_transaction' => [
                'required', 'string', 'max:100',
                "unique:contributions,reference_transaction,NULL,id,cycle_id,{$cycleId}",
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'reference_transaction.required' => 'La référence de transaction reçue par SMS est obligatoire.',
            'reference_transaction.unique' => 'Cette référence de transaction a déjà été déclarée pour ce cycle.',
        ];
    }
}
