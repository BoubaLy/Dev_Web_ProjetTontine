<?php

namespace App\Http\Requests\Kyc;

use Illuminate\Foundation\Http\FormRequest;

/** US-02 — Upload d'une pièce d'identité pour vérification KYC. */
class KycUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type_document' => ['required', 'in:cni,passeport'],
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'document.required' => 'La pièce d\'identité est obligatoire.',
            'document.mimes' => 'Format accepté : JPG, PNG ou PDF.',
            'document.max' => 'Le fichier ne doit pas dépasser 5 Mo.',
        ];
    }
}
