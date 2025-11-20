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

export function spawnParticle(x, y, color, props = {}) {
    const p = particlePool.get(x, y, color, props);
    gameState.particles.push(p);

    // Cap particles if needed, but if we release correctly, pool handles reuse.
    // However, we still need to prevent too many active particles.
    const limit = graphicsSettings ? graphicsSettings.maxParticles : MAX_PARTICLES;
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
    for (let i = 0; i < count; i++) {
        spawnParticle(x, y, color);
    }
}

export function createBloodSplatter(x, y, angle, isKill = false) {
    const particleCount = isKill ? 12 : 5;
    const bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222', '#8b0000'];
    
    for (let i = 0; i < particleCount; i++) {
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
    
    if (isKill) {
        for (let i = 0; i < 3; i++) {
            spawnParticle(
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
        }
    }
}

export function createExplosion(x, y) {
    // Large flash
    spawnParticle(x, y, '#ff6600', {
        radius: 80,
        life: 10,
        maxLife: 10,
        vx: 0,
        vy: 0
    });
    
    // Fire particles
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const speed = Math.random() * 4 + 2;
        spawnParticle(x, y, ['#ff6600', '#ff8800', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)], {
            radius: Math.random() * 3 + 2,
            life: Math.random() * 20 + 15,
            maxLife: Math.random() * 20 + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
    
    // Smoke particles
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        spawnParticle(x, y, `rgba(80, 80, 80, ${Math.random() * 0.5 + 0.3})`, {
            radius: Math.random() * 4 + 3,
            life: Math.random() * 30 + 20,
            maxLife: Math.random() * 30 + 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        if (p.update) {
            p.update();
        } else {
            // Fallback for simple objects if any remain
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }

        if (p.life <= 0) {
            // Remove from active array
            gameState.particles.splice(i, 1);
            // Return to pool if it's a Particle instance
            if (p instanceof Particle) {
                particlePool.release(p);
            }
        }
    }
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
