import {
    WEAPONS, MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, MELEE_SWIPE_DURATION,
    WAVE_BREAK_DURATION, PLAYER_MAX_HEALTH,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS,
    PLAYER_BASE_SPEED, PLAYER_SPRINT_SPEED,
    PLAYER_STAMINA_MAX, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN, PLAYER_STAMINA_REGEN_DELAY
} from './core/constants.js';
import { canvas, ctx, resizeCanvas } from './core/canvas.js';
import { gameState, resetGameState, createPlayer } from './core/gameState.js';
import { settingsManager } from './systems/SettingsManager.js';
import { initAudio, playFootstepSound, playDamageSound, playKillSound, playRestartSound, playMenuMusic, stopMenuMusic } from './systems/AudioSystem.js';
import { initGroundPattern } from './systems/GraphicsSystem.js';
import { GameHUD } from './ui/GameHUD.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie, GhostZombie, SpitterZombie } from './entities/Zombie.js';
import { AcidProjectile } from './entities/AcidProjectile.js';
import { AcidPool } from './entities/AcidPool.js';

// Make AcidProjectile and AcidPool available globally for SpitterZombie
window.AcidProjectile = AcidProjectile;
window.AcidPool = AcidPool;
import { BossZombie } from './entities/BossZombie.js';
import { HealthPickup, AmmoPickup, DamagePickup, NukePickup, SpeedPickup, RapidFirePickup, ShieldPickup } from './entities/Pickup.js';
import { DamageNumber } from './entities/Particle.js';
import {
    shootBullet, reloadWeapon, switchWeapon, throwGrenade, triggerExplosion,
    handleBulletZombieCollisions, handlePlayerZombieCollisions, handlePickupCollisions
} from './utils/combatUtils.js';
import {
    checkCollision, triggerDamageIndicator, triggerWaveNotification,
    loadHighScore, saveHighScore, loadUsername, saveUsername
} from './utils/gameUtils.js';

// Make triggerDamageIndicator available globally for AcidPool
window.triggerDamageIndicator = triggerDamageIndicator;
import { createParticles, createBloodSplatter, addParticle } from './systems/ParticleSystem.js';
import { inputSystem } from './systems/InputSystem.js';

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

function spawnBoss() {
    gameState.isSpawningWave = true;
    gameState.bossActive = true;

    // Spawn boss at top center
    const boss = new BossZombie(canvas.width / 2, -50);
    gameState.boss = boss;
    gameState.zombies.push(boss);

    triggerWaveNotification("BOSS WAVE!", 180); // Longer notification

    // Play boss sound (if we had one)
    // playBossRoar();

    gameState.isSpawningWave = false;
}

function spawnZombies(count) {
    // Clear any pending zombie spawn timeouts
    gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
    gameState.zombieSpawnTimeouts = [];

    // Check for Boss Wave (Every 5 waves)
    if (gameState.wave % 5 === 0) {
        spawnBoss();
        return;
    }

    // Mark that we're spawning a wave
    gameState.isSpawningWave = true;

    // Spawn zombies with staggered timing
    for (let i = 0; i < count; i++) {
        // Calculate spawn position (same logic as Zombie constructor)
        const side = Math.floor(Math.random() * 4);
        let spawnX, spawnY;
        switch(side) {
            case 0: spawnX = Math.random() * canvas.width; spawnY = -20; break;
            case 1: spawnX = canvas.width + 20; spawnY = Math.random() * canvas.height; break;
            case 2: spawnX = Math.random() * canvas.width; spawnY = canvas.height + 20; break;
            case 3: spawnX = -20; spawnY = Math.random() * canvas.height; break;
        }

        // Create spawn indicator 1 second before zombie spawns
        const indicatorDelay = i * 500;
        const spawnDelay = indicatorDelay + 1000; // 1 second after indicator
        
        // Create indicator with unique ID for removal
        const indicatorId = `ind_${i}_${Date.now()}_${Math.random()}`;
        setTimeout(() => {
            gameState.spawnIndicators.push({
                id: indicatorId,
                x: spawnX,
                y: spawnY,
                startTime: Date.now(),
                duration: 1000 // 1 second
            });
        }, indicatorDelay);

        // Spawn zombie after delay
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
            // Wave 4+: Introduce Ghost zombies (~10% chance)
            else if (gameState.wave >= 4 && rand >= 0.25 && rand < 0.35) {
                ZombieClass = GhostZombie;
            }
            // Wave 6+: Introduce Spitter zombies (~8% chance)
            else if (gameState.wave >= 6 && rand >= 0.35 && rand < 0.43) {
                ZombieClass = SpitterZombie;
            }
            // Wave 3+: Armored zombies (chance increases with wave, but only if not fast/exploding/ghost)
            else if (gameState.wave >= 3 && rand >= 0.35) {
                const armoredChance = Math.min(0.1 + (gameState.wave - 3) * 0.03, 0.5); // 10%+ and caps at 50%
                if (Math.random() < armoredChance) {
                    ZombieClass = ArmoredZombie;
                }
            }

            // Create zombie at the pre-determined spawn location
            // Note: Zombie constructor sets random position, so we override it
            const zombie = new ZombieClass(canvas.width, canvas.height);
            // Override with our predetermined spawn position
            zombie.x = spawnX;
            zombie.y = spawnY;
            gameState.zombies.push(zombie);

            // Remove the corresponding indicator by ID
            const indicatorIndex = gameState.spawnIndicators.findIndex(ind => ind.id === indicatorId);
            if (indicatorIndex !== -1) {
                gameState.spawnIndicators.splice(indicatorIndex, 1);
            }

            // After the last zombie spawns, clear the flag
            if (i === count - 1) {
                gameState.isSpawningWave = false;
            }
        }, spawnDelay);
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

