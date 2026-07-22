/**
 * Ground/scorch/blood decal ring buffer (Canvas draw under entities).
 * [TRACE: engine_vfx_modernize]
 */
import { ctx } from '../core/canvas.js';

const MAX_DECALS = 128;

class DecalSystem {
    constructor() {
        this.decals = [];
        this.writeIndex = 0;
    }

    clear() {
        this.decals.length = 0;
        this.writeIndex = 0;
    }

    /**
     * @param {'blood'|'scorch'|'ember'} type
     * @param {number} x
     * @param {number} y
     * @param {number} [radius=12]
     * @param {number} [life=600] frames-ish (decremented each update)
     */
    add(type, x, y, radius = 12, life = 600) {
        const entry = {
            type,
            x,
            y,
            radius,
            life,
            maxLife: life,
            rotation: Math.random() * Math.PI * 2,
        };
        if (this.decals.length < MAX_DECALS) {
            this.decals.push(entry);
        } else {
            this.decals[this.writeIndex % MAX_DECALS] = entry;
            this.writeIndex++;
        }
    }

    addBlood(x, y, amount = 0.5) {
        this.add('blood', x, y, 8 + amount * 16, 900);
    }

    addScorch(x, y, size = 1) {
        this.add('scorch', x, y, 20 * size, 1200);
    }

    update() {
        for (let i = this.decals.length - 1; i >= 0; i--) {
            this.decals[i].life--;
            if (this.decals[i].life <= 0) {
                this.decals.splice(i, 1);
            }
        }
    }

    draw(camera = null) {
        if (!ctx || this.decals.length === 0) return;
        for (let i = 0; i < this.decals.length; i++) {
            const d = this.decals[i];
            const alpha = Math.max(0, d.life / d.maxLife) * 0.55;
            if (alpha < 0.02) continue;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
            if (d.type === 'blood') {
                ctx.fillStyle = `rgba(100, 0, 8, ${alpha})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, d.radius, d.radius * 0.65, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'scorch') {
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius);
                g.addColorStop(0, `rgba(20, 12, 8, ${alpha * 0.9})`);
                g.addColorStop(0.6, `rgba(40, 25, 15, ${alpha * 0.4})`);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = `rgba(255, 120, 20, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(0, 0, d.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

export const decalSystem = new DecalSystem();
