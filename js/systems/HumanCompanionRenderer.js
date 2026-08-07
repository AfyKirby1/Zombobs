/**
 * HumanCompanionRenderer.js - Role-specific gear layers for hireable heroes,
 * recruited survivors, and campaign survivor NPCs.
 *
 * Split out of PlayerRenderer so the human cast can carry far more silhouette
 * detail (kit, headgear, ground identity, wear-and-tear) without bloating the
 * shared player draw path. Everything here is procedural Canvas 2D — the human
 * cast is small in count, so per-character detail is affordable.
 *
 * [TRACE: ARCHITECTURE.md]
 */

import { ctx } from '../core/canvas.js';
import { graphicsSettings } from './GraphicsSystem.js';

// Role identity: accent stays an accent so squadmates read as gritty humans,
// while kit/cloth/metal give each role a distinct silhouette at a glance.
export const ROLE_KITS = {
    warrior: { accent: '#ff5252', glow: '255, 82, 82', kit: 'riot', cloth: '#4a2b2b', metal: '#7d8a92', mark: 'shield' },
    ranger: { accent: '#76ff8a', glow: '118, 255, 138', kit: 'scout', cloth: '#2f4034', metal: '#6f7d70', mark: 'chevron' },
    medic: { accent: '#40c4ff', glow: '64, 196, 255', kit: 'field', cloth: '#cddbe4', metal: '#8fa6b3', mark: 'cross' },
    scavenger: { accent: '#ffd740', glow: '255, 215, 64', kit: 'junk', cloth: '#4a3c22', metal: '#8a7a55', mark: 'dots' },
    default: { accent: '#b0bec5', glow: '176, 190, 197', kit: 'field', cloth: '#33403f', metal: '#78868c', mark: 'bar' }
};

export function getRoleKit(subject) {
    return ROLE_KITS[subject?.heroRole || subject?.role] || ROLE_KITS.default;
}

export function isHumanCompanion(subject) {
    return !!(subject && (subject.isHero || subject.isSurvivor));
}

/** Stable per-character jitter so grime and dangling gear differ between units. */
function unitSeed(subject) {
    const key = subject?.heroId || subject?.id || subject?.name || 'unit';
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
    return h / 9973;
}

function healthFraction(subject) {
    const max = subject?.maxHealth || 0;
    if (max <= 0) return 1;
    return Math.max(0, Math.min(1, (subject.health || 0) / max));
}

/**
 * Ground identity ring + footfall dust. Drawn under the body so companions stay
 * findable in a horde without floating UI markers.
 */
