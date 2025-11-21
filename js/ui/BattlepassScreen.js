import { ctx } from '../core/canvas.js';
import { battlepassSystem } from '../systems/BattlepassSystem.js';
import { settingsManager } from '../systems/SettingsManager.js';

/**
 * BattlepassScreen - UI component for battlepass progression
 */
export class BattlepassScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scrollX = 0;
        this.maxScrollX = 0;
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        return Number.isFinite(scale) && scale > 0 ? scale : 1.0;
    }

    /**
     * Draw battlepass screen
     */
    draw() {
        const scale = this.getUIScale();
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Background overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, width, height);

        // Title
        const titleFontSize = Math.max(24, 32 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${titleFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        const seasonInfo = battlepassSystem.getSeasonInfo();
        this.ctx.fillText(`BATTLEPASS: ${seasonInfo.name}`, width / 2, 30 * scale);
        
        // Season info
        const infoFontSize = Math.max(10, 12 * scale);
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = `${infoFontSize}px 'Roboto Mono', monospace`;
        this.ctx.fillText(`${seasonInfo.daysRemaining} days remaining`, width / 2, 70 * scale);

        // Progress bar
        const progress = battlepassSystem.getProgress();
        const progressBarY = 100 * scale;
        const progressBarHeight = 30 * scale;
        const progressBarWidth = width - 40 * scale;
        const progressBarX = 20 * scale;

        this.drawProgressBar(progressBarX, progressBarY, progressBarWidth, progressBarHeight, progress);

        // Tier track (horizontal scrollable)
        const trackY = progressBarY + progressBarHeight + 30 * scale;
        const trackHeight = height - trackY - 100 * scale;
        const tierWidth = 100 * scale;
        const tierSpacing = 10 * scale;

        const season = battlepassSystem.getSeasonInfo();
        const totalTiers = 50; // Season 1 has 50 tiers
        const totalWidth = totalTiers * (tierWidth + tierSpacing) - tierSpacing;
        this.maxScrollX = Math.max(0, totalWidth - (width - 40 * scale));

        // Draw tier track background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.5)';
        this.ctx.fillRect(20 * scale, trackY, width - 40 * scale, trackHeight);

        // Draw visible tiers
        const startTier = Math.floor(this.scrollX / (tierWidth + tierSpacing));
        const visibleTiers = Math.ceil((width - 40 * scale) / (tierWidth + tierSpacing)) + 1;
        const endTier = Math.min(startTier + visibleTiers, totalTiers);

        for (let tier = startTier; tier < endTier; tier++) {
            const tierX = 20 * scale + tier * (tierWidth + tierSpacing) - this.scrollX;
            if (tierX + tierWidth < 20 * scale || tierX > width - 20 * scale) continue;

            const tierReward = battlepassSystem.getTierReward(tier + 1);
            const isUnlocked = battlepassSystem.isTierUnlocked(tier + 1);
            const isCurrent = tier + 1 === progress.currentTier;

            this.drawTierCard(tier + 1, tierX, trackY, tierWidth, trackHeight, tierReward, isUnlocked, isCurrent);
        }

        // Scrollbar
        if (this.maxScrollX > 0) {
            const scrollbarHeight = 8 * scale;
            const scrollbarY = trackY + trackHeight + 10 * scale;
            const scrollbarWidth = width - 40 * scale;
            const scrollbarX = 20 * scale;
            const thumbWidth = ((width - 40 * scale) / totalWidth) * scrollbarWidth;
            const thumbX = scrollbarX + (this.scrollX / this.maxScrollX) * (scrollbarWidth - thumbWidth);

            // Scrollbar track
            this.ctx.fillStyle = 'rgba(42, 42, 42, 0.5)';
            this.ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);

            // Scrollbar thumb
            this.ctx.fillStyle = '#ff6b00';
            this.ctx.fillRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight);
        }

        // Back button
        this.drawBackButton(width - 120 * scale, 30 * scale, 100 * scale, 35 * scale);
    }

    /**
     * Draw progress bar
     */
    drawProgressBar(x, y, width, height, progress) {
        const scale = this.getUIScale();

        // Background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
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
        const text = `Tier ${progress.currentTier} / ${progress.maxTier} - ${progress.battlepassXP} XP`;
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    /**
     * Draw tier card
     */
    drawTierCard(tier, x, y, width, height, tierReward, isUnlocked, isCurrent) {
        const scale = this.getUIScale();

        // Card background
        this.ctx.fillStyle = isUnlocked ? 'rgba(42, 42, 42, 0.9)' : 'rgba(20, 20, 20, 0.9)';
        if (isCurrent) {
            this.ctx.fillStyle = 'rgba(255, 107, 0, 0.3)';
        }
        this.ctx.fillRect(x, y, width, height);

        // Card border
        this.ctx.strokeStyle = isUnlocked ? '#ff6b00' : (isCurrent ? '#ff8c00' : '#444444');
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Tier number
        const tierFontSize = Math.max(10, 14 * scale);
        this.ctx.fillStyle = isUnlocked ? '#ffffff' : '#888888';
        this.ctx.font = `bold ${tierFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Tier ${tier}`, x + width / 2, y + 5 * scale);

        // Reward icon/text
        if (tierReward) {
            const reward = tierReward.freeReward;
            if (reward) {
                const iconY = y + 25 * scale;
                if (reward.type === 'rankXP') {
                    this.ctx.fillStyle = '#ff6b00';
                    this.ctx.font = `${Math.max(8, 10 * scale)}px 'Roboto Mono', monospace`;
                    this.ctx.fillText(`+${reward.amount} XP`, x + width / 2, iconY);
                } else if (reward.type === 'title') {
                    this.ctx.fillStyle = '#00ff00';
                    this.ctx.font = `${Math.max(8, 10 * scale)}px 'Roboto Mono', monospace`;
                    this.ctx.fillText('TITLE', x + width / 2, iconY);
                } else if (reward.type === 'emblem') {
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.font = `${Math.max(8, 10 * scale)}px 'Roboto Mono', monospace`;
                    this.ctx.fillText('EMBLEM', x + width / 2, iconY);
                }
            }
        }

        // Unlocked indicator
        if (isUnlocked) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = `${Math.max(8, 10 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText('✓', x + width / 2, y + height - 5 * scale);
        }
    }

    /**
     * Draw back button
     */
    drawBackButton(x, y, width, height) {
        const scale = this.getUIScale();

        // Button background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Button border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Button text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(10, 12 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('BACK', x + width / 2, y + height / 2);
    }

    /**
     * Handle click
     */
    handleClick(x, y) {
        const scale = this.getUIScale();
        const width = this.canvas.width;

        // Back button
        const backX = width - 120 * scale;
        const backY = 30 * scale;
        const backWidth = 100 * scale;
        const backHeight = 35 * scale;

        if (x >= backX && x <= backX + backWidth && y >= backY && y <= backY + backHeight) {
            return { action: 'back' };
        }

        return null;
    }

    /**
     * Handle scroll
     */
    handleScroll(deltaX) {
        this.scrollX = Math.max(0, Math.min(this.maxScrollX, this.scrollX + deltaX));
    }
}

