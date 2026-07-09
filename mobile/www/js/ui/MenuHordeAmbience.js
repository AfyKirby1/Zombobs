/**
 * Ambient main-menu horde: distant silhouettes, ash, ember sparks.
 * [TRACE: SCRATCHPAD.md]
 */

const MAX_ZOMBIES = 14;
const MAX_ASH = 48;
const MAX_EMBERS = 18;
const SPAWN_EDGE_PAD = 0.06;

function rand(a, b) {
    return a + Math.random() * (b - a);
}

export class MenuHordeAmbience {
    constructor(getCanvas) {
        this.getCanvas = getCanvas;
        this.zombies = [];
        this.ash = [];
        this.embers = [];
        this.menuEnteredAt = Date.now();
        this._seeded = false;
    }

    reset() {
        this.zombies = [];
        this.ash = [];
        this.embers = [];
        this.menuEnteredAt = Date.now();
        this._seeded = false;
    }

    update(isMobile) {
        const canvas = this.getCanvas();
        if (!canvas) return;
        const width = canvas.width;
        const height = canvas.height;
        const now = Date.now();
        const cap = isMobile ? 8 : MAX_ZOMBIES;
        const ashCap = isMobile ? 24 : MAX_ASH;
        const emberCap = isMobile ? 8 : MAX_EMBERS;

        if (!this._seeded) {
            this._seeded = true;
            const seedCount = Math.min(cap, isMobile ? 5 : 9);
            for (let i = 0; i < seedCount; i++) {
                this.zombies.push(this._makeZombie(width, height, true));
            }
            for (let i = 0; i < ashCap; i++) {
                this.ash.push(this._makeAsh(width, height, true));
            }
            for (let i = 0; i < Math.floor(emberCap / 2); i++) {
                this.embers.push(this._makeEmber(width, height));
            }
        }

        while (this.zombies.length < cap && Math.random() < 0.04) {
            this.zombies.push(this._makeZombie(width, height, false));
        }

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            z.x += z.vx;
            z.bobPhase += z.bobSpeed;
            z.y = z.baseY + Math.sin(z.bobPhase) * z.bobAmp;
            z.armSwing += z.armSpeed;
            z.life++;

            if (z.life < 40) z.alpha = Math.min(z.maxAlpha, z.life / 40 * z.maxAlpha);
            else if (z.life > z.maxLife - 50) {
                z.alpha = Math.max(0, z.maxAlpha * ((z.maxLife - z.life) / 50));
            }

            const offL = z.x < -60;
            const offR = z.x > width + 60;
            if (offL || offR || z.life >= z.maxLife) {
                this.zombies.splice(i, 1);
            }
        }

        while (this.ash.length < ashCap) {
            this.ash.push(this._makeAsh(width, height, false));
        }
        for (let i = this.ash.length - 1; i >= 0; i--) {
            const a = this.ash[i];
            a.x += a.vx + Math.sin(now * 0.001 + a.seed) * 0.15;
            a.y += a.vy;
            a.rot += a.rotSpeed;
            a.life--;
            if (a.life <= 0 || a.y > height + 10 || a.x < -20 || a.x > width + 20) {
                this.ash.splice(i, 1);
            }
        }

