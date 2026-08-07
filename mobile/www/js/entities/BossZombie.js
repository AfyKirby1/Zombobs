import { Zombie } from './Zombie.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { triggerExplosion } from '../utils/combatUtils.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';

export class BossZombie extends Zombie {
    constructor(x, y) {
        // v0.8.1.2: Call super with canvas dimensions (Zombie constructor expects canvasWidth, canvasHeight)
        // Then override position with the provided x, y coordinates
        super(1, 1); // Pass dummy values since we'll override position anyway
        this.x = x;
        this.y = y;
        this.type = 'boss';
        this.radius = 35; // Larger size
        this.speed = 0.6; // Slower than normal zombies initially
        // 1.25x increase, with minimum 1000 HP for wave 5+
        this.maxHealth = Math.max(1000, Math.floor((500 + (gameState.wave * 50)) * 1.25));
        this.health = this.maxHealth;
        this.scoreValue = 500;
        this.color = {
            light: '#8a0000', // Dark red
            dark: '#4a0000',
            glow: 'rgba(255, 0, 0, 0.6)',
            outline: '#ff0000'
        };
        
        // Boss specific properties
        this.lastAttackTime = Date.now();
        this.attackCooldown = 3000; // 3 seconds
        this.attackRange = 150;
        this.isAttacking = false;
        this.attackChargeTime = 1000; // 1 second charge up
        this.attackStartTime = 0;

        // Boss Rush bosses are a proper multi-phase encounter rather than a
        // standard boss with a few elite escorts. Each health threshold makes
        // the monster faster and more aggressive, with a clear on-screen callout.
        this.isBossRushEncounter = gameState.gameMode === 'boss_rush';
        this.bossRushPhase = 0;
        this.bossRushSpeedMultiplier = 1;
        if (this.isBossRushEncounter) {
            const waveScale = 1 + Math.min(0.8, Math.max(0, gameState.wave - 1) * 0.08);
            this.maxHealth = Math.floor(this.maxHealth * waveScale);
            this.health = this.maxHealth;
            this.scoreValue = 750;
        }
    }

    update(player) {
        this.updateBossRushPhase();

        // If attacking (charging up), don't move
        if (this.isAttacking) {
            if (Date.now() - this.attackStartTime >= this.attackChargeTime) {
                this.performAreaAttack();
                this.isAttacking = false;
                this.lastAttackTime = Date.now();
            }
            return;
        }

        // Normal movement
        super.update(player);

        // Check for special attack
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        if (distToPlayer < this.attackRange && Date.now() - this.lastAttackTime > this.attackCooldown) {
            this.startAttack();
        }
    }

    updateBossRushPhase() {
        if (!this.isBossRushEncounter || this.bossRushPhase >= 2 || this.maxHealth <= 0) {
            return;
        }

        const healthRatio = this.health / this.maxHealth;
        const nextPhase = healthRatio <= 0.34 ? 2 : (healthRatio <= 0.68 ? 1 : 0);
        if (nextPhase <= this.bossRushPhase) {
            return;
        }

        this.bossRushPhase = nextPhase;
        this.bossRushSpeedMultiplier = nextPhase === 1 ? 1.3 : 1.62;
        this.attackCooldown = nextPhase === 1 ? 2300 : 1550;
        this.attackChargeTime = nextPhase === 1 ? 800 : 580;
        this.attackRange = 150 + nextPhase * 30;
        gameState.shakeAmount = Math.max(gameState.shakeAmount || 0, 10 + nextPhase * 5);

        const phaseText = nextPhase === 1
            ? 'OVERLORD RAGE -- PHASE II'
            : 'OVERLORD RAGE -- FINAL PHASE';
        triggerWaveNotification(phaseText, 130);
    }

    startAttack() {
        this.isAttacking = true;
        this.attackStartTime = Date.now();
        // Optional: Play roar sound here
    }

    performAreaAttack() {
        // Trigger explosion centered on boss (doesn't hurt boss, hurts player)
        // Using triggerExplosion utility but we might need a custom one if we don't want it to hurt other zombies?
        // For now, let's use a custom logic or reuse triggerExplosion carefully.
        // Let's just do a direct distance check for simplicity and visual effect
        
        triggerExplosion(this.x, this.y, 120, 20, false); // x, y, radius, damage, sourceIsPlayer
        
        // Visual shockwave is handled by triggerExplosion
    }

