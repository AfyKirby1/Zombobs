import { ctx } from '../core/canvas.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { rankSystem } from '../systems/RankSystem.js';
import { achievementSystem } from '../systems/AchievementSystem.js';
import { battlepassSystem } from '../systems/BattlepassSystem.js';
import { RankDisplay } from './RankDisplay.js';
import { settingsManager } from '../systems/SettingsManager.js';

/**
 * ProfileScreen - UI component for player profile
 */
export class ProfileScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rankDisplay = new RankDisplay(canvas);
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        return Number.isFinite(scale) && scale > 0 ? scale : 1.0;
    }

    /**
     * Draw profile screen
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
        this.ctx.fillText('PROFILE', width / 2, 30 * scale);

        const profile = playerProfileSystem.getProfile();
        const stats = profile.stats;
        const achievementStats = achievementSystem.getStatistics();
        const battlepassProgress = battlepassSystem.getProgress();

        // Player info section (left side)
        const leftX = 40 * scale;
        const leftY = 100 * scale;
        const leftWidth = (width - 60 * scale) / 2;

        // Username
        const usernameFontSize = Math.max(18, 24 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${usernameFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        let usernameText = profile.username;
        if (profile.title) {
            usernameText = `${profile.title} ${usernameText}`;
        }
        this.ctx.fillText(usernameText, leftX, leftY);

        // Rank display
        this.rankDisplay.drawFullRankDisplay(leftX, leftY + 50 * scale, leftWidth);

        // Stats section (right side)
        const rightX = leftX + leftWidth + 20 * scale;
        const rightY = leftY;
        const rightWidth = leftWidth;

        // Stats title
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `bold ${Math.max(16, 20 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText('STATISTICS', rightX, rightY);

        // Stats list
        const statsY = rightY + 40 * scale;
        const statSpacing = 25 * scale;
        const statFontSize = Math.max(11, 13 * scale);

        this.drawStatLine('Games Played', stats.totalGamesPlayed.toLocaleString(), rightX, statsY, rightWidth, statFontSize);
        this.drawStatLine('Zombies Killed', stats.totalZombiesKilled.toLocaleString(), rightX, statsY + statSpacing, rightWidth, statFontSize);
        this.drawStatLine('Waves Survived', stats.totalWavesSurvived.toLocaleString(), rightX, statsY + statSpacing * 2, rightWidth, statFontSize);
        this.drawStatLine('Highest Wave', stats.highestWave.toString(), rightX, statsY + statSpacing * 3, rightWidth, statFontSize);
        this.drawStatLine('Highest Score', stats.highestScore.toLocaleString(), rightX, statsY + statSpacing * 4, rightWidth, statFontSize);
        
        const timePlayedHours = Math.floor(stats.totalTimePlayed / 3600);
        const timePlayedMinutes = Math.floor((stats.totalTimePlayed % 3600) / 60);
        const timePlayedText = timePlayedHours > 0 ? `${timePlayedHours}h ${timePlayedMinutes}m` : `${timePlayedMinutes}m`;
        this.drawStatLine('Time Played', timePlayedText, rightX, statsY + statSpacing * 5, rightWidth, statFontSize);

        // Achievement summary
        const achievementY = statsY + statSpacing * 6 + 20 * scale;
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `bold ${Math.max(14, 18 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText('ACHIEVEMENTS', rightX, achievementY);

        this.drawStatLine('Unlocked', `${achievementStats.unlocked} / ${achievementStats.total}`, rightX, achievementY + 30 * scale, rightWidth, statFontSize);
        this.drawStatLine('Completion', `${Math.floor(achievementStats.completionPercent)}%`, rightX, achievementY + 30 * scale + statSpacing, rightWidth, statFontSize);

        // Battlepass summary
        const battlepassY = achievementY + 30 * scale + statSpacing * 2 + 20 * scale;
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `bold ${Math.max(14, 18 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText('BATTLEPASS', rightX, battlepassY);

        this.drawStatLine('Current Tier', `${battlepassProgress.currentTier} / ${battlepassProgress.maxTier}`, rightX, battlepassY + 30 * scale, rightWidth, statFontSize);
        this.drawStatLine('Unlocked Tiers', battlepassProgress.unlockedTiers.toString(), rightX, battlepassY + 30 * scale + statSpacing, rightWidth, statFontSize);

        // Back button
        this.drawBackButton(width - 120 * scale, 30 * scale, 100 * scale, 35 * scale);
    }

    /**
     * Draw stat line
     */
    drawStatLine(label, value, x, y, width, fontSize) {
        const scale = this.getUIScale();

        // Label
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = `${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(label + ':', x, y);

        // Value
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(value, x + width, y);
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
}

