import { ctx } from '../core/canvas.js';

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

