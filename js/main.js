import { 
    WEAPONS, MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, MELEE_SWIPE_DURATION, 
    WAVE_BREAK_DURATION, PLAYER_MAX_HEALTH,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS,
    PLAYER_BASE_SPEED, PLAYER_SPRINT_SPEED,
    PLAYER_STAMINA_MAX, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN, PLAYER_STAMINA_REGEN_DELAY
} from './core/constants.js';
import { canvas, ctx, resizeCanvas } from './core/canvas.js';
import { gameState, resetGameState } from './core/gameState.js';
import { settingsManager } from './systems/SettingsManager.js';
import { initAudio, playFootstepSound, playDamageSound, playKillSound, playRestartSound } from './systems/AudioSystem.js';
import { initGrassPattern } from './systems/GraphicsSystem.js';
import { GameHUD } from './ui/GameHUD.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie } from './entities/Zombie.js';
import { HealthPickup, AmmoPickup } from './entities/Pickup.js';
import { DamageNumber } from './entities/Particle.js';
import { 
    shootBullet, reloadWeapon, switchWeapon, throwGrenade, triggerExplosion,
    handleBulletZombieCollisions, handlePlayerZombieCollisions, handlePickupCollisions
} from './utils/combatUtils.js';
import { 
    checkCollision, triggerDamageIndicator, triggerWaveNotification, 
    loadHighScore, saveHighScore, loadUsername, saveUsername 
} from './utils/gameUtils.js';
import { createParticles, createBloodSplatter, addParticle } from './systems/ParticleSystem.js';

// Initialize HUD
const gameHUD = new GameHUD(canvas);

// Initialize Settings Panel
const settingsPanel = new SettingsPanel(canvas, settingsManager);

// Input state
const keys = {};
const mouse = { x: 0, y: 0, isDown: false };

// Initial resize
resizeCanvas(gameState.player);
window.addEventListener('resize', () => resizeCanvas(gameState.player));

function connectToMultiplayer() {
    if (gameState.multiplayer.socket) return; // Already connected
    
    gameState.multiplayer.active = true;
    
    // Initialize socket.io
    if (typeof io !== 'undefined') {
        const socket = io();
        gameState.multiplayer.socket = socket;
        
        socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            gameState.multiplayer.connected = true;
            gameState.multiplayer.playerId = socket.id;
            socket.emit('player:register', {
                name: gameState.username || `Survivor-${socket.id.slice(-4)}`
            });
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from multiplayer server');
            gameState.multiplayer.connected = false;
            gameState.multiplayer.playerId = null;
            gameState.multiplayer.players = [];
        });
        
        socket.on('lobby:update', (players) => {
            gameState.multiplayer.players = Array.isArray(players) ? players : [];
        });
        
        socket.on('connect_error', (err) => {
            console.error('Multiplayer connection error:', err.message);
            gameState.multiplayer.connected = false;
        });
    } else {
        console.error('Socket.io not found. Make sure to run the server with launch.bat');
        gameState.multiplayer.connected = false;
    }
}

function spawnZombies(count) {
    // Clear any pending zombie spawn timeouts
    gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
    gameState.zombieSpawnTimeouts = [];
    
    // Mark that we're spawning a wave
    gameState.isSpawningWave = true;
    
    // Spawn zombies with staggered timing
    for (let i = 0; i < count; i++) {
        const timeout = setTimeout(() => {
            let ZombieClass = NormalZombie; // Default
            const rand = Math.random();
            
            // Wave 3+: Introduce Fast zombies (~15% chance)
            if (gameState.wave >= 3 && rand < 0.15) {
                ZombieClass = FastZombie;
            }
            // Wave 5+: Introduce Exploding zombies (~10% chance, but only if not fast)
            else if (gameState.wave >= 5 && rand >= 0.15 && rand < 0.25) {
                ZombieClass = ExplodingZombie;
            }
            // Wave 3+: Armored zombies (chance increases with wave, but only if not fast/exploding)
            else if (gameState.wave >= 3 && rand >= 0.25) {
                const armoredChance = Math.min(0.1 + (gameState.wave - 3) * 0.03, 0.5); // 10%+ and caps at 50%
                if (Math.random() < armoredChance) {
                    ZombieClass = ArmoredZombie;
                }
            }
            
            gameState.zombies.push(new ZombieClass(canvas.width, canvas.height));
            
            // After the last zombie spawns, clear the flag
            if (i === count - 1) {
                gameState.isSpawningWave = false;
            }
        }, i * 500);
        gameState.zombieSpawnTimeouts.push(timeout);
    }
}

