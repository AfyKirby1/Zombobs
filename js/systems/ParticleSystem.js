import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Particle } from '../entities/Particle.js';
import { MAX_PARTICLES } from '../core/constants.js';

export function addParticle(particle) {
    gameState.particles.push(particle);
    if (gameState.particles.length > MAX_PARTICLES) {
        // Drop oldest particles first (they are already nearly faded out)
        gameState.particles.splice(0, gameState.particles.length - MAX_PARTICLES);
    }
}

export function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        addParticle(new Particle(x, y, color));
    }
}

// Create blood splatter particles when zombie is hit or killed
export function createBloodSplatter(x, y, angle, isKill = false) {
    const particleCount = isKill ? 12 : 5; // More particles on kill
    const bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222', '#8b0000']; // Dark reds to bright red
    
    for (let i = 0; i < particleCount; i++) {
        // Directional splatter - particles spread from impact point
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI; // Spread in direction of impact
        const speed = isKill ? (Math.random() * 6 + 2) : (Math.random() * 4 + 1);
        const vx = Math.cos(spreadAngle) * speed;
        const vy = Math.sin(spreadAngle) * speed;
        
        // Create blood particle with custom properties
        const bloodParticle = {
            x: x,
            y: y,
            radius: Math.random() * 2.5 + 1.5, // Slightly larger blood droplets
            color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
            vx: vx,
            vy: vy,
            life: isKill ? 40 : 25, // Longer life for kill splatter
            maxLife: isKill ? 40 : 25
        };
        
        addParticle(bloodParticle);
    }
    
    // Also create some ground splatter (larger, darker patches)
    if (isKill) {
        for (let i = 0; i < 3; i++) {
            const groundParticle = {
                x: x + (Math.random() - 0.5) * 15,
                y: y + (Math.random() - 0.5) * 15,
                radius: Math.random() * 4 + 3, // Larger ground patches
                color: '#5a0000', // Very dark red
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 60,
                maxLife: 60
            };
            addParticle(groundParticle);
        }
    }
}

// Create explosion visual effect
export function createExplosion(x, y) {
    // Large flash
    const flashParticle = {
        x: x,
        y: y,
        radius: 80, // Use passed radius in triggerExplosion for better sync
        color: '#ff6600',
        life: 10,
        maxLife: 10,
        vx: 0,
        vy: 0
    };
    addParticle(flashParticle);
    
    // Fire particles
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const speed = Math.random() * 4 + 2;
        const fireParticle = {
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            color: ['#ff6600', '#ff8800', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)],
            life: Math.random() * 20 + 15,
            maxLife: Math.random() * 20 + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
        addParticle(fireParticle);
    }
    
    // Smoke particles
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const smokeParticle = {
            x: x,
            y: y,
            radius: Math.random() * 4 + 3,
            color: `rgba(80, 80, 80, ${Math.random() * 0.5 + 0.3})`,
            life: Math.random() * 30 + 20,
            maxLife: Math.random() * 30 + 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
        addParticle(smokeParticle);
    }
}