        if (this.embers.length < emberCap && Math.random() < 0.08) {
            this.embers.push(this._makeEmber(width, height));
        }
        for (let i = this.embers.length - 1; i >= 0; i--) {
            const e = this.embers[i];
            e.x += e.vx;
            e.y += e.vy;
            e.vy -= 0.008;
            e.life--;
            if (e.life <= 0) this.embers.splice(i, 1);
        }
    }

    _makeZombie(width, height, seeded) {
        const fromLeft = Math.random() > 0.5;
        const band = height * (0.72 + Math.random() * 0.22);
        const depth = Math.random();
        const scale = 0.35 + depth * 0.85;
        const speed = (0.15 + depth * 0.55) * (fromLeft ? 1 : -1);
        const x = seeded
            ? rand(width * SPAWN_EDGE_PAD, width * (1 - SPAWN_EDGE_PAD))
            : (fromLeft ? -40 : width + 40);

        return {
            x,
            baseY: band,
            y: band,
            vx: speed,
            scale,
            depth,
            bobPhase: Math.random() * Math.PI * 2,
            bobSpeed: 0.04 + Math.random() * 0.05,
            bobAmp: 1.5 + scale * 2,
            armSwing: Math.random() * Math.PI * 2,
            armSpeed: 0.06 + Math.random() * 0.04,
            life: seeded ? 40 + Math.floor(Math.random() * 80) : 0,
            maxLife: 400 + Math.floor(Math.random() * 500),
            alpha: seeded ? 0.25 + depth * 0.35 : 0,
            maxAlpha: 0.22 + depth * 0.38,
            variant: Math.floor(Math.random() * 3),
            eyeGlow: Math.random() > 0.55,
            limp: Math.random() > 0.6
        };
    }

    _makeAsh(width, height, seeded) {
        return {
            x: Math.random() * width,
            y: seeded ? Math.random() * height : -5 - Math.random() * 40,
            vx: rand(-0.35, 0.35),
            vy: rand(0.2, 0.9),
            size: rand(1, 3.2),
            rot: Math.random() * Math.PI * 2,
            rotSpeed: rand(-0.04, 0.04),
            life: 180 + Math.floor(Math.random() * 220),
            seed: Math.random() * 100,
            alpha: rand(0.15, 0.45)
        };
    }

    _makeEmber(width, height) {
        const edge = Math.random();
        let x; let y;
        if (edge < 0.35) {
            x = Math.random() * width;
            y = height * 0.85 + Math.random() * height * 0.15;
        } else if (edge < 0.7) {
            x = Math.random() < 0.5 ? rand(0, width * 0.15) : rand(width * 0.85, width);
            y = rand(height * 0.4, height);
        } else {
            x = Math.random() * width;
            y = rand(height * 0.55, height);
        }
        return {
            x,
            y,
            vx: rand(-0.4, 0.4),
            vy: rand(-1.2, -0.3),
            size: rand(1.2, 2.8),
            life: 40 + Math.floor(Math.random() * 50),
            maxLife: 90,
            hot: Math.random() > 0.4
        };
    }

    draw(ctx, width, height) {
        ctx.save();

        // Ground fog band behind horde
        const fogGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
        fogGrad.addColorStop(0, 'rgba(8, 12, 10, 0)');
        fogGrad.addColorStop(0.45, 'rgba(12, 18, 14, 0.35)');
        fogGrad.addColorStop(1, 'rgba(6, 10, 8, 0.55)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, height * 0.65, width, height * 0.35);

        // Far → near so depth reads
        const sorted = this.zombies.slice().sort((a, b) => a.depth - b.depth);
        for (let i = 0; i < sorted.length; i++) {
            this._drawZombie(ctx, sorted[i]);
        }

        for (let i = 0; i < this.ash.length; i++) {
            const a = this.ash[i];
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rot);
            ctx.globalAlpha = a.alpha * Math.min(1, a.life / 40);
            ctx.fillStyle = '#6a6a5a';
            ctx.fillRect(-a.size * 0.5, -a.size * 0.5, a.size, a.size * 0.7);
            ctx.restore();
        }

        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            const t = e.life / e.maxLife;
            ctx.globalAlpha = t * 0.85;
            ctx.shadowBlur = e.hot ? 10 : 5;
            ctx.shadowColor = e.hot ? 'rgba(255, 120, 40, 0.9)' : 'rgba(255, 80, 40, 0.6)';
            ctx.fillStyle = e.hot ? '#ffab40' : '#ff5722';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size * t, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    _drawZombie(ctx, z) {
        ctx.save();
        ctx.globalAlpha = z.alpha;
        ctx.translate(z.x, z.y);
        ctx.scale(z.scale, z.scale);

        const limpLean = z.limp ? Math.sin(z.bobPhase) * 0.08 : 0;
        ctx.rotate(limpLean);

        const body = `rgba(${18 + z.depth * 20}, ${22 + z.depth * 18}, ${16 + z.depth * 12}, 1)`;
        const outline = `rgba(0, 0, 0, ${0.45 + z.depth * 0.3})`;

        // Legs
        const legSwing = Math.sin(z.armSwing) * 6;
        ctx.fillStyle = body;
        ctx.fillRect(-7, 8, 5, 16 + legSwing * 0.15);
        ctx.fillRect(2, 8, 5, 16 - legSwing * 0.15);

        // Torso
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Arms reach forward
        const arm = Math.sin(z.armSwing) * 10;
        ctx.strokeStyle = body;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(-18 - arm * 0.3, 4 + arm * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -2);
        ctx.lineTo(16 + arm * 0.25, 2 + arm * 0.15);
        ctx.stroke();

        // Head
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, -16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Variant: hunched / tall / crawler-ish
        if (z.variant === 1) {
            ctx.fillStyle = body;
            ctx.beginPath();
            ctx.ellipse(2, -6, 6, 4, 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (z.variant === 2) {
            ctx.fillRect(-3, -24, 2, 6);
            ctx.fillRect(1, -23, 2, 5);
        }

        if (z.eyeGlow) {
            const pulse = 0.55 + 0.45 * Math.sin(Date.now() * 0.006 + z.bobPhase);
            ctx.globalAlpha = z.alpha * pulse;
            ctx.fillStyle = '#ff1744';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
            ctx.ellipse(-2.5, -17, 1.4, 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(2.5, -17, 1.4, 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