export function drawCompanionGroundMark(subject, pose) {
    if (!isHumanCompanion(subject)) return;
    const quality = graphicsSettings.getQualityValues('aura');
    if (quality.opacity <= 0) return;

    const { x, y, radius } = subject;
    const kit = getRoleKit(subject);
    const now = Date.now();
    const ringY = y + radius * 1.15;
    const rx = radius * 1.05;
    const ry = rx * 0.34;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.30 * quality.opacity;
    ctx.strokeStyle = kit.accent;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([radius * 0.5, radius * 0.42]);
    ctx.lineDashOffset = -now / 90;
    ctx.beginPath();
    ctx.ellipse(x, ringY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Facing tick: cheap orientation read for AI squadmates.
    ctx.globalAlpha = 0.45 * quality.opacity;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(subject.angle || 0) * rx * 0.72, ringY + Math.sin(subject.angle || 0) * ry * 0.72);
    ctx.lineTo(x + Math.cos(subject.angle || 0) * rx * 1.15, ringY + Math.sin(subject.angle || 0) * ry * 1.15);
    ctx.stroke();
    ctx.restore();

    if (pose.amount > 0.35) {
        const dust = (1 - pose.bob) * 0.22 * pose.amount;
        if (dust > 0.02) {
            ctx.save();
            ctx.globalAlpha = dust;
            ctx.strokeStyle = '#9b9384';
            ctx.lineWidth = 1.2;
            for (let i = -1; i <= 1; i += 2) {
                ctx.beginPath();
                ctx.arc(x + i * radius * 0.55, ringY + ry * 0.35, radius * (0.22 + pose.bob * 0.14), Math.PI * 1.05, Math.PI * 1.95);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}

function drawPauldron(x, y, radius, side, kit) {
    ctx.beginPath();
    ctx.moveTo(x + side * radius * 0.42, y - radius * 0.22);
    ctx.quadraticCurveTo(x + side * radius * 0.95, y - radius * 0.34, x + side * radius * 0.92, y + radius * 0.10);
    ctx.quadraticCurveTo(x + side * radius * 0.66, y + radius * 0.24, x + side * radius * 0.40, y + radius * 0.14);
    ctx.closePath();
    ctx.fillStyle = kit.metal;
    ctx.fill();
    ctx.strokeStyle = '#12181c';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Rim light sells the plate as curved metal.
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(x + side * radius * 0.48, y - radius * 0.18);
    ctx.quadraticCurveTo(x + side * radius * 0.86, y - radius * 0.28, x + side * radius * 0.84, y + radius * 0.04);
    ctx.stroke();
}

function drawPouchBelt(x, torsoY, radius, kit, seed) {
    ctx.fillStyle = '#20282c';
    ctx.fillRect(x - radius * 0.62, torsoY + radius * 0.30, radius * 1.24, radius * 0.20);
    ctx.fillStyle = kit.cloth;
    for (let i = -1; i <= 1; i++) {
        const w = radius * (0.20 + ((seed * 7 + i + 3) % 1) * 0.10);
        ctx.fillRect(x + i * radius * 0.40 - w / 2, torsoY + radius * 0.34, w, radius * 0.26);
    }
    ctx.strokeStyle = '#11171a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - radius * 0.62, torsoY + radius * 0.30, radius * 1.24, radius * 0.20);
}

function drawGrime(x, torsoY, radius, seed) {
    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = '#0d1215';
    for (let i = 0; i < 3; i++) {
        const a = (seed * 6.28 + i * 2.1);
        ctx.beginPath();
        ctx.ellipse(
            x + Math.cos(a) * radius * 0.42,
            torsoY + Math.sin(a) * radius * 0.34,
            radius * (0.16 + (i % 2) * 0.08),
            radius * 0.11,
            a,
            0, Math.PI * 2
        );
        ctx.fill();
    }
    ctx.restore();
}

function drawRoleMark(x, torsoY, radius, kit, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = kit.accent;
    ctx.fillStyle = kit.accent;
    ctx.lineWidth = Math.max(1, radius * 0.09);

    if (kit.mark === 'cross') {
        ctx.fillRect(x - radius * 0.09, torsoY - radius * 0.24, radius * 0.18, radius * 0.48);
        ctx.fillRect(x - radius * 0.24, torsoY - radius * 0.09, radius * 0.48, radius * 0.18);
    } else if (kit.mark === 'shield') {
        ctx.beginPath();
        ctx.moveTo(x, torsoY - radius * 0.30);
        ctx.lineTo(x + radius * 0.23, torsoY - radius * 0.13);
        ctx.lineTo(x + radius * 0.14, torsoY + radius * 0.24);
        ctx.lineTo(x, torsoY + radius * 0.35);
        ctx.lineTo(x - radius * 0.14, torsoY + radius * 0.24);
        ctx.lineTo(x - radius * 0.23, torsoY - radius * 0.13);
        ctx.closePath();
        ctx.stroke();
    } else if (kit.mark === 'chevron') {
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.22, torsoY - radius * 0.18);
        ctx.lineTo(x, torsoY + radius * 0.10);
        ctx.lineTo(x + radius * 0.22, torsoY - radius * 0.18);
        ctx.stroke();
    } else if (kit.mark === 'dots') {
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(x + i * radius * 0.17, torsoY, radius * 0.075, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.24, torsoY);
        ctx.lineTo(x + radius * 0.24, torsoY);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Torso-level kit. `view` is `{ facingBack, isFront, side }` so callers keep
 * ownership of the direction mapping.
 */
export function drawCompanionGear(subject, torsoY, pose, view) {
    if (!isHumanCompanion(subject)) return;

    const { x, radius } = subject;
    const kit = getRoleKit(subject);
    const seed = unitSeed(subject);
    const now = Date.now();
    const swing = pose.stride * radius * 0.22;
    const hp = healthFraction(subject);

    ctx.save();
    ctx.lineCap = 'round';

    if (kit.kit === 'riot') {
        // Heavy plating: broad shoulders, chest slab, breaching axe on the back.
        if (view.facingBack || view.side !== 0) {
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = Math.max(3, radius * 0.20);
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.45, torsoY + radius * 0.32);
            ctx.lineTo(x + radius * 0.50, torsoY - radius * 0.40);
            ctx.stroke();
            ctx.strokeStyle = kit.metal;
            ctx.lineWidth = Math.max(2, radius * 0.12);
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.34, torsoY - radius * 0.30);
            ctx.lineTo(x + radius * 0.62, torsoY - radius * 0.52);
            ctx.stroke();
        }
        ctx.fillStyle = kit.metal;
        ctx.beginPath();
        ctx.ellipse(x, torsoY - radius * 0.04, radius * 0.52, radius * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10161a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        drawPauldron(x, torsoY - radius * 0.10, radius, -1, kit);
        drawPauldron(x, torsoY - radius * 0.10, radius, 1, kit);
    } else if (kit.kit === 'scout') {
        // Light cloak + quiver: tall, ragged silhouette.
        ctx.fillStyle = kit.cloth;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.58, torsoY - radius * 0.34);
        ctx.quadraticCurveTo(x - radius * 0.86 - swing, torsoY + radius * 0.36, x - radius * 0.42 - swing, torsoY + radius * 0.62);
        ctx.lineTo(x + radius * 0.42 - swing, torsoY + radius * 0.62);
        ctx.quadraticCurveTo(x + radius * 0.86 - swing, torsoY + radius * 0.36, x + radius * 0.58, torsoY - radius * 0.34);
        ctx.closePath();
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#161f19';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = '#3d2f20';
        ctx.lineWidth = Math.max(2, radius * 0.14);
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.42, torsoY + radius * 0.24);
        ctx.lineTo(x + radius * 0.44, torsoY - radius * 0.30);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = i === 1 ? '#d9cbb0' : '#8d7c5f';
            ctx.lineWidth = Math.max(1, radius * 0.07);
            ctx.beginPath();
            ctx.moveTo(x + radius * (0.40 + i * 0.08), torsoY - radius * 0.22);
            ctx.lineTo(x + radius * (0.58 + i * 0.10), torsoY - radius * 0.66);
            ctx.stroke();
        }
    } else if (kit.kit === 'field') {
        // Field coat with open lapels plus a satchel that hangs off one hip.
        ctx.fillStyle = kit.cloth;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.52, torsoY - radius * 0.36);
        ctx.lineTo(x - radius * 0.18, torsoY - radius * 0.30);
        ctx.lineTo(x - radius * 0.22, torsoY + radius * 0.56);
        ctx.lineTo(x - radius * 0.60, torsoY + radius * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + radius * 0.52, torsoY - radius * 0.36);
        ctx.lineTo(x + radius * 0.18, torsoY - radius * 0.30);
        ctx.lineTo(x + radius * 0.22, torsoY + radius * 0.56);
        ctx.lineTo(x + radius * 0.60, torsoY + radius * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,28,32,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#2b3a42';
        ctx.fillRect(x + radius * 0.36, torsoY + radius * 0.16 + swing * 0.4, radius * 0.42, radius * 0.36);
        ctx.strokeStyle = '#0f1519';
        ctx.strokeRect(x + radius * 0.36, torsoY + radius * 0.16 + swing * 0.4, radius * 0.42, radius * 0.36);
    } else {
        // Junk kit: overloaded pack with tools that swing on the stride.
        ctx.fillStyle = kit.cloth;
        ctx.beginPath();
        ctx.ellipse(x, torsoY - radius * 0.02, radius * 0.56, radius * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#181206';
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
            const hx = x + i * radius * 0.36;
            const hy = torsoY + radius * 0.34;
            ctx.strokeStyle = kit.metal;
            ctx.lineWidth = Math.max(1.5, radius * 0.08);
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx + swing * (0.6 + i * 0.2), hy + radius * 0.40);
            ctx.stroke();
            ctx.fillStyle = '#6f6244';
            ctx.beginPath();
            ctx.arc(hx + swing * (0.6 + i * 0.2), hy + radius * 0.44, radius * 0.09, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPouchBelt(x, torsoY, radius, kit, seed);
    drawGrime(x, torsoY, radius, seed);

    // Field dressing: wounded companions look wounded before they die.
    if (hp < 0.5) {
        ctx.strokeStyle = 'rgba(226, 218, 200, 0.85)';
        ctx.lineWidth = Math.max(2, radius * 0.13);
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.46, torsoY + radius * 0.02);
        ctx.lineTo(x + radius * 0.40, torsoY + radius * 0.22);
        ctx.stroke();
        ctx.strokeStyle = `rgba(140, 20, 20, ${0.35 + (1 - hp) * 0.4})`;
        ctx.lineWidth = Math.max(1, radius * 0.08);
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.10, torsoY + radius * 0.08);
        ctx.lineTo(x + radius * 0.06, torsoY + radius * 0.16);
        ctx.stroke();
    }

    if (!view.facingBack) {
        drawRoleMark(x, torsoY, radius, kit, 0.58 + Math.sin(now / 180 + seed * 6) * 0.18);
    }
    ctx.restore();
}

