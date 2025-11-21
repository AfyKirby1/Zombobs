import {
    HEALTH_PICKUP_SPAWN_INTERVAL,
    MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL,
    MAX_AMMO_PICKUPS,
    PLAYER_MAX_HEALTH
} from '../core/constants.js';
import {
    HealthPickup,
    AmmoPickup,
    DamagePickup,
    NukePickup,
    SpeedPickup,
    RapidFirePickup,
    ShieldPickup,
    AdrenalinePickup
} from '../entities/Pickup.js';

/**
 * PickupSpawnSystem handles spawning of health, ammo, and powerup pickups
 * based on game conditions and timers.
 */
export class PickupSpawnSystem {
    /**
     * Main method to update all pickup spawning
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    updateSpawns(gameState, canvas, now) {
        this.spawnHealthPickup(gameState, canvas, now);
        this.spawnAmmoPickup(gameState, canvas, now);
        this.spawnPowerup(gameState, canvas, now);
    }

    /**
     * Spawn health pickup if conditions are met
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnHealthPickup(gameState, canvas, now) {
        if (now - gameState.lastHealthPickupSpawnTime >= HEALTH_PICKUP_SPAWN_INTERVAL &&
            gameState.healthPickups.length < MAX_HEALTH_PICKUPS) {
            // Only spawn if some player is hurt
            if (gameState.players.some(p => p.health < PLAYER_MAX_HEALTH && p.health > 0)) {
                gameState.healthPickups.push(new HealthPickup(canvas.width, canvas.height));
                gameState.lastHealthPickupSpawnTime = now;
            }
        }
    }

    /**
     * Spawn ammo pickup if conditions are met
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnAmmoPickup(gameState, canvas, now) {
        if (now - gameState.lastAmmoPickupSpawnTime >= AMMO_PICKUP_SPAWN_INTERVAL &&
            gameState.ammoPickups.length < MAX_AMMO_PICKUPS) {
            if (gameState.players.some(p => p.currentAmmo < p.maxAmmo * 0.5 && p.health > 0)) {
                gameState.ammoPickups.push(new AmmoPickup(canvas.width, canvas.height));
                gameState.lastAmmoPickupSpawnTime = now;
            }
        }
    }

    /**
     * Spawn powerup with weighted distribution
     * Distribution: Damage (20%), Nuke (8%), Speed (18%), RapidFire (18%), Shield (24%), Adrenaline (12%)
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnPowerup(gameState, canvas, now) {
        if (now - gameState.lastPowerupSpawnTime >= 30000) { // Every 30 seconds check
            if (Math.random() < 0.6) { // 60% chance
                const rand = Math.random();

                // Distribution: Damage (20%), Nuke (8%), Speed (18%), RapidFire (18%), Shield (24%), Adrenaline (12%)
                if (rand < 0.20) { // Damage
                    if (gameState.damagePickups.length < 1) {
                        gameState.damagePickups.push(new DamagePickup(canvas.width, canvas.height));
                    }
                } else if (rand < 0.28) { // Nuke
                    if (gameState.nukePickups.length < 1) {
                        gameState.nukePickups.push(new NukePickup(canvas.width, canvas.height));
                    }
                } else if (rand < 0.46) { // Speed
                    if (gameState.speedPickups.length < 1) {
                        gameState.speedPickups.push(new SpeedPickup(canvas.width, canvas.height));
                    }
                } else if (rand < 0.64) { // RapidFire
                    if (gameState.rapidFirePickups.length < 1) {
                        gameState.rapidFirePickups.push(new RapidFirePickup(canvas.width, canvas.height));
                    }
                } else if (rand < 0.88) { // Shield
                    if (gameState.shieldPickups.length < 1) {
                        gameState.shieldPickups.push(new ShieldPickup(canvas.width, canvas.height));
                    }
                } else { // Adrenaline
                    if (gameState.adrenalinePickups.length < 1) {
                        gameState.adrenalinePickups.push(new AdrenalinePickup(canvas.width, canvas.height));
                    }
                }
            }
            gameState.lastPowerupSpawnTime = now;
        }
    }
}

// Export singleton instance
export const pickupSpawnSystem = new PickupSpawnSystem();

