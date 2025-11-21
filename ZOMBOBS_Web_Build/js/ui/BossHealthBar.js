import { gameState } from '../core/gameState.js';

export class BossHealthBar {
    constructor(canvas) {
        this.canvas = canvas;
        this.height = 24;
        this.width = 600;
        this.padding = 4;
    }

    draw(ctx) {
        if (!gameState.bossActive || !gameState.boss) return;

        const boss = gameState.boss;
        const x = (this.canvas.width - this.width) / 2;
        const y = 40; // Top of screen

        ctx.save();

        // Background (Container)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.rect(x, y, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Health Fill
        const healthPct = Math.max(0, boss.health / boss.maxHealth);
        const fillWidth = (this.width - this.padding * 2) * healthPct;

        // Gradient for health bar
        const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#b71c1c');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + this.padding, y + this.padding, fillWidth, this.height - this.padding * 2);

        // Text Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`BOSS - ${Math.ceil(boss.health)} / ${boss.maxHealth}`, this.canvas.width / 2, y + this.height / 2);

        ctx.restore();
    }
}
