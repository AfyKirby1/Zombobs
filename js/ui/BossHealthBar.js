import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { getUiDensityScale } from '../core/canvas.js';

export class BossHealthBar {
    constructor(canvas) {
        this.canvas = canvas;
        this.height = 24;
        this.width = 600;
        this.padding = 4;
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        const base = Number.isFinite(scale) && scale > 0 ? scale : 1.0;
        return base * getUiDensityScale();
    }

    draw(ctx) {
        if (!gameState.bossActive || !gameState.boss) return;

        const boss = gameState.boss;
        const scale = this.getUIScale();
        const scaledWidth = this.width * scale;
        const scaledHeight = this.height * scale;
        const scaledPadding = this.padding * scale;
        const x = (this.canvas.width - scaledWidth) / 2;
        // Boss Rush has a persistent mode banner at the very top.
        const y = (gameState.gameMode === 'boss_rush' ? 80 : 40) * scale;

        ctx.save();

        // Background (Container)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2 * scale;

        ctx.beginPath();
        ctx.rect(x, y, scaledWidth, scaledHeight);
        ctx.fill();
        ctx.stroke();

        // Health Fill
        const healthPct = Math.max(0, boss.health / boss.maxHealth);
        const fillWidth = (scaledWidth - scaledPadding * 2) * healthPct;

        // Gradient for health bar
        const gradient = ctx.createLinearGradient(x, y, x, y + scaledHeight);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#b71c1c');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + scaledPadding, y + scaledPadding, fillWidth, scaledHeight - scaledPadding * 2);

        // Text Label
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(10, Math.round(14 * scale));
        ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4 * scale;
        const phaseLabel = boss.bossRushPhase > 0 ? `  // RAGE ${boss.bossRushPhase + 1}` : '';
        const name = gameState.gameMode === 'boss_rush' ? 'OVERLORD' : 'BOSS';
        ctx.fillText(`${name}${phaseLabel} - ${Math.ceil(boss.health)} / ${boss.maxHealth}`, this.canvas.width / 2, y + scaledHeight / 2);

        ctx.restore();
    }
}
