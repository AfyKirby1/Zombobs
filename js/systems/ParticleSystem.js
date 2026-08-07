import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Particle } from '../entities/Particle.js';
import { MAX_PARTICLES } from '../core/constants.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { settingsManager } from './SettingsManager.js';
import { compactArrayWithUpdate } from '../utils/arrayUtils.js';
import { parseColorToRgba, PARTICLE_KIND, PARTICLE_KIND_BUDGET } from '../utils/colorParse.js';
import { decalSystem } from './vfx/DecalSystem.js';

export { PARTICLE_KIND } from '../utils/colorParse.js';

// Reusable batching map to avoid allocation per frame
const particleBatches = new Map();

// Shared arcade-weather state. Wind is intentionally horizontal-only: snow may
// flutter and gust sideways, but its vertical velocity is always clamped down.
// Snow is SCREEN-anchored: flakes live in screen coordinates (sx/sy) and their
// world position is re-derived from the viewport every frame. World-anchored
// snow read as "rising" whenever the player outran the fall speed (player base
// speed 4 vs fall speed 1.8-5.0), so screen space is the correct model here.
const snowWeather = {
    wind: 0,
    targetWind: 0,
    gustTimer: 0,
    spawnCarry: 0,
    viewLeft: 0,
    viewTop: 0,
    viewWidth: 0,
    viewHeight: 0,
};

const SNOW_COLORS = [
    'rgba(255, 255, 255, 0.96)',
    'rgba(226, 242, 255, 0.88)',
    'rgba(196, 224, 255, 0.78)',
];

// Particle Pool
export const particlePool = new ObjectPool(
    () => new Particle(0, 0, '#fff'),
    (p, x, y, color, props) => p.reset(x, y, color, props),
    100 // Initial size
);

/**
 * Get particle limit based on quality preset
 * @returns {number} Maximum number of particles allowed
 */
function getParticleLimit() {
    const particleCount = graphicsSettings ? graphicsSettings.maxParticles : 'high';

    if (particleCount === 'low') {
        return 50;
    } else if (particleCount === 'high') {
        return 200;
    } else if (particleCount === 'ultra') {
        return 500;
    }

    return MAX_PARTICLES;
}

function countParticlesOfType(type) {
    const particles = gameState.particles;
    let n = 0;
    for (let i = 0; i < particles.length; i++) {
        if (particles[i] && particles[i].type === type) n++;
    }
    return n;
}

function enqueueGpuCombat(p) {
    const effects = window.webgpuRenderer?.effects;
    if (!effects?.enqueueCombat || !p) return;
    const kind = p.type;
    if (
        kind !== PARTICLE_KIND.fire &&
        kind !== PARTICLE_KIND.flash &&
        kind !== PARTICLE_KIND.smoke &&
        kind !== PARTICLE_KIND.ember &&
        kind !== PARTICLE_KIND.shockwave
    ) {
        return;
    }
    effects.enqueueCombat(
        p.x, p.y, p.vx || 0, p.vy || 0,
        p.rgba || parseColorToRgba(p.color),
        p.radius || 2,
        p.life || 30,
        kind
    );
}

/**
 * Typed emitter facade — soft per-kind budgets under global limit.
 */
export function emit(kind, x, y, color, props = {}) {
    const limit = getParticleLimit();
    const budgetFrac = PARTICLE_KIND_BUDGET[kind];
    if (budgetFrac !== undefined) {
        const softCap = Math.max(4, Math.floor(limit * budgetFrac));
        if (countParticlesOfType(kind) >= softCap) {
            return null;
        }
    }
    const merged = {
        ...props,
        type: kind,
        rgba: props.rgba || parseColorToRgba(color),
    };
    const p = spawnParticle(x, y, color, merged);
    enqueueGpuCombat(p);
    return p;
}

export function spawnParticle(x, y, color, props = {}) {
    const limit = getParticleLimit();
    if (gameState.particles.length >= limit) {
        return null;
    }

    const merged = {
        ...props,
        type: props.type !== undefined ? props.type : PARTICLE_KIND.spark,
        rgba: props.rgba || parseColorToRgba(color),
    };

    const p = particlePool.get(x, y, color, merged);
    if (!p) {
        return null;
    }

    gameState.particles.push(p);

    if (gameState.particles.length > limit) {
        const removed = gameState.particles.shift();
        if (removed) {
            particlePool.release(removed);
        }
    }
    return p;
}