function performMeleeAttack(player) {
    player = player || gameState.players[0];
    const now = Date.now();

    // Check cooldown
    if (now - player.lastMeleeTime < MELEE_COOLDOWN) {
        return;
    }

    // Check if reloading
    if (player.isReloading) {
        return;
    }

    player.lastMeleeTime = now;

    // Create swipe animation (right to left)
    player.activeMeleeSwipe = {
        startTime: now,
        angle: player.angle,
        duration: MELEE_SWIPE_DURATION
    };

    // Play melee sound (using damage sound as placeholder)
    playDamageSound();

    // Check for zombies in melee range
    let hitCount = 0;
    gameState.zombies.forEach((zombie, zombieIndex) => {
        if (isInMeleeRange(zombie.x, zombie.y, zombie.radius, player.x, player.y, player.angle)) {
            const impactAngle = Math.atan2(zombie.y - player.y, zombie.x - player.x);

            // Store zombie position and type before damage (for exploding zombies)
            const zombieX = zombie.x;
            const zombieY = zombie.y;
            const isExploding = zombie.type === 'exploding';

            // Check if zombie dies
            if (zombie.takeDamage(MELEE_DAMAGE)) {
                // Remove zombie from array first
                gameState.zombies.splice(zombieIndex, 1);

                // Check if boss was killed
                if (zombie.type === 'boss' || zombie === gameState.boss) {
                    gameState.bossActive = false;
                    gameState.boss = null;
                }

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
        createParticles(player.x, player.y, '#ffaa00', 5);
    } else {
        gameState.shakeAmount = 2; // Light shake even on miss
    }
}

function isInMeleeRange(zombieX, zombieY, zombieRadius, playerX, playerY, playerAngle) {
    const dx = zombieX - playerX;
    const dy = zombieY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Generous close-range check (inside the "swing" arc origin or very close)
    // If zombie is practically touching the player, they get hit regardless of angle
    const closeRangeThreshold = 30 + (zombieRadius || 12);
    if (distance < closeRangeThreshold) {
        // Check if they are somewhat in front (180 degree arc instead of 120)
        // or just hit them if they are really close
        if (distance < 25) return true; // Overlap check
    }

    if (distance > MELEE_RANGE + (zombieRadius || 0)) return false;

    // Check if zombie is in front arc (140 degree arc for wider coverage)
    const angleToZombie = Math.atan2(dy, dx);
    const angleDiff = Math.abs(angleToZombie - playerAngle);
    const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

    return normalizedAngleDiff < Math.PI * 0.4; // ~72 degrees on each side = 144 degree arc
}

function addAIPlayer() {
    if (gameState.players.length >= 4) return; // Max 4 players
    
    const colorIndex = gameState.players.length; // Use next available color
    const spawnOffset = gameState.players.length * 50; // Offset spawn position
    const aiPlayer = createPlayer(canvas.width / 2 + spawnOffset, canvas.height / 2, colorIndex);
    aiPlayer.inputSource = 'ai';
    aiPlayer.gamepadIndex = null;
    gameState.players.push(aiPlayer);
}

function updatePlayers() {
    // Don't update player if main menu is showing
    if (gameState.showMainMenu || gameState.showCoopLobby || gameState.showLobby || gameState.showAILobby) return;

    // Get shared controls settings
    const controls = settingsManager.settings.controls;

    gameState.players.forEach((player, index) => {
        if (player.health <= 0) return;

        let moveX = 0;
        let moveY = 0;
        let aimX = 0;
        let aimY = 0;
        let isSprintingInput = false;
        let target = { x: player.x + Math.cos(player.angle) * 100, y: player.y + Math.sin(player.angle) * 100 };

        // Player 1 Controls
        if (index === 0) {
            if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
                const gpState = inputSystem.getGamepad(player.gamepadIndex);
                if (gpState) {
                    moveX = gpState.axes.move.x;
                    moveY = gpState.axes.move.y;
                    if (Math.abs(gpState.axes.aim.x) > 0.1 || Math.abs(gpState.axes.aim.y) > 0.1) {
                        player.angle = Math.atan2(gpState.axes.aim.y, gpState.axes.aim.x);
                        target = {
                            x: player.x + gpState.axes.aim.x * 200,
                            y: player.y + gpState.axes.aim.y * 200
                        };
                    } else if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
                        // Aim in movement direction if no right stick
                        player.angle = Math.atan2(moveY, moveX);
                    }
                    if (gpState.buttons.sprint.pressed) isSprintingInput = true;
                }
            } else {
                // Mouse/Keyboard
                if (keys[controls.moveUp]) moveY -= 1;
                if (keys[controls.moveDown]) moveY += 1;
                if (keys[controls.moveLeft]) moveX -= 1;
                if (keys[controls.moveRight]) moveX += 1;

                const sprintKey = controls.sprint || 'shift';
                if (keys[sprintKey] || keys['shift']) isSprintingInput = true;

                target = mouse;
                player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
            }
        }
        // AI Player Controls
        if (player.inputSource === 'ai') {
            // Find nearest zombie
            let nearestZombie = null;
            let minDist = Infinity;
            
            gameState.zombies.forEach(zombie => {
                const dx = zombie.x - player.x;
                const dy = zombie.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minDist) {
                    minDist = dist;
                    nearestZombie = zombie;
                }
            });
            
            // Move away from nearest zombie
            if (nearestZombie) {
                const dx = player.x - nearestZombie.x;
                const dy = player.y - nearestZombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                
                // Normalize and move away
                moveX = (dx / dist);
                moveY = (dy / dist);
                
                // Face away from zombie
                player.angle = Math.atan2(dy, dx);
            } else {
                // No zombies nearby, move randomly or stay still
                moveX = 0;
                moveY = 0;
            }
            
            // AI doesn't sprint (moves at base speed)
            player.isSprinting = false;
            player.speed = PLAYER_BASE_SPEED;
        }
        // Player 2 Controls
        else if (index === 1) {
            if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
                const gpState = inputSystem.getGamepad(player.gamepadIndex);
                if (gpState) {
                    moveX = gpState.axes.move.x;
                    moveY = gpState.axes.move.y;
                    if (Math.abs(gpState.axes.aim.x) > 0.1 || Math.abs(gpState.axes.aim.y) > 0.1) {
                        player.angle = Math.atan2(gpState.axes.aim.y, gpState.axes.aim.x);
                        target = {
                            x: player.x + gpState.axes.aim.x * 200,
                            y: player.y + gpState.axes.aim.y * 200
                        };
                    } else if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
                        player.angle = Math.atan2(moveY, moveX);
                    }

                    if (gpState.buttons.sprint.pressed) isSprintingInput = true;
                }
            } else {
                // Keyboard Arrows
                if (keys['arrowup']) moveY -= 1;
                if (keys['arrowdown']) moveY += 1;
                if (keys['arrowleft']) moveX -= 1;
                if (keys['arrowright']) moveX += 1;

                if (keys['control'] || keys['rcontrol']) isSprintingInput = true;

                if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
                    player.angle = Math.atan2(moveY, moveX);
                }
                target = {
                    x: player.x + Math.cos(player.angle) * 200,
                    y: player.y + Math.sin(player.angle) * 200
                };
            }
        }

        // Normalize movement vector
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        if (len > 1) {
            moveX /= len;
            moveY /= len;
        }

        // Sprint Logic (with speed boost buff)
        const speedBoostMultiplier = (gameState.speedBoostEndTime > Date.now()) ? 1.5 : 1;

        if ((Math.abs(moveX) > 0 || Math.abs(moveY) > 0) && isSprintingInput && player.stamina > 0) {
            player.isSprinting = true;
            player.speed = PLAYER_SPRINT_SPEED * speedBoostMultiplier;
            player.stamina = Math.max(0, player.stamina - PLAYER_STAMINA_DRAIN);
            player.lastSprintTime = Date.now();
        } else {
            player.isSprinting = false;
            player.speed = PLAYER_BASE_SPEED * speedBoostMultiplier;
            if (Date.now() - player.lastSprintTime > PLAYER_STAMINA_REGEN_DELAY) {
                player.stamina = Math.min(player.maxStamina, player.stamina + PLAYER_STAMINA_REGEN);
            }
        }

        // Apply Position
        player.x += moveX * player.speed;
        player.y += moveY * player.speed;

        // Bounds
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

        // Footstep sounds
        if ((Math.abs(moveX) > 0 || Math.abs(moveY) > 0) && gameState.gameRunning && !gameState.gamePaused) {
            const currentTime = Date.now();
            if (currentTime - gameState.lastFootstepTime >= 350) {
                playFootstepSound();
                gameState.lastFootstepTime = currentTime;
            }
        }

        // Handle Actions (Shooting, etc.)
        // P1 Actions (if mouse) handled in event listeners mostly, but gamepad actions here
        // P2 Actions

        // Gamepad Actions (For either player if using gamepad)
        if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
            const gpState = inputSystem.getGamepad(player.gamepadIndex);
            if (gpState) {
                if (gpState.buttons.fire.pressed) shootBullet(target, canvas, player);
                if (gpState.buttons.melee.justPressed) performMeleeAttack(player);
                if (gpState.buttons.reload.justPressed) reloadWeapon(player);
                if (gpState.buttons.grenade.justPressed) throwGrenade(target, canvas, player);
                if (gpState.buttons.prevWeapon.justPressed) cycleWeapon(-1, player);
                if (gpState.buttons.nextWeapon.justPressed) cycleWeapon(1, player);
            }
        }

        // Keyboard Actions P2 (only if not AI)
        if (index === 1 && player.inputSource !== 'gamepad' && player.inputSource !== 'ai') {
            if (keys['enter']) shootBullet(target, canvas, player);
            if (keys['shift']) performMeleeAttack(player);
            if (keys[']']) reloadWeapon(player);
        }
    });
}

