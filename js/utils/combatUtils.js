import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { Quadtree } from './Quadtree.js';
import {
    WEAPONS, GRENADE_COOLDOWN, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS, PLAYER_MAX_HEALTH, HEALTH_PICKUP_HEAL_AMOUNT,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS, AMMO_PICKUP_AMOUNT, MAX_GRENADES
} from '../core/constants.js';
import { playGunshotSound, playKillSound, playDamageSound, playExplosionSound } from '../systems/AudioSystem.js';
import { createExplosion, createBloodSplatter, createParticles, addParticle } from '../systems/ParticleSystem.js';
import { triggerMuzzleFlash, triggerDamageIndicator, checkCollision, triggerWaveNotification } from './gameUtils.js';
import { Bullet, FlameBullet } from '../entities/Bullet.js';
import { Shell } from '../entities/Shell.js';
import { Grenade } from '../entities/Grenade.js';
import { DamageNumber } from '../entities/Particle.js';
import { settingsManager } from '../systems/SettingsManager.js';

export function shootBullet(target, canvas, player) {
    // Fallback to p1 for backward compat if player not provided
    player = player || gameState.players[0];

    const now = Date.now();

    // Check if reloading
    if (player.isReloading) {
        if (now - player.reloadStartTime >= player.currentWeapon.reloadTime) {
            player.isReloading = false;
            player.currentAmmo = player.currentWeapon.maxAmmo;
            // Update weapon state with reloaded ammo
            const weaponKeys = Object.keys(WEAPONS);
            const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);
            if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
                player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
            }
        } else {
            return; // Still reloading
        }
    }

    // Check fire rate cooldown (with rapid fire buff)
    const fireRateMultiplier = (gameState.rapidFireEndTime > now) ? 0.5 : 1;
    if (now - player.lastShotTime < player.currentWeapon.fireRate * fireRateMultiplier) {
        return;
    }

    // Check ammo
    if (player.currentAmmo <= 0) {
        reloadWeapon(player);
        return;
    }

    // Calculate damage multiplier
    const damageMult = (gameState.damageBuffEndTime > now) ? 2 : 1;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const gunX = player.x + Math.cos(angle) * player.radius * 1.8;
    const gunY = player.y + Math.sin(angle) * player.radius * 1.8;

    // Create bullets based on weapon type
    if (player.currentWeapon === WEAPONS.shotgun) {
        // Shotgun fires 5 spread bullets
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5; // Add spread
            const bullet = new Bullet(gunX, gunY, spreadAngle, player.currentWeapon);
            bullet.damage *= damageMult;
            gameState.bullets.push(bullet);
        }
    } else if (player.currentWeapon === WEAPONS.flamethrower) {
        // Flamethrower fires multiple flame particles with spread
        const flameCount = 3; // Fire 3 flame particles per shot
        for (let i = 0; i < flameCount; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.4; // Wider spread
            const flame = new FlameBullet(gunX, gunY, spreadAngle, player.currentWeapon);
            flame.damage *= damageMult;
            gameState.bullets.push(flame);
        }
    } else {
        // Pistol and rifle fire single bullet
        const bullet = new Bullet(gunX, gunY, angle, player.currentWeapon);
        bullet.damage *= damageMult;
        gameState.bullets.push(bullet);
    }

    // Consume ammo
    player.currentAmmo--;

    // Auto-reload if ammo is empty after this shot
    if (player.currentAmmo === 0) {
        reloadWeapon(player);
    }

    // Update last shot time
    player.lastShotTime = now;

    // Add screen shake on shoot (global effect, maybe reduce if P2 shoots?)
    gameState.shakeAmount = 3;

    // Trigger muzzle flash on THIS player
    // Refactored triggerMuzzleFlash to handle player object directly if needed, 
    // or we just set properties here manually since triggerMuzzleFlash might be hardcoded to global state.
    // Let's inline the muzzle flash logic or update triggerMuzzleFlash.
    // Since triggerMuzzleFlash is imported from gameUtils, let's just update the player's state directly.
    player.muzzleFlash.active = true;
    player.muzzleFlash.x = gunX;
    player.muzzleFlash.y = gunY;
    player.muzzleFlash.angle = angle;
    player.muzzleFlash.life = player.muzzleFlash.maxLife;
    player.muzzleFlash.intensity = 1;

    // Create shell casing
    gameState.shells.push(new Shell(gunX, gunY, angle));

    // Play gunshot sound
    playGunshotSound();
}

