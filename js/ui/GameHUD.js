import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { BossHealthBar } from './BossHealthBar.js';
import { LOW_AMMO_FRACTION } from '../core/constants.js';

export class GameHUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bossHealthBar = new BossHealthBar(canvas);
        this.padding = 15;
        this.itemSpacing = 12;
        this.fontSize = 16;
        this.font = `700 ${this.fontSize}px 'Roboto Mono', monospace`;
        this.gameOver = false;
        this.paused = false;
        this.finalScore = '';
        this.mainMenu = false;
        this.hoveredButton = null;
    }

    drawStat(label, value, icon, color, x, y, width) {
        // Background with glow
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + 40);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, 40);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, 40);

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.strokeRect(x, y, width, 40);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = this.font;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const text = `${icon} ${label}:`;
        this.ctx.fillText(text, x + 10, y + 13);

        this.ctx.fillStyle = color;
        this.ctx.font = `700 ${this.fontSize + 2}px 'Roboto Mono', monospace`;
        this.ctx.fillText(value, x + 10, y + 27);
    }

    draw() {
        if (gameState.showLobby) {
            this.drawLobby();
            return;
        }

        if (gameState.showCoopLobby) {
            this.drawCoopLobby();
            return;
        }

        if (this.mainMenu) {
            this.drawMainMenu();
            return;
        }

        if (!this.gameOver && !this.paused) {
            if (gameState.isCoop) {
                this.drawCoopHUD();
            } else {
                this.drawSinglePlayerHUD();
            }
        }

        if (this.gameOver) {
            this.drawGameOver();
        }

        if (this.paused) {
            this.drawPauseMenu();
        }
    }

    drawSinglePlayerHUD() {
        const player = gameState.players[0];
        const startX = this.padding;
        let startY = this.padding;

        this.drawPlayerStats(player, startX, startY);

        // Draw shared stats below player stats for single player
        startY += (40 + this.itemSpacing) * 2 + this.itemSpacing;
        this.drawSharedStats(startX, startY);

        this.drawInstructions();
    }

    drawCoopHUD() {
        // P1 Left
        this.drawPlayerStats(gameState.players[0], this.padding, this.padding, "P1");

        // P2 Right
        if (gameState.players[1]) {
            // Align to right side
            const width = 140;
            const rightX = this.canvas.width - width - this.padding;
            this.drawPlayerStats(gameState.players[1], rightX, this.padding, "P2");
        }

        // Shared stats in Top Center
        const centerX = this.canvas.width / 2 - 70;
        this.drawSharedStats(centerX, this.padding);
    }

    drawPlayerStats(player, x, y, labelPrefix = "") {
        const width = 140;
        let currentY = y;

        // Health
        const healthValue = Math.max(0, Math.floor(player.health));
        const healthColor = player.health < 30 ? '#ff0000' : '#ff1744';
        const healthLabel = labelPrefix ? `${labelPrefix} HP` : 'Health';
        this.drawStat(healthLabel, healthValue, '❤️', healthColor, x, currentY, width);
        currentY += 40 + this.itemSpacing;

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
        const ammoText = player.isReloading ? `Reload...` : `${player.currentAmmo}/${player.maxAmmo}`;
        const weaponLabel = labelPrefix ? `${labelPrefix} ${player.currentWeapon.name}` : player.currentWeapon.name;
        this.drawStat(weaponLabel, ammoText, '🔫', ammoColor, x, currentY, width);

        // Grenades (Optional to show per player, maybe skip to save space in coop or show small)
        currentY += 40 + this.itemSpacing;
        const grenadeColor = player.grenadeCount > 0 ? '#ff9800' : '#666666';
        this.drawStat('Grenades', player.grenadeCount, '💣', grenadeColor, x, currentY, width);
    }

    drawSharedStats(x, y) {
        const width = 140;
        let currentY = y;

        // Wave
        // Draw Boss Health Bar if active
        if (gameState.bossActive) {
            this.bossHealthBar.draw(this.ctx);
        }

        this.drawStat('WAVE', gameState.wave, '🌊', '#ffc107', x, currentY, width);
        currentY += 40 + this.itemSpacing;

        // Kills
        this.drawStat('Kills', gameState.zombiesKilled, '💀', '#76ff03', x, currentY, width);
        currentY += 40 + this.itemSpacing;

        // Remaining
        const remainingZombies = gameState.zombies.length;
        const totalZombies = gameState.zombiesPerWave;
        const waveProgressText = `${remainingZombies}/${totalZombies}`;
        const waveProgressColor = remainingZombies <= totalZombies * 0.3 ? '#76ff03' : '#ffc107';
        this.drawStat('Left', waveProgressText, '🧟', waveProgressColor, x, currentY, width);

        if (!gameState.isCoop) {
            currentY += 40 + this.itemSpacing;
            this.drawStat('Score', gameState.score, '🏆', '#ffd700', x, currentY, width);
        }

        // Buffs
        if (gameState.damageBuffEndTime > Date.now()) {
            currentY += 40 + this.itemSpacing;
            const timeLeft = Math.ceil((gameState.damageBuffEndTime - Date.now()) / 1000);
            this.drawStat('Damage', 'x2 ' + timeLeft + 's', '⚡', '#e040fb', x, currentY, width);
        }
    }

    drawInstructions() {
        this.ctx.fillStyle = 'rgba(153, 153, 153, 0.7)';
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';

        const line1 = 'WASD to move • Mouse to aim • Click to shoot • 1/2/3 to switch weapons';
        const line2 = 'G for grenade • V or Right-Click for melee';

        this.ctx.strokeStyle = 'rgba(153, 153, 153, 0.3)';
        this.ctx.lineWidth = 1;
        const lineY = this.canvas.height - 45;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 200, lineY);
        this.ctx.lineTo(this.canvas.width / 2 + 200, lineY);
        this.ctx.stroke();

        this.ctx.fillText(line1, this.canvas.width / 2, lineY - 8);
        this.ctx.fillText(line2, this.canvas.width / 2, lineY + 20);
    }

    drawCoopLobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = 'bold 48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('LOCAL CO-OP', this.canvas.width / 2, 100);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '24px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#ffffff';

        const p1 = gameState.players[0];
        const p2 = gameState.players[1]; // Might be undefined

        // P1 Info
        this.ctx.fillStyle = '#66b3ff';
        this.ctx.fillText('Player 1', this.canvas.width / 4, this.canvas.height / 2 - 50);
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';

        const p1Controls = p1.inputSource === 'mouse' ? 'WASD + Mouse' :
            (p1.inputSource === 'gamepad' ? `Gamepad (ID: ${p1.gamepadIndex})` : 'Keyboard');
        this.ctx.fillText(`Controls: ${p1Controls}`, this.canvas.width / 4, this.canvas.height / 2);
        this.ctx.fillText('Status: Ready', this.canvas.width / 4, this.canvas.height / 2 + 30);

        // P2 Info
        this.ctx.font = '24px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Player 2', (this.canvas.width / 4) * 3, this.canvas.height / 2 - 50);
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';

        if (p2) {
            const p2Controls = p2.inputSource === 'gamepad' ? `Gamepad (ID: ${p2.gamepadIndex})` : 'Arrows + Enter';
            this.ctx.fillText(`Controls: ${p2Controls}`, (this.canvas.width / 4) * 3, this.canvas.height / 2);
            this.ctx.fillStyle = '#76ff03';
            this.ctx.fillText('Status: Ready', (this.canvas.width / 4) * 3, this.canvas.height / 2 + 30);

            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px "Roboto Mono", monospace';
            this.ctx.fillText('(Press Back/B to Leave)', (this.canvas.width / 4) * 3, this.canvas.height / 2 + 60);
        } else {
            this.ctx.fillText('Controls: Arrows + Enter', (this.canvas.width / 4) * 3, this.canvas.height / 2);
            this.ctx.fillText('OR Any Other Gamepad', (this.canvas.width / 4) * 3, this.canvas.height / 2 + 25);

            this.ctx.fillStyle = '#888888';
            this.ctx.fillText('Status: Press Enter/A to Join', (this.canvas.width / 4) * 3, this.canvas.height / 2 + 60);
        }

        // Start Button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height - 150;

        const startHovered = this.hoveredButton === 'coop_start';
        const backHovered = this.hoveredButton === 'coop_back';

        // Only enable start if P2 joined? Or allow solo on coop mode (weird but ok)?
        // Let's require 2 players for Coop Start
        const canStart = gameState.players.length > 1;

        this.drawMenuButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, startHovered, !canStart);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, startY + 70, buttonWidth, buttonHeight, backHovered, false);
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
    }

    showPauseMenu() { this.paused = true; }
    hidePauseMenu() { this.paused = false; }
    hideGameOver() { this.gameOver = false; this.finalScore = ''; }

    drawCreepyBackground() {
        const time = Date.now();

        // Base black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center
        const pulseSpeed = 0.002;
        const pulseSize = 0.5 + Math.sin(time * pulseSpeed) * 0.1; // Oscillates between 0.4 and 0.6
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        gradient.addColorStop(0, 'rgba(40, 0, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(20, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
    }

    drawMainMenu() {
        this.drawCreepyBackground();

        this.ctx.font = 'bold 64px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ZOMBOBS', this.canvas.width / 2, this.canvas.height / 2 - 200);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '18px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Survive the Horde', this.canvas.width / 2, this.canvas.height / 2 - 150);

        // Music Tip - More visible
        const musicTipY = this.canvas.height / 2 - 125;
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        this.ctx.fillText('🎵 Click anywhere to enable audio', this.canvas.width / 2, musicTipY);
        this.ctx.shadowBlur = 0;

        const buttonWidth = 240;
        const buttonHeight = 50;
        const buttonSpacing = 18;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const usernameY = this.canvas.height / 2 - 100;
        const usernameHovered = this.hoveredButton === 'username';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillStyle = usernameHovered ? '#ff9800' : '#cccccc';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Welcome, ${gameState.username}`, centerX, usernameY);

        if (usernameHovered) {
            this.ctx.font = '12px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillText('Click to change name', centerX, usernameY + 20);
        }

        // Move buttons down to avoid overlap with username hover text
        const buttonStartY = centerY + 90;
        const singlePlayerY = buttonStartY - (buttonHeight + buttonSpacing) * 1.5;
        const coopY = buttonStartY - (buttonHeight + buttonSpacing) * 0.5;
        const settingsY = buttonStartY + (buttonHeight + buttonSpacing) * 0.5;
        const multiplayerY = buttonStartY + (buttonHeight + buttonSpacing) * 1.5;

        this.drawMenuButton('Single Player', centerX - buttonWidth / 2, singlePlayerY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'single', false);
        this.drawMenuButton('Local Co-op', centerX - buttonWidth / 2, coopY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'local_coop', false);
        this.drawMenuButton('Settings', centerX - buttonWidth / 2, settingsY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'settings', false);
        this.drawMenuButton('Multiplayer', centerX - buttonWidth / 2, multiplayerY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'multiplayer', false);

        this.ctx.font = '12px "Roboto Mono", monospace';
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
        this.ctx.fillText('High Score: ' + gameState.highScore, centerX, this.canvas.height - 40);
    }

    drawLobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = 'bold 48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('MULTIPLAYER LOBBY', this.canvas.width / 2, 100);
        this.ctx.shadowBlur = 0;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const players = Array.isArray(gameState.multiplayer.players) ? gameState.multiplayer.players : [];

        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';

        if (!gameState.multiplayer.connected) {
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillText('Connecting to server...', centerX, centerY - 50);
            const t = Date.now() / 1000;
            this.ctx.strokeStyle = '#ff9800';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 20, t * Math.PI, t * Math.PI + Math.PI * 1.5);
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = '#76ff03';
            this.ctx.fillText('Connected!', centerX, centerY - 70);
            this.ctx.font = '16px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText(`Player ID: ${gameState.multiplayer.playerId || 'Unknown'}`, centerX, centerY - 35);
            this.ctx.fillText(`Players Online: ${players.length}`, centerX, centerY - 5);
        }

        const panelWidth = 360;
        const panelHeight = 200;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY + 30;

        this.ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Players in Lobby', panelX + 20, panelY + 30);

        if (players.length === 0) {
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px "Roboto Mono", monospace';
            this.ctx.fillText('Waiting for players...', panelX + 20, panelY + 60);
        } else {
            players.forEach((player, index) => {
                const name = player?.name || `Player ${index + 1}`;
                const idSuffix = player?.id ? player.id.slice(-4) : '----';
                this.ctx.fillStyle = player?.id === gameState.multiplayer.playerId ? '#76ff03' : '#ffffff';
                this.ctx.fillText(`${index + 1}. ${name} (#${idSuffix})`, panelX + 20, panelY + 60 + index * 30);
            });
        }

        const buttonWidth = 200;
        const buttonHeight = 50;
        const backY = this.canvas.height - 100;

        this.drawMenuButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, this.hoveredButton === 'lobby_back', false);

        if (gameState.multiplayer.connected) {
            const startY = this.canvas.height - 170;
            this.drawMenuButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, this.hoveredButton === 'lobby_start', false);
        }
    }

    drawMenuButton(text, x, y, width, height, hovered, disabled) {
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
        this.ctx.font = 'bold 20px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    checkMenuButtonClick(mouseX, mouseY) {
        const centerX = this.canvas.width / 2;
        const buttonWidth = 200;
        const buttonHeight = 50;

        // Check Coop Lobby
        if (gameState.showCoopLobby) {
            const startY = this.canvas.height - 150;

            // Start Game
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY && mouseY <= startY + buttonHeight) {
                return 'coop_start';
            }
            // Back
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY + 70 && mouseY <= startY + 70 + buttonHeight) {
                return 'coop_back';
            }
            return null;
        }

        // Check Multiplayer Lobby
        if (gameState.showLobby) {
            const backY = this.canvas.height - 100;
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= backY && mouseY <= backY + buttonHeight) {
                return 'lobby_back';
            }

            if (gameState.multiplayer.connected) {
                const startY = this.canvas.height - 170;
                if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                    mouseY >= startY && mouseY <= startY + buttonHeight) {
                    return 'lobby_start';
                }
            }
            return null;
        }

        if (!this.mainMenu) return null;

        const mainMenuButtonWidth = 240;
        const centerY = this.canvas.height / 2;
        const buttonSpacing = 18;

        // Username
        const usernameY = this.canvas.height / 2 - 100;
        if (mouseX >= centerX - 150 && mouseX <= centerX + 150 &&
            mouseY >= usernameY - 20 && mouseY <= usernameY + 20) {
            return 'username';
        }

        const buttonStartY = centerY + 90;
        const singlePlayerY = buttonStartY - (buttonHeight + buttonSpacing) * 1.5;
        const coopY = buttonStartY - (buttonHeight + buttonSpacing) * 0.5;
        const settingsY = buttonStartY + (buttonHeight + buttonSpacing) * 0.5;
        const multiplayerY = buttonStartY + (buttonHeight + buttonSpacing) * 1.5;

        if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2) {
            if (mouseY >= singlePlayerY - buttonHeight / 2 && mouseY <= singlePlayerY + buttonHeight / 2) return 'single';
            if (mouseY >= coopY - buttonHeight / 2 && mouseY <= coopY + buttonHeight / 2) return 'local_coop';
            if (mouseY >= settingsY - buttonHeight / 2 && mouseY <= settingsY + buttonHeight / 2) return 'settings';
            if (mouseY >= multiplayerY - buttonHeight / 2 && mouseY <= multiplayerY + buttonHeight / 2) return 'multiplayer';
        }

        return null;
    }

    updateMenuHover(mouseX, mouseY) {
        if (!this.mainMenu && !gameState.showLobby && !gameState.showCoopLobby) {
            this.hoveredButton = null;
            return;
        }
        this.hoveredButton = this.checkMenuButtonClick(mouseX, mouseY);
    }

    showMainMenu() { this.mainMenu = true; }
    hideMainMenu() { this.mainMenu = false; this.hoveredButton = null; }
}
