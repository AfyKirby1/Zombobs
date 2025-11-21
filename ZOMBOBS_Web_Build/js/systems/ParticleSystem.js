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
        
        const p = spawnParticle(x, y, bloodColors[Math.floor(Math.random() * bloodColors.length)], {
            radius: radius,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: isKill ? 40 : 25,
            maxLife: isKill ? 40 : 25
        });
        if (!p) break;
    }
    
    // Large detail particles for kills (high/ultra quality)
    if (isKill && hasDetailParticles && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        const largeParticlesToSpawn = quality === 'ultra' ? Math.min(5, remainingSlots) : Math.min(3, remainingSlots);
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
            if (!p) break;
        }
    }
    
    // Ultra quality: Pooling effect (stationary blood puddles)
    if (isKill && quality === 'ultra' && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        const poolParticles = Math.min(3, remainingSlots);
        for (let i = 0; i < poolParticles; i++) {
            const p = spawnParticle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                'rgba(139, 0, 0, 0.6)',
                {
                    radius: Math.random() * 5 + 4,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    life: 80,
                    maxLife: 80
                }
            );
            if (!p) break;
        }
    }
}

export function createExplosion(x, y) {
    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);
    const explosionQuality = graphicsSettings.getQualityValues('explosion');
    
    // Large flash (only if quality allows)
    if (explosionQuality.hasLargeFlash && availableSlots > 0) {
        const flashSize = explosionQuality.hasShockwave ? 100 : 80;
        spawnParticle(x, y, '#ff6600', {
            radius: flashSize,
            life: 10,
            maxLife: 10,
            vx: 0,
            vy: 0
        });
    }
    
    // Fire particles (quality-based count)
    const fireParticlesToSpawn = Math.min(explosionQuality.fireParticles, availableSlots - (explosionQuality.hasLargeFlash ? 1 : 0));
    for (let i = 0; i < fireParticlesToSpawn; i++) {
        const angle = (Math.PI * 2 / explosionQuality.fireParticles) * i;
        const speed = Math.random() * 4 + 2;
        const p = spawnParticle(x, y, ['#ff6600', '#ff8800', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)], {
            radius: Math.random() * 3 + 2,
            life: Math.random() * 20 + 15,
            maxLife: Math.random() * 20 + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break; // Stop if we can't spawn more
    }
    
    // Smoke particles (quality-based count)
    const remainingSlots = limit - gameState.particles.length;
    const smokeParticlesToSpawn = Math.min(explosionQuality.smokeParticles, remainingSlots);
    for (let i = 0; i < smokeParticlesToSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const p = spawnParticle(x, y, `rgba(80, 80, 80, ${Math.random() * 0.5 + 0.3})`, {
            radius: Math.random() * 4 + 3,
            life: Math.random() * 30 + 20,
            maxLife: Math.random() * 30 + 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break; // Stop if we can't spawn more
    }
    
    // Ultra quality: Shockwave ring
    if (explosionQuality.hasShockwave && remainingSlots > smokeParticlesToSpawn) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const p = spawnParticle(x, y, 'rgba(255, 200, 100, 0.8)', {
                radius: 4,
                life: 15,
                maxLife: 15,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6
            });
            if (!p) break;
        }
    }
    
    // High/Ultra quality: Particle trails
    if (explosionQuality.hasTrails && remainingSlots > smokeParticlesToSpawn + (explosionQuality.hasShockwave ? 20 : 0)) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const p = spawnParticle(x, y, '#ffaa00', {
                radius: 2,
                life: 25,
                maxLife: 25,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3
            });
            if (!p) break;
        }
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
    const particleDetail = graphicsSettings.particleDetail || 'standard';
    
    // Optimized loop: use for loop instead of forEach
    for (let i = 0; i < gameState.particles.length; i++) {
        const particle = gameState.particles[i];
        
        if (particle.draw) {
            // If it has a custom draw method, use it
            particle.draw(); 
        } else {
            // Fallback drawing with quality-based enhancements
            const maxLife = particle.maxLife || 30;
            const alpha = Math.max(0, particle.life / maxLife);
            
            if (particleDetail === 'minimal') {
                // Minimal: Simple solid circles
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (particleDetail === 'standard') {
                // Standard: Current particle system
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (particleDetail === 'detailed') {
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
        }
    }
}
