import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { playDamageSound, playKillSound, playExplosionSound } from '../systems/AudioSystem.js';
import { triggerDamageIndicator } from '../utils/gameUtils.js';
import { createExplosion, createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';

// Base Zombie class (shared behaviour for all zombie types)
export class Zombie {
    constructor(canvasWidth, canvasHeight) {
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: this.x = Math.random() * canvasWidth; this.y = -20; break;
            case 1: this.x = canvasWidth + 20; this.y = Math.random() * canvasHeight; break;
            case 2: this.x = Math.random() * canvasWidth; this.y = canvasHeight + 20; break;
            case 3: this.x = -20; this.y = Math.random() * canvasHeight; break;
        }
        this.radius = 12;
        this.speed = 1 + (gameState.wave * 0.1);
        this.health = 2 + Math.floor(gameState.wave / 3);
        this.type = 'base';
    }

    update(player) {
        // Check if the slow effect has expired
        if (this.slowedUntil && Date.now() > this.slowedUntil) {
            this.speed = this.originalSpeed;
            this.slowedUntil = undefined;
            this.originalSpeed = undefined;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
    }

    draw() {
        // Shadow (larger and more ominous)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Toxic aura (pulsing outer glow)
        const pulse = Math.sin(Date.now() / 250) * 0.4 + 0.6;
        const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2);
        auraGradient.addColorStop(0, `rgba(0, 255, 0, ${0.4 * pulse})`);
        auraGradient.addColorStop(0.5, `rgba(50, 255, 50, ${0.2 * pulse})`);
        auraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Zombie torso (singular piece of body) - drawn BEFORE head for proper layering
        const bodyGradient = ctx.createRadialGradient(this.x - 4, this.y - 4, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#9acd32');
        bodyGradient.addColorStop(0.4, '#7cb342');
        bodyGradient.addColorStop(0.7, '#558b2f');
        bodyGradient.addColorStop(1, '#33691e');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Zombie arm (singular piece of body) - drawn BEFORE head for proper layering
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y + 10);
        ctx.lineTo(this.x - 15, this.y + 18);
        ctx.stroke();
        
        // Decayed flesh body (head)
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Zombie skin texture (darker patches)
        ctx.fillStyle = 'rgba(30, 60, 10, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.x - 3, this.y + 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline (rough edges)
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Eye sockets (darker areas)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing zombie eyes (animated intensity)
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        ctx.shadowBlur = 10 * eyePulse;
        ctx.shadowColor = '#ff0000';
        
        // Eye glow gradient
        const eyeGradient = ctx.createRadialGradient(this.x - 5, this.y - 3, 0, this.x - 5, this.y - 3, 3);
        eyeGradient.addColorStop(0, '#ff6666');
        eyeGradient.addColorStop(0.5, '#ff0000');
        eyeGradient.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeGradient2 = ctx.createRadialGradient(this.x + 5, this.y - 3, 0, this.x + 5, this.y - 3, 3);
        eyeGradient2.addColorStop(0, '#ff6666');
        eyeGradient2.addColorStop(0.5, '#ff0000');
        eyeGradient2.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient2;
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlights
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 4, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Jagged mouth (open and menacing)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 5);
        ctx.quadraticCurveTo(this.x - 3, this.y + 8, this.x, this.y + 7);
        ctx.quadraticCurveTo(this.x + 3, this.y + 8, this.x + 6, this.y + 5);
        ctx.stroke();
        
        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y + 5);
        ctx.lineTo(this.x - 4, this.y + 7);
        ctx.moveTo(this.x - 1, this.y + 6);
        ctx.lineTo(this.x - 1, this.y + 8);
        ctx.moveTo(this.x + 2, this.y + 6);
        ctx.lineTo(this.x + 2, this.y + 8);
        ctx.moveTo(this.x + 4, this.y + 5);
        ctx.lineTo(this.x + 4, this.y + 7);
        ctx.stroke();
        
        // Dripping effect (zombie drool/decay)
        const dripAnim = (Date.now() / 50 + this.x) % 10;
        if (dripAnim < 5) {
            ctx.fillStyle = 'rgba(100, 150, 50, 0.6)';
            ctx.beginPath();
            ctx.ellipse(this.x + 7, this.y + 8 + dripAnim * 0.5, 1, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        return this.health <= 0;
    }
}

// Normal zombie - current default enemy type
export class NormalZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'normal';
    }
}

