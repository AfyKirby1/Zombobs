/**
 * SurvivorNpcRenderer.js - Detailed campaign survivor NPC model.
 *
 * Campaign contacts (Rook/Pip/June/Holt) are the only humans the player meets
 * who are not shooting, so they carry more storytelling detail than companions:
 * layered coat, role kit, slung weapon, breath fog, and a wear pass. Counts are
 * low (a handful per zone), so per-NPC detail is affordable.
 *
 * [TRACE: CAMPAIGN_DESIGN.md]
 */

import { ctx } from '../core/canvas.js';
import { graphicsSettings } from './GraphicsSystem.js';
import { getRoleKit } from './HumanCompanionRenderer.js';

function drawNpcEye(x, y, radius, blink, color) {
    if (blink > 0.85) {
        ctx.strokeStyle = '#5d3527';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - radius, y);
        ctx.quadraticCurveTo(x, y + radius * 0.4, x + radius, y);
        ctx.stroke();
        return;
    }
    const openY = radius * (1 - blink * 0.7);
    ctx.fillStyle = '#f2f6f7';
    ctx.beginPath();
    ctx.ellipse(x, y, radius, openY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
}

function drawBoots(x, y, sway) {
    ctx.strokeStyle = '#151b20';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 8);
    ctx.lineTo(x - 6 + sway * 0.4, y + 21);
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 6 - sway * 0.4, y + 21);
    ctx.stroke();
    ctx.strokeStyle = '#070a0c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 10 + sway * 0.4, y + 21);
    ctx.lineTo(x - 3 + sway * 0.4, y + 21);
    ctx.moveTo(x + 3 - sway * 0.4, y + 21);
    ctx.lineTo(x + 10 - sway * 0.4, y + 21);
    ctx.stroke();
}

function drawCoat(x, torsoY, kit, wind) {
    // Long coat with a wind-driven hem — the clearest "still alive out here" cue.
    ctx.fillStyle = kit.cloth;
    ctx.beginPath();
    ctx.moveTo(x - 13, torsoY - 10);
    ctx.lineTo(x + 13, torsoY - 10);
    ctx.lineTo(x + 16 + wind, torsoY + 20);
    ctx.lineTo(x + 6 + wind * 0.6, torsoY + 16);
    ctx.lineTo(x - 6 + wind * 0.4, torsoY + 20);
    ctx.lineTo(x - 16 + wind * 0.2, torsoY + 17);
    ctx.closePath();
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#0a0f12';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Armored core over the coat.
    const torso = ctx.createLinearGradient(x - 14, torsoY - 12, x + 14, torsoY + 14);
    torso.addColorStop(0, '#4a616b');
    torso.addColorStop(0.55, '#25373f');
    torso.addColorStop(1, '#0f171d');
    ctx.fillStyle = torso;
    ctx.beginPath();
    ctx.moveTo(x - 11, torsoY - 9);
    ctx.lineTo(x + 11, torsoY - 9);
    ctx.lineTo(x + 13, torsoY + 11);
    ctx.lineTo(x - 13, torsoY + 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0a1014';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Plate seams + shoulder straps.
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, torsoY - 2);
    ctx.lineTo(x + 10, torsoY - 2);
    ctx.moveTo(x, torsoY - 9);
    ctx.lineTo(x, torsoY + 11);
    ctx.stroke();
    ctx.strokeStyle = '#1b232a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 8, torsoY - 9);
    ctx.lineTo(x - 5, torsoY + 11);
    ctx.moveTo(x + 8, torsoY - 9);
    ctx.lineTo(x + 5, torsoY + 11);
    ctx.stroke();
}

