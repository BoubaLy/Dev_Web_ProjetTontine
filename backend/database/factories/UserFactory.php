<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'telephone' => '+221'.fake()->unique()->numerify('#########'),
            'email' => fake()->unique()->safeEmail(),
            'telephone_verifie_le' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'statut_kyc' => 'verifie',
            'score_fiabilite' => 100.00,
            'role' => 'membre',
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => ['role' => 'super_admin']);
    }

    public function kycEnAttente(): static
    {
        return $this->state(fn (array $attributes) => ['statut_kyc' => 'en_attente']);
    }

    public function kycRejete(): static
    {
        return $this->state(fn (array $attributes) => ['statut_kyc' => 'rejete']);
    }

    public function gele(): static
    {
        return $this->state(fn (array $attributes) => ['est_gele' => true]);
    }
}
