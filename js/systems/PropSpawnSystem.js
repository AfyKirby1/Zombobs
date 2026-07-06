import { canvas } from '../core/canvas.js';
import { CHUNK_SIZE, PROP_SPAWN_DENSITY, PROP_MIN_DISTANCE, PROP_SPAWN_MARGIN } from '../core/constants.js';
import { chunkManager } from '../utils/ChunkManager.js';
import { Prop } from '../entities/Prop.js';
import { isCampaignMode } from '../utils/gameUtils.js';

/**
 * PropSpawnSystem - Handles chunk-based spawning of world props
 * Only active in single player arcade mode
 */
export class PropSpawnSystem {
    constructor() {
        this.lastChunkCheckTime = 0;
        this.chunkCheckInterval = 500; // Check for new chunks every 500ms
    }

    /**
     * Update prop spawning based on player position
     * @param {Object} gameState - Game state object
     * @param {Object} player - Player object
     */
    update(gameState, player) {
        // Only spawn in single player arcade mode
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        if (!isSinglePlayerArcade || isCampaignMode(gameState)) return;

        if (!player || player.health <= 0) return;

        const now = Date.now();
        
        // Throttle chunk checking for performance
        if (now - this.lastChunkCheckTime < this.chunkCheckInterval) return;
        this.lastChunkCheckTime = now;

        // Get player's current chunk
        const playerChunk = chunkManager.getChunkCoords(player.x, player.y);
        
        // Check surrounding chunks (3x3 grid around player)
        const checkRadius = 1; // Check 1 chunk in each direction
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                const chunkX = playerChunk.chunkX + dx;
                const chunkY = playerChunk.chunkY + dy;
                
                // Skip if chunk already activated
                if (chunkManager.isChunkActive(chunkX, chunkY)) continue;
                
                // Activate chunk and spawn props
                chunkManager.activateChunk(chunkX, chunkY);
                this.spawnPropsInChunk(gameState, chunkX, chunkY, player);
            }
        }
    }

    /**
     * Spawn props in a specific chunk
     * @param {Object} gameState - Game state object
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     */
    spawnPropsInChunk(gameState, chunkX, chunkY, player = null) {
        // Calculate chunk world bounds
        const chunkWorldX = chunkX * CHUNK_SIZE;
        const chunkWorldY = chunkY * CHUNK_SIZE;
        
        // Calculate spawn area (chunk minus margins)
        const spawnLeft = chunkWorldX + PROP_SPAWN_MARGIN;
        const spawnTop = chunkWorldY + PROP_SPAWN_MARGIN;
        const spawnRight = chunkWorldX + CHUNK_SIZE - PROP_SPAWN_MARGIN;
        const spawnBottom = chunkWorldY + CHUNK_SIZE - PROP_SPAWN_MARGIN;
        const spawnWidth = spawnRight - spawnLeft;
        const spawnHeight = spawnBottom - spawnTop;
        
        // Calculate number of props to spawn based on density
        const chunkArea = CHUNK_SIZE * CHUNK_SIZE;
        const spawnArea = spawnWidth * spawnHeight;
        const maxProps = Math.floor((spawnArea / chunkArea) * PROP_SPAWN_DENSITY * 10); // Scale up for reasonable counts
        
        // Spawn props
        const propsToSpawn = Math.floor(Math.random() * maxProps) + 1; // At least 1 prop per chunk
        
        for (let i = 0; i < propsToSpawn; i++) {
            // Try to find a valid spawn position
            let attempts = 0;
            let validPosition = false;
            let propX, propY;
            
            while (attempts < 10 && !validPosition) {
                propX = spawnLeft + Math.random() * spawnWidth;
                propY = spawnTop + Math.random() * spawnHeight;
                
                const avoidX = player ? player.x : canvas.width / 2;
                const avoidY = player ? player.y : canvas.height / 2;
                const dxFromPlayer = propX - avoidX;
                const dyFromPlayer = propY - avoidY;
                const minPlayerDistance = PROP_MIN_DISTANCE * 1.5;

                if (dxFromPlayer * dxFromPlayer + dyFromPlayer * dyFromPlayer < minPlayerDistance * minPlayerDistance) {
                    attempts++;
                    continue;
                }
                
                // Check distance from other props
                validPosition = true;
                for (const existingProp of gameState.props) {
                    const dx = propX - existingProp.x;
                    const dy = propY - existingProp.y;
                    const propPadding = Math.min(80, PROP_MIN_DISTANCE + (existingProp.radius || 0) * 0.35);

                    if (dx * dx + dy * dy < propPadding * propPadding) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // If we found a valid position, spawn a prop
            if (validPosition) {
                // Randomly choose prop type with weights
                const rand = Math.random();
                let propType;
                if (rand < 0.17) {
                    propType = 'rock';
                } else if (rand < 0.31) {
                    propType = 'debris';
                } else if (rand < 0.38) {
                    propType = 'burntCar';
                } else if (rand < 0.45) {
                    propType = 'skull';
                } else if (rand < 0.50) {
                    propType = 'zombieArms';
                } else if (rand < 0.54) {
                    propType = 'zombieLegs';
                } else if (rand < 0.59) {
                    propType = 'trashCan';
                } else if (rand < 0.70) {
                    propType = 'explosiveBarrel';
                } else if (rand < 0.77) {
                    propType = 'abandonedMotorbike';
                } else if (rand < 0.83) {
                    propType = 'sandbagBarricade';
                } else if (rand < 0.88) {
                    propType = 'medicalCrate';
                } else if (rand < 0.92) {
                    propType = 'concreteBarrier';
                } else {
                    propType = 'ammoCrate';
                }
                
                const prop = new Prop(propX, propY, propType);
                gameState.props.push(prop);
            }
        }
    }

    /**
     * Reset the spawn system (for new game)
     */
    reset() {
        chunkManager.reset();
        this.lastChunkCheckTime = 0;
    }
}

// Export singleton instance
export const propSpawnSystem = new PropSpawnSystem();

