import { gameState } from '../core/gameState.js';
import { Bullet } from './Bullet.js';
import { createParticles } from '../systems/ParticleSystem.js';
import { playGunshotSound } from '../systems/AudioSystem.js';

export class SentryTurret {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.health = 100;
        this.maxHealth = 100;
        this.range = 380;
        this.fireRate = 220; // ms between shots
        this.lastShotTime = 0;
        this.angle = 0;
        this.damage = 4;
        this.lifetimeMs = 45000; // 45 seconds duration
        this.createdAt = Date.now();
        this.isDestroyed = false;
        this.target = null;
    }

    update() {
        const now = Date.now();
        if (now - this.createdAt > this.lifetimeMs || this.health <= 0) {
            this.isDestroyed = true;
            createParticles(this.x, this.y, '#9e9e9e', 12);
            return;
        }

        // Find closest target in range
        this.target = this._findTarget();
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Smoothly rotate toward target
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * 0.2;

            // Shoot if cooldown ready
            if (now - this.lastShotTime >= this.fireRate) {
                this._fire(now);
            }
        }
    }

    _findTarget() {
        let closest = null;
        let closestDistSq = this.range * this.range;

        for (let i = 0; i < gameState.zombies.length; i++) {
            const z = gameState.zombies[i];
            if (z.isDead || z.health <= 0) continue;
            const dx = z.x - this.x;
            const dy = z.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closest = z;
            }
        }
        return closest;
    }

    _fire(now) {
        this.lastShotTime = now;
        const spread = (Math.random() - 0.5) * 0.12;
        const bulletAngle = this.angle + spread;
        const speed = 16;
        const barrelLength = 22;

        const startX = this.x + Math.cos(this.angle) * barrelLength;
        const startY = this.y + Math.sin(this.angle) * barrelLength;

        const bullet = new Bullet(startX, startY, bulletAngle, speed, this.damage);
        bullet.isSentryBullet = true;
        gameState.bullets.push(bullet);
        gameState.totalShotsFired = (gameState.totalShotsFired || 0) + 1;

        // Muzzle flash
        createParticles(startX, startY, '#ffeb3b', 4);
        playGunshotSound('smg');
    }

    draw(ctx, cameraSystem) {
        const renderX = cameraSystem ? this.x - cameraSystem.x : this.x;
        const renderY = cameraSystem ? this.y - cameraSystem.y : this.y;

        ctx.save();
        ctx.translate(renderX, renderY);

        // Draw tripod legs
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
            const legAngle = (Math.PI * 2 / 3) * i + Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(legAngle) * 22, Math.sin(legAngle) * 22);
            ctx.stroke();
        }

        // Draw base circle
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = '#455a64';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw rotating turret head & barrel
        ctx.rotate(this.angle);

        // Double barrel
        ctx.fillStyle = '#102027';
        ctx.fillRect(4, -5, 20, 4);
        ctx.fillRect(4, 1, 20, 4);

        // Turret cap
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar & lifetime bar above turret
        const hpPercent = this.health / this.maxHealth;
        const remainingLifePercent = 1 - (Date.now() - this.createdAt) / this.lifetimeMs;
        const barWidth = 32;
        const barHeight = 4;
        const barX = renderX - barWidth / 2;
        const barY = renderY - this.radius - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = hpPercent > 0.4 ? '#00e676' : '#ff1744';
        ctx.fillRect(barX, barY, barWidth * Math.max(0, hpPercent), barHeight);

        // Thin blue timer bar below HP bar
        ctx.fillStyle = '#00b0ff';
        ctx.fillRect(barX, barY + barHeight + 1, barWidth * Math.max(0, remainingLifePercent), 2);
    }
}
