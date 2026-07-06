<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            // Format sénégalais : +221 suivi de 9 chiffres.
            'telephone' => ['required', 'string', 'regex:/^\+221[0-9]{9}$/', 'unique:users,telephone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ];
    }

    public function messages(): array
    {
        return [
            'telephone.regex' => 'Le téléphone doit être au format sénégalais (+221XXXXXXXXX).',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé.',
        ];
    }
}
