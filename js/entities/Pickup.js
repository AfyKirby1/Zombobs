import { ctx } from '../core/canvas.js';

// Simple health pickup (healing orb with cross icon)
export class HealthPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 10;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    draw() {
        const t = Date.now() / 500 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.15;

        // Outer glow
        const glowRadius = this.radius * 2.2 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 80, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#ff8a80');
        coreGradient.addColorStop(1, '#d50000');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // White cross icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius / 2, this.y);
        ctx.lineTo(this.x + this.radius / 2, this.y);
        ctx.moveTo(this.x, this.y - this.radius / 2);
        ctx.lineTo(this.x, this.y + this.radius / 2);
        ctx.stroke();
    }
}

// Ammo pickup (ammo box with bullet icon)
export class AmmoPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 10;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    draw() {
        const t = Date.now() / 500 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.15;

        // Outer glow (yellow/orange)
        const glowRadius = this.radius * 2.2 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc (yellow/orange)
        const coreGradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#ffd54f');
        coreGradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bullet icon (simple rectangle with point)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - this.radius * 0.4, this.y - this.radius * 0.3, this.radius * 0.8, this.radius * 0.6);
        // Bullet tip
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.4, this.y - this.radius * 0.3);
        ctx.lineTo(this.x + this.radius * 0.6, this.y);
        ctx.lineTo(this.x + this.radius * 0.4, this.y + this.radius * 0.3);
        ctx.fill();
    }
}

