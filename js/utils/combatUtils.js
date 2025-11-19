import { gameState } from '../core/gameState.js';
import { 
    WEAPONS, GRENADE_COOLDOWN, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS, PLAYER_MAX_HEALTH, HEALTH_PICKUP_HEAL_AMOUNT,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS, AMMO_PICKUP_AMOUNT, MAX_GRENADES
} from '../core/constants.js';
import { playGunshotSound, playKillSound, playDamageSound, playExplosionSound } from '../systems/AudioSystem.js';
import { createExplosion, createBloodSplatter, createParticles, addParticle } from '../systems/ParticleSystem.js';
import { triggerMuzzleFlash, triggerDamageIndicator, checkCollision, triggerWaveNotification } from './gameUtils.js';
import { Bullet } from '../entities/Bullet.js';
import { Shell } from '../entities/Shell.js';
import { Grenade } from '../entities/Grenade.js';
import { DamageNumber } from '../entities/Particle.js';

export function shootBullet(mouse, canvas) {
    const now = Date.now();
    
    // Check if reloading
    if (gameState.isReloading) {
        if (now - gameState.reloadStartTime >= gameState.currentWeapon.reloadTime) {
            gameState.isReloading = false;
            gameState.currentAmmo = gameState.currentWeapon.maxAmmo;
        } else {
            return; // Still reloading
        }
    }
    
    // Check fire rate cooldown
    if (now - gameState.lastShotTime < gameState.currentWeapon.fireRate) {
        return;
    }
    
    // Check ammo
    if (gameState.currentAmmo <= 0) {
        reloadWeapon();
        return;
    }
    
    const angle = Math.atan2(mouse.y - gameState.player.y, mouse.x - gameState.player.x);
    const gunX = gameState.player.x + Math.cos(angle) * gameState.player.radius * 1.8;
    const gunY = gameState.player.y + Math.sin(angle) * gameState.player.radius * 1.8;
    
    // Create bullets based on weapon type
    if (gameState.currentWeapon === WEAPONS.shotgun) {
        // Shotgun fires 5 spread bullets
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5; // Add spread
            gameState.bullets.push(new Bullet(gunX, gunY, spreadAngle, gameState.currentWeapon));
        }
    } else {
        // Pistol and rifle fire single bullet
        gameState.bullets.push(new Bullet(gunX, gunY, angle, gameState.currentWeapon));
    }
    
    // Consume ammo
    gameState.currentAmmo--;
    
    // Update last shot time
    gameState.lastShotTime = now;
    
    // Add screen shake on shoot
    gameState.shakeAmount = 3;
    
    // Trigger muzzle flash
    triggerMuzzleFlash(gunX, gunY, angle);
    
    // Create shell casing
    gameState.shells.push(new Shell(gunX, gunY, angle));
    
    // Play gunshot sound
    playGunshotSound();
}

export function reloadWeapon() {
    if (!gameState.isReloading && gameState.currentAmmo < gameState.currentWeapon.maxAmmo) {
        gameState.isReloading = true;
        gameState.reloadStartTime = Date.now();
        // Play reload sound if implemented
    }
}

export function switchWeapon(weapon) {
    if (weapon !== gameState.currentWeapon) {
        gameState.currentWeapon = weapon;
        gameState.currentAmmo = gameState.currentWeapon.ammo;
        gameState.maxAmmo = gameState.currentWeapon.maxAmmo;
        gameState.lastShotTime = 0; // Reset fire rate cooldown
        gameState.isReloading = false; // Cancel any ongoing reload
    }
}

