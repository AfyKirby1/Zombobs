import { ctx } from '../core/canvas.js';

export class FlameBullet {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.speed = 6; // Slightly slower than regular bullets
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.damage = weapon.damage;
        this.type = 'flame';
        this.life = 20; // Short-lived flame particles
        this.maxLife = 20;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        // Slow down over time (flame dissipates)
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        
        // Flame trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.strokeStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${alpha * 0.6})`;
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Flame glow
        const flameGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        flameGlow.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.8})`);
        flameGlow.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`);
        flameGlow.addColorStop(1, `rgba(255, 50, 0, 0)`);
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Flame core
        const flameGradient = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, this.radius);
        flameGradient.addColorStop(0, '#ffffff');
        flameGradient.addColorStop(0.3, '#ffff00');
        flameGradient.addColorStop(0.7, '#ff8800');
        flameGradient.addColorStop(1, '#ff4400');
        ctx.fillStyle = flameGradient;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 || 
               this.y < -50 || this.y > canvasHeight + 50 ||
               this.life <= 0;
    }
}

export class Bullet {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 8;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.damage = weapon.damage; // Weapon-specific damage
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        // Bullet trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bullet glow
        const bulletGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        bulletGlow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        bulletGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = bulletGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet core
        const bulletGradient = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, this.radius);
        bulletGradient.addColorStop(0, '#ffffff');
        bulletGradient.addColorStop(0.5, '#ffff00');
        bulletGradient.addColorStop(1, '#ffaa00');
        ctx.fillStyle = bulletGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet outline
        ctx.strokeStyle = '#cc8800';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < 0 || this.x > canvasWidth || 
               this.y < 0 || this.y > canvasHeight;
    }
}