// Pause menu functions
function togglePause() {
    if (gameState.gameRunning && !gameHUD.gameOver) {
        if (gameState.gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function pauseGame() {
    gameState.gamePaused = true;
    gameHUD.showPauseMenu();
}

function resumeGame() {
    gameState.gamePaused = false;
    gameHUD.hidePauseMenu();
}

function performMeleeAttack() {
    const now = Date.now();
    
    // Check cooldown
    if (now - gameState.lastMeleeTime < MELEE_COOLDOWN) {
        return;
    }
    
    // Check if reloading
    if (gameState.isReloading) {
        return;
    }
    
    gameState.lastMeleeTime = now;
    
    // Create swipe animation (right to left)
    gameState.activeMeleeSwipe = {
        startTime: now,
        angle: gameState.player.angle,
        duration: MELEE_SWIPE_DURATION
    };
    
    // Play melee sound (using damage sound as placeholder)
    playDamageSound();
    
    // Check for zombies in melee range
    let hitCount = 0;
    gameState.zombies.forEach((zombie, zombieIndex) => {
        if (isInMeleeRange(zombie.x, zombie.y, gameState.player.x, gameState.player.y, gameState.player.angle)) {
            const impactAngle = Math.atan2(zombie.y - gameState.player.y, zombie.x - gameState.player.x);
            
            // Store zombie position and type before damage (for exploding zombies)
            const zombieX = zombie.x;
            const zombieY = zombie.y;
            const isExploding = zombie.type === 'exploding';
            
            // Check if zombie dies
            if (zombie.takeDamage(MELEE_DAMAGE)) {
                // Remove zombie from array first
                gameState.zombies.splice(zombieIndex, 1);
                
                // Handle exploding zombie explosion (after removal to avoid array issues)
                if (isExploding) {
                    triggerExplosion(zombieX, zombieY, 60, 30, false);
                }
                
                gameState.score += 10;
                gameState.zombiesKilled++;
                // Play kill confirmed sound (unless it was exploding zombie, explosion sound plays)
                if (!isExploding) {
                    playKillSound();
                }
                gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, MELEE_DAMAGE));
                createBloodSplatter(zombieX, zombieY, impactAngle, true);
            } else {
                gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, MELEE_DAMAGE));
                createBloodSplatter(zombie.x, zombie.y, impactAngle, false);
            }
            hitCount++;
        }
    });
    
    // Screen shake on melee (stronger if hit something)
    if (hitCount > 0) {
        gameState.shakeAmount = 5;
        createParticles(gameState.player.x, gameState.player.y, '#ffaa00', 5);
    } else {
        gameState.shakeAmount = 2; // Light shake even on miss
    }
}

function isInMeleeRange(zombieX, zombieY, playerX, playerY, playerAngle) {
    const dx = zombieX - playerX;
    const dy = zombieY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > MELEE_RANGE) return false;
    
    // Check if zombie is in front arc (120 degree arc)
    const angleToZombie = Math.atan2(dy, dx);
    const angleDiff = Math.abs(angleToZombie - playerAngle);
    const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
    
    return normalizedAngleDiff < Math.PI / 3; // 60 degrees on each side = 120 degree arc
}

