import { gameState } from '../core/gameState.js';
import { canvas, ctx } from '../core/canvas.js';
import { createParticles, createExplosion } from '../systems/ParticleSystem.js';

export class Bullet {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 12; // Default speed
        this.damage = weapon.damage;
        this.radius = 3;
        this.color = '#ffff00';
        this.distanceTraveled = 0;
        this.maxDistance = 1000; // Max range
        this.markedForRemoval = false;
        this.type = 'normal';

        // Calculate velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.distanceTraveled += this.speed;

        // Mark for removal if out of bounds or max range
        if (
            this.x < 0 || this.x > canvas.width ||
            this.y < 0 || this.y > canvas.height ||
            this.distanceTraveled > this.maxDistance
        ) {
            this.markedForRemoval = true;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw bullet trail
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bullet head
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }
}

export class FlameBullet extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 7;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 5;
        this.color = '#ff5722';
        this.maxDistance = weapon.range || 250;
        this.life = 1.0; // For fading out
        this.decay = 0.05;
        this.type = 'flame';
    }

    update() {
        super.update();
        this.life -= this.decay;
        if (this.life <= 0) {
            this.markedForRemoval = true;
        }
        // Add random jitter to flame
        this.x += (Math.random() - 0.5) * 2;
        this.y += (Math.random() - 0.5) * 2;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (2 - this.life), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export class PiercingBullet extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 25; // Very fast
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = '#00e5ff'; // Cyan
        this.pierceCount = 3; // Can hit 3 enemies
        this.maxDistance = 2000; // Long range
        this.type = 'piercing';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Long trail
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Bright core
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }
}

export class Rocket extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 2; // Starts slow
        this.acceleration = 0.5;
        this.maxSpeed = 15;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 6;
        this.color = '#795548'; // Brownish
        this.explosionRadius = weapon.explosionRadius || 150;
        this.explosionDamage = weapon.explosionDamage || 60;
        this.type = 'rocket';
    }

    update() {
        // Accelerate
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        super.update();

        // Rocket smoke trail
        if (Math.random() < 0.5) {
            createParticles(this.x, this.y, '#9e9e9e', 1);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Rocket body
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-10, -3, 20, 6);

        // Rocket head
        ctx.beginPath();
        ctx.moveTo(10, -3);
        ctx.lineTo(15, 0);
        ctx.lineTo(10, 3);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        // Fins
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-10, -6, 5, 12);

        // Engine glow
        ctx.beginPath();
        ctx.arc(-12, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9800';
        ctx.fill();

        ctx.restore();
    }
}
