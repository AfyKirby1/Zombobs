/**
 * Pure-logic VFX smoke tests (no Canvas / WebGPU).
 * Run: node tools/vfx_smoke_test.mjs
 */
import { parseColorToRgba, PARTICLE_KIND, PARTICLE_KIND_BUDGET } from '../js/utils/colorParse.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) {
        passed++;
        console.log(`  OK  ${msg}`);
    } else {
        failed++;
        console.error(`  FAIL  ${msg}`);
    }
}

console.log('VFX smoke tests\n');

// parseColorToRgba
{
    const hex = parseColorToRgba('#ff8800');
    assert(Math.abs(hex.r - 1) < 0.01, 'hex #ff8800 red ≈ 1');
    assert(Math.abs(hex.g - 0x88 / 255) < 0.01, 'hex #ff8800 green');
    assert(hex.a === 1, 'hex alpha default 1');

    const rgba = parseColorToRgba('rgba(40, 40, 40, 0.5)');
    assert(Math.abs(rgba.r - 40 / 255) < 0.01, 'rgba r');
    assert(Math.abs(rgba.a - 0.5) < 0.01, 'rgba a');

    const bad = parseColorToRgba(null);
    assert(bad.r === 1 && bad.a === 1, 'null color fallback white');
}

// PARTICLE_KIND IDs stable
{
    assert(PARTICLE_KIND.spark === 0, 'spark=0');
    assert(PARTICLE_KIND.blood === 1, 'blood=1');
    assert(PARTICLE_KIND.smoke === 2, 'smoke=2');
    assert(PARTICLE_KIND.fire === 3, 'fire=3');
    assert(PARTICLE_KIND.flash === 5, 'flash=5');
    assert(PARTICLE_KIND.ember === 9, 'ember=9');
}

// Budgets
{
    assert(PARTICLE_KIND_BUDGET[PARTICLE_KIND.blood] > 0, 'blood budget > 0');
    assert(PARTICLE_KIND_BUDGET[PARTICLE_KIND.smoke] > 0, 'smoke budget > 0');
    const sumish = Object.values(PARTICLE_KIND_BUDGET).reduce((a, b) => a + b, 0);
    assert(sumish > 1, 'kind budgets sum > 1 (soft caps overlap OK)');
}

// Explosion stage counts (quality recipe math — mirrors createExplosion mins)
{
    function explosionStageCounts(size, quality) {
        const fireParticles = quality.fireParticles || 30;
        const smokeParticles = quality.smokeParticles || 15;
        const sizeMultiplier = size;
        const flash = 4;
        const fire = Math.max(15, Math.floor(fireParticles * sizeMultiplier * 1.5));
        const shock = quality.hasShockwave === false ? 0 : Math.floor(25 * sizeMultiplier);
        const debris = Math.floor(12 * sizeMultiplier);
        const smoke = Math.max(10, Math.floor(smokeParticles * sizeMultiplier * 1.2));
        const trails = quality.hasTrails ? Math.floor(10 * sizeMultiplier) : 0;
        return { flash, fire, shock, debris, smoke, trails };
    }

    const low = explosionStageCounts(1, { fireParticles: 10, smokeParticles: 5, hasTrails: false, hasShockwave: true });
    assert(low.flash === 4, 'low: 4 flash stages');
    assert(low.fire >= 15, 'low: min 15 fire');
    assert(low.trails === 0, 'low: no trails');

    const ultra = explosionStageCounts(1.5, { fireParticles: 40, smokeParticles: 20, hasTrails: true, hasShockwave: true });
    assert(ultra.fire >= 15, 'ultra rocket: fire count');
    assert(ultra.trails >= 10, 'ultra rocket: trails');
    assert(ultra.shock >= 25, 'ultra rocket: shockwave');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