function updateCoopLobby() {
    if (!gameState.showCoopLobby) return;

    inputSystem.update(); // Update inputs to check for joins
    const gamepads = inputSystem.getConnectedGamepadIndices();
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    // P1 Input Source Detection
    // If P1 moves mouse or presses keys, switch to mouse and release gamepad
    const hasMouseOrKeyboardInput = mouse.isDown || Object.keys(keys).some(k => keys[k] && !['enter', ']'].includes(k));
    if (hasMouseOrKeyboardInput) {
        if (p1.inputSource === 'gamepad') {
            p1.inputSource = 'mouse';
            p1.gamepadIndex = null;
        }
    }

    // P1 Controller Assignment
    // If P1 already has a gamepad assigned, stick with it
    if (p1.gamepadIndex !== undefined && p1.gamepadIndex !== null) {
        const p1Gp = inputSystem.getGamepad(p1.gamepadIndex);
        if (!p1Gp) {
            // Gamepad disconnected, switch to mouse
            p1.inputSource = 'mouse';
            p1.gamepadIndex = null;
        } else {
            // Verify it's still active (being used)
            const isActive = Math.abs(p1Gp.axes.move.x) > 0.3 || Math.abs(p1Gp.axes.move.y) > 0.3 ||
                Math.abs(p1Gp.axes.aim.x) > 0.3 || Math.abs(p1Gp.axes.aim.y) > 0.3 ||
                p1Gp.buttons.select.pressed || p1Gp.buttons.fire.pressed;
            if (isActive && !hasMouseOrKeyboardInput) {
                p1.inputSource = 'gamepad';
            }
        }
    } else if (!hasMouseOrKeyboardInput) {
        // P1 doesn't have a gamepad yet - find first available one not used by P2
        for (const index of gamepads) {
            // Skip if this gamepad is already assigned to P2
            if (p2 && p2.gamepadIndex === index) continue;

            const gp = inputSystem.getGamepad(index);
            if (!gp) continue;

            // Check if this controller is being actively used
            const isActive = Math.abs(gp.axes.move.x) > 0.5 || Math.abs(gp.axes.move.y) > 0.5 ||
                Math.abs(gp.axes.aim.x) > 0.3 || Math.abs(gp.axes.aim.y) > 0.3 ||
                gp.buttons.select.pressed || gp.buttons.fire.pressed || gp.buttons.start?.pressed;

            if (isActive) {
                // Assign this controller to P1
                p1.inputSource = 'gamepad';
                p1.gamepadIndex = index;
                break; // Only assign one controller to P1
            }
        }
    }

    // P2 Joining Logic
    // Check for 'A'/'Start' on any gamepad NOT used by P1
    if (gameState.players.length < 2) {
        // Check gamepads for join input
        for (const index of gamepads) {
            // Skip P1's gamepad
            if (p1.gamepadIndex === index) continue;

            const gp = inputSystem.getGamepad(index);
            if (!gp) continue;

            // Check for join button press
            if (gp.buttons.select.justPressed || gp.buttons.pause?.justPressed) {
                // Create P2 and assign this gamepad (with red color)
                const newP2 = createPlayer(canvas.width / 2 + 50, canvas.height / 2, 1);
                newP2.inputSource = 'gamepad';
                newP2.gamepadIndex = index;
                gameState.players.push(newP2);
                break; // Only join with one controller
            }
        }

        // Check for Keyboard Join (Enter) - only if no gamepad was used
        if (gameState.players.length < 2 && keys['enter']) {
            const p2Keyboard = createPlayer(canvas.width / 2 + 50, canvas.height / 2, 1);
            p2Keyboard.inputSource = 'keyboard_arrow';
            p2Keyboard.gamepadIndex = null;
            gameState.players.push(p2Keyboard);
        }
    }

    // P2 Dropping out (B/Back)
    if (gameState.players.length > 1 && p2) {
        if (p2.inputSource === 'gamepad' && p2.gamepadIndex !== undefined && p2.gamepadIndex !== null) {
            const gp = inputSystem.getGamepad(p2.gamepadIndex);
            if (gp && gp.buttons.back.justPressed) {
                gameState.players.pop(); // Remove P2
            }
        }
        // Keyboard drop out
        if (p2.inputSource === 'keyboard_arrow' && keys['backspace']) {
            gameState.players.pop();
        }
    }
}