export function throwGrenade(mouse, canvas) {
    const now = Date.now();
    
    // Check cooldown
    if (now - gameState.lastGrenadeThrowTime < GRENADE_COOLDOWN) {
        return;
    }
    
    // Check grenade count
    if (gameState.grenadeCount <= 0) {
        return;
    }
    
    // Calculate throw position (from player)
    const angle = Math.atan2(mouse.y - gameState.player.y, mouse.x - gameState.player.x);
    const throwX = gameState.player.x + Math.cos(angle) * gameState.player.radius * 1.5;
    const throwY = gameState.player.y + Math.sin(angle) * gameState.player.radius * 1.5;
    
    // Target is where the mouse cursor is (ensure it's within canvas bounds)
    const targetX = Math.max(20, Math.min(canvas.width - 20, mouse.x));
    const targetY = Math.max(20, Math.min(canvas.height - 20, mouse.y));
    
    gameState.grenades.push(new Grenade(throwX, throwY, targetX, targetY));
    gameState.grenadeCount--;
    gameState.lastGrenadeThrowTime = now;
    
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
        const dx = gameState.player.x - x;
        const dy = gameState.player.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
            const damageMultiplier = 1 - (distance / radius) * 0.5;
            const playerDamage = Math.floor(damage * damageMultiplier * 0.5); // Player takes 50% of explosion damage
            gameState.player.health -= playerDamage;
            createParticles(gameState.player.x, gameState.player.y, '#ff0000', 5);
            gameState.shakeAmount = 12;
            triggerDamageIndicator();
            playDamageSound();
            
            // No gameOver() call here to avoid circular dependency
            // Game loop will check health <= 0
        }
    }
    
    // Play explosion sound
    playExplosionSound();
}

// Collision handlers
export function handleBulletZombieCollisions() {
    gameState.bullets.forEach((bullet, bulletIndex) => {
        gameState.zombies.forEach((zombie, zombieIndex) => {
            if (checkCollision(bullet, zombie)) {
                // Get bullet angle for directional blood splatter
                const impactAngle = Math.atan2(bullet.vy, bullet.vx);
                
                // Store zombie position and type before damage (for exploding zombies)
                const zombieX = zombie.x;
                const zombieY = zombie.y;
                const isExploding = zombie.type === 'exploding';
                
                // Check if zombie dies from this hit
                if (zombie.takeDamage(bullet.damage)) {
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
                    // Create floating damage number
                    gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, bullet.damage));
                    // Create blood splatter on kill
                    createBloodSplatter(zombieX, zombieY, impactAngle, true);
                } else {
                    // Create floating damage number
                    gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
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
                gameState.bullets.splice(bulletIndex, 1);
            }
        });
    });
}

export function handlePlayerZombieCollisions() {
    gameState.zombies.forEach(zombie => {
        if (checkCollision(gameState.player, zombie)) {
            gameState.player.health -= 0.5;
            createParticles(gameState.player.x, gameState.player.y, '#ff0000', 3);
            // Add screen shake on damage
            gameState.shakeAmount = 8;
            // Trigger damage indicator
            triggerDamageIndicator();
            // Play damage sound
            playDamageSound();
        }
    });
}

export function handlePickupCollisions() {
    // Check player-health pickup collisions
    if (gameState.healthPickups.length > 0 && gameState.player.health < PLAYER_MAX_HEALTH) {
        gameState.healthPickups = gameState.healthPickups.filter(pickup => {
            if (checkCollision(gameState.player, pickup)) {
                gameState.player.health = Math.min(
                    PLAYER_MAX_HEALTH,
                    gameState.player.health + HEALTH_PICKUP_HEAL_AMOUNT
                );
                createParticles(pickup.x, pickup.y, '#ff1744', 8);
                return false; // remove collected pickup
            }
            return true;
        });
    }
    
    // Check player-ammo pickup collisions
    if (gameState.ammoPickups.length > 0 && (gameState.currentAmmo < gameState.maxAmmo || gameState.grenadeCount < MAX_GRENADES)) {
        gameState.ammoPickups = gameState.ammoPickups.filter(pickup => {
            if (checkCollision(gameState.player, pickup)) {
                // Restore ammo for current weapon
                gameState.currentAmmo = Math.min(gameState.maxAmmo, gameState.currentAmmo + AMMO_PICKUP_AMOUNT);
                // Also refill grenades
                gameState.grenadeCount = MAX_GRENADES;
                createParticles(pickup.x, pickup.y, '#ff9800', 8);
                return false; // remove collected pickup
            }
            return true;
        });
    }
}
