import { rankSystem } from '../systems/RankSystem.js';
import { settingsManager } from '../systems/SettingsManager.js';

/** Per-rank accent palette for badge theming */
const RANK_THEMES = [
    { primary: '#cd7f32', light: '#f0b35a', glow: 'rgba(255, 140, 0, 0.55)' },   // Private
    { primary: '#7a8fa3', light: '#b8c9d9', glow: 'rgba(126, 184, 218, 0.5)' }, // Corporal
    { primary: '#c9a227', light: '#f4d76a', glow: 'rgba(255, 215, 0, 0.5)' },   // Sergeant
    { primary: '#4fc3f7', light: '#8ddbff', glow: 'rgba(79, 195, 247, 0.5)' }, // Lieutenant
    { primary: '#ab47bc', light: '#e1a8f0', glow: 'rgba(171, 71, 188, 0.5)' }, // Captain
    { primary: '#ef5350', light: '#ff8a80', glow: 'rgba(239, 83, 80, 0.5)' },   // Major
    { primary: '#ff6b00', light: '#ffab40', glow: 'rgba(255, 107, 0, 0.55)' }, // Colonel
    { primary: '#ffd700', light: '#fff59d', glow: 'rgba(255, 215, 0, 0.6)' },   // General
    { primary: '#ff1744', light: '#ff6090', glow: 'rgba(255, 23, 68, 0.6)' }  // Legend
];

/**
 * RankDisplay - UI component for displaying rank information
 */