// Deprecated legacy support if needed, but we should try to replace usage
export function addParticle(particle) {
    // If it's a pooled particle (checked via instance maybe?), fine.
    // If it's a raw object, we can't pool it easily unless we wrap it.
    // For now, just push it. Mixed usage might be tricky for pooling but safe for logic.
    gameState.particles.push(particle);
}

export function createParticles(x, y, color, count) {
    const limit = getParticleLimit();
    // Limit how many particles we try to spawn based on current count and limit
    const availableSlots = Math.max(0, limit - gameState.particles.length);
    const particlesToSpawn = Math.min(count, availableSlots);

    for (let i = 0; i < particlesToSpawn; i++) {
        const p = spawnParticle(x, y, color);
        if (!p) break; // Stop if we can't spawn more
    }
}

/**
 * Spawns a snow particle at a random position at the top of the screen
 * @param {Object} viewport - Current viewport bounds {left, top, right, bottom}
 */
export function spawnSnowParticle(viewport) {
    const width = viewport.right - viewport.left;
    const height = viewport.bottom - viewport.top;

    // Depth controls size, speed and opacity together so flakes read as a
    // layered weather volume rather than identically-sized white dots.
    const depth = Math.random();
    const radius = 0.75 + depth * depth * 2.35;
    const fallSpeed = 1.8 + depth * 3.2;
    const travelFrames = Math.ceil((height + 100) / fallSpeed);
    const life = Math.max(180, travelFrames + 45);
    const colorIndex = depth > 0.72 ? 0 : (depth > 0.32 ? 1 : 2);

    // Spawn in SCREEN coordinates just above the top edge, with horizontal
    // overscan in the wind direction. Screen-anchored flakes always travel
    // down the screen no matter how fast the camera moves.
    const overscan = 50 + Math.abs(snowWeather.wind) * 35;
    const sx = -overscan + Math.random() * (width + overscan * 2);
    const sy = -12 - Math.random() * 70;
    const x = viewport.left + sx;
    const y = viewport.top + sy;

    const p = spawnParticle(x, y, SNOW_COLORS[colorIndex], {
        life,
        maxLife: life,
        type: PARTICLE_KIND.snow,
        radius,
        vx: 0,
        vy: fallSpeed,
        drag: 1,
        gravity: 0,
    });

    if (!p) return;

    p.snowDepth = depth;
    p.isSnowflake = true;
    p.baseFallSpeed = fallSpeed;
    p.screenX = sx;
    p.screenY = sy;
    p.flutterAmount = 0.12 + (1 - depth) * 0.48;
    p.swayOffset = Math.random() * Math.PI * 2;
    p.swaySpeed = 0.025 + Math.random() * 0.035;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotationSpeed = (Math.random() - 0.5) * (0.025 + depth * 0.035);

    // Custom update for snow behavior
    p.customUpdate = function() {
        const age = this.maxLife - this.life;
        const flutter = Math.sin(age * this.swaySpeed + this.swayOffset);

        // Screen-space fall: screenY only ever increases, so flakes always
        // travel down the visible screen regardless of camera velocity. World
        // position is re-derived from the current viewport so every render
        // path (GPU camera-subtract, Canvas2D camera transform) lands the
        // flake at the same screen spot.
        this.vy = this.baseFallSpeed;
        this.vx = snowWeather.wind * (0.35 + this.snowDepth * 0.65)
            + flutter * this.flutterAmount;
        this.screenX += this.vx;
        this.screenY += this.vy;
        this.x = snowWeather.viewLeft + this.screenX;
        this.y = snowWeather.viewTop + this.screenY;
        this.rotation += this.rotationSpeed;
        this.life--;
    };
}

/**
 * Manages snow effect
 * @param {Object} viewport - Current viewport bounds
 */
