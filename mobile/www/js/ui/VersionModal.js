/**
 * Spooky arcade-cabinet patch-notes modal for the main-menu version badge.
 */

import { GAME_VERSION, ENGINE_VERSION, VERSION_HISTORY } from '../core/constants.js';

function flickerAlpha(t) {
    const fast = Math.sin(t / 90) * 0.5 + 0.5;
    const slow = Math.sin(t / 430) > 0.2 ? 1 : 0.35;
    return 0.72 + 0.28 * fast * slow;
}

export class VersionModal {
    constructor(getCanvas) {
        this.getCanvas = getCanvas;
        this._layout = null;
    }

    getLayout(scale) {
        const canvas = this.getCanvas();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const modalWidth = Math.min(580 * scale, canvas.width - 48);
        const modalHeight = Math.min(480 * scale, canvas.height - 56);
        const layout = {
            x: centerX - modalWidth / 2,
            y: centerY - modalHeight / 2,
            width: modalWidth,
            height: modalHeight,
            centerX,
            centerY,
            scale,
            closeBtn: null
        };
        const btnW = 140 * scale;
        const btnH = 38 * scale;
        layout.closeBtn = {
            x: centerX - btnW / 2,
            y: layout.y + modalHeight - (52 * scale),
            width: btnW,
            height: btnH
        };
        this._layout = layout;
        return layout;
    }

    draw(ctx, hud, scale) {
        const layout = this.getLayout(scale);
        const { x, y, width, height, centerX, closeBtn } = layout;
        const t = Date.now();

        // Dim the bar floor behind the cabinet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, 0, this.getCanvas().width, this.getCanvas().height);

        ctx.save();

        // Outer Halloween neon frame
        const glow = flickerAlpha(t);
        ctx.shadowBlur = 22 * scale;
        ctx.shadowColor = `rgba(255, 111, 0, ${0.55 * glow})`;
        ctx.strokeStyle = `rgba(255, 111, 0, ${0.95 * glow})`;
        ctx.lineWidth = 3 * scale;
        ctx.strokeRect(x - 4 * scale, y - 4 * scale, width + 8 * scale, height + 8 * scale);
        ctx.shadowBlur = 0;

        // Inner purple trim
        ctx.strokeStyle = 'rgba(156, 39, 176, 0.75)';
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeRect(x + 2 * scale, y + 2 * scale, width - 4 * scale, height - 4 * scale);

        // Cabinet body
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + height);
        bodyGrad.addColorStop(0, 'rgba(18, 8, 12, 0.98)');
        bodyGrad.addColorStop(0.45, 'rgba(12, 10, 18, 0.98)');
        bodyGrad.addColorStop(1, 'rgba(8, 6, 10, 0.99)');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(x, y, width, height);

        this._drawCobweb(ctx, x + 14 * scale, y + 14 * scale, scale, 1);
        this._drawCobweb(ctx, x + width - 14 * scale, y + 14 * scale, scale, -1);
        this._drawBloodDrips(ctx, x, y, width, scale, t);

        // Marquee header strip
        const marqueeH = 54 * scale;
        const marqueeGrad = ctx.createLinearGradient(x, y, x, y + marqueeH);
        marqueeGrad.addColorStop(0, 'rgba(40, 12, 8, 0.95)');
        marqueeGrad.addColorStop(1, 'rgba(20, 6, 10, 0.9)');
        ctx.fillStyle = marqueeGrad;
        ctx.fillRect(x, y, width, marqueeH);