export function reloadWeapon(player) {
    player = player || gameState.players[0];
    if (!player.isReloading && player.currentAmmo < player.currentWeapon.maxAmmo) {
        player.isReloading = true;
        player.reloadStartTime = Date.now();
        // Play reload sound if implemented
    }
}

export function switchWeapon(weapon, player) {
    player = player || gameState.players[0];
    if (weapon !== player.currentWeapon) {
        const now = Date.now();
        
        // Find the current weapon key to save its state
        const weaponKeys = Object.keys(WEAPONS);
        const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);
        
        // Save current weapon's ammo state before switching
        if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
            player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
            player.weaponStates[currentWeaponKey].lastHolsteredTime = now;
        }
        
        // Find the new weapon key
        const newWeaponKey = weaponKeys.find(key => WEAPONS[key] === weapon);
        
        // Switch to new weapon
        player.currentWeapon = weapon;
        player.maxAmmo = player.currentWeapon.maxAmmo;
        player.lastShotTime = 0; // Reset fire rate cooldown
        player.isReloading = false; // Cancel any ongoing reload
        
        // Check if the new weapon was holstered long enough for background reload
        if (newWeaponKey && player.weaponStates[newWeaponKey]) {
            const weaponState = player.weaponStates[newWeaponKey];
            const timeHolstered = now - weaponState.lastHolsteredTime;
            
            // If weapon was holstered for longer than reload time, it auto-reloaded
            if (timeHolstered >= weapon.reloadTime && weaponState.lastHolsteredTime > 0) {
                player.currentAmmo = weapon.maxAmmo;
            } else {
                // Restore saved ammo state
                player.currentAmmo = weaponState.ammo;
            }
        } else {
            // Fallback: initialize with weapon's default ammo
            player.currentAmmo = weapon.ammo;
        }
    }
}

export function throwGrenade(target, canvas, player) {
    player = player || gameState.players[0];
    const now = Date.now();

    // Check cooldown
    if (now - player.lastGrenadeThrowTime < GRENADE_COOLDOWN) {
        return;
    }

    // Check grenade count
    if (player.grenadeCount <= 0) {
        return;
    }

    // Calculate throw position (from player)
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const throwX = player.x + Math.cos(angle) * player.radius * 1.5;
    const throwY = player.y + Math.sin(angle) * player.radius * 1.5;

    // Target is where the cursor/aim is
    const targetX = Math.max(20, Math.min(canvas.width - 20, target.x));
    const targetY = Math.max(20, Math.min(canvas.height - 20, target.y));

    gameState.grenades.push(new Grenade(throwX, throwY, targetX, targetY));
    player.grenadeCount--;
    player.lastGrenadeThrowTime = now;

    // Small screen shake on throw
    gameState.shakeAmount = 2;
}

export function triggerExplosion(x, y, radius, damage, sourceIsPlayer = true) {
    // Create explosion visual effect
    createExplosion(x, y);

    // Screen shake
    gameState.shakeAmount = 15;

    // AOE damage to zombies
    gameState.zombies.forEach((zombie, zombieIndex) => {
        const dx = zombie.x - x;
        const dy = zombie.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
            // Damage decreases with distance
            const damageMultiplier = 1 - (distance / radius) * 0.5; // 50% to 100% damage
            const finalDamage = Math.floor(damage * damageMultiplier);

            if (zombie.takeDamage(finalDamage)) {
                gameState.zombies.splice(zombieIndex, 1);

                // Check if boss was killed
                if (zombie.type === 'boss' || zombie === gameState.boss) {
                    gameState.bossActive = false;
                    gameState.boss = null;
                }

                gameState.score += 10;
                gameState.zombiesKilled++;
                // Play kill confirmed sound
                playKillSound();
                createBloodSplatter(zombie.x, zombie.y, Math.atan2(dy, dx), true);
            } else {
                createBloodSplatter(zombie.x, zombie.y, Math.atan2(dy, dx), false);
            }
        }
    });

    // Player damage if explosion is not from player (e.g., exploding zombie)
    if (!sourceIsPlayer) {
        gameState.players.forEach(player => {
            if (player.health <= 0) return;

            const dx = player.x - x;
            const dy = player.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                const damageMultiplier = 1 - (distance / radius) * 0.5;
                const playerDamage = Math.floor(damage * damageMultiplier * 0.5); // Player takes 50% of explosion damage
                player.health -= playerDamage;
                createParticles(player.x, player.y, '#ff0000', 5);

                if (player === gameState.players[0]) { // Only trigger indicator for local player 1 primarily, or logic?
                    triggerDamageIndicator();
                }
                playDamageSound();
            }
        });
        if (gameState.shakeAmount < 12) gameState.shakeAmount = 12;
    }

    // Play explosion sound
    playExplosionSound();
}

