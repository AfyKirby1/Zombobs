import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { triggerExplosion } from '../utils/combatUtils.js';

export class OrbitalStrikeBeacon {
    constructor(x, y, targetX, targetY, player = null) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.targetX = targetX;
        this.targetY = targetY;
        this.gravity = 0.3;
        this.bounce = 0.4;
        this.onGround = false;
        this.fuseTime = 3000; // 3 seconds until orbital laser
        this.createdAt = Date.now();
        this.exploded = false;
        this.player = player;
        this.strikeRadius = 250;

        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const framesToTarget = Math.max(30, Math.min(80, distance / 4));

        this.vx = dx / framesToTarget;
        const totalGravityEffect = 0.5 * this.gravity * framesToTarget * framesToTarget;
        this.vy = (dy - totalGravityEffect) / framesToTarget;

        if (this.vy > -3) {
            this.vy = Math.min(this.vy, -3);
        }
    }

    update(canvasWidth, canvasHeight) {
        if (this.exploded) return;

        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

        const elapsed = Date.now() - this.createdAt;
        if (elapsed >= this.fuseTime) {
            this.explode();
            return;
        }

        if (!this.onGround) {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;

            if (!isSinglePlayerArcade) {
                if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.6; }
                if (this.x > canvasWidth - this.radius) { this.x = canvasWidth - this.radius; this.vx *= -0.6; }
                if (this.y < this.radius) { this.y = this.radius; this.vy *= -0.4; }
            }

            const dxToTarget = this.targetX - this.x;
            const dyToTarget = this.targetY - this.y;
            const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);
            const dot = this.vx * dxToTarget + this.vy * dyToTarget;

            if (distToTarget <= 15 || (dot < 0 && distToTarget <= 30)) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.vx = 0;
                this.vy = 0;
                this.onGround = true;
            }
            if (!isSinglePlayerArcade) {
                if (this.y >= canvasHeight - this.radius && this.targetY >= canvasHeight - 30) {
                    this.y = canvasHeight - this.radius;
                    if (!this.onGround) {
                        this.vy *= -this.bounce;
                        this.vx *= 0.7;
                        this.onGround = true;
                    } else {
                        this.vy = 0;
                        this.vx *= 0.9;
                    }
                }
            }
        } else {
            this.vx *= 0.9;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;

        // Massive explosion
        triggerExplosion(this.x, this.y, this.strikeRadius, 1500, true, this.player);
        
        // Massive screen shake
        gameState.shakeAmount = 40;

        // White flash effect via damage indicator logic
        gameState.playerDamageIndicatorLife = 20; // Re-use screen flash
    }

    draw() {
        if (this.exploded) return;

        const elapsed = Date.now() - this.createdAt;
        const timeLeft = Math.max(0, this.fuseTime - elapsed);
        const pulse = timeLeft < 1500 ? Math.sin(Date.now() / 30) * 0.5 + 0.5 : 1;

        // Draw danger zone (strike radius)
        ctx.save();
        if (this.onGround) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.strikeRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + (pulse * 0.15)})`;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + (pulse * 0.4)})`;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw the beacon itself
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Laser pointer shooting up
        if (this.onGround) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y - 1000);
            const laserGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y - 500);
            laserGrad.addColorStop(0, `rgba(255, 23, 68, ${0.8 * pulse})`);
            laserGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');
            ctx.strokeStyle = laserGrad;
            ctx.lineWidth = 4 + (pulse * 4);
            ctx.stroke();
        }

        // Blinking light
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
