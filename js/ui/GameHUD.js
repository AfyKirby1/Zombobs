import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { BossHealthBar } from './BossHealthBar.js';
import { LOW_AMMO_FRACTION, NEWS_UPDATES } from '../core/constants.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { SKILLS_POOL } from '../systems/SkillSystem.js';
import { saveMultiplierStats } from '../utils/gameUtils.js';
import { isAudioInitialized } from '../systems/AudioSystem.js';

export class GameHUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bossHealthBar = new BossHealthBar(canvas);
        this.basePadding = 15;
        this.baseItemSpacing = 12;
        this.baseFontSize = 16;
        this.padding = this.getScaledPadding();
        this.itemSpacing = this.getScaledItemSpacing();
        this.fontSize = this.getScaledFontSize();
        this.font = `700 ${this.fontSize}px 'Roboto Mono', monospace`;
        this.gameOver = false;
        this.paused = false;
        this.finalScore = '';
        this.mainMenu = false;
        this.hoveredButton = null;
        this.hoveredSkillIndex = null;
        this.lobbyEnterTime = null; // Track when lobby was entered for fade-in animations
        this.lastLobbyState = false; // Track previous lobby state to reset animation
    }

    getUIScale() {
        return settingsManager.getSetting('video', 'uiScale') ?? 1.0;
    }

    getScaledPadding() {
        return this.basePadding * this.getUIScale();
    }

    getScaledItemSpacing() {
        return this.baseItemSpacing * this.getUIScale();
    }

    getScaledFontSize() {
        return Math.max(8, Math.round(this.baseFontSize * this.getUIScale())); // Min 8px for readability
    }

    drawStat(label, value, icon, color, x, y, width) {
        const scale = this.getUIScale();
        const height = 50 * scale;
        const padding = 10 * scale;
        const fontSize = this.getScaledFontSize();
        // Background with glow
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.shadowBlur = 10 * scale;
        this.ctx.shadowColor = color;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const text = `${icon} ${label}:`;
        this.ctx.fillText(text, x + padding, y + height * 0.3);

        this.ctx.fillStyle = color;
        this.ctx.font = `700 ${fontSize + Math.round(2 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(value, x + padding, y + height * 0.7);
    }

    drawHealthDisplay(player, x, y, width) {
        const height = 50;
        const health = Math.max(0, Math.floor(player.health));
        const maxHealth = player.maxHealth || 100;
        const healthPercent = Math.min(1, health / maxHealth);

        // Pulse effect for low health
        let pulse = 0;
        if (health < 30) {
            pulse = Math.sin(Date.now() / 100) * 0.2; // Fast pulse
        } else {
            pulse = Math.sin(Date.now() / 1000) * 0.05; // Slow breathing
        }

        // Colors
        const baseColor = '#ff1744';

        // 1. Glass Background
        this.ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
        this.ctx.fillRect(x, y, width, height);

        // 2. Health Bar Background (Empty)
        const barPadding = 4;
        const barWidth = width - (barPadding * 2);
        const barHeight = 8;
        const barX = x + barPadding;
        const barY = y + height - barHeight - 8; // Bottom aligned

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // 3. Health Bar Fill
        const fillWidth = Math.max(0, barWidth * healthPercent);
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#ff1744');

        this.ctx.fillStyle = gradient;
        // Add glow
        this.ctx.shadowBlur = 10 + (pulse * 20);
        this.ctx.shadowColor = baseColor;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        this.ctx.shadowBlur = 0;

        // 4. Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // 5. Heart Icon & Pulse
        const iconSize = 24 + (pulse * 5);
        const iconX = x + 25;
        const iconY = y + 20;

        this.ctx.font = `${iconSize}px serif`; // Emoji font
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('❤️', iconX, iconY);

        // 6. Text Label "HP"
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('HP', x + 50, y + 15);

        // 7. Health Value (Big Number)
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 24px "Roboto Mono", monospace';
        this.ctx.fillStyle = health < 30 ? '#ff5252' : '#ffffff';
        this.ctx.shadowBlur = health < 30 ? 10 : 0;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.fillText(health, x + width - 10, y + 20);
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'left'; // Reset alignment

        // 8. Preview Label
        this.ctx.font = 'italic 8px "Roboto Mono", monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText('PREVIEW', x + 3, y + 8);
    }

    draw() {
        if (gameState.showAbout) {
            this.drawAboutScreen();
        } else if (gameState.showLobby) {
            this.drawLobby();
        } else if (gameState.showCoopLobby) {
            this.drawCoopLobby();
        } else if (gameState.showAILobby) {
            this.drawAILobby();
        } else if (this.mainMenu) {
            this.drawMainMenu();
        } else {
            if (!this.gameOver && !this.paused && !gameState.showLevelUp) {
                if (gameState.isCoop) {
                    this.drawCoopHUD();
                } else {
                    this.drawSinglePlayerHUD();
                }
                this.drawOffScreenIndicators();
            }

            if (this.gameOver) {
                this.drawGameOver();
            }

            if (this.paused) {
                this.drawPauseMenu();
            }

            if (gameState.showLevelUp) {
                this.drawLevelUpScreen();
            }
        }

        // Always draw WebGPU status icon on top of everything
        this.drawWebGPUStatusIcon();
    }

    drawSinglePlayerHUD() {
        const player = gameState.players[0];
        const startX = this.padding;
        let startY = this.padding;
        const itemSpacing = this.getScaledItemSpacing();

        this.drawPlayerStats(player, startX, startY);

        // Draw shared stats below player stats for single player
        // 3 stats (Health, Ammo, Grenades) * (50 height + 12 spacing) + spacing
        const statHeight = 50 * this.getUIScale();
        startY += (statHeight + itemSpacing) * 3 + itemSpacing;
        this.drawSharedStats(startX, startY);

        this.drawInstructions();
    }

    drawCoopHUD() {
        // 2x2 grid layout for up to 4 players
        // Top-left: P1, Top-right: P2, Bottom-left: P3, Bottom-right: P4
        const scale = this.getUIScale();
        const padding = this.getScaledPadding();
        const itemSpacing = this.getScaledItemSpacing();
        const statHeight = 50 * scale;
        const width = 160 * scale;
        const statsHeight = (statHeight + itemSpacing) * 3; // 3 stats per player (health, ammo, grenades)

        // Calculate positions for 2x2 grid
        const leftX = padding;
        const rightX = this.canvas.width - width - padding;
        const topY = padding;
        const bottomY = this.canvas.height - statsHeight - padding;

        // Draw players in grid positions
        if (gameState.players.length >= 1) {
            this.drawPlayerStats(gameState.players[0], leftX, topY, "P1");
        }
        if (gameState.players.length >= 2) {
            this.drawPlayerStats(gameState.players[1], rightX, topY, "P2");
        }
        if (gameState.players.length >= 3) {
            this.drawPlayerStats(gameState.players[2], leftX, bottomY, "P3");
        }
        if (gameState.players.length >= 4) {
            this.drawPlayerStats(gameState.players[3], rightX, bottomY, "P4");
        }

        // Shared stats in Top Center
        const centerX = this.canvas.width / 2 - (80 * scale);
        this.drawSharedStats(centerX, padding);
    }

    drawPlayerStats(player, x, y, labelPrefix = "") {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const width = 160 * scale;
        const height = 50 * scale;
        let currentY = y;

        // Health - NEW DESIGN
        this.drawHealthDisplay(player, x, currentY, width);
        currentY += height + itemSpacing;

        // Shield
        if (player.shield > 0) {
            const shieldValue = Math.ceil(player.shield);
            this.drawStat('Shield', shieldValue, '🛡️', '#29b6f6', x, currentY, width);
            currentY += height + itemSpacing;
        }

        // Ammo
        let ammoColor;
        if (player.isReloading) {
            ammoColor = '#ff9800';
        } else if (player.currentAmmo === 0) {
            ammoColor = '#ff5722';
        } else if (player.currentAmmo <= player.maxAmmo * LOW_AMMO_FRACTION) {
            const t = Date.now() / 200;
            const pulse = 0.5 + 0.5 * Math.sin(t);
            ammoColor = pulse > 0.5 ? '#ff0000' : '#ff4444';
        } else {
            ammoColor = '#ff9800';
        }

        const weaponLabel = labelPrefix ? `${labelPrefix} ${player.currentWeapon.name}` : player.currentWeapon.name;

        if (player.isReloading) {
            // Draw reload progress bar
            const now = Date.now();
            const reloadProgress = Math.min(1, (now - player.reloadStartTime) / player.currentWeapon.reloadTime);
            const progressBarWidth = width - (20 * scale);
            const progressBarHeight = 6 * scale;
            const progressBarX = x + (10 * scale);
            const progressBarY = currentY + (35 * scale);

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Progress fill
            const fillWidth = progressBarWidth * reloadProgress;
            const progressGradient = this.ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + fillWidth, progressBarY);
            progressGradient.addColorStop(0, '#ff9800');
            progressGradient.addColorStop(1, '#ffc107');
            this.ctx.fillStyle = progressGradient;
            this.ctx.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);

            // Border
            this.ctx.strokeStyle = ammoColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Text
            const ammoText = `${Math.ceil(reloadProgress * 100)}%`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = this.font;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            const fontSize = this.getScaledFontSize();
            this.ctx.fillText(`${weaponLabel}:`, x + (10 * scale), currentY + (15 * scale));
            this.ctx.fillStyle = ammoColor;
            this.ctx.font = `700 ${fontSize + Math.round(2 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.fillText(ammoText, x + (10 * scale), currentY + (35 * scale));
        } else {
            const ammoText = `${player.currentAmmo}/${player.maxAmmo}`;
            this.drawStat(weaponLabel, ammoText, '🔫', ammoColor, x, currentY, width);
        }

        // Grenades (Optional to show per player, maybe skip to save space in coop or show small)
        currentY += height + itemSpacing;
        const grenadeColor = player.grenadeCount > 0 ? '#ff9800' : '#666666';
        this.drawStat('Grenades', player.grenadeCount, '💣', grenadeColor, x, currentY, width);

        // Multiplier indicator (if active)
        if (player.scoreMultiplier > 1.0) {
            currentY += height + itemSpacing;
            this.drawMultiplierIndicator(player, x, currentY);
        }
    }

    drawSharedStats(x, y) {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const width = 160 * scale;
        const height = 50 * scale;
        let currentY = y;

        // Wave
        // Draw Boss Health Bar if active
        if (gameState.bossActive) {
            this.bossHealthBar.draw(this.ctx);
        }

        this.drawStat('WAVE', gameState.wave, '🌊', '#ffc107', x, currentY, width);
        currentY += height + itemSpacing;

        // Kills
        this.drawStat('Kills', gameState.zombiesKilled, '💀', '#76ff03', x, currentY, width);
        currentY += height + itemSpacing;

        // Remaining
        const remainingZombies = gameState.zombies.length;
        const totalZombies = gameState.zombiesPerWave;
        const waveProgressText = `${remainingZombies}/${totalZombies}`;
        const waveProgressColor = remainingZombies <= totalZombies * 0.3 ? '#76ff03' : '#ffc107';
        this.drawStat('Left', waveProgressText, '🧟', waveProgressColor, x, currentY, width);

        if (!gameState.isCoop) {
            currentY += height + itemSpacing;
            this.drawStat('Score', gameState.score, '🏆', '#ffd700', x, currentY, width);

            // Draw multiplier indicator for player 1 (single player)
            const player = gameState.players[0];
            if (player.scoreMultiplier > 1.0) {
                currentY += height + itemSpacing;
                this.drawMultiplierIndicator(player, x, currentY);
                currentY += 50 * scale; // Add space for multiplier indicator
            }
        }

        // Buffs
        if (gameState.damageBuffEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.damageBuffEndTime - Date.now()) / 1000);
            this.drawStat('Damage', 'x2 ' + timeLeft + 's', '⚡', '#e040fb', x, currentY, width);
        }

        if (gameState.speedBoostEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.speedBoostEndTime - Date.now()) / 1000);
            this.drawStat('Speed', '>> ' + timeLeft + 's', '👟', '#00bcd4', x, currentY, width);
        }

        if (gameState.rapidFireEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.rapidFireEndTime - Date.now()) / 1000);
            this.drawStat('Rapid', '>>> ' + timeLeft + 's', '🔥', '#ff9800', x, currentY, width);
        }

        if (gameState.adrenalineEndTime > Date.now()) {
            currentY += height + this.itemSpacing;
            const timeLeft = Math.ceil((gameState.adrenalineEndTime - Date.now()) / 1000);
            this.drawStat('Adrenaline', '⚡⚡⚡ ' + timeLeft + 's', '💉', '#4caf50', x, currentY, width);
        }
    }

    drawInstructions() {
        const line1 = 'WASD to move • Mouse to aim • Click to shoot • 1/2/3/4 to switch weapons';
        const line2 = 'G for grenade • V or Right-Click for melee';

        this.ctx.save();
        const scale = this.getUIScale();
        const fontSize = Math.max(8, Math.round(14 * scale));
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';

        const textWidth = Math.max(this.ctx.measureText(line1).width, this.ctx.measureText(line2).width);
        const lineY = this.canvas.height - (45 * scale);

        // Semi-transparent background for readability
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const bgPadding = 20 * scale;
        const bgHeight = 60 * scale;
        this.ctx.fillRect(this.canvas.width / 2 - textWidth / 2 - bgPadding, lineY - (25 * scale), textWidth + bgPadding * 2, bgHeight);

        // Divider line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - textWidth / 2, lineY);
        this.ctx.lineTo(this.canvas.width / 2 + textWidth / 2, lineY);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
        this.ctx.fillText(line1, this.canvas.width / 2, lineY - 8);
        this.ctx.fillText(line2, this.canvas.width / 2, lineY + 20);
        this.ctx.restore();
    }

    drawTooltip(text, x, y) {
        if (!text) return;

        this.ctx.save();
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';

        const padding = 10;
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        const tooltipWidth = textWidth + padding * 2;
        const tooltipHeight = textHeight + padding * 2;

        // Position tooltip above the point
        const tooltipX = x;
        const tooltipY = y - 10;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(tooltipX - tooltipWidth / 2, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tooltipX - tooltipWidth / 2, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(text, tooltipX, tooltipY - padding);

        this.ctx.restore();
    }

    drawAILobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.getUIScale();
        // Title - scaled
        const aiTitleFontSize = Math.max(36, 48 * scale);
        this.ctx.font = `bold ${aiTitleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('AI SQUAD', this.canvas.width / 2, 100);
        this.ctx.shadowBlur = 0;

        const centerX = this.canvas.width / 2;
        const panelWidth = 400;
        const panelHeight = 300;
        const panelX = centerX - panelWidth / 2;
        const panelY = 180;

        // Player list panel
        this.ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Squad Members title - scaled (scale already defined at start of method)
        const squadTitleFontSize = Math.max(16, 20 * scale);
        this.ctx.font = `${squadTitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Squad Members', panelX + 20, panelY + 35);

        // List players - scaled
        const playerListFontSize = Math.max(12, 16 * scale);
        this.ctx.font = `${playerListFontSize}px "Roboto Mono", monospace`;
        gameState.players.forEach((player, index) => {
            const y = panelY + 70 + index * 35;
            const isPlayer = index === 0;
            const isAI = player.inputSource === 'ai';

            if (isPlayer) {
                this.ctx.fillStyle = '#66b3ff';
                this.ctx.fillText(`1. ${gameState.username || 'Player'} (You)`, panelX + 20, y);
            } else if (isAI) {
                this.ctx.fillStyle = '#76ff03';
                const botName = `Bot ${index}`;
                this.ctx.fillText(`${index + 1}. ${botName} [AI]`, panelX + 20, y);
            } else {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillText(`${index + 1}. Player ${index + 1}`, panelX + 20, y);
            }
        });

        // Buttons (scale already defined at start of method)
        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        const buttonY = this.canvas.height - (150 * scale);
        const addBotY = buttonY - (70 * scale);
        const startY = buttonY;

        const addBotHovered = this.hoveredButton === 'ai_add';
        const startHovered = this.hoveredButton === 'ai_start';
        const backHovered = this.hoveredButton === 'ai_back';

        // Max 4 players total (P1 + 3 bots)
        const canAddBot = gameState.players.length < 4;
        const addBotText = canAddBot ? 'Add Bot' : 'Max Players (4)';
        this.drawMenuButton(addBotText, centerX - buttonWidth / 2, addBotY, buttonWidth, buttonHeight, addBotHovered, !canAddBot);

        const canStart = gameState.players.length > 1;
        this.drawMenuButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, startHovered, !canStart);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY + 70, buttonWidth, buttonHeight, backHovered, false);
    }

    drawCoopLobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = 'bold 48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('LOCAL CO-OP (UP TO 4 PLAYERS)', this.canvas.width / 2, 80);
        this.ctx.shadowBlur = 0;

        // 2x2 grid layout for 4 player slots
        const slotWidth = 350;
        const slotHeight = 150;
        const spacing = 30;
        const gridWidth = slotWidth * 2 + spacing;
        const gridHeight = slotHeight * 2 + spacing;
        const startX = (this.canvas.width - gridWidth) / 2;
        const startY = 150;

        const playerColors = ['#66b3ff', '#ff6666', '#66ff66', '#ffaa66'];
        const playerLabels = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

        // Draw 4 player slots in 2x2 grid
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * (slotWidth + spacing);
            const y = startY + row * (slotHeight + spacing);

            const player = gameState.players[i];

            // Slot background
            this.ctx.fillStyle = 'rgba(15, 15, 20, 0.8)';
            this.ctx.fillRect(x, y, slotWidth, slotHeight);
            this.ctx.strokeStyle = player ? playerColors[i] : 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, slotWidth, slotHeight);

            // Player label
            this.ctx.font = '24px "Roboto Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = playerColors[i];
            this.ctx.fillText(playerLabels[i], x + slotWidth / 2, y + 30);

            // Player status
            this.ctx.font = '16px "Roboto Mono", monospace';

            if (player) {
                // Player joined
                const controls = player.inputSource === 'mouse' ? 'WASD + Mouse' :
                    (player.inputSource === 'gamepad' ? `Gamepad ${player.gamepadIndex + 1}` : 'Keyboard');
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillText(`Controls: ${controls}`, x + slotWidth / 2, y + 70);
                this.ctx.fillStyle = '#76ff03';
                this.ctx.fillText('✓ Ready', x + slotWidth / 2, y + 100);

                if (i > 0) {
                    this.ctx.fillStyle = '#888888';
                    this.ctx.font = '12px "Roboto Mono", monospace';
                    this.ctx.fillText('(Press Back/B to Leave)', x + slotWidth / 2, y + 125);
                }
            } else {
                // Empty slot
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText('Press A/Enter to Join', x + slotWidth / 2, y + 70);
                this.ctx.font = '14px "Roboto Mono", monospace';
                this.ctx.fillText('(Any Gamepad or Keyboard)', x + slotWidth / 2, y + 100);
            }
        }

        // Start Button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const centerX = this.canvas.width / 2;
        const buttonY = this.canvas.height - 100;

        const startHovered = this.hoveredButton === 'coop_start';
        const backHovered = this.hoveredButton === 'coop_back';

        // Require at least 2 players to start
        const canStart = gameState.players.length > 1;

        this.drawMenuButton('Start Game', centerX - buttonWidth / 2, buttonY - 70, buttonWidth, buttonHeight, startHovered, !canStart);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, backHovered, false);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = '48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.textAlign = 'center';

        this.ctx.fillText(this.finalScore, this.canvas.width / 2, this.canvas.height / 2 - 30);

        // Display multiplier stats
        const player = gameState.players[0];
        if (player.maxMultiplierThisSession > 1.0) {
            this.ctx.font = '18px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`Max Multiplier: ${player.maxMultiplierThisSession}x`, this.canvas.width / 2, this.canvas.height / 2 + 10);

            if (player.totalMultiplierBonus > 0) {
                this.ctx.fillStyle = '#4caf50';
                this.ctx.fillText(`Bonus Score: +${Math.floor(player.totalMultiplierBonus)}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
            }
        }

        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    drawPauseMenu() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = '48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 80);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Game is currently paused', this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillText('Press ESC to Resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 70);
        this.ctx.fillText('Press M to Return to Menu', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    showGameOver(scoreText) {
        this.gameOver = true;
        this.finalScore = scoreText;

        // Update all-time max multiplier if any player exceeded it
        gameState.players.forEach(player => {
            if (player.maxMultiplierThisSession > gameState.allTimeMaxMultiplier) {
                gameState.allTimeMaxMultiplier = player.maxMultiplierThisSession;
            }
        });

        // Save multiplier stats
        saveMultiplierStats();
    }

    showPauseMenu() { this.paused = true; }
    hidePauseMenu() { this.paused = false; }
    hideGameOver() { this.gameOver = false; this.finalScore = ''; }

    drawCreepyBackground() {
        const time = Date.now();
        const mouseX = this.mouseX || this.canvas.width / 2;
        const mouseY = this.mouseY || this.canvas.height / 2;

        // Base black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center
        const pulseSpeed = 0.002;
        const pulseSize = 0.5 + Math.sin(time * pulseSpeed) * 0.1; // Oscillates between 0.4 and 0.6
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        gradient.addColorStop(0, 'rgba(180, 0, 0, 0.7)');
        gradient.addColorStop(0.4, 'rgba(120, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Hidden Scratches (only visible near mouse)
        // We draw these BEFORE the heavy vignette so they feel "deep"
        if (Math.random() < 0.1) {
            // Use a fixed seed or just consistent noise for scratches?
            // Actually, let's just draw random faint lines near the cursor
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            const scratchX = mouseX + (Math.random() - 0.5) * 200;
            const scratchY = mouseY + (Math.random() - 0.5) * 200;
            this.ctx.moveTo(scratchX, scratchY);
            this.ctx.lineTo(scratchX + (Math.random() - 0.5) * 40, scratchY + (Math.random() - 0.5) * 40);
            this.ctx.stroke();
        }

        // Random Blood Splatters
        if (!this.splatters) this.splatters = [];

        // Spawn new splatter (small chance)
        if (Math.random() < 0.02) {
            this.splatters.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 15 + Math.random() * 30,
                alpha: 0.6 + Math.random() * 0.3,
                decay: 0.003 + Math.random() * 0.005,
                blobs: Array(4 + Math.floor(Math.random() * 5)).fill(0).map(() => ({
                    ox: (Math.random() - 0.5) * 30,
                    oy: (Math.random() - 0.5) * 30,
                    r: 5 + Math.random() * 15
                }))
            });
        }

        // Draw and update splatters
        this.ctx.fillStyle = '#660000'; // Deep red
        for (let i = this.splatters.length - 1; i >= 0; i--) {
            const s = this.splatters[i];
            s.alpha -= s.decay;

            if (s.alpha <= 0) {
                this.splatters.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = s.alpha;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            s.blobs.forEach(b => {
                this.ctx.arc(s.x + b.ox, s.y + b.oy, b.r, 0, Math.PI * 2);
            });
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;

        // Scanlines
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 2);
        }

        // Glitch Effect (Random horizontal slice displacement)
        if (Math.random() < 0.05) {
            const glitchHeight = Math.random() * 50 + 10;
            const glitchY = Math.random() * (this.canvas.height - glitchHeight);
            const offset = (Math.random() - 0.5) * 20;

            // Capture the slice
            const slice = this.ctx.getImageData(0, glitchY, this.canvas.width, glitchHeight);

            // Clear the area slightly to add artifacting feel
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fillRect(0, glitchY, this.canvas.width, glitchHeight);

            // Put it back offset
            this.ctx.putImageData(slice, offset, glitchY);

            // Add chromatic aberration line
            this.ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(0, glitchY + Math.random() * glitchHeight, this.canvas.width, 2);
        }

        // Moving static noise (lighter to not be too distracting)
        const noiseAmount = 1000;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < noiseAmount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2 + 1;
            this.ctx.fillRect(x, y, size, size);
        }

        // Heavy Vignette
        const vignette = this.ctx.createRadialGradient(centerX, centerY, this.canvas.height * 0.3, centerX, centerY, this.canvas.height * 0.8);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Flashlight / "Something Watching" Effect (drawn after vignette for uniform brightness)
        // Creates a subtle, unsettling spotlight that follows the mouse
        // revealing hidden scratches/texture
        const flashlightRadius = 150 + Math.sin(time * 0.005) * 20;
        const flashlight = this.ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, flashlightRadius);
        // Realistic flashlight: bright center, gradual fade to edges
        flashlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)'); // Bright center
        flashlight.addColorStop(0.2, 'rgba(255, 220, 220, 0.25)'); // Slight fade
        flashlight.addColorStop(0.5, 'rgba(255, 180, 180, 0.18)'); // More fade
        flashlight.addColorStop(0.75, 'rgba(200, 120, 120, 0.1)'); // Dimmer
        flashlight.addColorStop(0.9, 'rgba(150, 80, 80, 0.05)'); // Much dimmer
        flashlight.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent edge

        // Use screen blend mode to ensure uniform brightness regardless of underlying darkness
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = flashlight;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    }

    drawMainMenu() {
        this.drawCreepyBackground();

        const scale = this.getUIScale();

        // Main title - scaled
        const titleFontSize = Math.max(32, 40 * scale);
        this.ctx.font = `bold ${titleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS', this.canvas.width / 2, this.canvas.height / 2 - 200);
        this.ctx.shadowBlur = 0;

        // Subtitle - scaled
        const subtitleFontSize = Math.max(14, 18 * scale);
        this.ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Survive the Horde', this.canvas.width / 2, this.canvas.height / 2 - 150);

        // Music Tip - Only show if audio hasn't been initialized yet
        if (!isAudioInitialized()) {
            const centerY = this.canvas.height / 2;
            const musicTipY = centerY - 80;
            const musicTipFontSize = Math.max(11, 14 * scale);
            this.ctx.font = `${musicTipFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.fillText('🎵 Click anywhere to enable audio', this.canvas.width / 2, musicTipY);
            this.ctx.shadowBlur = 0;
        }
        const buttonWidth = 180 * scale;  // Reduced from 200
        const buttonHeight = 36 * scale;  // Reduced from 40
        const buttonSpacing = 15 * scale;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const usernameY = centerY - (130 * scale);
        const usernameHovered = this.hoveredButton === 'username';
        const fontSize = this.getScaledFontSize();
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = usernameHovered ? '#ff9800' : '#cccccc';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Welcome, ${gameState.username}`, centerX, usernameY);

        if (usernameHovered) {
            this.ctx.font = `${Math.max(8, Math.round(12 * scale))}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillText('Click to change name', centerX, usernameY + (20 * scale));
        }

        // 2x4 Grid Layout: 2 columns, 4 rows
        const columnSpacing = 20 * scale;
        const buttonStartY = centerY - (30 * scale);
        const leftColumnX = centerX - buttonWidth - columnSpacing / 2;
        const rightColumnX = centerX + columnSpacing / 2;

        // Row positions
        const row1Y = buttonStartY;
        const row2Y = buttonStartY + (buttonHeight + buttonSpacing);
        const row3Y = buttonStartY + (buttonHeight + buttonSpacing) * 2;
        const row4Y = buttonStartY + (buttonHeight + buttonSpacing) * 3;

        // Row 1: Arcade (left), Campaign (right)
        this.drawMenuButton('Arcade', leftColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'single', false);
        this.drawMenuButton('Campaign', rightColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'campaign', false);

        // Row 2: Local Co-op (left), Play with AI (right)
        this.drawMenuButton('Local Co-op', leftColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'local_coop', false);
        this.drawMenuButton('Play with AI', rightColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'play_ai', false);

        // Row 3: Settings (left), Multiplayer (right)
        this.drawMenuButton('Settings', leftColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'settings', false);
        this.drawMenuButton('Multiplayer', rightColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'multiplayer', false);

        // Row 4: About (centered)
        this.drawMenuButton('About', centerX - buttonWidth / 2, row4Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about', false);

        // High score - scaled
        const highScoreFontSize = Math.max(10, 12 * scale);
        this.ctx.font = `${highScoreFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
        this.ctx.fillText('High Score: ' + gameState.highScore, centerX, this.canvas.height - 80);  // Moved up from -40

        // Display all-time best multiplier - scaled
        if (gameState.allTimeMaxMultiplier > 1.0) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
            this.ctx.font = `${highScoreFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillText(`Best Multiplier: ${gameState.allTimeMaxMultiplier}x`, centerX, this.canvas.height - 60);  // Moved up from -20
        }

        // Draw server status indicator
        this.drawServerStatus();

        // Draw mute button in bottom right
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 60;
        const muteButtonY = this.canvas.height - 60;
        const muteButtonHovered = this.hoveredButton === 'mute_music';

        // Draw button background
        const bgColor = muteButtonHovered ? '#ff1744' : '#1a1a1a';
        const borderColor = muteButtonHovered ? '#ff5252' : '#ff1744';

        const bgGradient = this.ctx.createLinearGradient(muteButtonX, muteButtonY, muteButtonX, muteButtonY + muteButtonSize);
        bgGradient.addColorStop(0, muteButtonHovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(26, 26, 26, 0.9)');
        bgGradient.addColorStop(1, muteButtonHovered ? 'rgba(255, 23, 68, 0.2)' : 'rgba(10, 10, 10, 0.9)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);

        if (muteButtonHovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.strokeRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);
            this.ctx.shadowBlur = 0;
        }

        // Draw speaker icon - scaled
        this.ctx.fillStyle = '#ffffff';
        const speakerIconSize = Math.max(18, 24 * scale);
        this.ctx.font = `${speakerIconSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const icon = gameState.menuMusicMuted ? '🔇' : '🔊';
        this.ctx.fillText(icon, muteButtonX + muteButtonSize / 2, muteButtonY + muteButtonSize / 2);

        // Draw news ticker above footer
        this.drawNewsTicker();

        // Draw version box
        this.drawVersionBox();

        // Draw technology branding in bottom-left
        this.drawTechnologyBranding();
    }

    drawNewsTicker() {
        const scale = this.getUIScale();
        // Use smaller font size for news ticker to fit more content
        const newsFontSize = Math.max(10, Math.round(11 * scale * 0.85)); // 15% smaller than regular font
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Dimensions
        const boxWidth = 650;  // Increased from 480
        const boxHeight = 24;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const boxX = centerX - (boxWidth / 2);
        
        // Position below UI buttons
        // Last row center is roughly centerY + 135 (see drawMainMenu)
        // Bottom of buttons is roughly centerY + 155
        const boxY = centerY + 180;

        // Measure text width for scrolling calculation (using smaller font)
        ctx.font = `${newsFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(NEWS_UPDATES).width;

        // Calculate scroll offset (stateless animation using Date.now)
        // Scroll speed: divide by 30 for pixel-per-30ms movement (3x slower)
        const scrollSpeed = 30;
        const scrollOffset = (Date.now() / scrollSpeed) % (textWidth + boxWidth);
        const textX = boxX - scrollOffset;

        // Draw background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw border with amber glow
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Clip to box area to prevent text overflow
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxWidth, boxHeight);
        ctx.clip();

        // Draw scrolling text (amber/gold color) with smaller font
        ctx.fillStyle = '#ffc107';
        ctx.font = `${newsFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Draw text twice for seamless loop (when first copy scrolls out, second appears)
        const textY = boxY + boxHeight / 2;
        ctx.fillText(NEWS_UPDATES, textX, textY);
        ctx.fillText(NEWS_UPDATES, textX + textWidth + boxWidth, textY);

        // Restore clipping
        ctx.restore();
    }

    drawVersionBox() {
        const version = "V0.5.3";
        const padding = 15;
        const boxHeight = 24;
        
        const x = padding;
        const y = padding;

        this.ctx.save();
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        const textWidth = this.ctx.measureText(version).width;
        const boxWidth = textWidth + 24;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Text
        this.ctx.fillStyle = '#ff1744';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(version, x + boxWidth / 2, y + boxHeight / 2);
        
        this.ctx.restore();
    }

    drawAboutScreen() {
        this.drawCreepyBackground();

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title - scaled
        const aboutTitleFontSize = Math.max(36, 48 * scale);
        this.ctx.font = `bold ${aboutTitleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ABOUT', centerX, centerY - 250);
        this.ctx.shadowBlur = 0;

        // Game Info - scaled
        const gameInfoFontSize = Math.max(16, 20 * scale);
        this.ctx.font = `${gameInfoFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';

        let y = centerY - 150;
        this.ctx.fillText('ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS', centerX, y);
        y += 40;

        const versionFontSize = Math.max(12, 16 * scale);
        this.ctx.font = `${versionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Version: V0.5.3', centerX, y);
        y += 30;
        
        this.ctx.fillText('Engine: ZOMBS-XFX-NGIN V0.5.3', centerX, y);
        y += 50;

        const descriptionFontSize = Math.max(11, 14 * scale);
        this.ctx.font = `${descriptionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('A fast-paced, top-down zombie survival game', centerX, y);
        y += 25;
        this.ctx.fillText('built with vanilla HTML5 Canvas and JavaScript.', centerX, y);
        y += 50;

        this.ctx.font = `${versionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.fillText('Features:', centerX, y);
        y += 30;

        // Features list - scaled
        this.ctx.font = `${descriptionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#aaaaaa';
        const features = [
            '• Wave-based survival gameplay',
            '• Multiple zombie types and weapons',
            '• Local co-op support (up to 4 players)',
            '• WebGPU rendering with Canvas 2D fallback',
            '• Controller support',
            '• Day/Night cycle system'
        ];
        features.forEach(feature => {
            this.ctx.fillText(feature, centerX, y);
            y += 25;
        });

        // Back button (scale already defined at start of method)
        const buttonWidth = 240 * scale;
        const buttonHeight = 50 * scale;
        const backY = this.canvas.height - (100 * scale);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, backY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about_back', false);
    }

    drawLobbyBackground() {
        const time = Date.now();
        
        // Base gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#02040a');
        bgGradient.addColorStop(1, '#051b1f');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center (subtle)
        const pulseSpeed = 0.0015;
        const pulseSize = 0.4 + Math.sin(time * pulseSpeed) * 0.08;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const pulseGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        pulseGradient.addColorStop(0, 'rgba(255, 23, 68, 0.15)');
        pulseGradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.08)');
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = pulseGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated grid pattern (subtle)
        this.ctx.strokeStyle = 'rgba(255, 23, 68, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        const offset = (time * 0.05) % gridSize;
        
        this.ctx.beginPath();
        for (let x = -offset; x < this.canvas.width + gridSize; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = -offset; y < this.canvas.height + gridSize; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();

        // Scanlines
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }

        // Subtle noise overlay
        const noiseAmount = 500;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < noiseAmount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }

        // Vignette
        const vignette = this.ctx.createRadialGradient(centerX, centerY, this.canvas.height * 0.4, centerX, centerY, this.canvas.height * 0.7);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGlassCard(x, y, width, height, borderGlow = false) {
        // Glassmorphism effect - dark background with transparency
        const cardBg = this.ctx.createLinearGradient(x, y, x, y + height);
        cardBg.addColorStop(0, 'rgba(10, 12, 16, 0.85)');
        cardBg.addColorStop(1, 'rgba(10, 12, 16, 0.75)');
        
        this.ctx.fillStyle = cardBg;
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Optional glow effect
        if (borderGlow) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }
    }

    drawStatusIndicator(x, y, type, isActive, size = 20) {
        const time = Date.now();
        const pulse = isActive ? 0.5 + Math.sin(time * 0.01) * 0.3 : 1.0;
        
        this.ctx.save();
        this.ctx.translate(x, y);

        if (type === 'ready') {
            // Animated checkmark
            this.ctx.strokeStyle = isActive ? '#76ff03' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 10 * pulse;
                this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.4, 0);
            this.ctx.lineTo(-size * 0.1, size * 0.3);
            this.ctx.lineTo(size * 0.4, -size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'notReady') {
            // Animated X
            this.ctx.strokeStyle = isActive ? '#ff9800' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, -size * 0.3);
            this.ctx.lineTo(size * 0.3, size * 0.3);
            this.ctx.moveTo(size * 0.3, -size * 0.3);
            this.ctx.lineTo(-size * 0.3, size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'leader') {
            // Crown icon
            this.ctx.fillStyle = '#ffc107';
            this.ctx.shadowBlur = 15 * pulse;
            this.ctx.shadowColor = 'rgba(255, 193, 7, 0.8)';
            
            this.ctx.beginPath();
            // Crown base
            this.ctx.moveTo(-size * 0.5, size * 0.2);
            this.ctx.lineTo(-size * 0.3, -size * 0.2);
            this.ctx.lineTo(0, size * 0.1);
            this.ctx.lineTo(size * 0.3, -size * 0.2);
            this.ctx.lineTo(size * 0.5, size * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }

    drawPlayerCard(x, y, player, index, isLocalPlayer) {
        const scale = this.getUIScale();
        const cardWidth = 220 * scale;  // Reduced from 280
        const cardHeight = 75 * scale;  // Reduced from 100
        const padding = 12 * scale;     // Reduced from 15
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 300; // 300ms fade-in
            const elapsed = Date.now() - this.lobbyEnterTime;
            const delay = index * 100; // Stagger cards by 100ms each
            if (elapsed < delay + fadeDuration) {
                alpha = Math.min(1.0, Math.max(0, (elapsed - delay) / fadeDuration));
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Card background with glassmorphism
        this.drawGlassCard(x, y, cardWidth, cardHeight, isLocalPlayer);

        // Local player highlight (green glow border)
        if (isLocalPlayer) {
            this.ctx.strokeStyle = '#76ff03';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.6)';
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            this.ctx.shadowBlur = 0;
        }

        // Avatar placeholder (circular, colored by index)
        const avatarSize = 40 * scale;  // Reduced from 50
        const avatarX = x + padding;
        const avatarY = y + padding;
        const avatarColors = ['#ff1744', '#ff5252', '#76ff03', '#ffc107', '#2196f3', '#9c27b0'];
        const avatarColor = avatarColors[index % avatarColors.length];

        // Avatar circle
        this.ctx.fillStyle = avatarColor;
        this.ctx.beginPath();
        this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Avatar border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Player initial in avatar
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 16 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const initial = (player?.name || 'P')[0].toUpperCase();
        this.ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

        // Player name
        const nameX = avatarX + avatarSize + padding;
        const nameY = avatarY + 12 * scale;
        this.ctx.fillStyle = isLocalPlayer ? '#76ff03' : '#f5f5f5';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const playerName = player?.name || `Player ${index + 1}`;
        this.ctx.fillText(playerName, nameX, nameY);

        // Leader indicator
        if (player?.isLeader) {
            const leaderX = nameX + this.ctx.measureText(playerName).width + 6 * scale;
            this.drawStatusIndicator(leaderX, nameY + 6 * scale, 'leader', true, 14 * scale);
        }

        // Player ID badge
        const idSuffix = player?.id ? player.id.slice(-4) : '----';
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(`#${idSuffix}`, nameX, nameY + 18 * scale);

        // Ready status indicator
        const isReady = player?.isReady || false;
        const statusX = x + cardWidth - padding - 20 * scale;
        const statusY = y + cardHeight / 2;
        this.drawStatusIndicator(statusX, statusY, isReady ? 'ready' : 'notReady', true, 16 * scale);

        // Ready status text
        this.ctx.fillStyle = isReady ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const statusText = isReady ? 'READY' : 'NOT READY';
        this.ctx.fillText(statusText, x + cardWidth - padding, statusY + 18 * scale);
        
        this.ctx.restore();
    }

    drawConnectionStatusPanel(x, y) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 95 * scale;  // Reduced from 120
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15
        const time = Date.now();

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('CONNECTION STATUS', x + padding, y + padding);

        const isConnected = gameState.multiplayer.connected;
        const statusY = y + padding + 20 * scale;

        // Connection indicator (animated pulsing dot)
        const dotSize = 6 * scale;  // Reduced from 8
        const dotX = x + padding;
        const dotY = statusY + 6 * scale;
        const pulse = 0.7 + Math.sin(time * 0.01) * 0.3;

        if (isConnected) {
            this.ctx.fillStyle = '#76ff03';
            this.ctx.shadowBlur = 8 * scale * pulse;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
        } else {
            this.ctx.fillStyle = '#ff9800';
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Status text
        this.ctx.fillStyle = isConnected ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(isConnected ? 'Connected' : 'Connecting...', dotX + dotSize * 2 + 6 * scale, statusY);

        // Player ID
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const playerId = gameState.multiplayer.playerId || 'Unknown';
        const idSuffix = playerId.length > 8 ? playerId.slice(-8) : playerId;
        this.ctx.fillText(`ID: ${idSuffix}`, x + padding, statusY + 20 * scale);

        // Server status
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const serverStatus = gameState.multiplayer.serverStatus || 'Unknown';
        this.ctx.fillText(`Server: ${serverStatus}`, x + padding, statusY + 32 * scale);
        
        this.ctx.restore();
    }

    drawLobbyInfoPanel(x, y, playerCount) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 80 * scale;  // Reduced from 100
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('LOBBY INFO', x + padding, y + padding);

        // Player count
        const countY = y + padding + 20 * scale;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.font = `bold ${Math.max(24, 28 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(playerCount.toString(), x + padding, countY);

        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText('Players Online', x + padding, countY + 28 * scale);
        
        this.ctx.restore();
    }

    drawLobbyButton(text, x, y, width, height, hovered, disabled, isSpecial = false) {
        const time = Date.now();
        const pulse = 0.5 + Math.sin(time * 0.008) * 0.3;

        // Pill shape with rounded corners
        const radius = height / 2;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        if (disabled) {
            // Disabled state
            const disabledGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            disabledGradient.addColorStop(0, 'rgba(51, 51, 51, 0.6)');
            disabledGradient.addColorStop(1, 'rgba(26, 26, 26, 0.6)');
            this.ctx.fillStyle = disabledGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (hovered || isSpecial) {
            // Hovered or special state (all ready) - gradient with glow
            const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#ff5252');
            gradient.addColorStop(1, '#ff1744');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Glow effect
            if (isSpecial) {
                this.ctx.shadowBlur = 20 * pulse;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            } else {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            }
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            // Default state
            const defaultGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            defaultGradient.addColorStop(0, 'rgba(255, 23, 68, 0.2)');
            defaultGradient.addColorStop(1, 'rgba(255, 23, 68, 0.15)');
            this.ctx.fillStyle = defaultGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Text
        const scale = this.getUIScale();
        this.ctx.fillStyle = disabled ? '#888888' : '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawLobby() {
        // Track lobby entry time for fade-in animations
        if (this.lastLobbyState !== gameState.showLobby) {
            if (gameState.showLobby) {
                this.lobbyEnterTime = Date.now();
            } else {
                this.lobbyEnterTime = null;
            }
            this.lastLobbyState = gameState.showLobby;
        }
        
        // Draw animated background
        this.drawLobbyBackground();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title with enhanced effects
        const lobbyScale = this.getUIScale();
        this.ctx.font = `bold ${Math.max(36, 40 * lobbyScale)}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 25 * lobbyScale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.9)';
        this.ctx.fillText('MULTIPLAYER LOBBY', centerX, 60 * lobbyScale);
        this.ctx.shadowBlur = 0;

        // --- COUNTDOWN OVERLAY ---
        if (gameState.multiplayer.isGameStarting) {
            const timeLeft = Math.max(0, Math.ceil((gameState.multiplayer.gameStartTime - Date.now()) / 1000));

            // Enhanced dimming overlay with red tint
            const overlayGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height);
            overlayGradient.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
            overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
            overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Enhanced countdown number with stronger effects
            const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
            this.ctx.font = 'bold 140px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#ff1744';
            this.ctx.shadowBlur = 60 * pulse;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.fillText(timeLeft > 0 ? timeLeft : 'GO!', centerX, centerY);
            this.ctx.shadowBlur = 0;

            // Enhanced "DEPLOYING" text
            this.ctx.font = 'bold 36px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            this.ctx.fillText('DEPLOYING...', centerX, centerY + 100);
            this.ctx.shadowBlur = 0;

            // Don't draw interactive elements during countdown
            return;
        }

        const players = Array.isArray(gameState.multiplayer.players) ? gameState.multiplayer.players : [];
        const scale = lobbyScale;

        // Layout: Three-column design
        // Left: Connection status panel
        // Center: Player cards
        // Right: Lobby info panel

        const leftPanelX = 30 * scale;
        const rightPanelX = this.canvas.width - (230 * scale);
        const topY = 110 * scale;

        // Left panel: Connection status
        this.drawConnectionStatusPanel(leftPanelX, topY);

        // Right panel: Lobby info
        this.drawLobbyInfoPanel(rightPanelX, topY, players.length);

        // Center: Player cards (responsive layout)
        const cardSpacing = 15 * scale;
        const cardsPerRow = Math.min(2, Math.floor((this.canvas.width - 500 * scale) / (240 * scale))); // Responsive: 2 cards max
        const cardWidth = 220 * scale;
        const cardHeight = 75 * scale;
        
        // Calculate total width of card area and center it
        const totalCardsWidth = Math.min(players.length, cardsPerRow) * cardWidth + (Math.min(players.length, cardsPerRow) - 1) * cardSpacing;
        const cardStartX = centerX - totalCardsWidth / 2;
        const cardStartY = topY;

        if (players.length === 0) {
            // Empty state
            const emptyWidth = cardWidth * 2 + cardSpacing;
            const emptyX = centerX - emptyWidth / 2;
            this.drawGlassCard(emptyX, cardStartY, emptyWidth, cardHeight);
            this.ctx.fillStyle = '#9e9e9e';
            this.ctx.font = `${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Waiting for players to join...', centerX, cardStartY + cardHeight / 2);
        } else {
            // Draw player cards in grid
            players.forEach((player, index) => {
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;
                const cardX = cardStartX + col * (cardWidth + cardSpacing);
                const cardY = cardStartY + row * (cardHeight + cardSpacing);
                const isLocalPlayer = player?.id === gameState.multiplayer.playerId;
                
                this.drawPlayerCard(cardX, cardY, player, index, isLocalPlayer);
            });
        }

        // Bottom: Action buttons
        const buttonWidth = 180 * scale;  // Reduced from 200
        const buttonHeight = 40 * scale;  // Reduced from 45
        const buttonsDisabled = gameState.multiplayer.isGameStarting;

        if (gameState.multiplayer.connected) {
            const isLeader = gameState.multiplayer.isLeader;
            const allReady = players.length > 0 && players.every(p => p.isReady);

            if (isLeader) {
                // Leader: Ready, Start Game, Back
                const readyY = this.canvas.height - 150 * scale;
                const startY = this.canvas.height - 100 * scale;
                const backY = this.canvas.height - 50 * scale;

                const canStart = allReady && players.length > 0 && !buttonsDisabled;
                
                // Draw status text above Ready button
                if (!canStart && !buttonsDisabled) {
                    this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
                    this.ctx.fillStyle = '#ff9800';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Waiting for all players to be ready...', centerX, readyY - 25 * scale);
                }

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);

                this.drawLobbyButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_start', !canStart, canStart);

                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
                } else {
                    // Non-leader: Ready, Back
                    const readyY = this.canvas.height - 120 * lobbyScale;
                    const backY = this.canvas.height - 70 * lobbyScale;

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);
                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
            }
            } else {
                // Not connected - just Back button
                const backY = this.canvas.height - 100 * lobbyScale;
            this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                this.hoveredButton === 'lobby_back', false);
        }
    }

    drawMenuButton(text, x, y, width, height, hovered, disabled) {
        const scale = this.getUIScale();
        const bgColor = disabled ? '#333333' : (hovered ? '#ff1744' : '#1a1a1a');
        const borderColor = disabled ? '#666666' : (hovered ? '#ff5252' : '#ff1744');
        const textColor = disabled ? '#888888' : '#ffffff';

        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, disabled ? 'rgba(51, 51, 51, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(26, 26, 26, 0.9)'));
        bgGradient.addColorStop(1, disabled ? 'rgba(26, 26, 26, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.2)' : 'rgba(10, 10, 10, 0.9)'));

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        if (!disabled && hovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = textColor;
        const fontSize = Math.max(12, 18 * scale);  // Base 18px, minimum 12px
        this.ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    checkMenuButtonClick(mouseX, mouseY) {
        const centerX = this.canvas.width / 2;
        const uiScale = this.getUIScale();
        const buttonWidth = 200 * uiScale;
        const buttonHeight = 50 * uiScale;

        // Check AI Lobby
        if (gameState.showAILobby) {
            const addBotY = this.canvas.height - (220 * uiScale);
            const startY = this.canvas.height - (150 * uiScale);
            const backY = this.canvas.height - (80 * uiScale);

            // Add Bot
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= addBotY && mouseY <= addBotY + buttonHeight) {
                return 'ai_add';
            }
            // Start Game
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY && mouseY <= startY + buttonHeight) {
                return 'ai_start';
            }
            // Back
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= backY && mouseY <= backY + buttonHeight) {
                return 'ai_back';
            }
            return null;
        }

        // Check Coop Lobby
        if (gameState.showCoopLobby) {
            const startY = this.canvas.height - 100;

            // Start Game
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY - 70 && mouseY <= startY - 70 + buttonHeight) {
                return 'coop_start';
            }
            // Back
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY && mouseY <= startY + buttonHeight) {
                return 'coop_back';
            }
            return null;
        }

        // Check Multiplayer Lobby
        if (gameState.showLobby) {
            // Prevent clicks if game is starting
            if (gameState.multiplayer.isGameStarting) return null;

            const lobbyScale = this.getUIScale();
            const buttonWidth = 180 * lobbyScale;
            const buttonHeight = 40 * lobbyScale;

            if (gameState.multiplayer.connected) {
                const isLeader = gameState.multiplayer.isLeader;

                if (isLeader) {
                    // Leader: Ready, Start Game, Back
                    const readyY = this.canvas.height - 150 * lobbyScale;
                    const startY = this.canvas.height - 100 * lobbyScale;
                    const backY = this.canvas.height - 50 * lobbyScale;

                    // Check ready button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= readyY && mouseY <= readyY + buttonHeight) {
                        return 'lobby_ready';
                    }

                    // Check start game button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= startY && mouseY <= startY + buttonHeight) {
                        return 'lobby_start';
                    }

                    // Check back button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= backY && mouseY <= backY + buttonHeight) {
                        return 'lobby_back';
                    }
                } else {
                    // Non-leader: Ready, Back
                    const readyY = this.canvas.height - 120 * lobbyScale;
                    const backY = this.canvas.height - 70 * lobbyScale;

                    // Check ready button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= readyY && mouseY <= readyY + buttonHeight) {
                        return 'lobby_ready';
                    }

                    // Check back button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= backY && mouseY <= backY + buttonHeight) {
                        return 'lobby_back';
                    }
                }
            } else {
                // Not connected - just Back button
                const backY = this.canvas.height - 100 * lobbyScale;
                if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                    mouseY >= backY && mouseY <= backY + buttonHeight) {
                    return 'lobby_back';
                }
            }
            return null;
        }

        if (!this.mainMenu && !gameState.showAbout) return null;

        const scale = this.getUIScale();
        const mainMenuButtonWidth = 180 * scale;  // Reduced from 200
        const mainMenuButtonHeight = 36 * scale;  // Reduced from 40
        const centerY = this.canvas.height / 2;
        const buttonSpacing = 15 * scale;

        // Username
        const usernameY = centerY - (130 * scale);
        const usernameHitWidth = 150 * scale;
        const usernameHitHeight = 20 * scale;
        if (mouseX >= centerX - usernameHitWidth && mouseX <= centerX + usernameHitWidth &&
            mouseY >= usernameY - usernameHitHeight && mouseY <= usernameY + usernameHitHeight) {
            return 'username';
        }

        // 2x4 Grid Layout: 2 columns, 4 rows
        const columnSpacing = 20 * scale;
        const buttonStartY = centerY - (30 * scale);
        const leftColumnX = centerX - mainMenuButtonWidth - columnSpacing / 2;
        const rightColumnX = centerX + columnSpacing / 2;

        // Row positions
        const row1Y = buttonStartY;
        const row2Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing);
        const row3Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 2;
        const row4Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 3;

        // Check left column
        if (mouseX >= leftColumnX && mouseX <= leftColumnX + mainMenuButtonWidth) {
            if (mouseY >= row1Y - mainMenuButtonHeight / 2 && mouseY <= row1Y + mainMenuButtonHeight / 2) return 'single';
            if (mouseY >= row2Y - mainMenuButtonHeight / 2 && mouseY <= row2Y + mainMenuButtonHeight / 2) return 'local_coop';
            if (mouseY >= row3Y - mainMenuButtonHeight / 2 && mouseY <= row3Y + mainMenuButtonHeight / 2) return 'settings';
        }

        // Check right column
        if (mouseX >= rightColumnX && mouseX <= rightColumnX + mainMenuButtonWidth) {
            if (mouseY >= row1Y - mainMenuButtonHeight / 2 && mouseY <= row1Y + mainMenuButtonHeight / 2) return 'campaign';
            if (mouseY >= row2Y - mainMenuButtonHeight / 2 && mouseY <= row2Y + mainMenuButtonHeight / 2) return 'play_ai';
            if (mouseY >= row3Y - mainMenuButtonHeight / 2 && mouseY <= row3Y + mainMenuButtonHeight / 2) return 'multiplayer';
        }

        // Check About button (centered in row 4)
        if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2) {
            if (mouseY >= row4Y - mainMenuButtonHeight / 2 && mouseY <= row4Y + mainMenuButtonHeight / 2) return 'about';
        }

        // Check About screen back button
        if (gameState.showAbout) {
            const backY = this.canvas.height - 100;
            if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2 &&
                mouseY >= backY - mainMenuButtonHeight / 2 && mouseY <= backY + mainMenuButtonHeight / 2) {
                return 'about_back';
            }
        }

        // Check mute button (bottom right)
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 60;
        const muteButtonY = this.canvas.height - 60;
        if (mouseX >= muteButtonX && mouseX <= muteButtonX + muteButtonSize &&
            mouseY >= muteButtonY && mouseY <= muteButtonY + muteButtonSize) {
            return 'mute_music';
        }

        return null;
    }

    updateMenuHover(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        if (!this.mainMenu && !gameState.showLobby && !gameState.showCoopLobby && !gameState.showAILobby) {
            this.hoveredButton = null;
            return;
        }
        this.hoveredButton = this.checkMenuButtonClick(mouseX, mouseY);
    }

    drawOffScreenIndicators() {
        if (!gameState.gameRunning || gameState.gamePaused) return;
        if (gameState.zombies.length === 0) return;

        const indicatorDistance = 800; // Distance threshold
        const indicatorSize = 12;
        const edgePadding = 20;

        gameState.zombies.forEach(zombie => {
            // Find closest living player
            let closestPlayer = null;
            let minDist = Infinity;

            let minDistSquared = Infinity;
            gameState.players.forEach(p => {
                if (p.health > 0) {
                    const dx = p.x - zombie.x;
                    const dy = p.y - zombie.y;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < minDistSquared) {
                        minDistSquared = distSquared;
                        closestPlayer = p;
                    }
                }
            });

            if (!closestPlayer) return;

            const dx = zombie.x - closestPlayer.x;
            const dy = zombie.y - closestPlayer.y;
            const distSquared = dx * dx + dy * dy;
            const indicatorDistSquared = indicatorDistance * indicatorDistance;

            // Only show indicator if zombie is off-screen but within threshold distance
            if (distSquared > indicatorDistSquared) return;

            const isOnScreen = zombie.x >= 0 && zombie.x <= this.canvas.width &&
                zombie.y >= 0 && zombie.y <= this.canvas.height;

            if (isOnScreen) return; // Don't show indicator if zombie is on screen

            // Calculate angle to zombie
            const angle = Math.atan2(dy, dx);

            // Find intersection point with screen edge
            let indicatorX, indicatorY;

            // Check which edge the line intersects
            const slope = dy / dx;
            const playerX = closestPlayer.x;
            const playerY = closestPlayer.y;

            // Calculate intersections with all four edges
            let intersections = [];

            // Top edge (y = 0)
            const topX = playerX + (0 - playerY) / slope;
            if (topX >= 0 && topX <= this.canvas.width) {
                intersections.push({ x: topX, y: 0 });
            }

            // Bottom edge (y = canvas.height)
            const bottomX = playerX + (this.canvas.height - playerY) / slope;
            if (bottomX >= 0 && bottomX <= this.canvas.width) {
                intersections.push({ x: bottomX, y: this.canvas.height });
            }

            // Left edge (x = 0)
            const leftY = playerY + slope * (0 - playerX);
            if (leftY >= 0 && leftY <= this.canvas.height) {
                intersections.push({ x: 0, y: leftY });
            }

            // Right edge (x = canvas.width)
            const rightY = playerY + slope * (this.canvas.width - playerX);
            if (rightY >= 0 && rightY <= this.canvas.height) {
                intersections.push({ x: this.canvas.width, y: rightY });
            }

            // Use the closest intersection to the zombie
            if (intersections.length > 0) {
                let closestIntersection = intersections[0];
                const dx0 = intersections[0].x - zombie.x;
                const dy0 = intersections[0].y - zombie.y;
                let closestDistSquared = dx0 * dx0 + dy0 * dy0;

                intersections.forEach(int => {
                    const dx = int.x - zombie.x;
                    const dy = int.y - zombie.y;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < closestDistSquared) {
                        closestDistSquared = distSquared;
                        closestIntersection = int;
                    }
                });

                indicatorX = closestIntersection.x;
                indicatorY = closestIntersection.y;
            } else {
                // Fallback: use angle to place indicator at edge
                if (Math.abs(dx) > Math.abs(dy)) {
                    indicatorX = dx > 0 ? this.canvas.width - edgePadding : edgePadding;
                    indicatorY = playerY + slope * (indicatorX - playerX);
                } else {
                    indicatorY = dy > 0 ? this.canvas.height - edgePadding : edgePadding;
                    indicatorX = playerX + (indicatorY - playerY) / slope;
                }
            }

            // Clamp to screen bounds
            indicatorX = Math.max(edgePadding, Math.min(this.canvas.width - edgePadding, indicatorX));
            indicatorY = Math.max(edgePadding, Math.min(this.canvas.height - edgePadding, indicatorY));

            // Draw arrow indicator
            this.ctx.save();
            this.ctx.translate(indicatorX, indicatorY);
            this.ctx.rotate(angle);

            // Arrow color based on distance (closer = more red)
            // Calculate actual distance from squared distance
            const distance = Math.sqrt(distSquared);
            const distanceRatio = distance / indicatorDistance;
            const red = Math.floor(255 * (1 - distanceRatio));
            const green = Math.floor(100 * distanceRatio);
            const color = `rgb(${red}, ${green}, 0)`;

            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;

            // Draw arrow triangle
            this.ctx.beginPath();
            this.ctx.moveTo(indicatorSize, 0);
            this.ctx.lineTo(-indicatorSize / 2, -indicatorSize / 2);
            this.ctx.lineTo(-indicatorSize / 2, indicatorSize / 2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    showMainMenu() { this.mainMenu = true; }
    hideMainMenu() { this.mainMenu = false; this.hoveredButton = null; }

    drawLowHealthVignette(player) {
        if (!settingsManager.getSetting('video', 'lowHealthWarning')) return;

        const healthPercent = player.health / player.maxHealth;
        if (healthPercent >= 0.3) return; // Only show when health < 30%

        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
        const intensity = (0.3 - healthPercent) / 0.3; // 0 to 1 based on how low health is
        const alpha = intensity * pulse * 0.4; // Max 40% opacity

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.8;

        const vignette = this.ctx.createRadialGradient(
            centerX, centerY, this.canvas.height * 0.2,
            centerX, centerY, maxRadius
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(0.5, `rgba(255, 0, 0, ${alpha * 0.3})`);
        vignette.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);

        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCompass() {
        if (!gameState.gameRunning || gameState.gamePaused) return;
        if (gameState.players.length === 0) return;

        const player = gameState.players[0];
        const compassHeight = 30;
        const compassY = 10;
        const compassWidth = this.canvas.width * 0.4;
        const compassX = (this.canvas.width - compassWidth) / 2;

        this.ctx.save();

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(compassX, compassY, compassWidth, compassHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(compassX, compassY, compassWidth, compassHeight);

        // Get player angle and convert to compass direction
        // Player angle: 0 = right (East), PI/2 = down (South), PI = left (West), -PI/2 = up (North)
        const playerAngle = player.angle;
        // Convert to compass angle (0 = North, clockwise)
        const compassAngle = -playerAngle + Math.PI / 2;

        // Draw compass marks
        const directions = ['N', 'E', 'S', 'W'];
        const directionAngles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

        this.ctx.font = 'bold 14px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw center indicator
        const centerX = compassX + compassWidth / 2;
        const centerY = compassY + compassHeight / 2;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.fillRect(centerX - 2, centerY - 8, 4, 16);

        // Draw direction markers
        directionAngles.forEach((angle, index) => {
            const relativeAngle = angle - compassAngle;
            // Normalize angle to -PI to PI
            let normalizedAngle = relativeAngle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            // Only show if within visible range (about 90 degrees each side)
            if (Math.abs(normalizedAngle) < Math.PI / 2) {
                const offset = normalizedAngle / (Math.PI / 2) * (compassWidth / 2 - 20);
                const markerX = centerX + offset;

                // Draw tick mark
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(markerX, compassY + 5);
                this.ctx.lineTo(markerX, compassY + 15);
                this.ctx.stroke();

                // Draw direction label
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(directions[index], markerX, compassY + 25);
            }
        });

        this.ctx.restore();
    }

    drawTechnologyBranding() {
        this.ctx.save();

        const padding = 15;
        const fontSize = 10;
        const lineHeight = 14;
        const textPadding = 8;

        // Calculate text dimensions
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        const lines = [
            'Not sponsored',
            'Powered by Intel® / AMD',
            'WebGPU Technologies'
        ];

        // Measure text to determine panel size
        let maxWidth = 0;
        lines.forEach(line => {
            const width = this.ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const panelWidth = maxWidth + textPadding * 2;
        const panelHeight = lines.length * lineHeight + textPadding * 2;
        const panelX = padding;
        const panelY = this.canvas.height - panelHeight - padding;

        // Draw background panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Draw subtle border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Draw text lines
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
        lines.forEach((line, index) => {
            const y = panelY + textPadding + index * lineHeight;

            // Special styling for technology names
            if (line.includes('Intel') || line.includes('AMD') || line.includes('WebGPU')) {
                this.ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
            } else {
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            }

            this.ctx.fillText(line, panelX + textPadding, y);
        });

        this.ctx.restore();
    }

    drawWebGPUStatusIcon() {
        this.ctx.save();

        // Check if WebGPU renderer is available AND enabled
        const webgpuRenderer = window.webgpuRenderer;
        const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;
        const isWebGPUActive = webgpuRenderer && webgpuRenderer.isAvailable() && webgpuEnabled;

        const padding = 15;
        const iconWidth = 75;
        const iconHeight = 32;

        let iconX = padding;
        let iconY = this.canvas.height - iconHeight - padding;

        // If on Main Menu, stack above technology branding
        if (this.mainMenu) {
            // Branding height calculation from drawTechnologyBranding:
            // 3 lines * 14 lineHeight + 8 padding * 2 = 42 + 16 = 58px
            // plus 15px padding from bottom = 73px
            const brandingHeight = 58 + 15;
            iconY = this.canvas.height - brandingHeight - iconHeight - 10; // 10px gap
        }

        // Draw hexagon badge shape
        const hexRadius = iconHeight / 2;
        const centerX = iconX + hexRadius;
        const centerY = iconY + hexRadius;

        // Create hexagon path
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotate to point up
            const x = centerX + hexRadius * Math.cos(angle);
            const y = centerY + hexRadius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();

        // Fill with gradient or solid color based on state
        if (isWebGPUActive) {
            // Active: Blue/purple gradient with glow
            const gradient = this.ctx.createLinearGradient(iconX, iconY, iconX + iconWidth, iconY + iconHeight);
            gradient.addColorStop(0, '#6366f1'); // Indigo
            gradient.addColorStop(1, '#8b5cf6'); // Purple
            this.ctx.fillStyle = gradient;

            // Add glow effect
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
        } else {
            // Inactive: Gray with reduced opacity
            this.ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw border
        if (isWebGPUActive) {
            this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
            this.ctx.lineWidth = 1.5;
        } else {
            this.ctx.strokeStyle = 'rgba(102, 102, 102, 0.4)';
            this.ctx.lineWidth = 1;
        }
        this.ctx.stroke();

        // Draw "WebGPU" text
        this.ctx.font = 'bold 10px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (isWebGPUActive) {
            this.ctx.fillStyle = '#ffffff';
            // Subtle pulse effect
            const pulse = Math.sin(Date.now() / 1000) * 0.1 + 0.9;
            this.ctx.globalAlpha = pulse;
        } else {
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
            this.ctx.globalAlpha = 0.6;
        }

        this.ctx.fillText('WebGPU', centerX, centerY);
        this.ctx.globalAlpha = 1.0;

        // Draw status indicator dot
        const dotRadius = 3;
        const dotX = iconX + iconWidth - dotRadius - 4;
        const dotY = iconY + dotRadius + 4;

        if (isWebGPUActive) {
            this.ctx.fillStyle = '#10b981'; // Green
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
        } else {
            this.ctx.fillStyle = 'rgba(156, 163, 175, 0.6)'; // Gray
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    drawLevelUpScreen() {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffc107';
        ctx.fillStyle = '#ffc107';
        ctx.font = 'bold 48px "Roboto Mono", monospace';
        ctx.fillText('LEVEL UP!', canvas.width / 2, 80);
        ctx.shadowBlur = 0;

        // Level display
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Roboto Mono", monospace';
        ctx.fillText(`Level ${gameState.level}`, canvas.width / 2, 130);
        ctx.restore();

        // Draw skill cards
        const cardWidth = 300;
        const cardHeight = 400;
        const cardSpacing = 40;
        const totalWidth = (cardWidth * 2) + cardSpacing;
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 40;

        gameState.levelUpChoices.forEach((skill, index) => {
            const cardX = startX + (index * (cardWidth + cardSpacing));
            const isHovered = this.hoveredSkillIndex === index;

            // Card background
            const bgGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
            if (isHovered) {
                bgGradient.addColorStop(0, 'rgba(255, 193, 7, 0.3)');
                bgGradient.addColorStop(1, 'rgba(255, 152, 0, 0.3)');
            } else {
                bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
                bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.95)');
            }
            ctx.fillStyle = bgGradient;
            ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

            // Card border
            ctx.strokeStyle = isHovered ? '#ffc107' : '#666666';
            ctx.lineWidth = isHovered ? 4 : 2;
            ctx.shadowBlur = isHovered ? 15 : 0;
            ctx.shadowColor = '#ffc107';
            ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
            ctx.shadowBlur = 0;

            // Icon
            ctx.font = '64px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skill.icon, cardX + cardWidth / 2, cardY + 80);

            // Skill name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "Roboto Mono", monospace';
            ctx.fillText(skill.name, cardX + cardWidth / 2, cardY + 160);

            // Description
            ctx.fillStyle = '#cccccc';
            ctx.font = '16px "Roboto Mono", monospace';
            const descriptionLines = this.wrapText(ctx, skill.description, cardWidth - 40);
            let lineY = cardY + 200;
            descriptionLines.forEach(line => {
                ctx.fillText(line, cardX + cardWidth / 2, lineY);
                lineY += 24;
            });

            // Check if already owned
            const existingSkill = gameState.activeSkills.find(s => s.id === skill.id);
            if (existingSkill) {
                ctx.fillStyle = '#ffc107';
                ctx.font = 'bold 18px "Roboto Mono", monospace';
                ctx.fillText(`UPGRADE (Level ${existingSkill.level + 1})`, cardX + cardWidth / 2, cardY + cardHeight - 40);
            }
        });

        // Instruction text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '18px "Roboto Mono", monospace';
        ctx.fillText('Click a skill to select it', canvas.width / 2, canvas.height - 60);
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    checkLevelUpClick(x, y) {
        if (!gameState.showLevelUp || !gameState.levelUpChoices || gameState.levelUpChoices.length === 0) {
            return null;
        }

        const canvas = this.canvas;
        const cardWidth = 300;
        const cardHeight = 400;
        const cardSpacing = 40;
        const totalWidth = (cardWidth * 2) + cardSpacing;
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 40;

        for (let i = 0; i < gameState.levelUpChoices.length; i++) {
            const cardX = startX + (i * (cardWidth + cardSpacing));
            if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                return i;
            }
        }

        return null;
    }

    updateLevelUpHover(x, y) {
        this.hoveredSkillIndex = this.checkLevelUpClick(x, y);
    }

    drawServerStatus() {
        let status = gameState.multiplayer.status || 'disconnected';

        // If not actively connected to multiplayer lobby, show general server health
        if (status === 'disconnected' || status === 'error') {
            const serverHealth = gameState.multiplayer.serverStatus;
            if (serverHealth === 'online') {
                status = 'server_online';
            } else if (serverHealth === 'checking') {
                status = 'checking_health';
            }
        }

        const x = this.canvas.width - 150;
        const y = 20;
        const dotRadius = 6;
        const dotX = x + 10;
        const dotY = y + 10;

        // Determine color based on status
        let dotColor;
        let statusText;
        switch (status) {
            case 'connected':
                dotColor = '#10b981'; // Green
                statusText = 'Connected';
                break;
            case 'connecting':
                dotColor = '#f59e0b'; // Yellow/Amber
                statusText = 'Connecting...';
                break;
            case 'server_online':
                dotColor = '#10b981'; // Green
                statusText = 'Server Ready';
                break;
            case 'checking_health':
                dotColor = '#f59e0b'; // Yellow/Amber
                statusText = 'Waking Server...';
                break;
            case 'error':
                dotColor = '#ef4444'; // Red
                statusText = 'Error';
                break;
            default:
                dotColor = '#6b7280'; // Gray
                statusText = 'Offline';
        }

        // Background panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, 140, 30);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, 140, 30);

        // Status dot with glow
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = dotColor;
        this.ctx.fillStyle = dotColor;
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Status text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(statusText, dotX + 20, dotY);
    }

    drawMultiplierIndicator(player, x, y) {
        if (player.scoreMultiplier <= 1.0) {
            return; // Don't show at 1x
        }

        const width = 120;
        const height = 40;

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        // Color based on tier
        let color;
        if (player.scoreMultiplier >= 5.0) {
            color = '#ffd700'; // Gold for max
        } else if (player.scoreMultiplier >= 4.0) {
            color = '#ff9800'; // Orange
        } else if (player.scoreMultiplier >= 3.0) {
            color = '#ffeb3b'; // Yellow
        } else {
            color = '#4caf50'; // Green
        }

        // Render multiplier text
        this.ctx.save();
        this.ctx.font = 'bold 24px "Roboto Mono"';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 15 * pulse;
        this.ctx.shadowColor = color;
        this.ctx.fillText(`${player.scoreMultiplier}x`, x + width / 2, y);
        this.ctx.shadowBlur = 0;

        // Progress bar to next tier
        this.drawMultiplierProgress(player, x, y + 25, width);

        this.ctx.restore();
    }

    drawMultiplierProgress(player, x, y, width) {
        const kills = player.consecutiveKills;
        const thresholds = player.multiplierTierThresholds;

        // Find current and next threshold
        let currentThreshold = 0;
        let nextThreshold = thresholds[1];

        for (let i = 0; i < thresholds.length - 1; i++) {
            if (kills >= thresholds[i] && kills < thresholds[i + 1]) {
                currentThreshold = thresholds[i];
                nextThreshold = thresholds[i + 1];
                break;
            }
        }

        // At max tier
        if (kills >= thresholds[thresholds.length - 1]) {
            this.ctx.font = '12px "Roboto Mono"';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAX', x + width / 2, y);
            return;
        }

        // Calculate progress
        const progress = (kills - currentThreshold) / (nextThreshold - currentThreshold);

        // Render progress bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x, y, width, 6);

        // Render progress bar fill
        const fillWidth = width * progress;
        const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#ff1744');

        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        this.ctx.fillRect(x, y, fillWidth, 6);
        this.ctx.shadowBlur = 0;

        // Show kills remaining
        const killsRemaining = nextThreshold - kills;
        this.ctx.font = '10px "Roboto Mono"';
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${killsRemaining} kills to ${player.scoreMultiplier + 1.0}x`, x + width / 2, y + 16);
    }
}