/**
 * Headgear pass drawn on top of the shared helmet: hoods, visors, goggles and
 * headlamps carry most of the role read at gameplay zoom.
 */
export function drawCompanionHeadgear(subject, x, headY, headRadius, view, pose) {
    if (!isHumanCompanion(subject)) return;

    const kit = getRoleKit(subject);
    const now = Date.now();
    const quality = graphicsSettings.getQualityValues('aura');

    ctx.save();
    if (kit.kit === 'riot') {
        ctx.fillStyle = kit.metal;
        ctx.beginPath();
        ctx.moveTo(x - headRadius * 0.12, headY - headRadius * 1.35);
        ctx.lineTo(x + headRadius * 0.12, headY - headRadius * 1.35);
        ctx.lineTo(x + headRadius * 0.10, headY - headRadius * 0.35);
        ctx.lineTo(x - headRadius * 0.10, headY - headRadius * 0.35);
        ctx.closePath();
        ctx.fill();
        if (!view.facingBack) {
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = kit.accent;
            ctx.globalAlpha = 0.55 + Math.sin(now / 200) * 0.15;
            ctx.fillRect(x - headRadius * 0.78, headY - headRadius * 0.14, headRadius * 1.56, headRadius * 0.20);
        }
    } else if (kit.kit === 'scout') {
        ctx.fillStyle = kit.cloth;
        ctx.beginPath();
        ctx.moveTo(x - headRadius * 1.15, headY + headRadius * 0.30);
        ctx.quadraticCurveTo(x, headY - headRadius * 1.85, x + headRadius * 1.15, headY + headRadius * 0.30);
        ctx.quadraticCurveTo(x, headY + headRadius * 0.05, x - headRadius * 1.15, headY + headRadius * 0.30);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#141c17';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (!view.facingBack) {
            // Rangefinder monocle over one eye.
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = kit.accent;
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(x + headRadius * 0.42, headY - headRadius * 0.05, headRadius * 0.26, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (kit.kit === 'field') {
        ctx.fillStyle = kit.cloth;
        ctx.beginPath();
        ctx.arc(x, headY - headRadius * 0.30, headRadius * 0.95, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = kit.accent;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x - headRadius * 0.09, headY - headRadius * 1.02, headRadius * 0.18, headRadius * 0.44);
        ctx.fillRect(x - headRadius * 0.22, headY - headRadius * 0.89, headRadius * 0.44, headRadius * 0.18);
        if (!view.facingBack && quality.opacity > 0) {
            // Headlamp bleed: reads as a working medic in dark campaign zones.
            const lamp = ctx.createRadialGradient(x, headY - headRadius * 0.5, 0, x, headY - headRadius * 0.5, headRadius * 2.2);
            lamp.addColorStop(0, `rgba(${kit.glow}, ${0.22 * quality.opacity})`);
            lamp.addColorStop(1, `rgba(${kit.glow}, 0)`);
            ctx.fillStyle = lamp;
            ctx.beginPath();
            ctx.arc(x, headY - headRadius * 0.5, headRadius * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Goggles: pushed up on the forehead, lenses catch the light.
        ctx.strokeStyle = '#241c0e';
        ctx.lineWidth = Math.max(2, headRadius * 0.16);
        ctx.beginPath();
        ctx.moveTo(x - headRadius * 1.0, headY - headRadius * 0.55);
        ctx.lineTo(x + headRadius * 1.0, headY - headRadius * 0.55);
        ctx.stroke();
        for (let i = -1; i <= 1; i += 2) {
            ctx.fillStyle = '#3b3320';
            ctx.beginPath();
            ctx.arc(x + i * headRadius * 0.42, headY - headRadius * 0.62, headRadius * 0.30, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = kit.accent;
            ctx.globalAlpha = 0.35 + Math.sin(now / 260 + i) * 0.12;
            ctx.beginPath();
            ctx.arc(x + i * headRadius * 0.42, headY - headRadius * 0.66, headRadius * 0.17, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore();

    // Comms antenna sways with movement — subtle life on every role.
    ctx.save();
    ctx.strokeStyle = '#2a3338';
    ctx.lineWidth = Math.max(1, headRadius * 0.10);
    const tipX = x - headRadius * 0.85 + pose.stride * headRadius * 0.18;
    ctx.beginPath();
    ctx.moveTo(x - headRadius * 0.72, headY - headRadius * 0.20);
    ctx.quadraticCurveTo(x - headRadius * 0.95, headY - headRadius * 1.0, tipX, headY - headRadius * 1.7);
    ctx.stroke();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = kit.accent;
    ctx.globalAlpha = 0.4 + Math.sin(now / 150) * 0.3;
    ctx.beginPath();
    ctx.arc(tipX, headY - headRadius * 1.7, Math.max(1, headRadius * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