function drawPlayers() {
    gameState.players.forEach(player => {
        if (player.health <= 0) return;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(player.x + 2, player.y + player.radius + 2, player.radius * 0.8, player.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow - use player color
        const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 1.5);
        gradient.addColorStop(0, player.color.glow);
        gradient.addColorStop(1, player.color.glow.replace(/[\d.]+\)/, '0)'));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Body - use player color
        const bodyGradient = ctx.createRadialGradient(player.x - 5, player.y - 5, 0, player.x, player.y, player.radius);
        bodyGradient.addColorStop(0, player.color.light);
        bodyGradient.addColorStop(1, player.color.dark);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();

        // Body outline - use player color
        ctx.strokeStyle = player.color.outline;
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

        // Stamina bar
        if (player.stamina < PLAYER_STAMINA_MAX) {
            const barWidth = 40;
            const barHeight = 4;
            const barX = player.x - barWidth / 2;
            const barY = player.y + player.radius + 12;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const fillWidth = (player.stamina / PLAYER_STAMINA_MAX) * barWidth;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
        }

        // Muzzle flash
        if (player.muzzleFlash.active) {
            const flashSize = 8 + (player.muzzleFlash.intensity * 12);
            const flashOffset = -2;
            const flashX = player.muzzleFlash.x + Math.cos(player.muzzleFlash.angle) * flashOffset;
            const flashY = player.muzzleFlash.y + Math.sin(player.muzzleFlash.angle) * flashOffset;

            const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
            flashGradient.addColorStop(0, `rgba(255, 255, 255, ${player.muzzleFlash.intensity * 0.9})`);
            flashGradient.addColorStop(0.3, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.7})`);
            flashGradient.addColorStop(0.6, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.4})`);
            flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

            ctx.fillStyle = flashGradient;
            ctx.beginPath();
            ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Melee Swipe
        if (player.activeMeleeSwipe) {
            drawMeleeSwipe(player);
        }
    });
}

function drawMeleeSwipe(player) {
    const now = Date.now();
    const elapsed = now - player.activeMeleeSwipe.startTime;
    const progress = Math.min(elapsed / player.activeMeleeSwipe.duration, 1);

    const startAngle = player.activeMeleeSwipe.angle - Math.PI * 0.4; // Match wider arc
    const endAngle = player.activeMeleeSwipe.angle + Math.PI * 0.4;
    const currentAngle = startAngle + (endAngle - startAngle) * progress;

    const swipeRadius = MELEE_RANGE;

    ctx.save();
    
    // Create gradient for the swipe
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, swipeRadius);
    gradient.addColorStop(0, 'rgba(255, 170, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 170, 0, 0.6)');

    // Draw filled sector
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.lineTo(player.x, player.y);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw outer edge glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.stroke();

    // Draw tip spark
    const tipX = player.x + Math.cos(currentAngle) * swipeRadius;
    const tipY = player.y + Math.sin(currentAngle) * swipeRadius;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawCrosshair() {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby) return;

    // Only draw mouse crosshair if P1 is using mouse
    // If P1 is gamepad, we might rely on projected laser (already drawn as player gun direction)

    if (mouse.x < 0 || mouse.x > canvas.width || mouse.y < 0 || mouse.y > canvas.height) return;

    ctx.save();
    const crosshairSize = 12;
    const crosshairLineWidth = 2;
    const crosshairColor = '#ffffff';
    const crosshairOutlineColor = '#000000';

    const crosshairColorCurrent = gameState.player.isReloading ? '#888888' : crosshairColor;

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

    ctx.fillStyle = crosshairColorCurrent;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw hit marker (X) when hit occurs
    if (gameState.hitMarker.active) {
        const alpha = gameState.hitMarker.life / gameState.hitMarker.maxLife;
        const markerSize = 8;
        const markerColor = `rgba(255, 255, 0, ${alpha})`;
        
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Draw X
        ctx.beginPath();
        ctx.moveTo(mouse.x - markerSize, mouse.y - markerSize);
        ctx.lineTo(mouse.x + markerSize, mouse.y + markerSize);
        ctx.moveTo(mouse.x + markerSize, mouse.y - markerSize);
        ctx.lineTo(mouse.x - markerSize, mouse.y + markerSize);
        ctx.stroke();
    }

    ctx.restore();
}