function updatePlayer() {
    // Don't update player if main menu is showing
    if (gameState.showMainMenu) return;
    
    const controls = settingsManager.settings.controls;
    
    // Check if player is moving
    const isMoving = (keys[controls.moveUp] || keys['arrowup'] || keys[controls.moveDown] || keys['arrowdown'] || 
                     keys[controls.moveLeft] || keys['arrowleft'] || keys[controls.moveRight] || keys['arrowright']);
    
    // Sprint logic
    const sprintKey = controls.sprint || 'shift';
    const isSprintKeyDown = keys[sprintKey] || keys['shift']; 
    
    // Check if we can sprint (must be moving, holding key, and have stamina)
    if (isMoving && isSprintKeyDown && gameState.player.stamina > 0) {
        gameState.player.isSprinting = true;
        gameState.player.speed = PLAYER_SPRINT_SPEED;
        gameState.player.stamina = Math.max(0, gameState.player.stamina - PLAYER_STAMINA_DRAIN);
        gameState.player.lastSprintTime = Date.now();
    } else {
        gameState.player.isSprinting = false;
        gameState.player.speed = PLAYER_BASE_SPEED;
        
        // Regen stamina if not sprinting for a while
        if (Date.now() - gameState.player.lastSprintTime > PLAYER_STAMINA_REGEN_DELAY) {
            gameState.player.stamina = Math.min(PLAYER_STAMINA_MAX, gameState.player.stamina + PLAYER_STAMINA_REGEN);
        }
    }

    // Movement
    if (keys[controls.moveUp] || keys['arrowup']) gameState.player.y -= gameState.player.speed;
    if (keys[controls.moveDown] || keys['arrowdown']) gameState.player.y += gameState.player.speed;
    if (keys[controls.moveLeft] || keys['arrowleft']) gameState.player.x -= gameState.player.speed;
    if (keys[controls.moveRight] || keys['arrowright']) gameState.player.x += gameState.player.speed;

    // Bounds
    gameState.player.x = Math.max(gameState.player.radius, Math.min(canvas.width - gameState.player.radius, gameState.player.x));
    gameState.player.y = Math.max(gameState.player.radius, Math.min(canvas.height - gameState.player.radius, gameState.player.y));

    // Aim
    gameState.player.angle = Math.atan2(mouse.y - gameState.player.y, mouse.x - gameState.player.x);
    
    // Footstep sounds
    if (isMoving && gameState.gameRunning && !gameState.gamePaused) {
        const currentTime = Date.now();
        const footstepInterval = 350;
        if (currentTime - gameState.lastFootstepTime >= footstepInterval) {
            playFootstepSound();
            gameState.lastFootstepTime = currentTime;
        }
    } else {
        gameState.lastFootstepTime = 0; // Reset when not moving
    }
}