// Armored zombie - slower but much tougher, with armor that absorbs damage
export class ArmoredZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'armored';
        this.armor = 10 + Math.floor(gameState.wave * 1.5); // Armor pool scales with wave
        this.speed *= 0.75; // Heavier, slower
        this.radius += 2;   // Slightly larger visual silhouette
    }

    draw() {
        // Draw base zombie visuals
        super.draw();

        // Overlay metal armor plates
        ctx.save();
        ctx.translate(this.x, this.y);

        // Chest plate
        ctx.fillStyle = 'rgba(140, 140, 155, 0.96)';
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 2;
        const chestWidth = this.radius * 1.8;
        const chestHeight = this.radius * 1.1;
        ctx.beginPath();
        ctx.rect(-chestWidth / 2, this.radius * 0.2, chestWidth, chestHeight);
        ctx.fill();
        ctx.stroke();

        // Shoulder pads
        ctx.beginPath();
        ctx.arc(-this.radius * 0.9, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.9, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Helmet band
        ctx.beginPath();
        ctx.rect(-this.radius * 0.9, -this.radius * 1.2, this.radius * 1.8, this.radius * 0.4);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    takeDamage(bulletDamage) {
        // Armor absorbs most of the damage first; some always leaks through
        const armorLeakThrough = 0.35; // 35% of damage bypasses armor
        let remaining = bulletDamage;

        if (this.armor > 0) {
            const toArmor = remaining * (1 - armorLeakThrough);
            this.armor -= toArmor;
            remaining = remaining * armorLeakThrough;
        }

        if (remaining > 0) {
            this.health -= remaining;
        }

        return this.health <= 0;
    }
}

// Fast zombie - The Runner: faster but weaker
export class FastZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'fast';
        this.speed *= 1.6; // 1.6x faster
        this.health = Math.floor(this.health * 0.6); // 60% health
        this.radius *= 0.8; // Smaller hitbox
    }

    draw() {
        // Shadow (smaller)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 2, this.y + this.radius + 2, this.radius * 1.0, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reddish/orange aura (faster pulse)
        const pulse = Math.sin(Date.now() / 150) * 0.4 + 0.6;
        const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 1.8);
        auraGradient.addColorStop(0, `rgba(255, 100, 0, ${0.5 * pulse})`);
        auraGradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.3 * pulse})`);
        auraGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Body with reddish tint
        const bodyGradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#ff8c42');
        bodyGradient.addColorStop(0.4, '#d2691e');
        bodyGradient.addColorStop(0.7, '#8b4513');
        bodyGradient.addColorStop(1, '#654321');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 12, this.radius * 1.0, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#4a2c1a';
        ctx.lineWidth = 2;
        ctx.setLineDash([1, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Glowing red eyes (brighter for fast zombie)
        const eyePulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.shadowBlur = 12 * eyePulse;
        ctx.shadowColor = '#ff0000';
        
        const eyeGradient = ctx.createRadialGradient(this.x - 4, this.y - 2, 0, this.x - 4, this.y - 2, 2.5);
        eyeGradient.addColorStop(0, '#ff8888');
        eyeGradient.addColorStop(0.5, '#ff0000');
        eyeGradient.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeGradient2 = ctx.createRadialGradient(this.x + 4, this.y - 2, 0, this.x + 4, this.y - 2, 2.5);
        eyeGradient2.addColorStop(0, '#ff8888');
        eyeGradient2.addColorStop(0.5, '#ff0000');
        eyeGradient2.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient2;
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Trail particles (speed lines)
        if (Math.random() < 0.3) {
            const trailX = this.x - Math.cos(Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x)) * this.radius * 1.5;
            const trailY = this.y - Math.sin(Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x)) * this.radius * 1.5;
            const trailParticle = {
                x: trailX,
                y: trailY,
                radius: Math.random() * 2 + 1,
                color: `rgba(255, 150, 50, ${Math.random() * 0.5 + 0.3})`,
                vx: 0,
                vy: 0,
                life: 10,
                maxLife: 10
            };
            gameState.particles.push(trailParticle);
        }
    }
}

// Exploding zombie - The Boomer: explodes on death
export class ExplodingZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'exploding';
        this.speed *= 0.9; // Slightly slower
        this.health = Math.floor(this.health * 0.8); // 80% health
        this.explosionRadius = 60; // Smaller explosion than grenade
        this.explosionDamage = 30; // Less damage than grenade
    }

    draw() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing orange/yellow glow (faster when low health or close to player)
        const distToPlayer = Math.sqrt((gameState.player.x - this.x) ** 2 + (gameState.player.y - this.y) ** 2);
        const healthRatio = this.health / (2 + Math.floor(gameState.wave / 3));
        const pulseSpeed = healthRatio < 0.5 || distToPlayer < 100 ? 100 : 200;
        const pulse = Math.sin(Date.now() / pulseSpeed) * 0.5 + 0.5;
        
        const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
        auraGradient.addColorStop(0, `rgba(255, 150, 0, ${0.6 * pulse})`);
        auraGradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.4 * pulse})`);
        auraGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Body with orange/yellow tint
        const bodyGradient = ctx.createRadialGradient(this.x - 4, this.y - 4, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#ffa500');
        bodyGradient.addColorStop(0.4, '#ff8c00');
        bodyGradient.addColorStop(0.7, '#cc6600');
        bodyGradient.addColorStop(1, '#8b4500');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Glowing orange eyes
        const eyePulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.shadowBlur = 10 * eyePulse;
        ctx.shadowColor = '#ff6600';
        
        const eyeGradient = ctx.createRadialGradient(this.x - 5, this.y - 3, 0, this.x - 5, this.y - 3, 3);
        eyeGradient.addColorStop(0, '#ffaa66');
        eyeGradient.addColorStop(0.5, '#ff6600');
        eyeGradient.addColorStop(1, '#cc4400');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeGradient2 = ctx.createRadialGradient(this.x + 5, this.y - 3, 0, this.x + 5, this.y - 3, 3);
        eyeGradient2.addColorStop(0, '#ffaa66');
        eyeGradient2.addColorStop(0.5, '#ff6600');
        eyeGradient2.addColorStop(1, '#cc4400');
        ctx.fillStyle = eyeGradient2;
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Jagged mouth
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 5);
        ctx.quadraticCurveTo(this.x - 3, this.y + 8, this.x, this.y + 7);
        ctx.quadraticCurveTo(this.x + 3, this.y + 8, this.x + 6, this.y + 5);
        ctx.stroke();
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        return this.health <= 0;
    }
}