export class RankDisplay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        return Number.isFinite(scale) && scale > 0 ? scale : 1.0;
    }

    getRankTheme(rankIndex) {
        const idx = Math.max(0, Math.min(rankIndex - 1, RANK_THEMES.length - 1));
        return RANK_THEMES[idx];
    }

    /**
     * Draw rank badge (compact version for menu)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Size of badge
     */
    drawRankBadge(x, y, size = 60) {
        const showRankBadge = settingsManager.getSetting('video', 'showRankBadge') !== false;
        if (!showRankBadge) return;

        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();
        const theme = this.getRankTheme(progress.rank);

        const rankBadgeSize = settingsManager.getSetting('video', 'rankBadgeSize') || 'normal';
        let sizeMultiplier = 1.0;
        if (rankBadgeSize === 'small') sizeMultiplier = 0.8;
        else if (rankBadgeSize === 'large') sizeMultiplier = 1.2;

        const scaledSize = size * scale * sizeMultiplier;
        const centerX = x + scaledSize / 2;
        const centerY = y + scaledSize / 2;
        const radius = scaledSize / 2;
        const pulse = 0.88 + 0.12 * Math.sin(Date.now() / 900);

        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Soft outer glow
        this.ctx.shadowBlur = 18 * scale * pulse;
        this.ctx.shadowColor = theme.glow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 4 * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // XP progress track (outer ring)
        const arcR = radius + 3 * scale;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, arcR, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2.5 * scale;
        this.ctx.stroke();

        // XP progress fill
        const arcStart = -Math.PI / 2;
        const arcSweep = (progress.progressPercent / 100) * Math.PI * 2;
        if (arcSweep > 0.02) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, arcR, arcStart, arcStart + arcSweep);
            const arcGrad = this.ctx.createLinearGradient(
                centerX - arcR, centerY, centerX + arcR, centerY
            );
            arcGrad.addColorStop(0, theme.primary);
            arcGrad.addColorStop(1, theme.light);
            this.ctx.strokeStyle = arcGrad;
            this.ctx.lineWidth = 3 * scale;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }

        // Metallic ring border
        const ringGrad = this.ctx.createLinearGradient(
            centerX - radius, centerY - radius,
            centerX + radius, centerY + radius
        );
        ringGrad.addColorStop(0, theme.light);
        ringGrad.addColorStop(0.45, theme.primary);
        ringGrad.addColorStop(1, theme.primary);

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = ringGrad;
        this.ctx.lineWidth = 2.5 * scale;
        this.ctx.stroke();

        // Inner glass disc
        const innerR = radius - 2.5 * scale;
        const discGrad = this.ctx.createRadialGradient(
            centerX, centerY - innerR * 0.3, innerR * 0.1,
            centerX, centerY, innerR
        );
        discGrad.addColorStop(0, 'rgba(22, 26, 34, 0.95)');
        discGrad.addColorStop(0.6, 'rgba(10, 12, 16, 0.92)');
        discGrad.addColorStop(1, 'rgba(4, 6, 10, 0.98)');

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
        this.ctx.fillStyle = discGrad;
        this.ctx.fill();

        // Inner highlight arc (top shine)
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerR - 1 * scale, -Math.PI * 0.85, -Math.PI * 0.15);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 1 * scale;
        this.ctx.stroke();

        // Tier chevrons (military insignia)
        this._drawTierChevrons(centerX, centerY - 11 * scale, progress.rankTier, theme.light, scale);

        // Rank name
        const rankLen = progress.rankName.length;
        const rankFontSize = Math.max(9, (rankLen > 8 ? 10 : rankLen > 6 ? 11 : 12) * scale);
        this.ctx.font = `bold ${rankFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.shadowBlur = 4 * scale;
        this.ctx.shadowColor = theme.glow;
        this.ctx.fillText(progress.rankName.toUpperCase(), centerX, centerY + 1 * scale);
        this.ctx.shadowBlur = 0;

        // Tier pill
        const tierLabel = `TIER ${progress.rankTier}`;
        const pillFontSize = Math.max(7, 8 * scale);
        this.ctx.font = `bold ${pillFontSize}px 'Roboto Mono', monospace`;
        const pillW = this.ctx.measureText(tierLabel).width + 10 * scale;
        const pillH = 11 * scale;
        const pillX = centerX - pillW / 2;
        const pillY = centerY + 12 * scale;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.beginPath();
        this.ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        this.ctx.fill();

        this.ctx.strokeStyle = theme.primary;
        this.ctx.lineWidth = 1 * scale;
        this.ctx.stroke();

        this.ctx.fillStyle = theme.light;
        this.ctx.fillText(tierLabel, centerX, pillY + pillH / 2 + 0.5 * scale);

        this.ctx.restore();
    }

    /** Draw stacked chevrons for tier insignia */
    _drawTierChevrons(cx, cy, tier, color, scale) {
        const chevronW = 5 * scale;
        const chevronH = 2.2 * scale;
        const stackGap = 2.8 * scale;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.6 * scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let t = 0; t < tier; t++) {
            const rowY = cy + t * stackGap;
            const left = cx - chevronW / 2;
            const right = cx + chevronW / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(left, rowY + chevronH);
            this.ctx.lineTo(cx, rowY);
            this.ctx.lineTo(right, rowY + chevronH);
            this.ctx.stroke();
        }
    }

    /**
     * Draw rank progress bar
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of bar
     * @param {number} height - Height of bar
     */
    drawRankProgressBar(x, y, width, height) {
        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();

        // Background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.85)';
        this.ctx.fillRect(x, y, width, height);

        // Progress fill
        const fillWidth = (width * progress.progressPercent) / 100;
        const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff6b00');
        gradient.addColorStop(1, '#ff8c00');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, fillWidth, height);

        // Border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Text
        const fontSize = Math.max(10, 12 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const text = `${progress.currentTierXP} / ${progress.nextTierXP} XP`;
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    /**
     * Draw full rank display (for profile screen)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of display
     */
    drawFullRankDisplay(x, y, width) {
        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();
        const padding = 20 * scale;
        const height = 150 * scale;

        // Background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Rank badge (left side)
        const badgeSize = 80 * scale;
        const badgeX = x + padding;
        const badgeY = y + padding;
        this.drawRankBadge(badgeX, badgeY, badgeSize);

        // Rank info (right side)
        const infoX = x + badgeSize + padding * 2;
        const infoY = y + padding;
        const infoWidth = width - badgeSize - padding * 3;

        const fontSize = Math.max(12, 16 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Rank name
        this.ctx.fillText(progress.rankName, infoX, infoY);
        
        // Tier
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `${Math.max(10, 14 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(`Tier ${progress.rankTier}`, infoX, infoY + fontSize + 5 * scale);

        // Progress bar
        const barHeight = 20 * scale;
        const barY = infoY + fontSize * 2 + 15 * scale;
        this.drawRankProgressBar(infoX, barY, infoWidth, barHeight);

        // Total rank XP
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = `${Math.max(9, 11 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(`Total Rank XP: ${progress.rankXP.toLocaleString()}`, infoX, barY + barHeight + 10 * scale);
    }
}

