import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { DamageNumber } from './Particle.js';
import { MOLOTOV_FIRE_TICK_DAMAGE, ZOMBIE_BASE_SCORES } from '../core/constants.js';

export class AcidPool {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.life = 5000; // 5 seconds
        this.maxLife = 5000;
        this.damagePerTick = 0.3; // Damage per 200ms tick
        this.lastDamageTick = 0;
    }

    update() {
        this.life -= 16; // Approximate frame time
        
        // Damage players standing in pool
        const now = Date.now();
        if (now - this.lastDamageTick >= 200) {
            const radiusSquared = this.radius * this.radius;
            for (let i = 0; i < gameState.players.length; i++) {
                const player = gameState.players[i];
                if (player.health <= 0) continue;
                
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distSquared = dx * dx + dy * dy;
                
                if (distSquared < radiusSquared) {
                    if (player.isDodging) {
                        const dodgeNow = Date.now();
                        if (!player.lastDodgePopupTime || dodgeNow - player.lastDodgePopupTime > 200) {
                            player.lastDodgePopupTime = dodgeNow;
                            const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                            if (damageNumberStyle !== 'off') {
                                gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 20, "DODGED!", false, '#00ffff'));
                            }
                        }
                        continue;
                    }

                    // Pyromancer Immolation — heal in your own fire
                    if (this.isFirePool && this.player === player && (player.fireHealPerTick || 0) > 0) {
                        player.health = Math.min(player.maxHealth, player.health + player.fireHealPerTick);
                        continue;
                    }

                    // Player is in acid pool - take damage
                    const damage = this.damagePerTick;
                    const previousHealth = player.health;
                    
                    // Apply to shield first, then health
                    if (player.shield > 0) {
                        player.shield -= damage;
                        if (player.shield < 0) {
                            player.health += player.shield; // Negative shield becomes health damage
                            player.shield = 0;
                        }
                    } else {
                        player.health -= damage;
                    }
                    
                    // Reset multiplier if health was reduced (shield didn't fully absorb)
                    if (player.health < previousHealth && player.shield === 0) {
                        // Import resetMultiplier dynamically
                        import('../utils/combatUtils.js').then(module => {
                            module.resetMultiplier(player);
                        });
                    }
                    
                    // Trigger damage indicator (imported in main.js)
                    if (typeof triggerDamageIndicator !== 'undefined') {
                        triggerDamageIndicator();
                    }
                }
            }

            // If it's a fire pool, damage zombies as well
            if (this.isFirePool) {
                // Iterate backwards since we might splice
                for (let j = gameState.zombies.length - 1; j >= 0; j--) {
                    const zombie = gameState.zombies[j];
                    const dx = zombie.x - this.x;
                    const dy = zombie.y - this.y;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < radiusSquared) {
                        const finalDamage = MOLOTOV_FIRE_TICK_DAMAGE || 0.5;
                        zombie.burnDamage = finalDamage * 2;
                        zombie.burnTimer = 3000; // 3 seconds of burn time after leaving fire
                        
                        if (zombie.takeDamage(finalDamage)) {
                            // Zombie died!
                            gameState.zombies.splice(j, 1);
                            
                            // Trigger score awards & stats tracking
                            if (this.player) {
                                const baseScore = ZOMBIE_BASE_SCORES[zombie.type] || 10;
                                const finalScore = Math.floor(baseScore * this.player.scoreMultiplier);
                                this.player.score += finalScore;
                                this.player.consecutiveKills++;
                                
                                import('../utils/combatUtils.js').then(module => {
                                    module.updateScoreMultiplier(this.player);
                                });
                                
                                const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                                if (damageNumberStyle !== 'off') {
                                    if (this.player.scoreMultiplier > 1) {
                                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore} (${this.player.scoreMultiplier}x)`));
                                    } else {
                                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore}`));
                                    }
                                }
                                this.player.killsThisSession = (this.player.killsThisSession || 0) + 1;
                            }
                        } else {
                            const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                            if (damageNumberStyle !== 'off' && Math.random() < 0.2) {
                                gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, finalDamage));
                            }
                        }
                    }
                }
            }

            this.lastDamageTick = now;
        }
    }

    draw() {
        const alpha = this.life / this.maxLife;

        if (this.isFirePool) {
            const t = Date.now() / 1000;
            // Outer heat glow
            const outerR = this.radius * 1.35;
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerR);
            glowGradient.addColorStop(0, `rgba(255, 200, 60, ${alpha * 0.35})`);
            glowGradient.addColorStop(0.35, `rgba(255, 100, 0, ${alpha * 0.4})`);
            glowGradient.addColorStop(0.7, `rgba(180, 30, 0, ${alpha * 0.2})`);
            glowGradient.addColorStop(1, `rgba(80, 0, 0, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, outerR, 0, Math.PI * 2);
            ctx.fill();

            // Core fire pool
            const poolGradient = ctx.createRadialGradient(
                this.x - 5, this.y - 5, 0, this.x, this.y, this.radius
            );
            poolGradient.addColorStop(0, `rgba(255, 240, 120, ${alpha * 0.85})`);
            poolGradient.addColorStop(0.35, `rgba(255, 140, 0, ${alpha * 0.7})`);
            poolGradient.addColorStop(0.7, `rgba(220, 40, 0, ${alpha * 0.5})`);
            poolGradient.addColorStop(1, `rgba(60, 0, 0, ${alpha * 0.15})`);
            ctx.fillStyle = poolGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Rising flame tongues
            const flameCount = 8;
            for (let i = 0; i < flameCount; i++) {
                const angle = t * 2.5 + i * (Math.PI * 2 / flameCount);
                const r = (0.15 + 0.55 * (0.5 + 0.5 * Math.sin(t * 3 + i))) * this.radius;
                const flameX = this.x + Math.cos(angle) * r;
                const rise = Math.abs(Math.sin(t * 4 + i * 1.7)) * 14;
                const flameY = this.y + Math.sin(angle) * r * 0.4 - rise;
                const fr = 2 + Math.abs(Math.sin(t * 5 + i)) * 4;
                const g = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, fr);
                g.addColorStop(0, `rgba(255, 255, 180, ${alpha * 0.9})`);
                g.addColorStop(0.5, `rgba(255, 120, 0, ${alpha * 0.55})`);
                g.addColorStop(1, `rgba(255, 40, 0, 0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(flameX, flameY, fr, 0, Math.PI * 2);
                ctx.fill();
            }

            // Smoke wisps
            for (let i = 0; i < 3; i++) {
                const sx = this.x + Math.sin(t * 0.8 + i * 2) * this.radius * 0.3;
                const sy = this.y - this.radius * 0.4 - ((t * 20 + i * 40) % 50);
                ctx.fillStyle = `rgba(40, 30, 25, ${alpha * 0.15})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 6 + i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.isSlimePool) {
            // Slime pool (BlightZombie) — purple/magenta fungal slime
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            glowGradient.addColorStop(0, `rgba(171, 71, 188, ${alpha * 0.4})`);
            glowGradient.addColorStop(0.5, `rgba(123, 31, 162, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(74, 20, 140, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            const poolGradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
            poolGradient.addColorStop(0, `rgba(224, 64, 251, ${alpha * 0.6})`);
            poolGradient.addColorStop(0.5, `rgba(171, 71, 188, ${alpha * 0.5})`);
            poolGradient.addColorStop(1, `rgba(123, 31, 162, ${alpha * 0.3})`);
            ctx.fillStyle = poolGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Fungal bubbling effect
            const bubbleTime = Date.now() / 250;
            for (let i = 0; i < 3; i++) {
                const bubbleX = this.x + Math.cos(bubbleTime + i * 2) * (this.radius * 0.5);
                const bubbleY = this.y + Math.sin(bubbleTime + i * 2) * (this.radius * 0.5);
                ctx.fillStyle = `rgba(240, 180, 240, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Acid pool glow (SpitterZombie)
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            glowGradient.addColorStop(0, `rgba(0, 255, 0, ${alpha * 0.4})`);
            glowGradient.addColorStop(0.5, `rgba(50, 255, 50, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(0, 255, 0, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Acid pool surface
            const poolGradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
            poolGradient.addColorStop(0, `rgba(100, 255, 100, ${alpha * 0.6})`);
            poolGradient.addColorStop(0.5, `rgba(50, 200, 50, ${alpha * 0.5})`);
            poolGradient.addColorStop(1, `rgba(0, 150, 0, ${alpha * 0.3})`);
            ctx.fillStyle = poolGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Bubbling effect
            const bubbleTime = Date.now() / 200;
            for (let i = 0; i < 3; i++) {
                const bubbleX = this.x + Math.cos(bubbleTime + i * 2) * (this.radius * 0.5);
                const bubbleY = this.y + Math.sin(bubbleTime + i * 2) * (this.radius * 0.5);
                ctx.fillStyle = `rgba(200, 255, 200, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    isExpired() {
        return this.life <= 0;
    }
}

