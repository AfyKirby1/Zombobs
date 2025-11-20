import { ctx } from '../core/canvas.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.maxLife = 30;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export class DamageNumber {
    constructor(x, y, value, isCrit = false) {
        this.x = x + (Math.random() - 0.5) * 10; // Start at zombie's x with some jitter
        this.y = y;
        this.value = value;
        this.isCrit = isCrit;
        this.life = 60; // 1 second at 60fps
        this.maxLife = 60;
        this.vy = isCrit ? -2.0 : -1.5; // Faster upward velocity for crits
        this.vx = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03; // A bit of gravity to slow the ascent
        this.life--;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        
        if (this.isCrit) {
            // Critical hit styling: larger, yellow/red gradient, more prominent
            const fontSize = this.value === "CRIT!" ? 20 : 22;
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            
            // Yellow to red gradient for crits
            const gradient = ctx.createLinearGradient(this.x - 30, this.y, this.x + 30, this.y);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, ${alpha})`);
            ctx.fillStyle = gradient;
            
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fillText(this.value, this.x, this.y);
        } else {
            ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`; // Yellow color for normal damage
            ctx.font = 'bold 16px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(this.value, this.x, this.y);
        }
        
        ctx.restore();
    }
}