export function updateSnowSystem(viewport) {
    const limit = getParticleLimit();

    // Cache the viewport so snow customUpdate can convert screen -> world.
    snowWeather.viewLeft = viewport.left;
    snowWeather.viewTop = viewport.top;
    snowWeather.viewWidth = viewport.right - viewport.left;
    snowWeather.viewHeight = viewport.bottom - viewport.top;

    // Slow prevailing wind plus short gust changes. No vertical wind component.
    snowWeather.gustTimer--;
    if (snowWeather.gustTimer <= 0) {
        snowWeather.gustTimer = 150 + Math.floor(Math.random() * 330);
        snowWeather.targetWind = (Math.random() - 0.5) * 2.8;
    }
    snowWeather.wind += (snowWeather.targetWind - snowWeather.wind) * 0.008;

    // Reserve most of the pool for combat VFX while keeping weather visibly
    // layered. Deficit correction makes snow recover after particle-heavy fights.
    const targetSnowCount = Math.max(12, Math.floor(limit * 0.34));
    const snowCount = countParticlesOfType(PARTICLE_KIND.snow);
    const deficit = Math.max(0, targetSnowCount - snowCount);
    const spawnRate = Math.min(1.25, targetSnowCount / 520 + deficit * 0.008);
    snowWeather.spawnCarry += spawnRate;

    while (snowWeather.spawnCarry >= 1 && countParticlesOfType(PARTICLE_KIND.snow) < targetSnowCount) {
        spawnSnowParticle(viewport);
        snowWeather.spawnCarry--;
    }

    // Recycle flakes that left the screen (screen-anchored weather). Wind
    // drift and resizes all funnel back to the top edge.
    const margin = 60 + Math.abs(snowWeather.wind) * 35;
    const screenW = snowWeather.viewWidth;
    const screenH = snowWeather.viewHeight;
    const particles = gameState.particles;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p || p.type !== PARTICLE_KIND.snow || !p.isSnowflake) continue;
        const outBottom = p.screenY > screenH + 60;
        const outSide = p.screenX < -margin - 80 || p.screenX > screenW + margin + 80;
        const outTop = p.screenY < -220;
        if (outBottom || outSide || outTop) {
            p.screenX = -margin + Math.random() * (screenW + margin * 2);
            p.screenY = -12 - Math.random() * 70;
            p.life = p.maxLife;
        }
        // Keep world position pinned to the screen anchor even when the
        // particle update pass ran before this frame's viewport refresh.
        p.x = snowWeather.viewLeft + p.screenX;
        p.y = snowWeather.viewTop + p.screenY;
    }
}

