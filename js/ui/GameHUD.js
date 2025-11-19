import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { LOW_AMMO_FRACTION } from '../core/constants.js';

export class GameHUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.padding = 15;
        this.itemSpacing = 12;
        this.fontSize = 16;
        this.font = `700 ${this.fontSize}px 'Roboto Mono', monospace`;
        this.gameOver = false;
        this.paused = false;
        this.finalScore = '';
        this.mainMenu = false;
        this.hoveredButton = null; // Track which button is hovered
    }

    drawStat(label, value, icon, color, x, y, width) {
        // Background with glow
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + 40);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');
        
        // Main background
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, 40);
        
        // Border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, 40);
        
        // Glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.strokeRect(x, y, width, 40);
        this.ctx.shadowBlur = 0;
        
        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = this.font;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // Icon and label
        const text = `${icon} ${label}:`;
        this.ctx.fillText(text, x + 10, y + 13);
        
        // Value
        this.ctx.fillStyle = color;
        this.ctx.font = `700 ${this.fontSize + 2}px 'Roboto Mono', monospace`;
        this.ctx.fillText(value, x + 10, y + 27);
    }

    draw() {
        // Draw lobby if active
        if (gameState.showLobby) {
            this.drawLobby();
            return;
        }

        // Draw main menu if active
        if (this.mainMenu) {
            this.drawMainMenu();
            return;
        }
        
        // Draw regular HUD elements if game is running
        if (!this.gameOver && !this.paused) {
            const startX = this.padding;
            let startY = this.padding;
            
            // Health (redder when low)
            const healthValue = Math.max(0, Math.floor(gameState.player.health));
            const healthColor = gameState.player.health < 30 ? '#ff0000' : '#ff1744';
            this.drawStat('Health', healthValue, '❤️', healthColor, startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // Weapon and Ammo
            let ammoColor;
            if (gameState.isReloading) {
                ammoColor = '#ff9800'; // Keep existing reload color
            } else if (gameState.currentAmmo === 0) {
                ammoColor = '#ff5722'; // Empty ammo color
            } else if (gameState.currentAmmo <= gameState.maxAmmo * LOW_AMMO_FRACTION) {
                // Low ammo warning - bright red with optional pulse effect
                const t = Date.now() / 200;
                const pulse = 0.5 + 0.5 * Math.sin(t);
                const lowColor1 = '#ff0000';
                const lowColor2 = '#ff4444';
                // Blend between two colors for pulse effect
                const r1 = parseInt(lowColor1.slice(1, 3), 16);
                const g1 = parseInt(lowColor1.slice(3, 5), 16);
                const b1 = parseInt(lowColor1.slice(5, 7), 16);
                const r2 = parseInt(lowColor2.slice(1, 3), 16);
                const g2 = parseInt(lowColor2.slice(3, 5), 16);
                const b2 = parseInt(lowColor2.slice(5, 7), 16);
                const r = Math.floor(r1 + (r2 - r1) * pulse);
                const g = Math.floor(g1 + (g2 - g1) * pulse);
                const b = Math.floor(b1 + (b2 - b1) * pulse);
                ammoColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } else {
                ammoColor = '#ff9800'; // Normal ammo color
            }
            const ammoText = gameState.isReloading ? `Reloading...` : `${gameState.currentAmmo}/${gameState.maxAmmo}`;
            this.drawStat(gameState.currentWeapon.name, ammoText, '🔫', ammoColor, startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // Kills
            this.drawStat('Kills', gameState.zombiesKilled, '💀', '#76ff03', startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // Wave
            this.drawStat('Wave', gameState.wave, '🌊', '#ffc107', startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // Wave Progress (remaining zombies)
            const remainingZombies = gameState.zombies.length;
            const totalZombies = gameState.zombiesPerWave;
            const waveProgressText = `${remainingZombies}/${totalZombies}`;
            const waveProgressColor = remainingZombies <= totalZombies * 0.3 ? '#76ff03' : '#ffc107'; // Green when almost done
            this.drawStat('Remaining', waveProgressText, '🧟', waveProgressColor, startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // High Score
            this.drawStat('High Score', gameState.highScore, '🏆', '#ffd700', startX, startY, 140);
            startY += 40 + this.itemSpacing;
            
            // Grenades
            const grenadeColor = gameState.grenadeCount > 0 ? '#ff9800' : '#666666';
            this.drawStat('Grenades', gameState.grenadeCount, '💣', grenadeColor, startX, startY, 140);
            
            // Draw instructions at the bottom of the canvas
            this.ctx.fillStyle = 'rgba(153, 153, 153, 0.7)';
            this.ctx.font = '14px "Roboto Mono", monospace';
            this.ctx.textAlign = 'center';
            
            // Split instructions into two lines
            const line1 = 'WASD to move • Mouse to aim • Click to shoot • 1/2/3 to switch weapons';
            const line2 = 'G for grenade • V or Right-Click for melee';
            
            // Draw separator line
            this.ctx.strokeStyle = 'rgba(153, 153, 153, 0.3)';
            this.ctx.lineWidth = 1;
            const lineY = this.canvas.height - 45;
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2 - 200, lineY);
            this.ctx.lineTo(this.canvas.width / 2 + 200, lineY);
            this.ctx.stroke();
            
            // Draw first line above separator
            this.ctx.fillText(line1, this.canvas.width / 2, lineY - 8);
            
            // Draw second line below separator
            this.ctx.fillText(line2, this.canvas.width / 2, lineY + 20);
        }
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
        
        // Draw pause screen
        if (this.paused) {
            this.drawPauseMenu();
        }
    }

    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over title
        this.ctx.font = '48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        this.ctx.shadowBlur = 0;
        
        // Final score text
        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.textAlign = 'center';
        const lines = this.finalScore.split('\n');
        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 30 + (index * 30));
        });
        
        // Restart instruction
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    drawPauseMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause title
        this.ctx.font = '48px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 80);
        this.ctx.shadowBlur = 0;
        
        // Pause instruction
        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Game is currently paused', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Controls instruction
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

    showPauseMenu() {
        this.paused = true;
    }

    hidePauseMenu() {
        this.paused = false;
    }

    hideGameOver() {
        this.gameOver = false;
        this.finalScore = '';
    }

    drawMainMenu() {
        // Dark overlay background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.font = 'bold 64px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ZOMBOBS', this.canvas.width / 2, this.canvas.height / 2 - 200);
        this.ctx.shadowBlur = 0;
        
        // Subtitle
        this.ctx.font = '18px "Roboto Mono", monospace';
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Survive the Horde', this.canvas.width / 2, this.canvas.height / 2 - 150);
        
        // Button dimensions and positions (define early for username display)
        const buttonWidth = 240; // Reduced from 280
        const buttonHeight = 50; // Reduced from 60
        const buttonSpacing = 18; // Slightly reduced spacing
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Username display (clickable)
        const usernameY = this.canvas.height / 2 - 110;
        const usernameHovered = this.hoveredButton === 'username';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillStyle = usernameHovered ? '#ff9800' : '#cccccc';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Welcome, ${gameState.username}`, centerX, usernameY);
        
        // Change name hint
        if (usernameHovered) {
            this.ctx.font = '12px "Roboto Mono", monospace';
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillText('Click to change name', centerX, usernameY + 20);
        }
        
        // Button positions (moved down more to add space after username)
        const buttonStartY = centerY + 10; // Move buttons down by 50px from center
        const singlePlayerY = buttonStartY - (buttonHeight + buttonSpacing) * 1.5;
        const coopY = buttonStartY - (buttonHeight + buttonSpacing) * 0.5;
        const settingsY = buttonStartY + (buttonHeight + buttonSpacing) * 0.5;
        const multiplayerY = buttonStartY + (buttonHeight + buttonSpacing) * 1.5;

        // Single Player Button
        const singlePlayerHovered = this.hoveredButton === 'single';
        this.drawMenuButton(
            'Single Player',
            centerX - buttonWidth / 2,
            singlePlayerY - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            singlePlayerHovered,
            false
        );

        // Local Co-op Button
        const coopHovered = this.hoveredButton === 'local_coop';
        this.drawMenuButton(
            'Local Co-op',
            centerX - buttonWidth / 2,
            coopY - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            coopHovered,
            false // enabled (clickable but does nothing)
        );

        // Settings Button
        const settingsHovered = this.hoveredButton === 'settings';
        this.drawMenuButton(
            'Settings',
            centerX - buttonWidth / 2,
            settingsY - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            settingsHovered,
            false // enabled
        );
        
        // Multiplayer Button (enabled)
        const multiplayerHovered = this.hoveredButton === 'multiplayer';
        this.drawMenuButton(
            'Multiplayer',
            centerX - buttonWidth / 2,
            multiplayerY - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            multiplayerHovered,
            false // enabled
        );
        
        // Footer text
        this.ctx.font = '12px "Roboto Mono", monospace';
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
        this.ctx.fillText('High Score: ' + gameState.highScore, centerX, this.canvas.height - 40);
    }

    drawLobby() {
        // Dark overlay background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
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
        
        // Status Text
        this.ctx.font = '20px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        
        if (!gameState.multiplayer.connected) {
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillText('Connecting to server...', centerX, centerY - 50);
            
            // Loading spinner
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

        // Player list panel
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
        
        // Back Button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const backY = this.canvas.height - 100;
        
        const backHovered = this.hoveredButton === 'lobby_back';
        this.drawMenuButton(
            'Back',
            centerX - buttonWidth / 2,
            backY,
            buttonWidth,
            buttonHeight,
            backHovered,
            false
        );
        
        // Start Game Button (only if connected)
        if (gameState.multiplayer.connected) {
            const startY = this.canvas.height - 170;
            const startHovered = this.hoveredButton === 'lobby_start';
            this.drawMenuButton(
                'Start Game',
                centerX - buttonWidth / 2,
                startY,
                buttonWidth,
                buttonHeight,
                startHovered,
                false
            );
        }
    }

    drawMenuButton(text, x, y, width, height, hovered, disabled) {
        const alpha = disabled ? 0.5 : 1.0;
        const bgColor = disabled ? '#333333' : (hovered ? '#ff1744' : '#1a1a1a');
        const borderColor = disabled ? '#666666' : (hovered ? '#ff5252' : '#ff1744');
        const textColor = disabled ? '#888888' : '#ffffff';
        
        // Button background
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, disabled ? 'rgba(51, 51, 51, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(26, 26, 26, 0.9)'));
        bgGradient.addColorStop(1, disabled ? 'rgba(26, 26, 26, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.2)' : 'rgba(10, 10, 10, 0.9)'));
        
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Button border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Glow effect (only if not disabled and hovered)
        if (!disabled && hovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }
        
        // Button text
        this.ctx.fillStyle = textColor;
        this.ctx.font = 'bold 20px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    checkMenuButtonClick(mouseX, mouseY) {
        // Check lobby buttons if lobby is showing
        if (gameState.showLobby) {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const centerX = this.canvas.width / 2;
            
            // Back Button
            const backY = this.canvas.height - 100;
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= backY && mouseY <= backY + buttonHeight) {
                return 'lobby_back';
            }
            
            // Start Button (only if connected)
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
        
        const buttonWidth = 240; // Match drawMainMenu dimensions
        const buttonHeight = 50; // Match drawMainMenu dimensions
        const buttonSpacing = 18; // Match drawMainMenu spacing
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Check username click area (above buttons)
        const usernameY = this.canvas.height / 2 - 110;
        const usernameClickWidth = 300;
        const usernameClickHeight = 40;
        if (mouseX >= centerX - usernameClickWidth / 2 && mouseX <= centerX + usernameClickWidth / 2 &&
            mouseY >= usernameY - usernameClickHeight / 2 && mouseY <= usernameY + usernameClickHeight / 2) {
            return 'username';
        }
        
        // Button positions (match drawMainMenu positions)
        const buttonStartY = centerY + 10; // Match drawMainMenu offset
        const singlePlayerY = buttonStartY - (buttonHeight + buttonSpacing) * 1.5;
        const coopY = buttonStartY - (buttonHeight + buttonSpacing) * 0.5;
        const settingsY = buttonStartY + (buttonHeight + buttonSpacing) * 0.5;
        const multiplayerY = buttonStartY + (buttonHeight + buttonSpacing) * 1.5;
        
        // Check Single Player button
        const singlePlayerX = centerX - buttonWidth / 2;
        const singlePlayerYTop = singlePlayerY - buttonHeight / 2;
        if (mouseX >= singlePlayerX && mouseX <= singlePlayerX + buttonWidth &&
            mouseY >= singlePlayerYTop && mouseY <= singlePlayerYTop + buttonHeight) {
            return 'single';
        }
        
        // Check Coop button
        const coopX = centerX - buttonWidth / 2;
        const coopYTop = coopY - buttonHeight / 2;
        if (mouseX >= coopX && mouseX <= coopX + buttonWidth &&
            mouseY >= coopYTop && mouseY <= coopYTop + buttonHeight) {
            return 'local_coop';
        }

        // Check Settings button
        const settingsX = centerX - buttonWidth / 2;
        const settingsYTop = settingsY - buttonHeight / 2;
        if (mouseX >= settingsX && mouseX <= settingsX + buttonWidth &&
            mouseY >= settingsYTop && mouseY <= settingsYTop + buttonHeight) {
            return 'settings';
        }
        
        // Check Multiplayer button
        const multiplayerX = centerX - buttonWidth / 2;
        const multiplayerYTop = multiplayerY - buttonHeight / 2;
        if (mouseX >= multiplayerX && mouseX <= multiplayerX + buttonWidth &&
            mouseY >= multiplayerYTop && mouseY <= multiplayerYTop + buttonHeight) {
            return 'multiplayer';
        }
        
        return null;
    }

    updateMenuHover(mouseX, mouseY) {
        if (!this.mainMenu && !gameState.showLobby) {
            this.hoveredButton = null;
            return;
        }
        this.hoveredButton = this.checkMenuButtonClick(mouseX, mouseY);
    }

    showMainMenu() {
        this.mainMenu = true;
    }

    hideMainMenu() {
        this.mainMenu = false;
        this.hoveredButton = null;
    }
}
