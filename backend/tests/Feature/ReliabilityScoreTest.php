<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** US-17 — Score de fiabilité et badge ( ≥90, 70-89, <70). */
class ReliabilityScoreTest extends TestCase
{
    use RefreshDatabase;

    public static function scores(): array
    {
        return [
            'fiable' => [95, 'fiable'],
            'correct' => [75, 'correct'],
            'a_risque' => [50, 'a_risque'],
        ];
    }

    #[DataProvider('scores')]
    public function test_le_badge_correspond_au_score(float $score, string $niveau): void
    {
        $cible = User::factory()->create(['score_fiabilite' => $score]);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/users/{$cible->id}/reliability-score")
            ->assertOk()
            ->assertJsonPath('data.score', fn ($v) => (float) $v === $score)
            ->assertJsonPath('data.badge.niveau', $niveau);
    }
}