export function createBloodSplatter(x, y, angle, isKill = false) {
    const bloodGoreLevel = settingsManager.getSetting('video', 'bloodGoreLevel') ?? 1.0;
    if (bloodGoreLevel === 0) return;

    decalSystem.addBlood(x, y, isKill ? 1 : 0.4);

    const quality = graphicsSettings.quality;
    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);

    // Scale particle count based on quality preset
    let baseParticleCount = isKill ? 12 : 5;
    let particleCount = baseParticleCount;
    let hasDetailParticles = false;
    let hasColorVariation = true;

    if (quality === 'low') {
        particleCount = Math.floor(baseParticleCount * 0.6);
        hasDetailParticles = false;
        hasColorVariation = false;
    } else if (quality === 'medium') {
        particleCount = baseParticleCount;
        hasDetailParticles = false;
    } else if (quality === 'high') {
        particleCount = Math.floor(baseParticleCount * 1.2);
        hasDetailParticles = true;
    } else if (quality === 'ultra') {
        particleCount = Math.floor(baseParticleCount * 1.5);
        hasDetailParticles = true;
    }

    // Apply the blood/gore level setting
    particleCount = Math.floor(particleCount * bloodGoreLevel);

    const particlesToSpawn = Math.min(particleCount, availableSlots);

    // Blood colors - more variation at higher quality
    let bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222'];
    if (hasColorVariation && quality !== 'low') {
        bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222', '#cc0000', '#990000', '#660000'];
    }

    for (let i = 0; i < particlesToSpawn; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI;
        const speed = isKill ? (Math.random() * 6 + 2) : (Math.random() * 4 + 1);
        const radius = quality === 'ultra' ? (Math.random() * 3 + 1.5) : (Math.random() * 2.5 + 1.5);

        const p = emit(PARTICLE_KIND.blood, x, y,
            bloodColors[Math.floor(Math.random() * bloodColors.length)], {
            radius: radius,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: isKill ? 40 : 25,
            maxLife: isKill ? 40 : 25,
            drag: 0.98,
            gravity: 0.04,
        });
        if (!p) break;
    }

    if (isKill && hasDetailParticles && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        let largeParticleCount = quality === 'ultra' ? 5 : 3;
        largeParticleCount = Math.floor(largeParticleCount * bloodGoreLevel);
        const largeParticlesToSpawn = Math.min(largeParticleCount, remainingSlots);

        for (let i = 0; i < largeParticlesToSpawn; i++) {
            const p = emit(PARTICLE_KIND.blood,
                x + (Math.random() - 0.5) * 15,
                y + (Math.random() - 0.5) * 15,
                '#5a0000',
                {
                    radius: Math.random() * 4 + 3,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 60,
                    maxLife: 60,
                }
            );
            if (!p) break;
        }
    }

    if (isKill && quality === 'ultra' && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        let poolParticleCount = 3;
        poolParticleCount = Math.floor(poolParticleCount * bloodGoreLevel);
        const poolParticles = Math.min(poolParticleCount, remainingSlots);
        for (let i = 0; i < poolParticles; i++) {
            const p = emit(PARTICLE_KIND.blood,
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                'rgba(139, 0, 0, 0.6)',
                {
                    radius: Math.random() * 5 + 4,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    life: 80,
                    maxLife: 80,
                }
            );
            if (!p) break;
        }
    }
}