function drawPlayer() {
    const player = gameState.player;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x + 2, player.y + player.radius + 2, player.radius * 0.8, player.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 1.5);
    gradient.addColorStop(0, 'rgba(0, 136, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 136, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    const bodyGradient = ctx.createRadialGradient(player.x - 5, player.y - 5, 0, player.x, player.y, player.radius);
    bodyGradient.addColorStop(0, '#66b3ff');
    bodyGradient.addColorStop(1, '#0066cc');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Body outline
    ctx.strokeStyle = '#003d7a';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Direction indicator (gun)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    const gunX = player.x + Math.cos(player.angle) * player.radius * 1.8;
    const gunY = player.y + Math.sin(player.angle) * player.radius * 1.8;
    ctx.lineTo(gunX, gunY);
    ctx.stroke();
    
    // Gun tip
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(gunX, gunY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Stamina bar (only if not full)
    if (player.stamina < PLAYER_STAMINA_MAX) {
        const barWidth = 40;
        const barHeight = 4;
        const barX = player.x - barWidth / 2;
        const barY = player.y + player.radius + 12;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Fill
        const fillWidth = (player.stamina / PLAYER_STAMINA_MAX) * barWidth;
        ctx.fillStyle = '#00ffff'; // Cyan for stamina
        ctx.fillRect(barX, barY, fillWidth, barHeight);
    }

    // Muzzle flash
    if (gameState.muzzleFlash.active) {
        const flashSize = 8 + (gameState.muzzleFlash.intensity * 12);
        const flashOffset = -2; // Slightly in front of gun
        const flashX = gameState.muzzleFlash.x + Math.cos(gameState.muzzleFlash.angle) * flashOffset;
        const flashY = gameState.muzzleFlash.y + Math.sin(gameState.muzzleFlash.angle) * flashOffset;
        
        // Outer glow (bright white/yellow)
        const flashGradient = ctx.createRadialGradient(
            flashX, flashY, 0,
            flashX, flashY, flashSize
        );
        flashGradient.addColorStop(0, `rgba(255, 255, 255, ${gameState.muzzleFlash.intensity * 0.9})`);
        flashGradient.addColorStop(0.3, `rgba(255, 255, 200, ${gameState.muzzleFlash.intensity * 0.7})`);
        flashGradient.addColorStop(0.6, `rgba(255, 200, 0, ${gameState.muzzleFlash.intensity * 0.4})`);
        flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = flashGradient;
        ctx.beginPath();
        ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Core flash (very bright)
        const coreGradient = ctx.createRadialGradient(
            flashX, flashY, 0,
            flashX, flashY, flashSize * 0.4
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${gameState.muzzleFlash.intensity})`);
        coreGradient.addColorStop(0.5, `rgba(255, 255, 150, ${gameState.muzzleFlash.intensity * 0.8})`);
        coreGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(flashX, flashY, flashSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Spark particles (small bright dots)
        for (let i = 0; i < 4; i++) {
            const sparkAngle = gameState.muzzleFlash.angle + (Math.PI * 2 * i / 4) + Math.random() * 0.5;
            const sparkDist = flashSize * 0.6;
            const sparkX = flashX + Math.cos(sparkAngle) * sparkDist;
            const sparkY = flashY + Math.sin(sparkAngle) * sparkDist;
            
            ctx.fillStyle = `rgba(255, 255, 200, ${gameState.muzzleFlash.intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawMeleeSwipe() {
    if (!gameState.activeMeleeSwipe) return;
    
    const now = Date.now();
    const elapsed = now - gameState.activeMeleeSwipe.startTime;
    const progress = Math.min(elapsed / gameState.activeMeleeSwipe.duration, 1);
    
    // Swipe goes from right side (0.0) to left side (1.0) of player
    const startAngle = gameState.activeMeleeSwipe.angle - Math.PI / 2; // Right side
    const endAngle = gameState.activeMeleeSwipe.angle + Math.PI / 2; // Left side
    const currentAngle = startAngle + (endAngle - startAngle) * progress;
    
    // Calculate swipe position (arc from right to left)
    const swipeRadius = MELEE_RANGE;
    const swipeStartX = gameState.player.x + Math.cos(startAngle) * (gameState.player.radius + 5);
    const swipeStartY = gameState.player.y + Math.sin(startAngle) * (gameState.player.radius + 5);
    const swipeEndX = gameState.player.x + Math.cos(currentAngle) * swipeRadius;
    const swipeEndY = gameState.player.y + Math.sin(currentAngle) * swipeRadius;
    
    // Draw swipe arc
    ctx.save();
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1 - progress * 0.5; // Fade out as it completes
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    
    // Draw arc from right to current position
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, swipeRadius, startAngle, currentAngle);
    ctx.stroke();
    
    // Draw swipe trail (thick line)
    ctx.beginPath();
    ctx.moveTo(swipeStartX, swipeStartY);
    ctx.lineTo(swipeEndX, swipeEndY);
    ctx.stroke();
    
    // Draw swipe tip (glowing circle)
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(swipeEndX, swipeEndY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawCrosshair() {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (mouse.x < 0 || mouse.x > canvas.width || mouse.y < 0 || mouse.y > canvas.height) return;
    
    ctx.save();
    
    const crosshairSize = 12;
    const crosshairLineWidth = 2;
    const crosshairColor = '#ffffff';
    const crosshairOutlineColor = '#000000';
    
    const crosshairColorCurrent = gameState.isReloading ? '#888888' : crosshairColor;
    
    // Draw crosshair outline for better visibility
    ctx.strokeStyle = crosshairOutlineColor;
    ctx.lineWidth = crosshairLineWidth + 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(mouse.x - crosshairSize, mouse.y);
    ctx.lineTo(mouse.x + crosshairSize, mouse.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y - crosshairSize);
    ctx.lineTo(mouse.x, mouse.y + crosshairSize);
    ctx.stroke();
    
    // Draw crosshair main color
    ctx.strokeStyle = crosshairColorCurrent;
    ctx.lineWidth = crosshairLineWidth;
    
    ctx.beginPath();
    ctx.moveTo(mouse.x - crosshairSize, mouse.y);
    ctx.lineTo(mouse.x + crosshairSize, mouse.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y - crosshairSize);
    ctx.lineTo(mouse.x, mouse.y + crosshairSize);
    ctx.stroke();
    
    // Small central dot
    ctx.fillStyle = crosshairColorCurrent;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawWaveBreak() {
    if (!gameState.waveBreakActive) return;
    
    const remainingTime = Math.ceil((gameState.waveBreakEndTime - Date.now()) / 1000);
    if (remainingTime < 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw "Wave Cleared" or similar
    ctx.font = 'bold 40px Creepster, system-ui';
    ctx.fillStyle = '#ffc107';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText("Wave Cleared!", canvas.width / 2, canvas.height / 2 - 80);
    
    // Draw countdown
    ctx.font = '30px "Roboto Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Next wave in ${remainingTime}...`, canvas.width / 2, canvas.height / 2 - 30);
    
    // Reload hint
    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText("Reload [R] | Heal Up", canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.restore();
}

function drawWaveNotification() {
    if (!gameState.waveNotification.active) return;

    ctx.save();
    
    const alpha = Math.min(1, gameState.waveNotification.life / 30); // Fade in quickly
    const fadeOut = Math.min(1, gameState.waveNotification.life / 40); // Fade out at end
    const finalAlpha = alpha * fadeOut;

    // Background glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(255, 23, 68, ${finalAlpha * 0.6})`;
    
    // Main text
    ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
    ctx.font = 'bold 32px \"Roboto Mono\", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.waveNotification.text, canvas.width / 2, canvas.height / 2 - 40);
    
    // Subtitle
    ctx.fillStyle = `rgba(255, 200, 200, ${finalAlpha * 0.8})`;
    ctx.font = '14px \"Roboto Mono\", monospace';
    ctx.fillText('Get ready...', canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawFpsCounter() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px \"Roboto Mono\", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${gameState.fps} FPS`, canvas.width - 20, 20);
    ctx.restore();
}

function updateGame() {
    if (!gameState.gameRunning || gameState.showMainMenu || gameState.showLobby) return;

    const now = Date.now();

    // Spawn health pickups periodically
    if (now - gameState.lastHealthPickupSpawnTime >= HEALTH_PICKUP_SPAWN_INTERVAL &&
        gameState.healthPickups.length < MAX_HEALTH_PICKUPS &&
        gameState.player.health < PLAYER_MAX_HEALTH) {
        gameState.healthPickups.push(new HealthPickup(canvas.width, canvas.height));
        gameState.lastHealthPickupSpawnTime = now;
    }
    
    // Spawn ammo pickups periodically
    if (now - gameState.lastAmmoPickupSpawnTime >= AMMO_PICKUP_SPAWN_INTERVAL &&
        gameState.ammoPickups.length < MAX_AMMO_PICKUPS &&
        gameState.currentAmmo < gameState.maxAmmo * 0.5) {
        gameState.ammoPickups.push(new AmmoPickup(canvas.width, canvas.height));
        gameState.lastAmmoPickupSpawnTime = now;
    }

    // Update player
    updatePlayer();

    // Update bullets
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.update();
        return !bullet.isOffScreen(canvas.width, canvas.height);
    });

    // Update grenades
    gameState.grenades = gameState.grenades.filter(grenade => {
        grenade.update(canvas.width, canvas.height);
        return !grenade.exploded;
    });

    // Update zombies
    gameState.zombies.forEach(zombie => zombie.update(gameState.player));

    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
        if (particle.update) {
            particle.update();
        } else {
            // Handle custom particles if any remain (legacy support)
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
        }
        return particle.life > 0;
    });

    // Update shells
    gameState.shells = gameState.shells.filter(shell => {
        shell.update();
        return shell.life > 0;
    });

    // Update damage numbers
    gameState.damageNumbers = gameState.damageNumbers.filter(num => {
        num.update();
        return num.life > 0;
    });
    
    // Update damage indicator
    if (gameState.damageIndicator.active) {
        gameState.damageIndicator.intensity *= gameState.damageIndicator.decay;
        if (gameState.damageIndicator.intensity < 0.1) {
            gameState.damageIndicator.active = false;
        }
    }

    // Update muzzle flash
    if (gameState.muzzleFlash.active) {
        gameState.muzzleFlash.life--;
        gameState.muzzleFlash.intensity = gameState.muzzleFlash.life / gameState.muzzleFlash.maxLife;
        if (gameState.muzzleFlash.life <= 0) {
            gameState.muzzleFlash.active = false;
        }
    }

    // Update wave notification
    if (gameState.waveNotification.active) {
        gameState.waveNotification.life--;
        if (gameState.waveNotification.life <= 0) {
            gameState.waveNotification.active = false;
        }
    }

    // Update melee swipe animation
    if (gameState.activeMeleeSwipe) {
        const swipeElapsed = now - gameState.activeMeleeSwipe.startTime;
        if (swipeElapsed >= gameState.activeMeleeSwipe.duration) {
            gameState.activeMeleeSwipe = null;
        }
    }

    // Update reload timer
    if (gameState.isReloading) {
        if (now - gameState.reloadStartTime >= gameState.currentWeapon.reloadTime) {
            gameState.isReloading = false;
            gameState.currentAmmo = gameState.currentWeapon.maxAmmo;
        }
    }

    // Continuous firing
    if (mouse.isDown && gameState.gameRunning && !gameState.gamePaused) {
        shootBullet(mouse, canvas);
    }

    // Collisions
    handleBulletZombieCollisions();
    handlePlayerZombieCollisions();
    handlePickupCollisions();

    if (gameState.player.health <= 0) {
        gameOver();
    }

    // Check for next wave
    if (gameState.zombies.length === 0 && gameState.gameRunning && !gameState.isSpawningWave) {
        if (!gameState.waveBreakActive) {
            // Start wave break
            gameState.waveBreakActive = true;
            gameState.waveBreakEndTime = Date.now() + WAVE_BREAK_DURATION;
        } else if (Date.now() >= gameState.waveBreakEndTime) {
            // End wave break and start next wave
            gameState.waveBreakActive = false;
            gameState.wave++;
            gameState.zombiesPerWave += 2;
            triggerWaveNotification();
            spawnZombies(gameState.zombiesPerWave);
        }
    }
}

function drawGame() {
    // Draw settings panel if showing
    if (gameState.showSettingsPanel) {
        canvas.style.cursor = 'default';
        settingsPanel.draw(mouse);
        return;
    }
    
    // Draw main menu if showing
    if (gameState.showMainMenu) {
        gameHUD.mainMenu = true;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    // Draw lobby if showing
    if (gameState.showLobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    gameHUD.mainMenu = false;
    canvas.style.cursor = 'none';
    
    ctx.save();
    // Apply screen shake
    if (gameState.shakeAmount > 0.1) {
        const shakeX = (Math.random() - 0.5) * gameState.shakeAmount;
        const shakeY = (Math.random() - 0.5) * gameState.shakeAmount;
        ctx.translate(shakeX, shakeY);
        gameState.shakeAmount *= gameState.shakeDecay;
    } else {
        gameState.shakeAmount = 0;
    }
    
    // Clear canvas with dark gradient
    const maxDimension = Math.max(canvas.width, canvas.height);
    const bgGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, maxDimension / 1.5);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grassy ground pattern
    const grassPattern = initGrassPattern();
    if (grassPattern) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = grassPattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
    
    // Add subtle vignette
    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, maxDimension / 3, canvas.width / 2, canvas.height / 2, maxDimension);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw damage indicator
    if (gameState.damageIndicator.active) {
        ctx.fillStyle = `rgba(255, 0, 0, ${gameState.damageIndicator.intensity * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw particles
    gameState.particles.forEach(particle => {
        if (particle.draw) {
            particle.draw();
        } else {
            // Custom particle fallback
            const maxLife = particle.maxLife || 30;
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, particle.life / maxLife);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });

    // Draw entities
    gameState.shells.forEach(shell => shell.draw(ctx));
    gameState.bullets.forEach(bullet => bullet.draw());
    gameState.grenades.forEach(grenade => grenade.draw());
    gameState.healthPickups.forEach(pickup => pickup.draw());
    gameState.ammoPickups.forEach(pickup => pickup.draw());
    gameState.zombies.forEach(zombie => zombie.draw());

    if (gameState.activeMeleeSwipe) {
        drawMeleeSwipe();
    }

    drawPlayer();
    
    ctx.restore();

    // Draw UI elements
    gameState.damageNumbers.forEach(num => num.draw(ctx));
    drawCrosshair();
    gameHUD.draw();
    drawWaveNotification();
    drawWaveBreak();
    drawFpsCounter();
}

function gameOver() {
    gameState.gameRunning = false;
    saveHighScore();
    gameHUD.showGameOver(`You survived ${gameState.wave} waves and killed ${gameState.zombiesKilled} zombies!\nHigh Score: ${gameState.highScore} zombies`);
}

function restartGame() {
    playRestartSound();
    
    gameState.showMainMenu = true;
    gameState.gameRunning = false;
    gameState.gamePaused = false;
    gameHUD.hidePauseMenu();
    gameHUD.hideGameOver();
    
    resetGameState(canvas.width, canvas.height);
}

function startGame() {
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    gameState.showLobby = false;
    
    resetGameState(canvas.width, canvas.height);
    gameState.showMainMenu = false; // Explicitly hide menu
    
    triggerWaveNotification();
    spawnZombies(gameState.zombiesPerWave);
}

function gameLoop() {
    const now = performance.now();
    gameState.framesSinceFpsUpdate++;
    if (now - gameState.lastFpsUpdateTime >= 500) {
        gameState.fps = Math.round((gameState.framesSinceFpsUpdate * 1000) / (now - gameState.lastFpsUpdateTime));
        gameState.framesSinceFpsUpdate = 0;
        gameState.lastFpsUpdateTime = now;
    }

    if (!gameState.showMainMenu && !gameState.gamePaused && !gameState.showLobby) {
        updateGame();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    // Handle ESC key for settings panel first
    if (e.key === 'Escape') {
        if (gameState.showSettingsPanel) {
            // If we are rebinding, cancel it
            if (settingsPanel.rebindingAction) {
                settingsPanel.cancelRebind();
                return;
            }
            
            gameState.showSettingsPanel = false;
            settingsPanel.close();
            return;
        }
    }
    
    // Handle key rebinding if active
    if (gameState.showSettingsPanel && settingsPanel.rebindingAction) {
        e.preventDefault();
        settingsPanel.handleRebind(e.key);
        return;
    }
    
    // Don't process game keys if main menu is showing
    if (gameState.showMainMenu) return;
    
    // Don't process game keys if settings panel is showing
    if (gameState.showSettingsPanel) return;
    
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    // Pause/unpause on ESC key
    if (e.key === 'Escape') {
        togglePause();
    }

    const controls = settingsManager.settings.controls;

    // Weapon switching
    if (key === controls.weapon1) switchWeapon(WEAPONS.pistol);
    if (key === controls.weapon2) switchWeapon(WEAPONS.shotgun);
    if (key === controls.weapon3) switchWeapon(WEAPONS.rifle);
    
    // Actions
    if (key === controls.grenade) throwGrenade(mouse, canvas);
    if (key === controls.reload && gameState.gameRunning && !gameState.gamePaused) reloadWeapon();
    if (key === controls.melee && gameState.gameRunning && !gameState.gamePaused) performMeleeAttack();

    // Handle keys for paused/game over state
    if (gameState.gamePaused || !gameState.gameRunning) {
        if (key === controls.reload) restartGame();
        if (gameState.gamePaused && (key === 'm')) restartGame(); // M to return to menu
    }
});

document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
    
    if (gameState.showSettingsPanel) {
        settingsPanel.handleMouseMove(mouse.x, mouse.y);
    } else if (gameState.showMainMenu || gameState.showLobby) {
        gameHUD.updateMenuHover(mouse.x, mouse.y);
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    if (gameState.showSettingsPanel) {
        settingsPanel.handleClick(clickX, clickY);
        return;
    }
    
    if (gameState.showMainMenu) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'single') {
            gameState.showMainMenu = false;
            initAudio();
            startGame();
        } else if (clickedButton === 'settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
        } else if (clickedButton === 'username') {
            // Prompt for new username
            const newUsername = window.prompt('Enter your name:', gameState.username);
            if (newUsername !== null && newUsername.trim() !== '') {
                gameState.username = newUsername.trim();
                saveUsername();
            }
        } else if (clickedButton === 'multiplayer') {
            gameState.showMainMenu = false;
            gameState.showLobby = true;
            connectToMultiplayer();
        }
        return;
    }

    if (gameState.showLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'lobby_back') {
            gameState.showLobby = false;
            gameState.showMainMenu = true;
            // Optional: Disconnect from multiplayer if going back? 
            // For now we keep connection alive
        } else if (clickedButton === 'lobby_start') {
            gameState.showLobby = false;
            initAudio();
            startGame(); // Start multiplayer game (same as single for now)
        }
        return;
    }
    
    if (gameState.gameRunning && !gameState.gamePaused) {
        if (e.button === 0) {
            initAudio();
            mouse.isDown = true;
            shootBullet(mouse, canvas);
        } else if (e.button === 2) {
            performMeleeAttack();
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.isDown = false;
    if (gameState.showSettingsPanel) settingsPanel.handleMouseUp();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mouseleave', () => mouse.isDown = false);

// Initialization
loadHighScore();
loadUsername();
gameLoop();
