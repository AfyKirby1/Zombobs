import { ctx } from '../core/canvas.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';
import { parseColorToRgba, PARTICLE_KIND } from '../utils/colorParse.js';

export class Particle {
    constructor(x, y, color) {
        this.reset(x, y, color);
    }

    reset(x, y, color, props = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = props.radius !== undefined ? props.radius : Math.random() * 3 + 1;
        this.vx = props.vx !== undefined ? props.vx : (Math.random() - 0.5) * 4;
        this.vy = props.vy !== undefined ? props.vy : (Math.random() - 0.5) * 4;
        this.life = props.life !== undefined ? props.life : 30;
        this.maxLife = props.maxLife !== undefined ? props.maxLife : (props.life || 30);

        this.type = props.type !== undefined ? props.type : PARTICLE_KIND.spark;
        this.drag = props.drag !== undefined ? props.drag : 1;
        this.gravity = props.gravity !== undefined ? props.gravity : 0;
        this.fadeMode = props.fadeMode || 'linear';
        this.blendHint = props.blendHint || 'alpha';
        this.sizeOverLife = props.sizeOverLife !== undefined ? props.sizeOverLife : 1;
        this.rgba = props.rgba || parseColorToRgba(color);

        this.customUpdate = null;
        this.customDraw = null;
    }

    update() {
        if (this.customUpdate) {
            this.customUpdate();
            return;
        }
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        if (this.sizeOverLife !== 1 && this.maxLife > 0) {
            const t = this.life / this.maxLife;
            // shrink or grow toward end based on sizeOverLife factor
            this.radius *= 1 + (this.sizeOverLife - 1) * 0.02 * (1 - t);
        }
        this.life--;
    }
}

export class DamageNumber {
    constructor(x, y, value, isCrit = false, customColor = null, customFontSize = null) {
        this.style = graphicsSettings.damageNumberStyle;
        DamageNumber._sequence = ((DamageNumber._sequence || 0) + 1) % 4;
        this.x = this.style === 'stacking' ? x : x + (Math.random() - 0.5) * 10;
        this.y = this.style === 'stacking' ? y - DamageNumber._sequence * 7 : y;
        this.value = value;
        this.isCrit = isCrit;
        this.customColor = customColor;
        this.customFontSize = customFontSize;
        this.life = this.style === 'stacking' ? 72 : 60;
        this.maxLife = this.life;
        this.vy = this.style === 'stacking' ? -0.75 : (isCrit ? -2.0 : -1.5);
        this.vx = this.style === 'stacking' ? 0 : (Math.random() - 0.5) * 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03;
        this.life--;
    }

    draw(ctx) {
        if (this.life <= 0 || graphicsSettings.damageNumberStyle === 'off') return;
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        const damageQuality = graphicsSettings.getQualityValues('damageNumber');
        const baseFontSize = this.customFontSize !== null
            ? this.customFontSize
            : (this.isCrit ? (this.value === "CRIT!" ? 20 : 22) : 16);
        const fontSize = baseFontSize * damageQuality.fontSize * graphicsSettings.damageNumberScale;

        if (this.isCrit) {
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';

            const gradient = ctx.createLinearGradient(this.x - 30, this.y, this.x + 30, this.y);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, ${alpha})`);
            ctx.fillStyle = gradient;

            if (damageQuality.hasGlow) {
                ctx.shadowColor = `rgba(255, 0, 0, ${0.8 * damageQuality.glowIntensity})`;
                ctx.shadowBlur = 8 * damageQuality.glowIntensity;
            } else {
                ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                ctx.shadowBlur = 8;
            }

            if (damageQuality.hasOutline) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
                ctx.lineWidth = damageQuality.outlineWidth;
                ctx.strokeText(this.value, this.x, this.y);
            }

            ctx.fillText(this.value, this.x, this.y);
        } else {
            if (this.customColor) {
                const r = parseInt(this.customColor.slice(1, 3), 16);
                const g = parseInt(this.customColor.slice(3, 5), 16);
                const b = parseInt(this.customColor.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
            }
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';

            if (damageQuality.hasGlow) {
                ctx.shadowColor = `rgba(0, 0, 0, ${0.7 * damageQuality.glowIntensity})`;
                ctx.shadowBlur = 4 * damageQuality.glowIntensity;
            } else {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 4;
            }

            if (damageQuality.hasOutline) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
                ctx.lineWidth = damageQuality.outlineWidth;
                ctx.strokeText(this.value, this.x, this.y);
            }

            ctx.fillText(this.value, this.x, this.y);
        }

        ctx.restore();
    }
}