function drawRoleKitBadge(x, torsoY, kit, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = kit.accent;
    ctx.fillStyle = kit.accent;
    ctx.lineWidth = 1.5;
    if (kit.mark === 'cross') {
        ctx.fillRect(x - 2, torsoY - 5, 4, 10);
        ctx.fillRect(x - 5, torsoY - 2, 10, 4);
    } else if (kit.mark === 'shield') {
        ctx.beginPath();
        ctx.moveTo(x, torsoY - 6);
        ctx.lineTo(x + 5, torsoY - 3);
        ctx.lineTo(x + 3, torsoY + 5);
        ctx.lineTo(x, torsoY + 7);
        ctx.lineTo(x - 3, torsoY + 5);
        ctx.lineTo(x - 5, torsoY - 3);
        ctx.closePath();
        ctx.stroke();
    } else if (kit.mark === 'chevron') {
        ctx.beginPath();
        ctx.moveTo(x - 5, torsoY - 3);
        ctx.lineTo(x, torsoY + 2);
        ctx.lineTo(x + 5, torsoY - 3);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(x - 4, torsoY, 1.5, 0, Math.PI * 2);
        ctx.arc(x, torsoY, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 4, torsoY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawHeadAndFace(npc, x, headY, kit, now, accentAlpha) {
    const skin = ctx.createRadialGradient(x - 3, headY - 3, 0, x, headY, 9);
    skin.addColorStop(0, '#ffd6b0');
    skin.addColorStop(0.65, '#c88e62');
    skin.addColorStop(1, '#6f4436');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, headY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c1a17';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stubble/dirt on the lower face separates survivors from clean companions.
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#3a2a22';
    ctx.beginPath();
    ctx.ellipse(x, headY + 4.5, 6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const blinkTick = (now + Math.floor((x + headY) * 19)) % 4100;
    const blink = blinkTick < 110 ? Math.sin((blinkTick / 110) * Math.PI) : 0;
    drawNpcEye(x - 3.1, headY + 1, 1.9, blink, '#18313c');
    drawNpcEye(x + 3.1, headY + 1, 1.9, blink, '#18313c');

    // Brow + mouth shift slowly so idle NPCs never look frozen.
    ctx.strokeStyle = '#5b382c';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - 5, headY - 2.6);
    ctx.lineTo(x - 1.4, headY - 3.2);
    ctx.moveTo(x + 1.4, headY - 3.2);
    ctx.lineTo(x + 5, headY - 2.6);
    ctx.stroke();
    ctx.strokeStyle = '#6f4136';
    ctx.beginPath();
    ctx.moveTo(x - 3, headY + 5);
    ctx.quadraticCurveTo(x, headY + 6 + Math.sin(now / 600 + headY) * 0.7, x + 3, headY + 5);
    ctx.stroke();

    // Hood / cap by role, drawn over the skull.
    ctx.fillStyle = kit.kit === 'scout' ? kit.cloth : '#182126';
    ctx.beginPath();
    ctx.arc(x, headY - 3, 9.6, Math.PI, Math.PI * 2);
    ctx.lineTo(x + 8, headY);
    ctx.lineTo(x - 8, headY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0b1013';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Comms earpiece diode.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = kit.accent;
    ctx.globalAlpha = Math.min(1, accentAlpha + Math.sin(now / 210) * 0.18);
    ctx.fillRect(x + 7, headY + 1, 2, 4);
    ctx.restore();
}

/**
 * Full survivor NPC render.
 * @param {object} npc - `{ x, y, def }` map NPC record
 * @param {{ questReady?: boolean, pulse?: number }} opts
 */
export function drawSurvivorNpcModel(npc, { questReady = false, pulse = 1 } = {}) {
    const { x, y, def } = npc;
    const radius = 18;
    const kit = getRoleKit(def);
    const quality = graphicsSettings.getQualityValues('aura');
    const now = Date.now();
    const idle = Math.sin(now / 420 + x * 0.013) * 1.2;
    const sway = Math.sin(now / 900 + y * 0.011) * 1.4;
    const wind = Math.sin(now / 520 + x * 0.02) * 2.2;
    const accentAlpha = questReady ? 0.8 : 0.48;
    const torsoY = y + 2 + idle;
    const headY = y - 13 + idle;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + radius * 0.9, radius * 0.9, radius * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    if (quality.opacity > 0) {
        const halo = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 1.8);
        halo.addColorStop(0, `rgba(${kit.glow}, ${0.16 * pulse * quality.opacity})`);
        halo.addColorStop(1, `rgba(${kit.glow}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Slung rifle behind the body so the strap reads across the chest later.
    ctx.strokeStyle = '#1d262b';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 10, torsoY - 8);
    ctx.lineTo(x + 19, torsoY + 14);
    ctx.stroke();
    ctx.strokeStyle = '#4d5a61';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 11, torsoY - 6);
    ctx.lineTo(x + 18, torsoY + 11);
    ctx.stroke();

    drawBoots(x, y, sway);
    drawCoat(x, torsoY, kit, wind);
    drawRoleKitBadge(x, torsoY - 1, kit, accentAlpha);

    // Role prop: makes each contact identifiable before dialogue starts.
    if (kit.kit === 'junk') {
        ctx.fillStyle = '#6b5c38';
        ctx.beginPath();
        ctx.ellipse(x - 15, torsoY + 6 + sway * 0.4, 5, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#241c0e';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else if (kit.kit === 'field' && quality.opacity > 0) {
        const lamp = ctx.createRadialGradient(x - 14, torsoY, 0, x - 14, torsoY, 16);
        lamp.addColorStop(0, `rgba(${kit.glow}, ${0.32 * quality.opacity})`);
        lamp.addColorStop(1, `rgba(${kit.glow}, 0)`);
        ctx.fillStyle = lamp;
        ctx.beginPath();
        ctx.arc(x - 14, torsoY, 16, 0, Math.PI * 2);
        ctx.fill();
    } else if (kit.kit === 'riot') {
        ctx.fillStyle = kit.metal;
        ctx.beginPath();
        ctx.moveTo(x - 20, torsoY - 6);
        ctx.lineTo(x - 12, torsoY - 9);
        ctx.lineTo(x - 12, torsoY + 9);
        ctx.lineTo(x - 20, torsoY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#111a1f';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawHeadAndFace(npc, x, headY, kit, now, accentAlpha);

    // Breath fog: strongest single "this person is alive" signal in fog zones.
    const breathPhase = (now / 2600 + x * 0.0007) % 1;
    if (breathPhase < 0.35) {
        const t = breathPhase / 0.35;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.20;
        ctx.fillStyle = '#dfe9ef';
        ctx.beginPath();
        ctx.arc(x + 2 + t * 5, headY + 5 - t * 6, 2.2 + t * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Slow scan arc: living quest contact, not loot.
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = accentAlpha * (0.75 + Math.sin(now / 220) * 0.2);
    ctx.strokeStyle = kit.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, now / 700, now / 700 + Math.PI * 0.75);
    ctx.stroke();
    ctx.restore();
}