function drawWaveBreak() {
    if (!gameState.waveBreakActive) return;

    const remainingTime = Math.ceil((gameState.waveBreakEndTime - Date.now()) / 1000);
    if (remainingTime < 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 40px Creepster, system-ui';
    ctx.fillStyle = '#ffc107';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText("Wave Cleared!", canvas.width / 2, canvas.height / 2 - 80);

    ctx.font = '30px "Roboto Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Next wave in ${remainingTime}...`, canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText("Reload [R] | Heal Up", canvas.width / 2, canvas.height / 2 + 20);

    ctx.restore();
}

function drawWaveNotification() {
    if (!gameState.waveNotification.active) return;

    ctx.save();
    const alpha = Math.min(1, gameState.waveNotification.life / 30);
    const fadeOut = Math.min(1, gameState.waveNotification.life / 40);
    const finalAlpha = alpha * fadeOut;

    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(255, 23, 68, ${finalAlpha * 0.6})`;

    ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
    ctx.font = 'bold 32px \"Roboto Mono\", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.waveNotification.text, canvas.width / 2, canvas.height / 2 - 40);

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
    if (!gameState.gameRunning || gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby || gameState.showAILobby) return;

    const now = Date.now();
    const activePlayers = gameState.players.filter(p => p.health > 0);
    const anyPlayerAlive = activePlayers.length > 0;

    if (!anyPlayerAlive) {
        gameOver();
        return;
    }

    // Update Day/Night Cycle
    const cycleElapsed = now - gameState.dayNightCycle.startTime;
    gameState.gameTime = (cycleElapsed % gameState.dayNightCycle.cycleDuration) / gameState.dayNightCycle.cycleDuration;
    // Night is from 0.5 to 1.0 (second half of cycle)
    gameState.isNight = gameState.gameTime >= 0.5;

    // Spawn health pickups
    if (now - gameState.lastHealthPickupSpawnTime >= HEALTH_PICKUP_SPAWN_INTERVAL &&
        gameState.healthPickups.length < MAX_HEALTH_PICKUPS) {
        // Only spawn if some player is hurt
        if (gameState.players.some(p => p.health < PLAYER_MAX_HEALTH && p.health > 0)) {
            gameState.healthPickups.push(new HealthPickup(canvas.width, canvas.height));
            gameState.lastHealthPickupSpawnTime = now;
        }
    }

    // Spawn ammo pickups
    if (now - gameState.lastAmmoPickupSpawnTime >= AMMO_PICKUP_SPAWN_INTERVAL &&
        gameState.ammoPickups.length < MAX_AMMO_PICKUPS) {
        if (gameState.players.some(p => p.currentAmmo < p.maxAmmo * 0.5 && p.health > 0)) {
            gameState.ammoPickups.push(new AmmoPickup(canvas.width, canvas.height));
            gameState.lastAmmoPickupSpawnTime = now;
        }
    }

    // Spawn powerups (Rare)
    if (now - gameState.lastPowerupSpawnTime >= 30000) { // Every 30 seconds check
        if (Math.random() < 0.6) { // 60% chance
            const rand = Math.random();

            // Distribution: Damage (20%), Nuke (8%), Speed (24%), RapidFire (24%), Shield (24%)
            if (rand < 0.20) { // Damage
                if (gameState.damagePickups.length < 1) {
                    gameState.damagePickups.push(new DamagePickup(canvas.width, canvas.height));
                }
            } else if (rand < 0.28) { // Nuke
                if (gameState.nukePickups.length < 1) {
                    gameState.nukePickups.push(new NukePickup(canvas.width, canvas.height));
                }
            } else if (rand < 0.52) { // Speed
                if (gameState.speedPickups.length < 1) {
                    gameState.speedPickups.push(new SpeedPickup(canvas.width, canvas.height));
                }
            } else if (rand < 0.76) { // RapidFire
                if (gameState.rapidFirePickups.length < 1) {
                    gameState.rapidFirePickups.push(new RapidFirePickup(canvas.width, canvas.height));
                }
            } else { // Shield
                if (gameState.shieldPickups.length < 1) {
                    gameState.shieldPickups.push(new ShieldPickup(canvas.width, canvas.height));
                }
            }
        }
        gameState.lastPowerupSpawnTime = now;
    }

    // Update players
    updatePlayers();

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

    // Update acid projectiles
    gameState.acidProjectiles = gameState.acidProjectiles.filter(projectile => {
        projectile.update();
        return !projectile.isOffScreen(canvas.width, canvas.height);
    });

    // Update acid pools
    gameState.acidPools = gameState.acidPools.filter(pool => {
        pool.update();
        return !pool.isExpired();
    });

    // Update zombies (Find target for each)
    // Apply night difficulty modifier (20% speed increase)
    const nightSpeedMultiplier = gameState.isNight ? 1.2 : 1.0;
    
    gameState.zombies.forEach(zombie => {
        // Find closest living player
        let closestPlayer = null;
        let minDist = Infinity;

        gameState.players.forEach(p => {
            if (p.health > 0) {
                const d = (p.x - zombie.x) ** 2 + (p.y - zombie.y) ** 2;
                if (d < minDist) {
                    minDist = d;
                    closestPlayer = p;
                }
            }
        });

        if (closestPlayer) {
            // Store original speed if not already stored
            if (!zombie.baseSpeed) {
                zombie.baseSpeed = zombie.speed;
            }
            // Apply night speed boost
            zombie.speed = zombie.baseSpeed * nightSpeedMultiplier;
            zombie.update(closestPlayer);
        }
    });

    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
        if (particle.update) {
            particle.update();
        } else {
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

    // Update spawn indicators
    gameState.spawnIndicators = gameState.spawnIndicators.filter(indicator => {
        const elapsed = Date.now() - indicator.startTime;
        return elapsed < indicator.duration;
    });

    // Update damage indicator (Visual only, global logic is fine but intensity depends on triggers)
    if (gameState.damageIndicator.active) {
        gameState.damageIndicator.intensity *= gameState.damageIndicator.decay;
        if (gameState.damageIndicator.intensity < 0.1) {
            gameState.damageIndicator.active = false;
        }
    }

    // Update hit marker
    if (gameState.hitMarker.active) {
        gameState.hitMarker.life--;
        if (gameState.hitMarker.life <= 0) {
            gameState.hitMarker.active = false;
        }
    }

    // Update muzzle flashes for all players
    gameState.players.forEach(p => {
        if (p.muzzleFlash.active) {
            p.muzzleFlash.life--;
            p.muzzleFlash.intensity = p.muzzleFlash.life / p.muzzleFlash.maxLife;
            if (p.muzzleFlash.life <= 0) {
                p.muzzleFlash.active = false;
            }
        }
        // Update melee swipes
        if (p.activeMeleeSwipe) {
            const swipeElapsed = now - p.activeMeleeSwipe.startTime;
            if (swipeElapsed >= p.activeMeleeSwipe.duration) {
                p.activeMeleeSwipe = null;
            }
        }
        // Update reload
        if (p.isReloading) {
            if (now - p.reloadStartTime >= p.currentWeapon.reloadTime) {
                p.isReloading = false;
                p.currentAmmo = p.currentWeapon.maxAmmo;
            }
        }
    });

    // Update wave notification
    if (gameState.waveNotification.active) {
        gameState.waveNotification.life--;
        if (gameState.waveNotification.life <= 0) {
            gameState.waveNotification.active = false;
        }
    }

    // Continuous firing (P1 Mouse)
    if (mouse.isDown && gameState.gameRunning && !gameState.gamePaused) {
        const p1 = gameState.players[0];
        if (p1 && p1.health > 0 && p1.inputSource === 'mouse') {
            shootBullet(mouse, canvas, p1);
        }
    }

    // Collisions
    handleBulletZombieCollisions();
    handlePlayerZombieCollisions();
    handlePickupCollisions();

    // Check for next wave
    if (gameState.zombies.length === 0 && gameState.gameRunning && !gameState.isSpawningWave) {
        if (!gameState.waveBreakActive) {
            gameState.waveBreakActive = true;
            gameState.waveBreakEndTime = Date.now() + WAVE_BREAK_DURATION;
        } else if (Date.now() >= gameState.waveBreakEndTime) {
            gameState.waveBreakActive = false;
            gameState.wave++;
            gameState.zombiesPerWave += 2;
            triggerWaveNotification();
            spawnZombies(gameState.zombiesPerWave);
        }
    }
}

function drawGame() {
    if (gameState.showSettingsPanel) {
        canvas.style.cursor = 'default';
        settingsPanel.draw(mouse);
        return;
    }

    if (gameState.showMainMenu) {
        gameHUD.mainMenu = true;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    if (gameState.showLobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    if (gameState.showCoopLobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    if (gameState.showAILobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    gameHUD.mainMenu = false;

    // Hide cursor if P1 is gamepad, or always hide during game (crosshair used)
    if (activeInputSource === 'gamepad') {
        canvas.style.cursor = 'none';
    } else {
        canvas.style.cursor = 'none';
    }

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

    // Background
    const maxDimension = Math.max(canvas.width, canvas.height);
    const bgGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, maxDimension / 1.5);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groundPattern = initGroundPattern();
    if (groundPattern) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = groundPattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }

    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, maxDimension / 3, canvas.width / 2, canvas.height / 2, maxDimension);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Day/Night Cycle Overlay
    // Calculate ambient light level based on gameTime
    // Day (0.0-0.5): Transparent to slightly dark
    // Night (0.5-1.0): Dark blue/black overlay
    let nightAlpha = 0;
    if (gameState.isNight) {
        // Smooth transition: 0.5 -> 0.0 alpha, 0.75 -> 0.6 alpha, 1.0 -> 0.7 alpha
        const nightProgress = (gameState.gameTime - 0.5) * 2; // 0 to 1 during night
        nightAlpha = 0.5 + (nightProgress * 0.2); // 0.5 to 0.7
    } else {
        // Dawn transition: 0.0 -> 0.0 alpha, 0.25 -> 0.3 alpha, 0.5 -> 0.0 alpha
        const dawnProgress = gameState.gameTime * 2; // 0 to 1 during day
        if (dawnProgress < 0.5) {
            nightAlpha = dawnProgress * 0.6; // 0 to 0.3
        } else {
            nightAlpha = (1 - dawnProgress) * 0.6; // 0.3 to 0
        }
    }
    
    if (nightAlpha > 0) {
        ctx.fillStyle = `rgba(10, 10, 30, ${nightAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (gameState.damageIndicator.active) {
        ctx.fillStyle = `rgba(255, 0, 0, ${gameState.damageIndicator.intensity * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    gameState.particles.forEach(particle => {
        if (particle.draw) {
            particle.draw();
        } else {
            const maxLife = particle.maxLife || 30;
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, particle.life / maxLife);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });

    // Draw spawn indicators
    gameState.spawnIndicators.forEach(indicator => {
        const elapsed = Date.now() - indicator.startTime;
        const progress = elapsed / indicator.duration;
        const pulse = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5; // Pulsing effect
        const alpha = 0.3 + pulse * 0.4; // 0.3 to 0.7 alpha
        const radius = 15 + pulse * 10; // 15 to 25 radius

        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(indicator.x, indicator.y, 0, indicator.x, indicator.y, radius);
        gradient.addColorStop(0, 'rgba(255, 23, 68, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    gameState.shells.forEach(shell => shell.draw(ctx));
    gameState.bullets.forEach(bullet => bullet.draw());
    gameState.grenades.forEach(grenade => grenade.draw());
    gameState.acidProjectiles.forEach(projectile => projectile.draw());
    gameState.acidPools.forEach(pool => pool.draw());
    gameState.healthPickups.forEach(pickup => pickup.draw());
    gameState.ammoPickups.forEach(pickup => pickup.draw());
    gameState.damagePickups.forEach(pickup => pickup.draw());
    gameState.nukePickups.forEach(pickup => pickup.draw());
    gameState.speedPickups.forEach(pickup => pickup.draw());
    gameState.rapidFirePickups.forEach(pickup => pickup.draw());
    gameState.shieldPickups.forEach(pickup => pickup.draw());
    gameState.zombies.forEach(zombie => zombie.draw());

    drawPlayers();

    ctx.restore();

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

    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    let scoreMsg = `You survived ${gameState.wave} waves!\nKilled: ${gameState.zombiesKilled}`;

    if (gameState.isCoop && p2) {
        scoreMsg = `Team survived ${gameState.wave} waves!\nTotal Kills: ${gameState.zombiesKilled}`;
    }

    gameHUD.showGameOver(scoreMsg);
}

function restartGame() {
    playRestartSound();
    playMenuMusic();
    gameState.showMainMenu = true;
    gameState.gameRunning = false;
    gameState.gamePaused = false;
    gameState.showCoopLobby = false;
    gameState.showLobby = false;
    gameState.showAILobby = false;
    gameHUD.hidePauseMenu();
    gameHUD.hideGameOver();
    resetGameState(canvas.width, canvas.height);
}

function startGame() {
    stopMenuMusic();
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    gameState.showLobby = false;
    gameState.showCoopLobby = false;
    gameState.showAILobby = false;

    // Do NOT reset players here for coop, we want to keep the lobby configuration
    if (!gameState.isCoop) {
        resetGameState(canvas.width, canvas.height);
    } else {
        // Just reset game objects, keep players
        gameState.score = 0;
        gameState.wave = 1;
        gameState.zombiesKilled = 0;
        gameState.bullets = [];
        gameState.zombies = [];
        gameState.particles = [];
        gameState.healthPickups = [];
        gameState.ammoPickups = [];
        gameState.damagePickups = [];
        gameState.nukePickups = [];
        gameState.grenades = [];
        gameState.acidProjectiles = [];
        gameState.acidPools = [];

        // Reset all players (including AI)
        gameState.players.forEach((p, index) => {
            p.health = PLAYER_MAX_HEALTH;
            p.stamina = PLAYER_STAMINA_MAX;
            // Spawn players with slight offset to avoid overlap
            p.x = canvas.width / 2 + (index * 50);
            p.y = canvas.height / 2;
        });
    }

    gameState.showMainMenu = false;

    triggerWaveNotification();
    spawnZombies(gameState.zombiesPerWave);
}

function cycleWeapon(direction, player) {
    player = player || gameState.players[0];
    const weaponKeys = Object.keys(WEAPONS);
    let currentIndex = weaponKeys.findIndex(key => WEAPONS[key] === player.currentWeapon);

    if (currentIndex === -1) currentIndex = 0;

    let newIndex = currentIndex + direction;
    if (newIndex >= weaponKeys.length) newIndex = 0;
    if (newIndex < 0) newIndex = weaponKeys.length - 1;

    switchWeapon(WEAPONS[weaponKeys[newIndex]], player);
}

let activeInputSource = 'mouse';

function gameLoop() {
    const now = performance.now();
    gameState.framesSinceFpsUpdate++;
    if (now - gameState.lastFpsUpdateTime >= 500) {
        gameState.fps = Math.round((gameState.framesSinceFpsUpdate * 1000) / (now - gameState.lastFpsUpdateTime));
        gameState.framesSinceFpsUpdate = 0;
        gameState.lastFpsUpdateTime = now;
    }

    if (gameState.showCoopLobby) {
        updateCoopLobby();
        gameHUD.draw(); // Draw lobby
    }
    else if (!gameState.showMainMenu && !gameState.gamePaused && !gameState.showLobby && !gameState.showAILobby) {
        updateGame();
        drawGame(); // Only draw game if not in lobby
    }
    // Only draw game if not in lobbies/main menu (drawGame handles mainmenu/lobby drawing internally too but structured oddly)
    // Let's rely on drawGame() for everything except pure lobby updates
    else if (gameState.showMainMenu || gameState.showLobby || gameState.showAILobby) {
        drawGame();
    }
    // If paused
    else if (gameState.gamePaused) {
        drawGame();
    }

    // Update Input
    inputSystem.update(settingsManager.settings.gamepad);

    // Check for Gamepad Actions (Mostly P1 if we allow it, or Global Menus)
    if (inputSystem.isConnected() && !gameState.showSettingsPanel && !gameState.showMainMenu && !gameState.showLobby && !gameState.showCoopLobby && !gameState.showAILobby && gameState.gameRunning) {

        const p1 = gameState.players[0];

        // If P1 uses gamepad
        if (p1 && p1.inputSource !== 'mouse') {
            activeInputSource = 'gamepad';
            // Use stored index if available, else 0
            const gpIndex = p1.gamepadIndex !== undefined && p1.gamepadIndex !== null ? p1.gamepadIndex : 0;
            const gpState = inputSystem.getGamepad(gpIndex);

            if (!gameState.gamePaused && gpState) {
                if (gpState.buttons.reload.justPressed) reloadWeapon(p1);
                if (gpState.buttons.grenade.justPressed) {
                    const gpAim = gpState.axes.aim;
                    let target = {
                        x: p1.x + gpAim.x * 300,
                        y: p1.y + gpAim.y * 300
                    };
                    throwGrenade(target, canvas, p1);
                }
                if (gpState.buttons.prevWeapon.justPressed) cycleWeapon(-1, p1);
                if (gpState.buttons.nextWeapon.justPressed) cycleWeapon(1, p1);
                if (gpState.buttons.melee.justPressed) performMeleeAttack(p1);
                if (gpState.buttons.fire.pressed) {
                    const gpAim = gpState.axes.aim;
                    let target = {
                        x: p1.x + gpAim.x * 200,
                        y: p1.y + gpAim.y * 200
                    };
                    shootBullet(target, canvas, p1);
                }
                if (gpState.buttons.pause.justPressed) togglePause();
            }
        }

        // Pause handling for P2 too?
        // Iterate all players to check for pause?
        // For now just global pause from any gamepad is fine
        const gpState = inputSystem.getAnyGamepad();
        if (gpState && gpState.buttons.pause.justPressed && gameState.gameRunning) {
            togglePause();
        }
    }

    // Pause Menu Navigation
    if (gameState.gamePaused) {
        const gpState = inputSystem.getAnyGamepad();
        if (gpState) {
            if (gpState.buttons.pause.justPressed) resumeGame();
            if (gpState.buttons.reload.justPressed) restartGame();
        }
    }

    // drawGame(); // Removed duplicate call
    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    activeInputSource = 'mouse';

    if (e.key === 'Escape') {
        if (gameState.showSettingsPanel) {
            if (settingsPanel.rebindingAction) {
                settingsPanel.cancelRebind();
                return;
            }
            gameState.showSettingsPanel = false;
            settingsPanel.close();
            return;
        }
    }

    if (gameState.showSettingsPanel && settingsPanel.rebindingAction) {
        e.preventDefault();
        settingsPanel.handleRebind(e.key);
        return;
    }

    if (gameState.showMainMenu) return;
    if (gameState.showSettingsPanel) return;

    const key = e.key.toLowerCase();
    keys[key] = true;

    if (e.key === 'Escape') {
        togglePause();
    }

    const controls = settingsManager.settings.controls;
    const p1 = gameState.players[0]; // P1 uses Keyboard

    // Weapon switching
    if (key === controls.weapon1 && p1) switchWeapon(WEAPONS.pistol, p1);
    if (key === controls.weapon2 && p1) switchWeapon(WEAPONS.shotgun, p1);
    if (key === controls.weapon3 && p1) switchWeapon(WEAPONS.rifle, p1);
    if (key === controls.weapon4 && p1) switchWeapon(WEAPONS.flamethrower, p1);

    // Actions
    if (key === controls.grenade && p1) throwGrenade(mouse, canvas, p1);
    if (key === controls.reload && gameState.gameRunning && !gameState.gamePaused && p1) reloadWeapon(p1);
    if (key === controls.melee && gameState.gameRunning && !gameState.gamePaused && p1) performMeleeAttack(p1);

    if (gameState.gamePaused || !gameState.gameRunning) {
        if (key === controls.reload) restartGame();
        if (gameState.gamePaused && (key === 'm')) restartGame();
    }
});

document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Helper function to get accurate mouse coordinates accounting for canvas scaling
function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();

    // Calculate scale factors between internal canvas resolution and displayed size
    // This accounts for RENDER_SCALE and any CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get mouse position relative to canvas element
    // rect.left/top account for any CSS positioning, borders, or padding
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
}

canvas.addEventListener('mousemove', (e) => {
    activeInputSource = 'mouse';

    const pos = getCanvasMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;

    if (gameState.showSettingsPanel) {
        settingsPanel.handleMouseMove(mouse.x, mouse.y);
    } else if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby || gameState.showAILobby) {
        gameHUD.updateMenuHover(mouse.x, mouse.y);
    }
});

canvas.addEventListener('mousedown', (e) => {
    activeInputSource = 'mouse';

    const pos = getCanvasMousePos(e);
    const clickX = pos.x;
    const clickY = pos.y;

    if (gameState.showSettingsPanel) {
        settingsPanel.handleClick(clickX, clickY);
        return;
    }

    // Main Menu
    if (gameState.showMainMenu) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);

        // Try to start menu music on first interaction if it's not playing
        initAudio();
        playMenuMusic();

        if (clickedButton === 'single') {
            gameState.isCoop = false;
            startGame();
        } else if (clickedButton === 'local_coop') {
            gameState.showMainMenu = false;
            gameState.showCoopLobby = true;
            // Reset to P1
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'play_ai') {
            gameState.showMainMenu = false;
            gameState.showAILobby = true;
            gameState.isCoop = false;
            // Reset to P1 only
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
        } else if (clickedButton === 'username') {
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

    // Multiplayer Lobby
    if (gameState.showLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'lobby_back') {
            gameState.showLobby = false;
            gameState.showMainMenu = true;
            playMenuMusic();
        } else if (clickedButton === 'lobby_start') {
            gameState.isCoop = false;
            initAudio();
            startGame();
        }
        return;
    }

    // AI Lobby
    if (gameState.showAILobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'ai_back') {
            gameState.showAILobby = false;
            gameState.showMainMenu = true;
            // Remove all AI players when leaving lobby
            gameState.players = [gameState.players[0]];
            playMenuMusic();
        } else if (clickedButton === 'ai_add') {
            addAIPlayer();
        } else if (clickedButton === 'ai_start') {
            // Start game with AI
            gameState.showAILobby = false;
            gameState.isCoop = true; // Enable multi-player logic
            initAudio();
            startGame();
        }
        return;
    }

    // Coop Lobby
    if (gameState.showCoopLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'coop_back') {
            gameState.showCoopLobby = false;
            gameState.showMainMenu = true;
            playMenuMusic();
        } else if (clickedButton === 'coop_start') {
            // Start coop game
            gameState.showCoopLobby = false;
            gameState.isCoop = true;
            initAudio();
            startGame();
        }
        return;
    }

    if (gameState.gameRunning && !gameState.gamePaused) {
        if (e.button === 0) {
            initAudio();
            mouse.isDown = true;
            // Handled in updateGame loop
        } else if (e.button === 2) {
            const p1 = gameState.players[0];
            if (p1) performMeleeAttack(p1);
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