export function createExplosion(x, y, size = 1.0) {
    if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
        return;
    }

    decalSystem.addScorch(x, y, size);

    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);

    let explosionQuality;
    try {
        explosionQuality = graphicsSettings ? graphicsSettings.getQualityValues('explosion') : {
            fireParticles: 30,
            smokeParticles: 15,
            hasLargeFlash: true,
            hasShockwave: true,
            hasTrails: true
        };
    } catch (e) {
        explosionQuality = {
            fireParticles: 30,
            smokeParticles: 15,
            hasLargeFlash: true,
            hasShockwave: true,
            hasTrails: true
        };
    }

    const sizeMultiplier = size;
    const baseFlashSize = 150 * sizeMultiplier;

    if (gameState.particles.length >= limit && limit > 10) {
        const particlesToRemove = Math.min(20, gameState.particles.length - 10);
        for (let i = 0; i < particlesToRemove; i++) {
            const removed = gameState.particles.shift();
            if (removed) particlePool.release(removed);
        }
    }

    const flashSpecs = [
        { color: '#ffffff', radius: baseFlashSize, life: 30 },
        { color: '#ffff00', radius: baseFlashSize * 0.95, life: 35 },
        { color: '#ff8800', radius: baseFlashSize * 0.8, life: 40 },
        { color: '#ff4400', radius: baseFlashSize * 0.6, life: 45 },
    ];
    for (let f = 0; f < flashSpecs.length; f++) {
        const spec = flashSpecs[f];
        let flash = emit(PARTICLE_KIND.flash, x, y, spec.color, {
            radius: spec.radius,
            life: spec.life,
            maxLife: spec.life,
            vx: 0,
            vy: 0,
        });
        if (!flash) {
            const p = particlePool.get(x, y, spec.color, {
                radius: spec.radius,
                life: spec.life,
                maxLife: spec.life,
                vx: 0,
                vy: 0,
                type: PARTICLE_KIND.flash,
                rgba: parseColorToRgba(spec.color),
            });
            if (p) {
                gameState.particles.push(p);
                enqueueGpuCombat(p);
            }
        }
    }

    // Point light for explosion
    const fx = window.webgpuRenderer?.effects;
    if (fx?.addLight) {
        fx.addLight(x, y, 120 * sizeMultiplier, 1.2 * sizeMultiplier, 1.0, 0.55, 0.15);
    }
    if (window.webgpuRenderer) {
        window.webgpuRenderer.hazeStrength = Math.min(1.5,
            (window.webgpuRenderer.hazeStrength || 0) + 0.6 * sizeMultiplier);
        window.webgpuRenderer.addPostImpulse(0.28 * sizeMultiplier);
    }

    const minFireParticles = Math.max(15, Math.floor(explosionQuality.fireParticles * sizeMultiplier * 1.5));
    const fireParticlesToSpawn = Math.min(minFireParticles, Math.max(0, availableSlots - 3));
    for (let i = 0; i < fireParticlesToSpawn; i++) {
        const angle = (Math.PI * 2 / fireParticlesToSpawn) * i + (Math.random() - 0.5) * 0.3;
        const speed = (Math.random() * 6 + 3) * sizeMultiplier;
        const colors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const p = emit(PARTICLE_KIND.fire, x, y, colors[Math.floor(Math.random() * colors.length)], {
            radius: (Math.random() * 6 + 4) * sizeMultiplier,
            life: Math.random() * 30 + 25,
            maxLife: Math.random() * 30 + 25,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 0.96,
            gravity: -0.03,
        });
        if (!p) break;
    }

    const remainingSlots = limit - gameState.particles.length;
    if (explosionQuality.hasShockwave !== false) {
        const shockwaveCount = Math.floor(25 * sizeMultiplier);
        for (let i = 0; i < shockwaveCount && remainingSlots > i; i++) {
            const angle = (Math.PI * 2 / shockwaveCount) * i;
            const p = emit(PARTICLE_KIND.shockwave, x, y, 'rgba(255, 220, 150, 0.95)', {
                radius: 6 * sizeMultiplier,
                life: 30,
                maxLife: 30,
                vx: Math.cos(angle) * 8 * sizeMultiplier,
                vy: Math.sin(angle) * 8 * sizeMultiplier,
            });
            if (!p) break;
        }
    }

    const debrisSlots = limit - gameState.particles.length;
    const debrisCount = Math.min(Math.floor(12 * sizeMultiplier), debrisSlots);
    for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 5 + 3) * sizeMultiplier;
        const p = emit(PARTICLE_KIND.debris, x, y,
            ['#2a2a2a', '#1a1a1a', '#3a3a3a', '#4a4a4a'][Math.floor(Math.random() * 4)], {
            radius: Math.random() * 3 + 2,
            life: Math.random() * 40 + 30,
            maxLife: Math.random() * 40 + 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 0.97,
            gravity: 0.08,
        });
        if (!p) break;
    }

    const smokeSlots = limit - gameState.particles.length;
    const minSmokeParticles = Math.max(10, Math.floor(explosionQuality.smokeParticles * sizeMultiplier * 1.2));
    const smokeParticlesToSpawn = Math.min(minSmokeParticles, smokeSlots);
    for (let i = 0; i < smokeParticlesToSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 1.5) * sizeMultiplier;
        const smokeLife = Math.random() * 50 + 40 + (sizeMultiplier > 1 ? 20 : 0);
        const p = emit(PARTICLE_KIND.smoke, x, y,
            `rgba(40, 40, 40, ${Math.random() * 0.6 + 0.5})`, {
            radius: (Math.random() * 8 + 5) * sizeMultiplier,
            life: smokeLife,
            maxLife: smokeLife,
            vx: Math.cos(angle) * speed * 0.4,
            vy: Math.sin(angle) * speed * 0.4 - 0.8,
            drag: 0.97,
            gravity: -0.05,
            sizeOverLife: 1.15,
        });
        if (!p) break;
    }

    const trailSlots = limit - gameState.particles.length;
    if (explosionQuality.hasTrails && trailSlots > 0) {
        const trailCount = Math.min(Math.floor(10 * sizeMultiplier), trailSlots);
        for (let i = 0; i < trailCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const p = emit(PARTICLE_KIND.ember, x, y, '#ffaa00', {
                radius: 2 * sizeMultiplier,
                life: 25,
                maxLife: 25,
                vx: Math.cos(angle) * 3 * sizeMultiplier,
                vy: Math.sin(angle) * 3 * sizeMultiplier,
                drag: 0.95,
                gravity: -0.02,
            });
            if (!p) break;
        }
    }
}