// Collision handlers
export function handleBulletZombieCollisions() {
    // Initialize Quadtree for spatial partitioning
    // Capacity 4 per node seems reasonable for zombies
    const qt = new Quadtree({ x: 0, y: 0, width: canvas.width, height: canvas.height }, 4);
    
    // Insert all zombies into Quadtree
    gameState.zombies.forEach(zombie => qt.insert(zombie));

    gameState.bullets.forEach((bullet, bulletIndex) => {
        // Define query range for the bullet (using a safe bounding box)
        const range = {
            x: bullet.x - 20, // Arbitrary padding around bullet
            y: bullet.y - 20,
            width: 40,
            height: 40
        };

        // Query potential collisions
        const candidates = qt.query(range);

        candidates.forEach(zombie => {
            // Verify the zombie is still alive (might have been killed by another bullet in this same frame)
            // Although candidates are references to objects in gameState.zombies, 
            // if we splice from gameState.zombies, the reference is still valid but we need to ensure
            // we don't process a dead zombie if we handle death by setting health <= 0 before splicing.
            // However, we splice immediately. 
            // Problem: If a bullet kills a zombie, it's removed from gameState.zombies. 
            // But it's still in the local `candidates` list for *other* bullets?
            // No, we are inside the bullet loop. 
            // If bullet A kills zombie Z, zombie Z is removed from gameState.zombies.
            // But logic uses references. 
            
            // We need to check if zombie is still in gameState.zombies to be safe, 
            // or just check health > 0.
            if (zombie.health <= 0) return;

            // Also checking if bullet is still active (it might have hit another zombie in spread?)
            // The bullet loop continues? No, we usually splice bullet on impact.
            if (bullet.hit) return; // Add a hit flag if we want to stop processing this bullet

            const zombieIndex = gameState.zombies.indexOf(zombie);
            if (zombieIndex === -1) return; // Already removed

            if (checkCollision(bullet, zombie)) {
                // Mark bullet as hit to prevent multiple collisions if it's not piercing
                // (Flamethrower is piercing-ish, handled separately)
                if (bullet.type !== 'flame') bullet.hit = true;

                // Get bullet angle for directional blood splatter
                const impactAngle = Math.atan2(bullet.vy, bullet.vx);

                // Store zombie position and type before damage (for exploding zombies)
                const zombieX = zombie.x;
                const zombieY = zombie.y;
                const isExploding = zombie.type === 'exploding';

                // Handle flame bullets (apply burn effect)
                if (bullet.type === 'flame') {
                    // Apply burn timer (3 seconds) and burn damage
                    zombie.burnTimer = 3000; // 3 seconds
                    zombie.burnDamage = bullet.damage * 2; // Double damage over time
                    // Also apply instant damage
                    if (zombie.takeDamage(bullet.damage)) {
                        // Zombie dies from flame hit
                        // const zombieX = zombie.x; // Already stored
                        // const zombieY = zombie.y;
                        gameState.zombies.splice(zombieIndex, 1);
                        
                        if (zombie.type === 'boss' || zombie === gameState.boss) {
                            gameState.bossActive = false;
                            gameState.boss = null;
                        }
                        
                        gameState.score += 10;
                        gameState.zombiesKilled++;
                        
                        const now = Date.now();
                        if (now - gameState.lastKillTime < 1500) {
                            gameState.killStreak++;
                        } else {
                            gameState.killStreak = 1;
                        }
                        gameState.lastKillTime = now;
                        
                        if (gameState.killStreak > 2) {
                            let comboText = `${gameState.killStreak} HIT COMBO!`;
                            if (gameState.killStreak % 5 === 0) comboText = `${gameState.killStreak} KILL RAMPAGE!`;
                            if (gameState.killStreak >= 10) comboText = "UNSTOPPABLE!";
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY - 30, comboText));
                        }
                        
                        playKillSound();
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, Math.floor(bullet.damage)));
                        createBloodSplatter(zombieX, zombieY, impactAngle, true);
                    } else {
                        // Zombie survives but is burning
                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
                        createBloodSplatter(zombie.x, zombie.y, impactAngle, false);
                        
                        // Trigger hit marker
                        gameState.hitMarker.active = true;
                        gameState.hitMarker.life = gameState.hitMarker.maxLife;
                    }
                    // Don't destroy flame bullets immediately? 
                    // Original code: gameState.bullets.splice(bulletIndex, 1);
                    // But wait, flame passes through?
                    // The original code spliced it. So it's not piercing multiple enemies in one frame easily 
                    // unless we structured it differently.
                    // Let's keep original behavior: remove bullet.
                    // But we are in a forEach loop for bullets. Splicing inside forEach is dangerous in JS 
                    // if we don't handle index shifts.
                    // The outer loop is `gameState.bullets.forEach`. 
                    // If we splice `bulletIndex`, the next element is skipped.
                    // The original code had this bug!
                    // "gameState.bullets.splice(bulletIndex, 1);" inside forEach.
                    
                    // Better approach: mark for removal and filter later, or loop backwards.
                    // For now, I'll stick to the original logic but acknowledge the flaw, 
                    // or fix it by marking `bullet.markedForRemoval = true` and filtering after.
                    bullet.markedForRemoval = true;
                    return; 
                }

                // Critical hit chance (10%)
                const isCrit = Math.random() < 0.1;
                let finalDamage = bullet.damage;
                if (isCrit) {
                    finalDamage = bullet.damage * 2; // 2x damage on crit
                }

                // Check if zombie dies from this hit
                if (zombie.takeDamage(finalDamage)) {
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

                    // Kill Streak Logic
                    const now = Date.now();
                    if (now - gameState.lastKillTime < 1500) {
                        gameState.killStreak++;
                    } else {
                        gameState.killStreak = 1;
                    }
                    gameState.lastKillTime = now;

                    if (gameState.killStreak > 2) {
                        let comboText = `${gameState.killStreak} HIT COMBO!`;
                        if (gameState.killStreak % 5 === 0) comboText = `${gameState.killStreak} KILL RAMPAGE!`;
                        if (gameState.killStreak >= 10) comboText = "UNSTOPPABLE!";

                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY - 30, comboText));
                    }

                    // Play kill confirmed sound (unless it was exploding zombie, explosion sound plays)
                    if (!isExploding) {
                        playKillSound();
                    }
                    // Create floating damage number (with crit styling if crit)
                    if (isCrit) {
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, Math.floor(finalDamage), true));
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY - 25, "CRIT!", true));
                    } else {
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, Math.floor(finalDamage)));
                    }
                    // Create blood splatter on kill
                    createBloodSplatter(zombieX, zombieY, impactAngle, true);
                } else {
                    // Create floating damage number (with crit styling if crit)
                    if (isCrit) {
                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, Math.floor(finalDamage), true));
                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y - 25, "CRIT!", true));
                    } else {
                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
                    }
                    // Create blood splatter on hit (not kill)
                    createBloodSplatter(zombie.x, zombie.y, impactAngle, false);

                    // --- START: Apply Slow-on-Hit ---
                    if (zombie.originalSpeed === undefined) {
                        zombie.originalSpeed = zombie.speed;
                    }
                    zombie.speed = zombie.originalSpeed * 0.70; // 30% slow
                    zombie.slowedUntil = Date.now() + 500; // for 0.5 seconds
                    // --- END: Apply Slow-on-Hit ---
                }
                
                // Trigger hit marker
                gameState.hitMarker.active = true;
                gameState.hitMarker.life = gameState.hitMarker.maxLife;
                
                bullet.markedForRemoval = true;
            }
        });
    });

    // Remove marked bullets
    // We need to filter the main array
    // Since we can't easily replace the array in place if it's const (it's not, it's a prop of gameState), 
    // we can do:
    gameState.bullets = gameState.bullets.filter(b => !b.markedForRemoval);
}

