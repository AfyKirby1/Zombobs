import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { createPlayer } from '../core/gameState.js';
import { PLAYER_BASE_SPEED } from '../core/constants.js';
import { shootBullet, reloadWeapon } from '../utils/combatUtils.js';

/**
 * CompanionSystem manages AI NPC companions
 * Handles their behavior, decision-making, and lifecycle
 */
export class CompanionSystem {
    constructor() {
        this.maxCompanions = 4;
        this.leashDistance = 500; // Max distance from P1 before forcing return
        this.followDistance = 150; // Preferred distance from P1 when idle
        this.combatRange = 500; // Max range to engage zombies
        this.kiteDistance = 200; // Distance at which to back away from zombies
        this.engageDistance = 350; // Distance at which to approach zombies
    }

    /**
     * Adds a new AI companion to the game
     * @returns {Object|null} The created companion player object, or null if max reached
     */
    addCompanion() {
        if (gameState.players.length >= this.maxCompanions) {
            return null; // Max 4 players
        }
        
        const colorIndex = gameState.players.length; // Use next available color
        const spawnOffset = gameState.players.length * 50; // Offset spawn position
        const aiPlayer = createPlayer(canvas.width / 2 + spawnOffset, canvas.height / 2, colorIndex);
        aiPlayer.inputSource = 'ai';
        aiPlayer.gamepadIndex = null;
        gameState.players.push(aiPlayer);
        
        return aiPlayer;
    }

    /**
     * Updates AI companion behavior for a single frame
     * Modifies the player object directly (angle, isSprinting, speed)
     * Returns movement vector {moveX, moveY}
     * 
     * @param {Object} player - The AI companion player object
     * @returns {{moveX: number, moveY: number}} Movement vector for this frame
     */
    update(player) {
        if (!player || player.health <= 0) {
            return { moveX: 0, moveY: 0 };
        }

        const p1 = gameState.players[0];
        if (!p1 || p1.health <= 0) {
            // No leader, stand still
            player.angle = 0;
            player.isSprinting = false;
            player.speed = PLAYER_BASE_SPEED;
            return { moveX: 0, moveY: 0 };
        }

        const distToP1 = Math.sqrt((player.x - p1.x) ** 2 + (player.y - p1.y) ** 2);

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

        let moveX = 0;
        let moveY = 0;
        let wantsToMove = false;

        if (nearestZombie) {
            const dx = nearestZombie.x - player.x;
            const dy = nearestZombie.y - player.y;
            const dist = minDist;
            
            // Face the zombie
            player.angle = Math.atan2(dy, dx);

            // Combat movement logic
            if (dist < this.kiteDistance) {
                // Too close! Back away (Kite)
                moveX = -(dx / dist);
                moveY = -(dy / dist);
                wantsToMove = true;
            } else if (distToP1 > this.leashDistance) {
                // Too far from squad, regroup towards P1 (ignoring zombie positioning slightly)
                const dxP1 = p1.x - player.x;
                const dyP1 = p1.y - player.y;
                const distP1 = Math.sqrt(dxP1 * dxP1 + dyP1 * dyP1);
                moveX = dxP1 / distP1;
                moveY = dyP1 / distP1;
                wantsToMove = true;
            } else if (dist > this.engageDistance) {
                // Close the gap slightly if safe
                moveX = (dx / dist) * 0.5; // Move slower when approaching
                moveY = (dy / dist) * 0.5;
                wantsToMove = true;
            }

            // Shooting Logic
            // Check if we have ammo and are not reloading
            if (!player.isReloading && player.currentAmmo > 0 && dist < this.combatRange) {
                // Add a small random delay or check to prevent perfect laser aim fire rate
                // For now, just fire if cooldown allows (shootBullet handles fire rate)
                const targetPos = { x: nearestZombie.x, y: nearestZombie.y };
                // Random inaccuracy
                targetPos.x += (Math.random() - 0.5) * 20;
                targetPos.y += (Math.random() - 0.5) * 20;
                
                shootBullet(targetPos, canvas, player);
            } else if (player.currentAmmo <= 0 && !player.isReloading) {
                reloadWeapon(player);
            }

        } else {
            // No enemies, stick close to P1
            if (distToP1 > this.followDistance) {
                const dx = p1.x - player.x;
                const dy = p1.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                moveX = dx / dist;
                moveY = dy / dist;
                wantsToMove = true;
                // Face movement direction when just walking
                player.angle = Math.atan2(moveY, moveX);
            }
        }
        
        if (!wantsToMove) {
            moveX = 0;
            moveY = 0;
        }
        
        // AI doesn't sprint (moves at base speed)
        player.isSprinting = false;
        player.speed = PLAYER_BASE_SPEED;

        return { moveX, moveY };
    }
}