export function updateParticles() {
    // In-place compaction with update - no array allocation per frame
    compactArrayWithUpdate(gameState.particles, p => {
        if (!p) return false;

        if (p.update) {
            p.update();
        } else {
            // Fallback for simple objects if any remain
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }

        if (p.life > 0) {
            return true; // Keep particle
        } else {
            // Return to pool if it's a Particle instance
            if (p instanceof Particle) {
                particlePool.release(p);
            }
            return false; // Remove particle
        }
    });
}

/**
 * Batch draw particles by color for better performance
 * Groups particles by color and draws them with a single fillStyle change
 */
function drawParticlesBatched() {
    const particles = gameState.particles;
    const len = particles.length;
    
    if (len === 0) return 0;
    
    // Clear and reuse the batch map
    particleBatches.clear();
    
    // Group particles by color (quantized to reduce unique batches)
    for (let i = 0; i < len; i++) {
        const p = particles[i];
        if (!p || p.life <= 0) continue;
        if (p.type === PARTICLE_KIND.snow && p.isSnowflake) continue;
        
        // Use color as key (for hex colors, batch exactly; for rgba, approximate)
        const key = p.color;
        if (!particleBatches.has(key)) {
            particleBatches.set(key, []);
        }
        particleBatches.get(key).push(p);
    }
    
    let drawnCount = 0;
    
    // Draw each batch with a single fillStyle
    particleBatches.forEach((batch, color) => {
        if (batch.length === 0) return;
        
        // Calculate alpha from first particle's life (approximate for batch)
        const firstParticle = batch[0];
        const maxLife = firstParticle.maxLife || 30;
        const alpha = Math.max(0, firstParticle.life / maxLife);
        
        // Convert color to rgba if needed
        let fillColor = color;
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            fillColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        
        // Draw all particles in batch with single path
        for (let i = 0; i < batch.length; i++) {
            const p = batch[i];
            const particleAlpha = Math.max(0, p.life / (p.maxLife || 30));
            
            // Skip nearly invisible particles
            if (particleAlpha <= 0.05 || p.radius <= 0) continue;
            
            ctx.moveTo(p.x + p.radius, p.y);
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            drawnCount++;
        }
        
        ctx.fill();
    });
    
    return drawnCount + drawSnowflakesCanvas();
}

/**
 * Canvas fallback for the crystalline snow flakes. Drawn under the current
 * transform (world camera in SP arcade; identity in co-op/MP where world
 * space equals screen space), so flakes stay anchored to the ground.
 */
function drawSnowflakesCanvas() {
    const particles = gameState.particles;
    let drawnCount = 0;

    ctx.save();
    ctx.lineCap = 'round';

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p || p.life <= 0 || p.type !== PARTICLE_KIND.snow || !p.isSnowflake) continue;

        const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));
        const armLength = Math.max(1.2, p.radius * 1.75);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.65, p.radius * 0.34);
        ctx.shadowColor = 'rgba(190, 225, 255, 0.75)';
        ctx.shadowBlur = p.radius > 2 ? 4 : 2;
        ctx.beginPath();
        for (let branch = 0; branch < 3; branch++) {
            const angle = branch * Math.PI / 3;
            const dx = Math.cos(angle) * armLength;
            const dy = Math.sin(angle) * armLength;
            ctx.moveTo(-dx, -dy);
            ctx.lineTo(dx, dy);
        }
        ctx.stroke();
        ctx.restore();
        drawnCount++;
    }

    ctx.restore();
    return drawnCount;
}