export function handlePlayerZombieCollisions() {
    gameState.players.forEach(player => {
        if (player.health <= 0) return;

        gameState.zombies.forEach(zombie => {
            if (checkCollision(player, zombie)) {
                const damage = 0.5;

                // Apply damage to shield first, then health
                if (player.shield > 0) {
                    player.shield -= damage;
                    if (player.shield < 0) {
                        player.health += player.shield; // Apply overflow damage to health
                        player.shield = 0;
                    }
                    createParticles(player.x, player.y, '#03a9f4', 3); // Blue for shield hit
                } else {
                    player.health -= damage;
                    createParticles(player.x, player.y, '#ff0000', 3); // Red for health hit
                }

                if (player === gameState.players[0]) {
                    // Add screen shake on damage (mostly for P1 or global)
                    gameState.shakeAmount = 8;
                    triggerDamageIndicator();
                }
                playDamageSound();
            }
        });
    });
}

export function handlePickupCollisions() {
    const showFloatingText = settingsManager.getSetting('video', 'floatingText') !== false;

    // Check player-health pickup collisions
    if (gameState.healthPickups.length > 0) {
        gameState.healthPickups = gameState.healthPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (player.health < PLAYER_MAX_HEALTH && checkCollision(player, pickup)) {
                    player.health = Math.min(
                        PLAYER_MAX_HEALTH,
                        player.health + HEALTH_PICKUP_HEAL_AMOUNT
                    );
                    createParticles(pickup.x, pickup.y, '#ff1744', 8);
                    if (showFloatingText) {
                        gameState.damageNumbers.push(new DamageNumber(pickup.x, pickup.y - 20, `+${HEALTH_PICKUP_HEAL_AMOUNT} HP`, false, '#ff1744'));
                    }
                    collected = true;
                    break; // Only one player picks it up
                }
            }
            return !collected;
        });
    }

    // Check player-ammo pickup collisions
    if (gameState.ammoPickups.length > 0) {
        gameState.ammoPickups = gameState.ammoPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if ((player.currentAmmo < player.maxAmmo || player.grenadeCount < MAX_GRENADES) && checkCollision(player, pickup)) {
                    // Restore ammo for current weapon
                    player.currentAmmo = Math.min(player.maxAmmo, player.currentAmmo + AMMO_PICKUP_AMOUNT);
                    // Also refill grenades
                    player.grenadeCount = MAX_GRENADES;
                    createParticles(pickup.x, pickup.y, '#ff9800', 8);
                    if (showFloatingText) {
                        gameState.damageNumbers.push(new DamageNumber(pickup.x, pickup.y - 20, `+${AMMO_PICKUP_AMOUNT} AMMO`, false, '#00ffff'));
                    }
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check damage pickup collisions
    if (gameState.damagePickups.length > 0) {
        gameState.damagePickups = gameState.damagePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.damageBuffEndTime = Date.now() + 10000; // 10 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "DOUBLE DAMAGE!"));
                    createParticles(pickup.x, pickup.y, '#9c27b0', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check nuke pickup collisions
    if (gameState.nukePickups.length > 0) {
        gameState.nukePickups = gameState.nukePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    triggerNuke(pickup.x, pickup.y);
                    createParticles(pickup.x, pickup.y, '#ffeb3b', 20);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check speed pickup collisions
    if (gameState.speedPickups.length > 0) {
        gameState.speedPickups = gameState.speedPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.speedBoostEndTime = Date.now() + 8000; // 8 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "SPEED BOOST!"));
                    createParticles(pickup.x, pickup.y, '#00bcd4', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check rapid fire pickup collisions
    if (gameState.rapidFirePickups.length > 0) {
        gameState.rapidFirePickups = gameState.rapidFirePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.rapidFireEndTime = Date.now() + 10000; // 10 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "RAPID FIRE!"));
                    createParticles(pickup.x, pickup.y, '#ff9800', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check shield pickup collisions
    if (gameState.shieldPickups.length > 0) {
        gameState.shieldPickups = gameState.shieldPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    player.shield = Math.min(player.maxShield, player.shield + 50);
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "+50 SHIELD!"));
                    createParticles(pickup.x, pickup.y, '#03a9f4', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }
}

function triggerNuke(x, y) {
    gameState.shakeAmount = 30;
    gameState.damageNumbers.push(new DamageNumber(x, y - 50, "TACTICAL NUKE!"));

    // Flash effect (simulated by white particles everywhere or just screen flash handled in draw)
    // We'll just kill everyone

    // Iterate backwards to safely remove
    for (let i = gameState.zombies.length - 1; i >= 0; i--) {
        const zombie = gameState.zombies[i];

        // Check if boss is being nuked
        if (zombie.type === 'boss' || zombie === gameState.boss) {
            gameState.bossActive = false;
            gameState.boss = null;
        }

        // Visuals
        createExplosion(zombie.x, zombie.y);

        // Score
        gameState.score += 10;
        gameState.zombiesKilled++;

        // Remove
        gameState.zombies.splice(i, 1);
    }

    playExplosionSound();
}
