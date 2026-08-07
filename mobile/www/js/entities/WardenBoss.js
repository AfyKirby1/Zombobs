// [TRACE: CAMPAIGN_DESIGN.md] Zone 4 finale boss — The Warden
import { BossZombie } from './BossZombie.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { triggerExplosion, applyPlayerDamage } from '../utils/combatUtils.js';
import {
    Zombie,
    NormalZombie,
    FastZombie,
    ArmoredZombie,
    GhostZombie
} from './Zombie.js';

/**
 * The Warden — Act 1 Control Tower boss.
 * Phases: Broadcast (slam) → Static (aim jitter + charge) → Blackout (ghost adds).
 */
export class WardenBoss extends BossZombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'warden';
        this.radius = 42;
        this.speed = 0.72;
        this.maxHealth = 2800;
        this.health = this.maxHealth;
        this.scoreValue = 1200;
        this.color = {
            light: '#4a0080',
            dark: '#1a0030',
            glow: 'rgba(0, 220, 255, 0.55)',
            outline: '#00e5ff'
        };
        this.attackCooldown = 2800;
        this.attackRange = 170;
        this.attackChargeTime = 700;
        this.phase = 1;
        this.lastScreamTime = 0;
        this.screamCooldown = 9000;
        this.aimJitterUntil = 0;
        this.blackoutTriggered = false;
        this.callYardUsed = { 1: false, 2: false, 3: false };
    }

    update(player) {
        const hpRatio = this.health / this.maxHealth;
        if (hpRatio <= 0.25) this.phase = 3;
        else if (hpRatio <= 0.6) this.phase = 2;
        else this.phase = 1;

        if (this.phase === 3 && !this.blackoutTriggered) {
            this.blackoutTriggered = true;
            gameState.campaignScript.lightsOutUntil = Date.now() + 6000;
            this._spawnAdds('ghost', 3);
            gameState.waveNotification = {
                active: true,
                text: 'WARDEN — BLACKOUT',
                life: 0,
                maxLife: 120
            };
        }

        if (!this.callYardUsed[this.phase]) {
            this.callYardUsed[this.phase] = true;
            this._callTheYard();
        }

        if (this.phase >= 2 && Date.now() - this.lastScreamTime > this.screamCooldown) {
            this._relayScream(player);
        }

        if (this.isAttacking) {
            if (Date.now() - this.attackStartTime >= this.attackChargeTime) {
                this.performAreaAttack();
                this.isAttacking = false;
                this.lastAttackTime = Date.now();
            }
            return;
        }

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        this.speed = this.phase >= 2 ? 0.95 : 0.72;

        // Skip BossZombie.update (would double-attack) — base chase only
        Zombie.prototype.update.call(this, player);

        if (dist < this.attackRange && Date.now() - this.lastAttackTime > this.attackCooldown) {
            this.startAttack();
        }
    }

    performAreaAttack() {
        const radius = this.phase >= 3 ? 150 : 130;
        const damage = this.phase >= 3 ? 28 : 22;
        triggerExplosion(this.x, this.y, radius, damage, false);

        const player = gameState.players[0];
        if (player && player.health > 0) {
            const d = Math.hypot(player.x - this.x, player.y - this.y);
            if (d < radius) {
                applyPlayerDamage(player, damage * 0.35);
            }
        }
    }

    _relayScream(player) {
        this.lastScreamTime = Date.now();
        this.aimJitterUntil = Date.now() + 3500;
        if (player) {
            player.sirenAimJitterUntil = this.aimJitterUntil;
        }
        gameState.waveNotification = {
            active: true,
            text: 'THE SIGNAL WAS MERCY',
            life: 0,
            maxLife: 90
        };
    }

    _callTheYard() {
        if (this.phase === 1) this._spawnAdds('normal', 4);
        else if (this.phase === 2) {
            this._spawnAdds('armored', 2);
            this._spawnAdds('fast', 3);
        } else {
            this._spawnAdds('armored', 2);
            this._spawnAdds('ghost', 2);
        }
    }

    _spawnAdds(kind, count) {
        const classes = {
            normal: NormalZombie,
            fast: FastZombie,
            armored: ArmoredZombie,
            ghost: GhostZombie
        };
        const Cls = classes[kind] || NormalZombie;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 120 + Math.random() * 80;
            const zx = this.x + Math.cos(angle) * dist;
            const zy = this.y + Math.sin(angle) * dist;
            try {
                const z = new Cls(1, 1);
                z.x = zx;
                z.y = zy;
                gameState.zombies.push(z);
            } catch (_) {
                /* ignore spawn failure */
            }
        }
    }

    draw() {
        const pulse = Math.sin(Date.now() / 180) * 0.2 + 0.8;
        const auraSize = this.radius * (1.6 + this.phase * 0.15) * pulse;

        if (settingsManager.getSetting('video', 'shadows') !== false) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.radius * 0.12,
                this.y + this.radius * 1.18,
                this.radius * 1.4,
                this.radius * 0.5,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isAttacking) {
            const chargeProgress = (Date.now() - this.attackStartTime) / this.attackChargeTime;
            ctx.beginPath();
            ctx.arc(0, 0, 140 * chargeProgress, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.55 * chargeProgress})`;
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = `rgba(80, 0, 120, ${0.2 * chargeProgress})`;
            ctx.fill();
        }

        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.4, 0, 0, auraSize);
        gradient.addColorStop(0, this.color.glow);
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fill();

        // Mast spear behind body
        ctx.strokeStyle = '#7ec8ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius - 30);
        ctx.lineTo(0, this.radius + 10);
        ctx.stroke();

        // Relay crossbars and hanging signal leads make the mast read as
        // machinery rather than a single line.
        ctx.strokeStyle = 'rgba(0, 188, 212, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.45, -this.radius - 18);
        ctx.lineTo(this.radius * 0.45, -this.radius - 18);
        ctx.moveTo(-this.radius * 0.3, -this.radius - 9);
        ctx.lineTo(this.radius * 0.3, -this.radius - 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.42, -this.radius - 18);
        ctx.quadraticCurveTo(-this.radius * 0.72, -this.radius * 0.2, -this.radius * 0.9, this.radius * 0.38);
        ctx.moveTo(this.radius * 0.42, -this.radius - 18);
        ctx.quadraticCurveTo(this.radius * 0.72, -this.radius * 0.2, this.radius * 0.9, this.radius * 0.38);
        ctx.stroke();
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, -this.radius - 34, 6, 0, Math.PI * 2);
        ctx.fill();

        // Long armored arms behind the core body.
        const armSwing = Math.sin(Date.now() / 300 + this.animSeed) * this.radius * 0.06;
        for (let side = -1; side <= 1; side += 2) {
            ctx.strokeStyle = '#1c1530';
            ctx.lineWidth = this.radius * 0.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(side * this.radius * 0.7, this.radius * 0.06);
            ctx.quadraticCurveTo(
                side * this.radius * 1.22,
                this.radius * 0.52 + armSwing * side,
                side * this.radius * 1.02,
                this.radius * 1.12
            );
            ctx.stroke();
            this.drawClawedHand(
                ctx,
                side * this.radius * 1.02,
                this.radius * 1.18,
                this.radius / 21,
                '#594072',
                side * -0.2
            );
        }

        const bodyGradient = ctx.createRadialGradient(
            -this.radius / 3, -this.radius / 3, 0, 0, this.radius * 0.12, this.radius * 1.25
        );
        bodyGradient.addColorStop(0, this.color.light);
        bodyGradient.addColorStop(0.55, '#32104f');
        bodyGradient.addColorStop(1, this.color.dark);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.28, this.radius * 1.08, this.radius * 1.24, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.color.outline;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Angular broadcast mask/head.
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.72, -this.radius * 0.5);
        ctx.lineTo(-this.radius * 0.52, -this.radius * 0.9);
        ctx.lineTo(this.radius * 0.52, -this.radius * 0.9);
        ctx.lineTo(this.radius * 0.72, -this.radius * 0.5);
        ctx.lineTo(this.radius * 0.58, this.radius * 0.08);
        ctx.lineTo(0, this.radius * 0.32);
        ctx.lineTo(-this.radius * 0.58, this.radius * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.drawOrganicModelDetails(ctx, 0, -this.radius * 0.28, this.radius * 0.82, {
            torsoOffsetY: 9,
            torsoRx: 1.32,
            torsoRy: 1.55,
            ribs: false,
            rimColor: 'rgba(100, 225, 255, 0.34)',
            mottleColor: 'rgba(20, 0, 45, 0.34)',
            woundColor: 'rgba(0, 105, 125, 0.78)'
        });
        this.drawTypeModelDetails(ctx, 0, 0, this.radius, 'warden');

        // Floodlight eyes
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 14 + this.phase * 3;
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.3, -this.radius * 0.38, 8, 5, -0.12, 0, Math.PI * 2);
        ctx.ellipse(this.radius * 0.3, -this.radius * 0.38, 8, 5, 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Respirator grille and phase-lit relay nodes.
        ctx.strokeStyle = '#94a3ad';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.radius * 0.12, -this.radius * 0.08);
            ctx.lineTo(i * this.radius * 0.1, this.radius * 0.18);
            ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.phase ? '#00e5ff' : 'rgba(0, 77, 87, 0.7)';
            ctx.beginPath();
            ctx.arc((i - 1) * this.radius * 0.22, this.radius * 0.52, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Headset bar
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -this.radius * 0.1, this.radius * 0.7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        this.drawHitReactFlash(ctx, 0, -this.radius * 0.08, this.radius);

        ctx.restore();

        // Phase label
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 11px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WARDEN P${this.phase}`, this.x, this.y - this.radius - 22);
    }
}
