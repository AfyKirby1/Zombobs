import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Particle } from '../entities/Particle.js';
import { MAX_PARTICLES } from '../core/constants.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';
import { ObjectPool } from '../utils/ObjectPool.js';

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
    
    // Convert quality preset to numeric limit
    // Low = CPU particles (50), High = GPU 10k (200 CPU fallback), Ultra = GPU 50k (500 CPU fallback)
    // For CPU particles (non-WebGPU), we use lower limits
    if (particleCount === 'low') {
        return 50;
    } else if (particleCount === 'high') {
        return 200; // Reasonable limit for high quality CPU particles
    } else if (particleCount === 'ultra') {
        return 500; // Higher limit for ultra quality
    }
    
    // Default fallback
    return MAX_PARTICLES;
}

export function spawnParticle(x, y, color, props = {}) {
    // Early return if already at particle limit (prevents creating particles we'll immediately remove)
    const limit = getParticleLimit();
    if (gameState.particles.length >= limit) {
        // Don't spawn more particles - we're at the limit
        return null;
    }
    
    const p = particlePool.get(x, y, color, props);
    gameState.particles.push(p);

    // Double-check limit (in case multiple particles spawned in same frame)
    if (gameState.particles.length > limit) {
        const removed = gameState.particles.shift(); // Remove oldest
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

export function createBloodSplatter(x, y, angle, isKill = false) {
    const baseParticleCount = isKill ? 12 : 5;
    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);
    
    // Scale particle count based on quality preset
    let particleCount = baseParticleCount;
    if (limit < 100) {
        // Low quality - reduce particle count
        particleCount = Math.floor(baseParticleCount * 0.6);
    }
    
    const particlesToSpawn = Math.min(particleCount, availableSlots);
    const bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222', '#8b0000'];
    
    for (let i = 0; i < particlesToSpawn; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI;
        const speed = isKill ? (Math.random() * 6 + 2) : (Math.random() * 4 + 1);
        
        spawnParticle(x, y, bloodColors[Math.floor(Math.random() * bloodColors.length)], {
            radius: Math.random() * 2.5 + 1.5,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: isKill ? 40 : 25,
            maxLife: isKill ? 40 : 25
        });
    }
    
    if (isKill && gameState.particles.length < limit) {
        const largeParticlesToSpawn = Math.min(3, availableSlots - particlesToSpawn);
        for (let i = 0; i < largeParticlesToSpawn; i++) {
            const p = spawnParticle(
                x + (Math.random() - 0.5) * 15,
                y + (Math.random() - 0.5) * 15,
                '#5a0000',
                {
                    radius: Math.random() * 4 + 3,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 60,
                    maxLife: 60
                }
            );
            if (!p) break; // Stop if we can't spawn more
        }
    }
}

export function createExplosion(x, y) {
    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);
    
    // Large flash (always spawn if possible)
    if (availableSlots > 0) {
        spawnParticle(x, y, '#ff6600', {
            radius: 80,
            life: 10,
            maxLife: 10,
            vx: 0,
            vy: 0
        });
    }
    
    // Fire particles (scale based on quality)
    let fireParticleCount = 30;
    if (limit < 100) {
        fireParticleCount = 15; // Reduce for low quality
    } else if (limit < 300) {
        fireParticleCount = 25; // Slightly reduced for medium
    }
    
    const fireParticlesToSpawn = Math.min(fireParticleCount, availableSlots - 1);
    for (let i = 0; i < fireParticlesToSpawn; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const speed = Math.random() * 4 + 2;
        spawnParticle(x, y, ['#ff6600', '#ff8800', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)], {
            radius: Math.random() * 3 + 2,
            life: Math.random() * 20 + 15,
            maxLife: Math.random() * 20 + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break; // Stop if we can't spawn more
    }
    
    // Smoke particles (scale based on quality)
    let smokeParticleCount = 15;
    if (limit < 100) {
        smokeParticleCount = 8; // Reduce for low quality
    } else if (limit < 300) {
        smokeParticleCount = 12; // Slightly reduced for medium
    }
    
    const smokeParticlesToSpawn = Math.min(smokeParticleCount, limit - gameState.particles.length);
    for (let i = 0; i < smokeParticlesToSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        spawnParticle(x, y, `rgba(80, 80, 80, ${Math.random() * 0.5 + 0.3})`, {
            radius: Math.random() * 4 + 3,
            life: Math.random() * 30 + 20,
            maxLife: Math.random() * 30 + 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break; // Stop if we can't spawn more
    }
}

export function updateParticles() {
    // Use filter pattern instead of reverse loop + splice for better performance
    const aliveParticles = [];
    
    for (let i = 0; i < gameState.particles.length; i++) {
        const p = gameState.particles[i];
        
        if (p.update) {
            p.update();
        } else {
            // Fallback for simple objects if any remain
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }

        if (p.life > 0) {
            aliveParticles.push(p);
        } else {
            // Return to pool if it's a Particle instance
            if (p instanceof Particle) {
                particlePool.release(p);
            }
        }
    }
    
    // Replace array instead of splicing
    gameState.particles = aliveParticles;
}

export function drawParticles() {
    gameState.particles.forEach(particle => {
        if (particle.draw) {
            // If it has a custom draw or is a class with draw method
            // We might need to check if it expects arguments?
            // Our Particle.draw() doesn't strictly need arguments but we passed ctx in main.js loop implicitly?
            // Actually main.js loop did: `if (particle.draw) particle.draw()`
            // But our Particle class `draw(ctx)` might need ctx if we didn't import it?
            // We imported it.
            particle.draw(); 
        } else {
            // Fallback drawing
            const maxLife = particle.maxLife || 30;
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, particle.life / maxLife);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}