    draw() {
        // Draw boss aura
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        const rage = this.bossRushPhase || 0;
        const auraSize = this.radius * (1.5 + rage * 0.24) * pulse;

        if (settingsManager.getSetting('video', 'shadows') !== false) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.radius * 0.12,
                this.y + this.radius * 1.15,
                this.radius * 1.35,
                this.radius * 0.48,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Attack charge indicator
        if (this.isAttacking) {
            const chargeProgress = (Date.now() - this.attackStartTime) / this.attackChargeTime;
            ctx.beginPath();
            ctx.arc(0, 0, 120 * chargeProgress, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 50, 0, ${0.5 * chargeProgress})`;
            ctx.lineWidth = 5;
            ctx.stroke();
            
            ctx.fillStyle = `rgba(255, 0, 0, ${0.2 * chargeProgress})`;
            ctx.fill();
        }

        // Glow
        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, auraSize);
        gradient.addColorStop(0, rage > 0 ? `rgba(255, ${70 + rage * 40}, 20, 0.78)` : this.color.glow);
        gradient.addColorStop(0.62, rage === 2 ? 'rgba(255, 23, 68, 0.26)' : 'rgba(255, 0, 0, 0.16)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fill();

        if (rage > 0) {
            ctx.strokeStyle = rage === 2 ? 'rgba(255, 82, 82, 0.85)' : 'rgba(255, 152, 0, 0.72)';
            ctx.lineWidth = 2 + rage;
            ctx.setLineDash([5, 7]);
            ctx.lineDashOffset = -Date.now() / (rage === 2 ? 35 : 55);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * (1.18 + pulse * 0.22), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Articulated brute arms establish a broad silhouette behind the body.
        const armSwing = Math.sin(Date.now() / 260 + this.animSeed) * this.radius * 0.08;
        for (let side = -1; side <= 1; side += 2) {
            ctx.strokeStyle = this.color.dark;
            ctx.lineWidth = this.radius * 0.34;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(side * this.radius * 0.72, this.radius * 0.18);
            ctx.quadraticCurveTo(
                side * this.radius * 1.24,
                this.radius * 0.58 + armSwing * side,
                side * this.radius * 1.05,
                this.radius * 1.18
            );
            ctx.stroke();
            this.drawClawedHand(
                ctx,
                side * this.radius * 1.05,
                this.radius * 1.24,
                this.radius / 19,
                this.color.light,
                side * -0.2
            );
        }

        // Separate torso and skull forms replace the old single-circle model.
        const bodyGradient = ctx.createRadialGradient(
            -this.radius * 0.35,
            -this.radius * 0.28,
            0,
            0,
            this.radius * 0.15,
            this.radius * 1.25
        );
        bodyGradient.addColorStop(0, this.color.light);
        bodyGradient.addColorStop(0.5, '#65040b');
        bodyGradient.addColorStop(1, this.color.dark);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.28, this.radius * 1.08, this.radius * 1.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.color.outline;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, -this.radius * 0.28, this.radius * 0.82, this.radius * 0.76, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        this.drawOrganicModelDetails(ctx, 0, -this.radius * 0.28, this.radius * 0.82, {
            torsoOffsetY: 9,
            torsoRx: 1.32,
            torsoRy: 1.5,
            rimColor: 'rgba(255, 125, 105, 0.28)',
            boneColor: 'rgba(255, 175, 145, 0.35)',
            woundColor: 'rgba(55, 0, 0, 0.9)'
        });
        this.drawTypeModelDetails(ctx, 0, 0, this.radius, 'boss');
        this.drawFaceFeatures(ctx, 0, -this.radius * 0.28, this.radius * 0.72, {
            mouthColor: '#270003',
            toothColor: '#f2d6a2',
            woundColor: 'rgba(35, 0, 0, 0.9)'
        });

        // Eyes (Glowing yellow)
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = rage === 2 ? 22 : 14;
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.24, -this.radius * 0.38, 6, 4.5, -0.12, 0, Math.PI * 2);
        ctx.ellipse(this.radius * 0.24, -this.radius * 0.38, 6, 4.5, 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Boss-rush phase shackles heat up as the encounter escalates.
        if (rage > 0) {
            ctx.strokeStyle = rage === 2 ? '#ff5252' : '#ff9800';
            ctx.lineWidth = 3;
            for (let side = -1; side <= 1; side += 2) {
                ctx.beginPath();
                ctx.arc(side * this.radius * 0.98, this.radius * 0.82, this.radius * 0.18, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        this.drawHitReactFlash(ctx, 0, -this.radius * 0.12, this.radius);

        ctx.restore();
        
        // Draw health bar above head if damaged
        if (this.health < this.maxHealth) {
            const barWidth = 60;
            const barHeight = 6;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 15;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const healthPct = this.health / this.maxHealth;
            const fillWidth = barWidth * healthPct;
            
            // Get health bar style setting
            const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';
            
            if (healthBarStyle === 'gradient') {
                // Red gradient for boss
                const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(1, '#ff6666');
                ctx.fillStyle = gradient;
            } else if (healthBarStyle === 'solid') {
                // Solid red for boss
                ctx.fillStyle = '#ff0000';
            } else if (healthBarStyle === 'simple') {
                // Simple white fill
                ctx.fillStyle = '#ffffff';
            }
            
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            // Border (only for gradient and solid styles)
            if (healthBarStyle !== 'simple') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }
    }
}