export function drawParticles() {
    // Check if WebGPU is active - if so, use WebGPU for enhanced particle rendering
    // WebGPU canvas is now on top (z-index 2) so particles render above gameplay
    const webgpuRenderer = window.webgpuRenderer;
    const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;

    if (webgpuEnabled && webgpuRenderer && webgpuRenderer.isAvailable()) {
        if (webgpuRenderer.syncGameParticles) {
            // Sync particles to WebGPU renderer for enhanced rendering (5x size, soft glow, hardware blending)
            webgpuRenderer.syncGameParticles(gameState.particles);
            return; // Skip Canvas 2D drawing - WebGPU handles it
        }
    }

    // Fallback to Canvas 2D if WebGPU is not available
    if (!ctx) {
        console.error('[ParticleSystem] drawParticles: ctx is not defined!');
        return;
    }

    if (gameState.particles.length === 0) {
        return; // No particles to draw
    }

    const particleDetail = graphicsSettings.particleDetail || 'standard';
    
    // Use batched rendering for minimal/standard detail (major performance win)
    if (particleDetail === 'minimal' || particleDetail === 'standard') {
        drawParticlesBatched();
        ctx.globalAlpha = 1;
        return;
    }

    // Detailed/Ultra rendering - individual particles with gradients
    let drawnCount = 0;
    for (let i = 0; i < gameState.particles.length; i++) {
        const particle = gameState.particles[i];

        if (!particle) {
            continue;
        }
        if (particle.type === PARTICLE_KIND.snow && particle.isSnowflake) {
            continue;
        }

        if (particle.draw) {
            // If it has a custom draw method, use it
            particle.draw();
            drawnCount++;
        } else {
            // Fallback drawing with quality-based enhancements
            const maxLife = particle.maxLife || 30;
            const alpha = Math.max(0, particle.life / maxLife);

            // Validate particle data
            if (isNaN(particle.x) || isNaN(particle.y) || isNaN(particle.radius)) {
                continue;
            }

            if (alpha <= 0 || particle.radius <= 0) {

                continue; // Skip invisible or zero-size particles
            }

            // Convert hex colors to rgba for proper alpha blending
            let fillColor = particle.color;
            if (!particle.color.startsWith('rgba') && particle.color.startsWith('#')) {
                // Convert hex to rgba for proper alpha support
                const hex = particle.color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                // Ensure minimum alpha for large explosion particles (radius > 50)
                const finalAlpha = particle.radius > 50 ? Math.max(alpha, 0.3) : alpha;
                fillColor = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
            } else if (particle.color.startsWith('rgba')) {
                // Extract existing rgba and apply alpha
                const match = particle.color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
                if (match) {
                    const r = match[1];
                    const g = match[2];
                    const b = match[3];
                    // Ensure minimum alpha for large explosion particles (radius > 50)
                    const finalAlpha = particle.radius > 50 ? Math.max(alpha, 0.3) : alpha;
                    fillColor = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                }
            }



            // Only detailed and ultra modes reach here (minimal/standard use batched rendering)
            if (particleDetail === 'detailed') {
                // Detailed: Gradients and light glow
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius
                );
                // Parse color and create gradient
                if (particle.color.startsWith('rgba')) {
                    gradient.addColorStop(0, particle.color.replace(/[\d.]+\)$/, `${alpha})`));
                    gradient.addColorStop(1, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.3})`));
                } else {
                    // Hex color - convert to rgba
                    const hex = particle.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
                }
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();

                // Light glow
                ctx.shadowBlur = particle.radius * 0.5;
                ctx.shadowColor = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (particleDetail === 'ultra') {
                // Ultra: Multi-layer gradients, glow, and trails
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius * 1.5
                );
                // Parse color and create rich gradient
                if (particle.color.startsWith('rgba')) {
                    gradient.addColorStop(0, particle.color.replace(/[\d.]+\)$/, `${alpha})`));
                    gradient.addColorStop(0.3, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.8})`));
                    gradient.addColorStop(0.7, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.4})`));
                    gradient.addColorStop(1, particle.color.replace(/[\d.]+\)$/, '0)'));
                } else {
                    const hex = particle.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
                    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                }

                // Outer glow layer
                ctx.shadowBlur = particle.radius * 1.5;
                ctx.shadowColor = particle.color;
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Inner core
                ctx.shadowBlur = 0;
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            drawnCount++;
        }
    }

    drawnCount += drawSnowflakesCanvas();

    // Reset globalAlpha at the end to ensure it's always 1
    ctx.globalAlpha = 1;

    if (drawnCount > 0 && drawnCount !== gameState.particles.length) {

    }
}