        // Marquee bulb string
        const bulbCount = 9;
        const bulbSpacing = width / (bulbCount + 1);
        for (let i = 1; i <= bulbCount; i++) {
            const bx = x + bulbSpacing * i;
            const by = y + 10 * scale;
            const on = Math.sin(t / 180 + i * 1.7) > -0.15;
            ctx.beginPath();
            ctx.arc(bx, by, 3.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = on ? `rgba(255, 193, 7, ${0.85 * glow})` : 'rgba(60, 30, 10, 0.6)';
            if (on) {
                ctx.shadowBlur = 10 * scale;
                ctx.shadowColor = 'rgba(255, 193, 7, 0.8)';
            }
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        const titleSize = Math.max(26, 34 * scale);
        ctx.font = `${titleSize}px "Creepster", cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 87, 34, ${glow})`;
        ctx.shadowBlur = 16 * scale;
        ctx.shadowColor = 'rgba(255, 87, 34, 0.7)';
        ctx.fillText('PATCH NOTES', centerX, y + marqueeH / 2 + 4 * scale);
        ctx.shadowBlur = 0;

        // Current build plaque
        const plaqueY = y + marqueeH + 14 * scale;
        const plaqueH = 52 * scale;
        ctx.fillStyle = 'rgba(255, 23, 68, 0.12)';
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.55)';
        ctx.lineWidth = 1 * scale;
        ctx.fillRect(x + 18 * scale, plaqueY, width - 36 * scale, plaqueH);
        ctx.strokeRect(x + 18 * scale, plaqueY, width - 36 * scale, plaqueH);

        const verSize = Math.max(18, 22 * scale);
        ctx.font = `bold ${verSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#ff5252';
        ctx.textAlign = 'center';
        ctx.fillText(GAME_VERSION, centerX, plaqueY + 18 * scale);

        const current = VERSION_HISTORY[0];
        const subSize = Math.max(10, 12 * scale);
        ctx.font = `${subSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#ffb74d';
        ctx.fillText(current?.codename ? `— ${current.codename} —` : '', centerX, plaqueY + 38 * scale);

        // Scroll panel
        const listX = x + 20 * scale;
        const listY = plaqueY + plaqueH + 12 * scale;
        const listW = width - 40 * scale;
        const listH = height - (plaqueY - y) - plaqueH - 88 * scale;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(listX, listY, listW, listH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(listX, listY, listW, listH);

        ctx.save();
        ctx.beginPath();
        ctx.rect(listX, listY, listW, listH);
        ctx.clip();

        let entryY = listY + 10 * scale;
        const entrySize = Math.max(10, 11 * scale);
        const bulletSize = Math.max(9, 10 * scale);

        for (let i = 0; i < VERSION_HISTORY.length; i++) {
            const entry = VERSION_HISTORY[i];
            if (entryY > listY + listH - 8 * scale) break;

            const isCurrent = i === 0;
            ctx.font = `bold ${entrySize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.fillStyle = isCurrent ? '#ff9800' : '#b0bec5';
            const tag = entry.tag ? `  ${entry.tag}` : '';
            ctx.fillText(`${entry.version}${tag}`, listX + 10 * scale, entryY);
            entryY += 16 * scale;

            ctx.font = `${bulletSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = 'rgba(255, 183, 77, 0.75)';
            ctx.fillText(entry.codename, listX + 10 * scale, entryY);
            entryY += 14 * scale;

            const maxBullets = isCurrent ? 4 : 2;
            for (let h = 0; h < Math.min(maxBullets, entry.highlights.length); h++) {
                if (entryY > listY + listH - 6 * scale) break;
                ctx.fillStyle = 'rgba(200, 200, 200, 0.72)';
                ctx.fillText(`  • ${entry.highlights[h]}`, listX + 10 * scale, entryY);
                entryY += 13 * scale;
            }
            entryY += 8 * scale;
        }

        ctx.restore();

        // Engine stamp
        const stampSize = Math.max(8, 9 * scale);
        ctx.font = `${stampSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(120, 120, 120, 0.65)';
        ctx.fillText(ENGINE_VERSION, centerX, closeBtn.y - 14 * scale);

        // Close button
        const closeHovered = hud.mainMenuScreen?.hoveredButton === 'version_close';
        hud.drawMenuButton('CLOSE', closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height, closeHovered, false);

        ctx.restore();
    }

    checkClick(x, y, scale) {
        const layout = this.getLayout(scale);
        const { x: mx, y: my, width, height, closeBtn } = layout;

        if (x >= closeBtn.x && x <= closeBtn.x + closeBtn.width &&
            y >= closeBtn.y && y <= closeBtn.y + closeBtn.height) {
            return 'version_close';
        }

        if (x < mx || x > mx + width || y < my || y > my + height) {
            return 'version_background';
        }

        return null;
    }

    _drawCobweb(ctx, cx, cy, scale, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flip, 1);
        ctx.strokeStyle = 'rgba(180, 180, 200, 0.18)';
        ctx.lineWidth = 1 * scale;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI / 2) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 28 * scale, Math.sin(angle) * 28 * scale);
            ctx.stroke();
        }
        for (let r = 8; r <= 24; r += 8) {
            ctx.beginPath();
            ctx.arc(0, 0, r * scale, 0, Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawBloodDrips(ctx, x, y, width, scale, t) {
        const drips = [0.12, 0.34, 0.58, 0.81];
        for (let i = 0; i < drips.length; i++) {
            const dx = x + width * drips[i];
            const len = (10 + (i % 3) * 6) * scale;
            const wobble = Math.sin(t / 400 + i) * 2 * scale;
            ctx.fillStyle = `rgba(140, 0, 0, ${0.35 + 0.15 * Math.sin(t / 300 + i)})`;
            ctx.beginPath();
            ctx.ellipse(dx + wobble, y + len, 2.5 * scale, len * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
