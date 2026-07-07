<?php

namespace Tests\Unit;

use App\Models\Cycle;
use App\Models\Group;
use App\Services\PenaltyCalculatorService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** RG-04 — La pénalité ne s'applique qu'après expiration du délai de grâce. */
class PenaltyCalculatorTest extends TestCase
{
    private function cycle(int $graceJours): Cycle
    {
        $group = new Group([
            'montant_cotisation' => 10000,
            'penalite_pourcentage' => 2.0,
            'delai_grace_jours' => $graceJours,
        ]);

        $cycle = new Cycle(['date_fin' => '2026-01-10']);
        $cycle->setRelation('group', $group);

        return $cycle;
    }

    public function test_pas_de_penalite_avant_expiration_du_delai_de_grace(): void
    {
        $service = new PenaltyCalculatorService();
        $cycle = $this->cycle(3); // limite = 2026-01-13

        $this->assertFalse($service->estEnRetard($cycle, Carbon::parse('2026-01-12')));
        $this->assertSame(0.0, $service->calculer($cycle->group, $cycle, Carbon::parse('2026-01-12')));
    }

    public function test_penalite_appliquee_apres_le_delai_de_grace(): void
    {
        $service = new PenaltyCalculatorService();
        $cycle = $this->cycle(3); // limite = 2026-01-13

        $this->assertTrue($service->estEnRetard($cycle, Carbon::parse('2026-01-20')));
        // 10000 × 2% = 200
        $this->assertSame(200.0, $service->calculer($cycle->group, $cycle, Carbon::parse('2026-01-20')));
    }
}
