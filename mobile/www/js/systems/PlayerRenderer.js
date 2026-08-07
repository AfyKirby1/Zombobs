/**
 * PlayerRenderer.js - Enhanced player model with 4-directional views and round hands
 * 
 * Features:
 * - 4-directional facing (front, back, left, right) based on player angle
 * - Round hands visible on all sides for gun holding
 * - Procedural body rendering with head, torso, and limbs
 * - Smooth direction transitions
 * 
 * @version 0.9.1
 */

import { ctx } from '../core/canvas.js';
import { settingsManager } from './SettingsManager.js';
import { graphicsSettings } from './GraphicsSystem.js';
import { PLAYER_SKINS, DEFAULT_PLAYER_SKIN } from '../core/constants.js';
import {
    getRoleKit,
    isHumanCompanion,
    drawCompanionGroundMark,
    drawCompanionGear,
    drawCompanionHeadgear
} from './HumanCompanionRenderer.js';
import { drawSurvivorNpcModel } from './SurvivorNpcRenderer.js';

// Direction constants (based on player angle)
const DIRECTION = {
    DOWN: 0,   // Facing screen (front view) - 315° to 45°
    RIGHT: 1,  // Facing right - 45° to 135°
    UP: 2,     // Facing away (back view) - 135° to 225°
    LEFT: 3    // Facing left - 225° to 315°
};

// Role identity (accent/glow/kit) lives in HumanCompanionRenderer so heroes,
// recruited survivors, and campaign NPCs never drift apart visually.
function getRoleVisual(subject) {
    return getRoleKit(subject);
}

/** Direction mapping stays owned here; gear layers take a plain descriptor. */
function getViewDescriptor(direction) {
    return {
        facingBack: direction === DIRECTION.UP,
        isFront: direction === DIRECTION.DOWN,
        side: direction === DIRECTION.LEFT ? -1 : (direction === DIRECTION.RIGHT ? 1 : 0)
    };
}

function getMovementPose(player) {
    const amount = Math.min(1, player.visualMoveAmount || (player.isDodging ? 1 : 0));
    const cadence = player.isDodging ? 0.022 : (player.isSprinting ? 0.018 : 0.011);
    const phase = Date.now() * cadence + (player.visualMoveX || 0) * 1.7 + (player.visualMoveY || 0) * 2.3;
    return {
        amount,
        stride: Math.sin(phase) * amount,
        bob: Math.abs(Math.sin(phase)) * amount
    };
}

function drawTacticalLegs(player, pose) {
    const { x, y, radius, color } = player;
    const hipY = y + radius * 0.48;
    const thighLen = radius * 0.52;
    const shinLen = radius * 0.52;
    const stride = pose.stride * radius * 0.42;
    const pant = color.dark || '#26343a';
    const pantDeep = color.outline || '#11181b';
    const pantHi = color.light || '#60737a';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = -1; i <= 1; i += 2) {
        // Opposite-phase gait: left advances while right recovers.
        const phase = i * stride;
        const hipX = x + i * radius * 0.28;
        const kneeX = hipX + phase * 0.55 + i * radius * 0.04;
        const kneeY = hipY + thighLen - Math.abs(phase) * 0.12;
        const ankleX = hipX - phase * 0.95;
        const ankleY = hipY + thighLen + shinLen - Math.abs(phase) * 0.06;
        const bootTip = ankleX + i * radius * 0.18 - phase * 0.15;

        // Contact shadow under the planted boot sells weight.
        if (Math.abs(phase) < radius * 0.18) {
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath();
            ctx.ellipse(ankleX + i * radius * 0.06, ankleY + radius * 0.08, radius * 0.32, radius * 0.10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Thigh block (wider near hip).
        ctx.strokeStyle = pantDeep;
        ctx.lineWidth = Math.max(5.2, radius * 0.50);
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();
        ctx.strokeStyle = pant;
        ctx.lineWidth = Math.max(3.4, radius * 0.32);
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();
        // Fabric highlight seam down the outer thigh.
        ctx.strokeStyle = pantHi;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(1.2, radius * 0.10);
        ctx.beginPath();
        ctx.moveTo(hipX + i * radius * 0.10, hipY + radius * 0.04);
        ctx.lineTo(kneeX + i * radius * 0.08, kneeY - radius * 0.04);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Shin taper into boot cuff.
        ctx.strokeStyle = pantDeep;
        ctx.lineWidth = Math.max(4.4, radius * 0.42);
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(ankleX, ankleY - radius * 0.12);
        ctx.stroke();
        ctx.strokeStyle = pant;
        ctx.lineWidth = Math.max(2.8, radius * 0.26);
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(ankleX, ankleY - radius * 0.14);
        ctx.stroke();

        // Kneepad plate with rim.
        ctx.fillStyle = pantHi;
        ctx.strokeStyle = pantDeep;
        ctx.lineWidth = Math.max(0.9, radius * 0.08);
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(kneeX - radius * 0.20, kneeY - radius * 0.14, radius * 0.40, radius * 0.28, radius * 0.08);
        } else {
            ctx.rect(kneeX - radius * 0.20, kneeY - radius * 0.14, radius * 0.40, radius * 0.28);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(kneeX - radius * 0.14, kneeY - radius * 0.10, radius * 0.12, radius * 0.08);

        // Combat boot: sole + upper + lace hints.
        ctx.fillStyle = '#0a0d10';
        ctx.beginPath();
        ctx.moveTo(ankleX - i * radius * 0.18, ankleY - radius * 0.16);
        ctx.lineTo(bootTip + i * radius * 0.22, ankleY - radius * 0.06);
        ctx.lineTo(bootTip + i * radius * 0.24, ankleY + radius * 0.08);
        ctx.lineTo(ankleX - i * radius * 0.22, ankleY + radius * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a2228';
        ctx.beginPath();
        ctx.moveTo(ankleX - i * radius * 0.14, ankleY - radius * 0.28);
        ctx.lineTo(ankleX + i * radius * 0.10, ankleY - radius * 0.28);
        ctx.lineTo(bootTip + i * radius * 0.12, ankleY - radius * 0.04);
        ctx.lineTo(ankleX - i * radius * 0.16, ankleY - radius * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a4650';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ankleX - i * radius * 0.04, ankleY - radius * 0.22);
        ctx.lineTo(ankleX + i * radius * 0.06, ankleY - radius * 0.10);
        ctx.moveTo(ankleX - i * radius * 0.02, ankleY - radius * 0.16);
        ctx.lineTo(ankleX + i * radius * 0.08, ankleY - radius * 0.04);
        ctx.stroke();
    }
    ctx.restore();
}

function drawHumanVfx(player, pose) {
    const quality = graphicsSettings.getQualityValues('aura');
    const { x, y, radius } = player;
    const role = getRoleVisual(player);
    const now = Date.now();

    drawCompanionGroundMark(player, pose);

    ctx.save();
    if (isHumanCompanion(player) && quality.opacity > 0) {
        const auraRadius = radius * (1.8 + pose.bob * 0.25);
        const aura = ctx.createRadialGradient(x, y, radius * 0.35, x, y, auraRadius);
        aura.addColorStop(0, `rgba(${role.glow}, ${0.13 * quality.opacity})`);
        aura.addColorStop(0.65, `rgba(${role.glow}, ${0.055 * quality.opacity})`);
        aura.addColorStop(1, `rgba(${role.glow}, 0)`);
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(x, y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Sprint chevrons read cleanly without allocating per-frame particles.
    if (player.isSprinting && pose.amount > 0.1) {
        const trailX = x - Math.cos(player.angle) * radius * 1.1;
        const trailY = y - Math.sin(player.angle) * radius * 1.1;
        ctx.globalAlpha = 0.22 + pose.bob * 0.18;
        ctx.strokeStyle = '#9be7ff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            const distance = radius * (1.1 + i * 0.45);
            const px = trailX - Math.cos(player.angle) * distance;
            const py = trailY - Math.sin(player.angle) * distance;
            ctx.beginPath();
            ctx.arc(px, py, radius * (0.22 - i * 0.05), player.angle - 0.75, player.angle + 0.75);
            ctx.stroke();
        }
    }

    if ((player.shield || 0) > 0) {
        const shieldPct = Math.min(1, player.shield / Math.max(1, player.maxShield || player.shield));
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(64, 196, 255, ${0.28 + shieldPct * 0.25})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 5]);
        ctx.lineDashOffset = -now / 35;
        ctx.beginPath();
        ctx.arc(x, y, radius * (1.35 + Math.sin(now / 190) * 0.05), -0.4, Math.PI * 1.35);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (player.hasStaticCharge && (player.staticCharge || 0) > 2) {
        const charge = Math.min(1, player.staticCharge / Math.max(1, player.staticChargeMax || 100));
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(224, 64, 251, ${0.18 + charge * 0.5})`;
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 3; i++) {
            const a = now / 240 + i * (Math.PI * 2 / 3);
            const inner = radius * 0.7;
            const outer = radius * (1.1 + charge * 0.6);
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
            ctx.lineTo(x + Math.cos(a + 0.38) * outer, y + Math.sin(a + 0.38) * outer);
            ctx.lineTo(x + Math.cos(a + 0.82) * inner, y + Math.sin(a + 0.82) * inner);
            ctx.stroke();
        }
    }
    ctx.restore();
}

/**
 * Get the facing direction from an angle (radians)
 * @param {number} angle - Player angle in radians
 * @returns {number} Direction constant
 */
function getDirectionFromAngle(angle) {
    // Normalize angle to 0-2PI
    const normalizedAngle = ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    const degrees = (normalizedAngle * 180 / Math.PI);

    // Map to 4 directions with dead zones
    if (degrees >= 315 || degrees < 45) {
        return DIRECTION.RIGHT;
    } else if (degrees >= 45 && degrees < 135) {
        return DIRECTION.DOWN;
    } else if (degrees >= 135 && degrees < 225) {
        return DIRECTION.LEFT;
    } else {
        return DIRECTION.UP;
    }
}

/**
 * Draw backpack/tactical gear based on direction
 * @param {number} x - Body center X
 * @param {number} y - Body center Y
 * @param {number} radius - Player radius
 * @param {number} direction - DIRECTION constant
 * @param {object} color - Player color object
 */
function drawBackpack(x, y, radius, direction, color) {
    const backpackColor = '#3e4a38'; // Dark military green
    const strapColor = '#2a3326'; // Darker strap color
    const detailColor = '#556650'; // Lighter detail

    // Dimensions
    const bodyWidth = radius * 1.6;
    const bodyHeight = radius * 1.8;

    ctx.fillStyle = backpackColor;
    ctx.strokeStyle = strapColor;

    switch (direction) {
        case DIRECTION.DOWN:
            // Front view - Straps and tactical vest details
            
            // Shoulder straps
            ctx.lineWidth = radius * 0.25;
            ctx.lineCap = 'round';
            ctx.strokeStyle = backpackColor;
            
            // Left strap
            ctx.beginPath();
            ctx.moveTo(x - bodyWidth * 0.25, y - bodyHeight * 0.4); // Shoulder
            ctx.quadraticCurveTo(
                x - bodyWidth * 0.15, y, // Curve inward
                x - bodyWidth * 0.1, y + bodyHeight * 0.3 // Down to waist
            );
            ctx.stroke();

            // Right strap
            ctx.beginPath();
            ctx.moveTo(x + bodyWidth * 0.25, y - bodyHeight * 0.4); // Shoulder
            ctx.quadraticCurveTo(
                x + bodyWidth * 0.15, y, // Curve inward
                x + bodyWidth * 0.1, y + bodyHeight * 0.3 // Down to waist
            );
            ctx.stroke();
            
            // Chest strap connecting them
            ctx.lineWidth = radius * 0.15;
            ctx.beginPath();
            ctx.moveTo(x - bodyWidth * 0.15, y - bodyHeight * 0.1);
            ctx.lineTo(x + bodyWidth * 0.15, y - bodyHeight * 0.1);
            ctx.stroke();
            
            // Buckle on chest strap
            ctx.fillStyle = '#111';
            ctx.fillRect(x - 3, y - bodyHeight * 0.1 - 3, 6, 6);
            break;

        case DIRECTION.UP:
            // Back view - Full backpack
            
            // Main pack shape
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(
                    x - bodyWidth * 0.35, 
                    y - bodyHeight * 0.35, 
                    bodyWidth * 0.7, 
                    bodyHeight * 0.7, 
                    radius * 0.3
                );
            } else {
                ctx.rect(
                    x - bodyWidth * 0.35, 
                    y - bodyHeight * 0.35, 
                    bodyWidth * 0.7, 
                    bodyHeight * 0.7
                );
            }
            ctx.fill();
            
            // Outline/Depth
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            
            // Pocket/Detail
            ctx.fillStyle = detailColor;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(
                    x - bodyWidth * 0.25, 
                    y - bodyHeight * 0.1, 
                    bodyWidth * 0.5, 
                    bodyHeight * 0.35, 
                    radius * 0.2
                );
            } else {
                ctx.rect(
                    x - bodyWidth * 0.25, 
                    y - bodyHeight * 0.1, 
                    bodyWidth * 0.5, 
                    bodyHeight * 0.35
                );
            }
            ctx.fill();
            break;

        case DIRECTION.LEFT:
            // Side view left - Backpack hump on RIGHT side (back)
            // Back of player is at x + radius * 0.4 approx
            
            // Pack profile - Extends FURTHER out
            ctx.beginPath();
            // Start at top of back
            ctx.moveTo(x + bodyWidth * 0.1, y - bodyHeight * 0.35);
            // Curve out significantly for the pack
            ctx.bezierCurveTo(
                x + bodyWidth * 0.65, y - bodyHeight * 0.2, // Control 1 (out)
                x + bodyWidth * 0.65, y + bodyHeight * 0.2, // Control 2 (out)
                x + bodyWidth * 0.1, y + bodyHeight * 0.35  // End at bottom of back
            );
            // Close shape flat against back
            ctx.lineTo(x + bodyWidth * 0.1, y - bodyHeight * 0.35);
            ctx.fill();
            
            // Outline
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            break;

        case DIRECTION.RIGHT:
            // Side view right - Backpack hump on LEFT side (back)
            // Back of player is at x - radius * 0.4 approx
            
            // Pack profile - Extends FURTHER out
            ctx.beginPath();
            // Start at top of back
            ctx.moveTo(x - bodyWidth * 0.1, y - bodyHeight * 0.35);
            // Curve out significantly for the pack
            ctx.bezierCurveTo(
                x - bodyWidth * 0.65, y - bodyHeight * 0.2, // Control 1 (out)
                x - bodyWidth * 0.65, y + bodyHeight * 0.2, // Control 2 (out)
                x - bodyWidth * 0.1, y + bodyHeight * 0.35  // End at bottom of back
            );
            // Close shape flat against back
            ctx.lineTo(x - bodyWidth * 0.1, y - bodyHeight * 0.35);
            ctx.fill();
            
            // Outline
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            break;
    }
}

/**
 * Draw a hand with palm volume, knuckles, and a grip curl when holding a gun.
 */
function drawHand(x, y, radius, skin, isHoldingGun = false, aimAngle = 0) {
    ctx.save();
    // Contact shadow under the palm.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 1.2, y + 1.4, radius * 1.05, radius * 0.78, aimAngle * 0.15, 0, Math.PI * 2);
    ctx.fill();

    const palm = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, 0, x, y, radius * 1.15);
    palm.addColorStop(0, skin.highlight);
    palm.addColorStop(0.55, skin.mid);
    palm.addColorStop(1, skin.shadow);
    ctx.fillStyle = palm;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.05, radius * 0.92, aimAngle * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = Math.max(0.9, radius * 0.14);
    ctx.stroke();

    // Knuckle ridge across the back of the hand.
    ctx.strokeStyle = skin.shadow;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(0.8, radius * 0.12);
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.55, y - radius * 0.15);
    ctx.quadraticCurveTo(x, y - radius * 0.42, x + radius * 0.55, y - radius * 0.15);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (isHoldingGun && radius > 3.2) {
        // Fingers curled around the grip — short ovals along the aim axis.
        const cos = Math.cos(aimAngle);
        const sin = Math.sin(aimAngle);
        const px = -sin;
        const py = cos;
        for (let f = -1; f <= 1; f++) {
            const fx = x + cos * radius * 0.55 + px * f * radius * 0.42;
            const fy = y + sin * radius * 0.55 + py * f * radius * 0.42;
            ctx.fillStyle = f === 0 ? skin.mid : skin.shadow;
            ctx.beginPath();
            ctx.ellipse(fx, fy, radius * 0.34, radius * 0.22, aimAngle, 0, Math.PI * 2);
            ctx.fill();
        }
        // Thumb on the opposite side of the grip.
        ctx.fillStyle = skin.highlight;
        ctx.beginPath();
        ctx.ellipse(
            x - cos * radius * 0.15 - px * radius * 0.7,
            y - sin * radius * 0.15 - py * radius * 0.7,
            radius * 0.28, radius * 0.18, aimAngle + 0.4, 0, Math.PI * 2
        );
        ctx.fill();
    } else {
        // Open-hand finger tips.
        for (let f = -1; f <= 1; f++) {
            ctx.fillStyle = skin.mid;
            ctx.beginPath();
            ctx.arc(x + f * radius * 0.45, y + radius * 0.55, radius * 0.26, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function resolveWeaponKey(weapon) {
    if (!weapon) return 'pistol';
    if (weapon.key) return weapon.key;
    // Identity match against WEAPONS entries when available on the player object.
    const name = (weapon.name || '').toLowerCase();
    if (name === 'shotgun') return 'shotgun';
    if (name === 'rifle') return 'rifle';
    if (name === 'flamethrower') return 'flamethrower';
    if (name === 'smg') return 'smg';
    if (name === 'sniper') return 'sniper';
    if (name === 'rocket launcher' || name === 'rpg') return 'rocketLauncher';
    if (name === 'laser') return 'laser';
    if (name.includes('shot')) return 'shotgun';
    if (name.includes('flame')) return 'flamethrower';
    if (name.includes('sniper')) return 'sniper';
    if (name.includes('rocket') || name.includes('rpg')) return 'rocketLauncher';
    if (name.includes('laser')) return 'laser';
    if (name.includes('smg')) return 'smg';
    if (name.includes('rifle')) return 'rifle';
    return 'pistol';
}

function strokeGunLine(x0, y0, x1, y1, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

/**
 * Per-weapon silhouette: body, barrel, grip, and a type-specific accent so
 * each gun reads at gameplay zoom without relying on HUD alone.
 */
function drawGun(startX, startY, angle, length, weapon, isFiring = false) {
    const key = resolveWeaponKey(weapon);
    const recoil = isFiring ? (key === 'shotgun' || key === 'rocketLauncher' ? 3.5 : 2.2) : 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const px = -sin;
    const py = cos;
    const sx = startX - cos * recoil;
    const sy = startY - sin * recoil;
    const tipX = sx + cos * length;
    const tipY = sy + sin * length;
    const midX = sx + cos * length * 0.45;
    const midY = sy + sin * length * 0.45;

    ctx.save();

    // Drop shadow under the gun plane.
    ctx.globalAlpha = 0.25;
    strokeGunLine(sx + 1.5, sy + 1.8, tipX + 1.5, tipY + 1.8, 5.5, '#000');
    ctx.globalAlpha = 1;

    if (key === 'shotgun') {
        strokeGunLine(sx, sy, tipX, tipY, 6.5, '#2a2a2a');
        strokeGunLine(sx, sy, tipX, tipY, 3.8, '#6a6a6a');
        // Dual barrel hint.
        strokeGunLine(sx + px * 1.6, sy + py * 1.6, tipX + px * 1.6, tipY + py * 1.6, 2.2, '#4a4a4a');
        // Pump.
        const pumpX = sx + cos * length * 0.55;
        const pumpY = sy + sin * length * 0.55;
        ctx.fillStyle = '#3d2a18';
        ctx.beginPath();
        ctx.ellipse(pumpX, pumpY, 5.5, 3.2, angle, 0, Math.PI * 2);
        ctx.fill();
    } else if (key === 'sniper') {
        const longTipX = sx + cos * length * 1.25;
        const longTipY = sy + sin * length * 1.25;
        strokeGunLine(sx, sy, longTipX, longTipY, 4.2, '#1e2830');
        strokeGunLine(sx, sy, longTipX, longTipY, 2.2, '#6f8494');
        // Scope tube.
        ctx.fillStyle = '#111820';
        ctx.beginPath();
        ctx.ellipse(midX + px * 3.5, midY + py * 3.5, 7, 2.6, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4fc3f7';
        ctx.globalAlpha = isFiring ? 0.9 : 0.45;
        ctx.beginPath();
        ctx.arc(midX + px * 3.5 + cos * 5, midY + py * 3.5 + sin * 5, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else if (key === 'rifle') {
        strokeGunLine(sx, sy, tipX, tipY, 5.2, '#222830');
        strokeGunLine(sx, sy, tipX, tipY, 2.8, '#7a8894');
        // Mag well.
        ctx.fillStyle = '#1a1f24';
        ctx.beginPath();
        ctx.ellipse(midX - px * 2, midY - py * 2, 3.2, 5.5, angle, 0, Math.PI * 2);
        ctx.fill();
        // Stock stub behind the hand.
        strokeGunLine(sx - cos * 6, sy - sin * 6, sx + cos * 2, sy + sin * 2, 4, '#3a2a1c');
    } else if (key === 'smg') {
        const shortX = sx + cos * length * 0.78;
        const shortY = sy + sin * length * 0.78;
        strokeGunLine(sx, sy, shortX, shortY, 5.8, '#2a2a2a');
        strokeGunLine(sx, sy, shortX, shortY, 3.2, '#8a8a8a');
        // Vertical foregrip.
        strokeGunLine(midX, midY, midX - px * 7, midY - py * 7, 3.2, '#3d2a18');
        // Folded stock hint.
        strokeGunLine(sx - cos * 4, sy - sin * 4, sx + px * 5, sy + py * 5, 2.2, '#555');
    } else if (key === 'flamethrower') {
        strokeGunLine(sx, sy, tipX, tipY, 6.2, '#3a2a18');
        strokeGunLine(sx, sy, tipX, tipY, 3.4, '#c47830');
        // Fuel tank on the side.
        ctx.fillStyle = '#4a3a22';
        ctx.beginPath();
        ctx.ellipse(sx - cos * 2 + px * 6, sy - sin * 2 + py * 6, 5.5, 7.5, angle * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a140c';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Nozzle glow.
        ctx.fillStyle = isFiring ? '#ff9800' : '#ff5722';
        ctx.globalAlpha = isFiring ? 0.95 : 0.55;
        ctx.beginPath();
        ctx.arc(tipX, tipY, isFiring ? 5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else if (key === 'rocketLauncher') {
        const tubeTipX = sx + cos * length * 1.15;
        const tubeTipY = sy + sin * length * 1.15;
        strokeGunLine(sx - cos * 4, sy - sin * 4, tubeTipX, tubeTipY, 9, '#2a3228');
        strokeGunLine(sx - cos * 4, sy - sin * 4, tubeTipX, tubeTipY, 5.5, '#5a6a58');
        // Open muzzle ring.
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tubeTipX, tubeTipY, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(tubeTipX, tubeTipY, 2.8, 0, Math.PI * 2);
        ctx.fill();
    } else if (key === 'laser') {
        strokeGunLine(sx, sy, tipX, tipY, 4.5, '#1a1020');
        strokeGunLine(sx, sy, tipX, tipY, 2.2, '#ff1744');
        ctx.fillStyle = isFiring ? '#ff80ab' : '#ff1744';
        ctx.globalAlpha = isFiring ? 1 : 0.7;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = isFiring ? 10 : 4;
        ctx.beginPath();
        ctx.arc(tipX, tipY, isFiring ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    } else {
        // Pistol default: short slide + angled grip.
        const shortX = sx + cos * length * 0.72;
        const shortY = sy + sin * length * 0.72;
        strokeGunLine(sx, sy, shortX, shortY, 5.2, '#2a2a2a');
        strokeGunLine(sx, sy, shortX, shortY, 2.8, '#8a8a8a');
        // Slide serrations.
        for (let s = 0; s < 3; s++) {
            const t = 0.25 + s * 0.12;
            const ax = sx + cos * length * t;
            const ay = sy + sin * length * t;
            strokeGunLine(ax + px * 2.2, ay + py * 2.2, ax - px * 2.2, ay - py * 2.2, 1.1, '#555');
        }
    }

    // Shared grip under the receiver.
    const gripX = sx + cos * 5 - px * 1.5;
    const gripY = sy + sin * 5 - py * 1.5;
    ctx.fillStyle = '#4a3420';
    ctx.beginPath();
    ctx.ellipse(gripX, gripY + 2.5, 2.6, 5.2, angle + 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1c10';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Muzzle tip / flash core.
    if (key !== 'flamethrower' && key !== 'laser' && key !== 'rocketLauncher') {
        ctx.fillStyle = isFiring ? '#ffe082' : '#1a1a1a';
        ctx.beginPath();
        ctx.arc(tipX, tipY, isFiring ? 3.4 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (isFiring) {
            ctx.fillStyle = 'rgba(255, 200, 80, 0.45)';
            ctx.beginPath();
            ctx.arc(tipX + cos * 4, tipY + sin * 4, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

/**
 * Sleeve + elbow + forearm articulated between shoulder and hand.
 */
function drawArm(fromX, fromY, toX, toY, color, skin, radius) {
    const mx = (fromX + toX) * 0.5;
    const my = (fromY + toY) * 0.5;
    const elbowX = mx + (toY - fromY) * 0.08;
    const elbowY = my - (toX - fromX) * 0.08;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Upper sleeve (thicker, darker).
    ctx.strokeStyle = color.outline || '#11181b';
    ctx.lineWidth = Math.max(4.5, radius * 0.42);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();
    ctx.strokeStyle = color.dark || '#26343a';
    ctx.lineWidth = Math.max(3.0, radius * 0.28);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();

    // Forearm sleeve taper into cuff.
    ctx.strokeStyle = color.outline || '#11181b';
    ctx.lineWidth = Math.max(3.8, radius * 0.34);
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.strokeStyle = color.dark || '#26343a';
    ctx.lineWidth = Math.max(2.4, radius * 0.22);
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Elbow joint plate.
    ctx.fillStyle = color.light || '#60737a';
    ctx.strokeStyle = color.outline || '#11181b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, Math.max(2.2, radius * 0.14), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Skin cuff peeking out at the wrist.
    ctx.fillStyle = skin.mid;
    ctx.beginPath();
    ctx.arc(toX, toY, Math.max(2.0, radius * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Draw the player body (torso and head)
 * @param {object} player - Player object
 * @param {number} direction - DIRECTION constant
 * @param {object} skin - Skin color object
 */
function drawPlayerBody(player, direction, skin, pose) {
    const { x, y, radius, color } = player;

    // Calculate sizes
    const headRadius = radius * 0.65;

    // Body shadow
    const cachedShadows = settingsManager.getSetting('video', 'shadows') ?? true;
    if (cachedShadows) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + radius * 1.35, radius * 0.95, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Outer glow aura
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glowGradient.addColorStop(0, color.glow);
    glowGradient.addColorStop(1, color.glow.replace(/[\d.]+\)/, '0)'));
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Full articulated lower body; collision geometry remains unchanged.
    drawTacticalLegs(player, pose);

    // Breathing and footfall response keep the torso from feeling pinned to
    // the ground while preserving the original collision center.
    const breath = Math.sin(Date.now() / 310 + x * 0.017) * (0.45 + pose.amount * 0.25);
    const torsoY = y + radius * 0.12 - pose.bob * radius * 0.045 + breath;
    const view = getViewDescriptor(direction);

    // Gear belongs behind the body; the former order painted a circular pack
    // over the torso and reinforced the capsule silhouette.
    drawBackpack(x, torsoY, radius, direction, color);

    // Broad shoulders, tapered waist, and a separate pelvis replace the old
    // dominant ellipse. These proportions remain legible at gameplay scale.
    const torsoGradient = ctx.createLinearGradient(x, torsoY - radius * 0.55, x, torsoY + radius * 0.86);
    torsoGradient.addColorStop(0, color.light);
    torsoGradient.addColorStop(0.42, color.dark);
    torsoGradient.addColorStop(1, color.outline);

    ctx.fillStyle = torsoGradient;
    ctx.strokeStyle = color.outline;
    ctx.lineWidth = Math.max(1.5, radius * 0.13);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.9, torsoY - radius * 0.48);
    ctx.quadraticCurveTo(x - radius * 1.02, torsoY - radius * 0.14, x - radius * 0.67, torsoY + radius * 0.14);
    ctx.lineTo(x - radius * 0.54, torsoY + radius * 0.72);
    ctx.lineTo(x - radius * 0.66, torsoY + radius * 0.9);
    ctx.lineTo(x + radius * 0.66, torsoY + radius * 0.9);
    ctx.lineTo(x + radius * 0.54, torsoY + radius * 0.72);
    ctx.lineTo(x + radius * 0.67, torsoY + radius * 0.14);
    ctx.quadraticCurveTo(x + radius * 1.02, torsoY - radius * 0.14, x + radius * 0.9, torsoY - radius * 0.48);
    ctx.quadraticCurveTo(x, torsoY - radius * 0.2, x - radius * 0.9, torsoY - radius * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shoulder armor makes facing and body width readable over dark terrain.
    ctx.fillStyle = color.outline;
    for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.roundRect(
            x + side * radius * 0.82 - radius * 0.25,
            torsoY - radius * 0.48,
            radius * 0.5,
            radius * 0.3,
            radius * 0.1
        );
        ctx.fill();
    }

    // Front/side armor plate and belt split the torso into readable sections.
    if (!view.facingBack) {
        ctx.fillStyle = 'rgba(10, 18, 22, 0.72)';
        ctx.strokeStyle = color.light;
        ctx.lineWidth = Math.max(0.8, radius * 0.07);
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.5, torsoY - radius * 0.27);
        ctx.lineTo(x + radius * 0.5, torsoY - radius * 0.27);
        ctx.lineTo(x + radius * 0.38, torsoY + radius * 0.45);
        ctx.lineTo(x, torsoY + radius * 0.62);
        ctx.lineTo(x - radius * 0.38, torsoY + radius * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(190, 220, 225, 0.46)';
        ctx.beginPath();
        ctx.moveTo(x, torsoY - radius * 0.2);
        ctx.lineTo(x, torsoY + radius * 0.45);
        ctx.moveTo(x - radius * 0.34, torsoY + radius * 0.08);
        ctx.lineTo(x + radius * 0.34, torsoY + radius * 0.08);
        ctx.stroke();
    }

    ctx.fillStyle = '#11171a';
    ctx.fillRect(x - radius * 0.62, torsoY + radius * 0.6, radius * 1.24, radius * 0.16);
    ctx.fillStyle = color.light;
    ctx.fillRect(x - radius * 0.12, torsoY + radius * 0.59, radius * 0.24, radius * 0.18);

    drawCompanionGear(player, torsoY, pose, view);

    // Head
    const headY = y - radius * 0.68 - pose.bob * radius * 0.10 + breath * 0.5;

    // Neck connects the head to the armor instead of leaving stacked circles.
    ctx.fillStyle = skin.shadow;
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.beginPath();
    ctx.roundRect(x - radius * 0.24, headY + headRadius * 0.55, radius * 0.48, radius * 0.55, radius * 0.12);
    ctx.fill();
    ctx.stroke();

    // Head — slightly elongated oval with a softer jaw, not a perfect circle.
    const headGradient = ctx.createRadialGradient(x - headRadius * 0.25, headY - headRadius * 0.3, 0, x, headY, headRadius * 1.15);
    headGradient.addColorStop(0, skin.highlight);
    headGradient.addColorStop(0.45, skin.mid);
    headGradient.addColorStop(1, skin.shadow);

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.ellipse(x, headY + headRadius * 0.06, headRadius * 0.95, headRadius * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft jawline stroke.
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, headY + headRadius * 0.06, headRadius * 0.95, headRadius * 1.05, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Temple indentation — subtle skull read under the helmet brim.
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - headRadius * 0.7, headY, headRadius * 0.22, -0.6, 0.8);
    ctx.arc(x + headRadius * 0.7, headY, headRadius * 0.22, Math.PI - 0.8, Math.PI + 0.6);
    ctx.stroke();

    // Face details based on direction
    drawFace(player, x, headY, headRadius, direction, pose, skin);

    // Hair/helmet
    drawHeadgear(x, headY, headRadius, direction, color);

    // Role headgear (hood/visor/goggles/lamp) sits over the shared helmet.
    drawCompanionHeadgear(player, x, headY, headRadius, view, pose);
}

/**
 * Draw the player's face based on direction
 * @param {number} x - Head center X
 * @param {number} y - Head center Y
 * @param {number} radius - Head radius
 * @param {number} direction - DIRECTION constant
 */
function drawAnimatedEye(x, y, radius, gazeX, gazeY, blink, eyeColor = '#2a3a44', irisTint = '#3d5a6c') {
    ctx.save();
    if (blink > 0.88) {
        // Closed lid with soft crease.
        ctx.strokeStyle = '#5d3527';
        ctx.lineWidth = Math.max(1.1, radius * 0.18);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - radius * 1.15, y);
        ctx.quadraticCurveTo(x, y + radius * 0.35, x + radius * 1.15, y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(93, 53, 39, 0.35)';
        ctx.lineWidth = Math.max(0.7, radius * 0.10);
        ctx.beginPath();
        ctx.moveTo(x - radius * 1.05, y - radius * 0.12);
        ctx.quadraticCurveTo(x, y - radius * 0.28, x + radius * 1.05, y - radius * 0.12);
        ctx.stroke();
        ctx.restore();
        return;
    }

    const openY = radius * (1 - blink * 0.78);
    // Soft orbital socket shadow.
    ctx.fillStyle = 'rgba(80, 40, 30, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.08, radius * 1.25, openY * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sclera with slight warm tint.
    const sclera = ctx.createRadialGradient(x - radius * 0.2, y - openY * 0.3, 0, x, y, radius * 1.2);
    sclera.addColorStop(0, '#ffffff');
    sclera.addColorStop(0.7, '#f0f2f4');
    sclera.addColorStop(1, '#d5c8bc');
    ctx.fillStyle = sclera;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.15, openY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(64, 36, 30, 0.55)';
    ctx.lineWidth = Math.max(0.7, radius * 0.10);
    ctx.stroke();

    const ix = x + gazeX * radius * 0.42;
    const iy = y + gazeY * openY * 0.42;
    // Iris ring.
    const iris = ctx.createRadialGradient(ix - radius * 0.1, iy - radius * 0.1, 0, ix, iy, radius * 0.62);
    iris.addColorStop(0, irisTint);
    iris.addColorStop(0.55, eyeColor);
    iris.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(ix, iy, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();
    // Pupil.
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(ix, iy, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    // Dual catchlights — primary + secondary — sell wet cornea.
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(ix - radius * 0.18, iy - radius * 0.18, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(ix + radius * 0.16, iy + radius * 0.10, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Upper lid shadow over the iris.
    ctx.fillStyle = 'rgba(60, 30, 24, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y - openY * 0.55, radius * 1.1, openY * 0.45, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function getFaceState(player) {
    const now = Date.now();
    const seed = ((player.id?.length || 3) * 719 + Math.floor((player.x || 0) * 13)) % 1600;
    const blinkTick = (now + seed) % 3600;
    const blink = blinkTick < 115 ? Math.sin((blinkTick / 115) * Math.PI) : 0;
    const hurt = player.lastDamageTime && now - player.lastDamageTime < 420;
    const lowHealth = player.maxHealth > 0 && player.health / player.maxHealth < 0.3;
    // Soft gaze lag so eyes don't lock perfectly to aim every frame.
    const gazeLag = Math.sin(now / 900 + seed) * 0.08;
    return {
        blink,
        gazeX: Math.cos((player.angle || 0) + gazeLag) * 0.85,
        gazeY: Math.sin((player.angle || 0) + gazeLag) * 0.55,
        tense: !!(hurt || player.isReloading || player.muzzleFlash?.active || lowHealth),
        hurt: !!hurt,
        lowHealth: !!lowHealth
    };
}

function drawFacePlane(player, x, y, radius, skin, pose, face) {
    // Cheek warmth + jaw shadow give the head volume beyond a flat circle.
    const cheek = ctx.createRadialGradient(x - radius * 0.35, y + radius * 0.15, 0, x, y, radius);
    cheek.addColorStop(0, 'rgba(210, 120, 100, 0.28)');
    cheek.addColorStop(0.55, 'rgba(210, 120, 100, 0)');
    ctx.fillStyle = cheek;
    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y + radius * 0.2, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.35, y + radius * 0.2, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(90, 50, 40, 0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.55, radius * 0.72, radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft under-eye / tear trough.
    ctx.strokeStyle = 'rgba(120, 70, 55, 0.25)';
    ctx.lineWidth = Math.max(0.8, radius * 0.06);
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.48, y + radius * 0.08);
    ctx.quadraticCurveTo(x - radius * 0.32, y + radius * 0.22, x - radius * 0.18, y + radius * 0.10);
    ctx.moveTo(x + radius * 0.18, y + radius * 0.10);
    ctx.quadraticCurveTo(x + radius * 0.32, y + radius * 0.22, x + radius * 0.48, y + radius * 0.08);
    ctx.stroke();
}

function drawNoseFront(x, y, radius, skin) {
    // Bridge shadow.
    ctx.strokeStyle = skin.shadow;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 0.05);
    ctx.lineTo(x, y + radius * 0.28);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Tip ball + nostril hints.
    const tip = ctx.createRadialGradient(x - 1, y + radius * 0.22, 0, x, y + radius * 0.28, radius * 0.18);
    tip.addColorStop(0, skin.highlight);
    tip.addColorStop(1, skin.shadow);
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.30, radius * 0.14, radius * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(80, 40, 30, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.10, y + radius * 0.34, radius * 0.05, radius * 0.035, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.10, y + radius * 0.34, radius * 0.05, radius * 0.035, 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawMouthFront(x, y, radius, face, pose) {
    const mouthY = y + radius * (face.tense ? 0.52 : 0.48);
    // Lip volume: darker crease + lighter body.
    ctx.strokeStyle = face.hurt ? '#8b2a2a' : '#8a4a3a';
    ctx.lineWidth = Math.max(1.4, radius * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (face.tense) {
        ctx.moveTo(x - radius * 0.22, mouthY);
        ctx.lineTo(x + radius * 0.22, mouthY);
    } else {
        ctx.moveTo(x - radius * 0.22, mouthY);
        ctx.quadraticCurveTo(x, mouthY + radius * (0.10 + pose.bob * 0.03), x + radius * 0.22, mouthY);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200, 140, 120, 0.55)';
    ctx.lineWidth = Math.max(0.8, radius * 0.06);
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.16, mouthY - radius * 0.04);
    ctx.quadraticCurveTo(x, mouthY - radius * 0.02, x + radius * 0.16, mouthY - radius * 0.04);
    ctx.stroke();
}

function drawFace(player, x, y, radius, direction, pose, skin) {
    const face = getFaceState(player);
    const role = getRoleVisual(player);
    const browLift = face.tense ? -radius * 0.12 : radius * 0.02;
    const iris = face.lowHealth ? '#5a3038' : '#3d5a6c';
    const pupil = face.hurt ? '#4a1010' : '#243038';

    switch (direction) {
        case DIRECTION.DOWN: {
            drawFacePlane(player, x, y, radius, skin || DEFAULT_PLAYER_SKIN, pose, face);
            const eyeOffsetX = radius * 0.34;
            const eyeY = y - radius * 0.12;
            const eyeRadius = radius * 0.16;
            drawAnimatedEye(x - eyeOffsetX, eyeY, eyeRadius, face.gazeX, face.gazeY, face.blink, pupil, iris);
            drawAnimatedEye(x + eyeOffsetX, eyeY, eyeRadius, face.gazeX, face.gazeY, face.blink, pupil, iris);

            // Brows with thickness + outer taper.
            ctx.strokeStyle = face.hurt ? '#9b2525' : '#4a2c20';
            ctx.lineWidth = Math.max(1.2, radius * 0.11);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - eyeOffsetX - eyeRadius * 1.1, eyeY - radius * 0.32);
            ctx.quadraticCurveTo(x - eyeOffsetX, eyeY - radius * 0.40 + browLift, x - eyeOffsetX + eyeRadius, eyeY - radius * 0.30 + browLift);
            ctx.moveTo(x + eyeOffsetX - eyeRadius, eyeY - radius * 0.30 + browLift);
            ctx.quadraticCurveTo(x + eyeOffsetX, eyeY - radius * 0.40 + browLift, x + eyeOffsetX + eyeRadius * 1.1, eyeY - radius * 0.32);
            ctx.stroke();

            drawNoseFront(x, y, radius, skin || DEFAULT_PLAYER_SKIN);
            drawMouthFront(x, y, radius, face, pose);

            if (player.isHero || player.isSurvivor) {
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = role.accent;
                ctx.globalAlpha = 0.72;
                ctx.fillRect(x - radius * 0.82, y + radius * 0.10, radius * 0.13, radius * 0.20);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }
            break;
        }

        case DIRECTION.UP:
            if (player.isHero || player.isSurvivor) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = role.accent;
                ctx.globalAlpha = 0.45 + Math.sin(Date.now() / 190) * 0.2;
                ctx.beginPath();
                ctx.arc(x, y + radius * 0.48, radius * 0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            break;

        case DIRECTION.LEFT: {
            // Soft cheek + jaw on the visible side.
            ctx.fillStyle = 'rgba(210, 120, 100, 0.22)';
            ctx.beginPath();
            ctx.arc(x - radius * 0.2, y + radius * 0.2, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            drawAnimatedEye(x - radius * 0.28, y - radius * 0.1, radius * 0.15, -0.8, face.gazeY * 0.5, face.blink, pupil, iris);
            // Profile nose: bridge to tip to nostril.
            const sk = skin || DEFAULT_PLAYER_SKIN;
            ctx.fillStyle = sk.mid;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.35, y - radius * 0.05);
            ctx.lineTo(x - radius * 0.72, y + radius * 0.08);
            ctx.lineTo(x - radius * 0.55, y + radius * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = sk.highlight;
            ctx.beginPath();
            ctx.arc(x - radius * 0.66, y + radius * 0.10, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8a4a3a';
            ctx.lineWidth = Math.max(1, radius * 0.08);
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.35, y + radius * 0.42);
            ctx.quadraticCurveTo(x - radius * 0.15, y + radius * 0.50, x - radius * 0.02, y + radius * 0.42);
            ctx.stroke();
            break;
        }

        case DIRECTION.RIGHT: {
            ctx.fillStyle = 'rgba(210, 120, 100, 0.22)';
            ctx.beginPath();
            ctx.arc(x + radius * 0.2, y + radius * 0.2, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            drawAnimatedEye(x + radius * 0.28, y - radius * 0.1, radius * 0.15, 0.8, face.gazeY * 0.5, face.blink, pupil, iris);
            const sk = skin || DEFAULT_PLAYER_SKIN;
            ctx.fillStyle = sk.mid;
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.35, y - radius * 0.05);
            ctx.lineTo(x + radius * 0.72, y + radius * 0.08);
            ctx.lineTo(x + radius * 0.55, y + radius * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = sk.highlight;
            ctx.beginPath();
            ctx.arc(x + radius * 0.66, y + radius * 0.10, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8a4a3a';
            ctx.lineWidth = Math.max(1, radius * 0.08);
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.35, y + radius * 0.42);
            ctx.quadraticCurveTo(x + radius * 0.15, y + radius * 0.50, x + radius * 0.02, y + radius * 0.42);
            ctx.stroke();
            break;
        }
    }
}

/**
 * Draw headgear/helmet based on direction
 * @param {number} x - Head center X
 * @param {number} y - Head center Y
 * @param {number} radius - Head radius
 * @param {number} direction - DIRECTION constant
 * @param {object} color - Player color object
 */
function drawHeadgear(x, y, radius, direction, color) {
    // Military-style helmet/cap
    const helmetColor = color.dark;
    const helmetHighlight = color.light;

    ctx.fillStyle = helmetColor;

    switch (direction) {
        case DIRECTION.DOWN:
            // Front view - Improved Tactical Helmet
            
            // 1. Ear Covers (bulging out slightly) - Draw first
            ctx.fillStyle = helmetColor;
            
            // Left Ear Muff
            ctx.beginPath();
            ctx.ellipse(x - radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Right Ear Muff
            ctx.beginPath();
            ctx.ellipse(x + radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // Ear Cover Highlights (to distinguish them)
            ctx.fillStyle = helmetHighlight;
            // Left highlight strip
            ctx.beginPath();
            ctx.ellipse(x - radius * 1.05, y + radius * 0.05, radius * 0.05, radius * 0.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
            // Right highlight strip
            ctx.beginPath();
            ctx.ellipse(x + radius * 1.05, y + radius * 0.05, radius * 0.05, radius * 0.2, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // 2. Helmet Shell (Main Dome) - sits between/on top of ear covers
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            // Start at left temple (above ear muff)
            ctx.moveTo(x - radius * 0.9, y - radius * 0.18);
            // Dome
            ctx.bezierCurveTo(
                x - radius * 0.9, y - radius * 1.4, 
                x + radius * 0.9, y - radius * 1.4, 
                x + radius * 0.9, y - radius * 0.18
            );
            // Forehead rim — higher cut so eyes/nose stay readable under the shell.
            ctx.quadraticCurveTo(
                x, y - radius * 0.62, 
                x - radius * 0.9, y - radius * 0.18
            );
            ctx.fill();
            
            // 3. Helmet Rim/Highlight (Forehead)
            ctx.fillStyle = helmetHighlight;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.9, y - radius * 0.18);
            ctx.quadraticCurveTo(x, y - radius * 0.58, x + radius * 0.9, y - radius * 0.18);
            ctx.quadraticCurveTo(x, y - radius * 0.72, x - radius * 0.9, y - radius * 0.18);
            ctx.fill();
            break;

        case DIRECTION.UP:
            // Back view - Full tactical helmet coverage
            
            // 1. Ear Covers (bulging out slightly)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x - radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, -0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // 2. Main Shell
            ctx.beginPath();
            // Slightly wider base than top
            ctx.arc(x, y - radius * 0.25, radius * 1.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet detailing (V-shape back straps or ridges)
            ctx.fillStyle = helmetHighlight;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.5, y + radius * 0.4);
            ctx.quadraticCurveTo(x, y + radius * 0.1, x + radius * 0.5, y + radius * 0.4);
            ctx.quadraticCurveTo(x, y + radius * 0.2, x - radius * 0.5, y + radius * 0.4);
            ctx.fill();
            break;

        case DIRECTION.LEFT:
            // Side view left - Tactical profile
            // Face is to the LEFT. Back of head is RIGHT.
            
            // Ear Muff (More distinct)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.35, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet shell (cut around ear)
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.9, y + radius * 0.2); // Back of neck (Right side)
            ctx.bezierCurveTo(
                x + radius * 1.2, y - radius * 1.3, // Back top
                x - radius * 0.8, y - radius * 1.3, // Front top
                x - radius * 0.9, y - radius * 0.3  // Front brim (Left side)
            );
            ctx.lineTo(x - radius * 0.4, y - radius * 0.1); // Cut back for ear
            // Curve over ear muff
            ctx.bezierCurveTo(
                x - radius * 0.2, y - radius * 0.5,
                x + radius * 0.4, y - radius * 0.5,
                x + radius * 0.5, y + radius * 0.1
            );
            ctx.lineTo(x + radius * 0.9, y + radius * 0.2);
            ctx.fill();
            
            // Ear cup highlight ring
            ctx.strokeStyle = helmetHighlight;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.25, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case DIRECTION.RIGHT:
            // Side view right - Tactical profile
            // Face is to the RIGHT. Back of head is LEFT.
            
            // Ear Muff (More distinct)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.35, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet shell
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.9, y + radius * 0.2); // Back of neck (Left side)
            ctx.bezierCurveTo(
                x - radius * 1.2, y - radius * 1.3, // Back top
                x + radius * 0.8, y - radius * 1.3, // Front top
                x + radius * 0.9, y - radius * 0.3  // Front brim (Right side)
            );
            ctx.lineTo(x + radius * 0.4, y - radius * 0.1); // Cut back for ear
            // Curve over ear muff
            ctx.bezierCurveTo(
                x + radius * 0.2, y - radius * 0.5,
                x - radius * 0.4, y - radius * 0.5,
                x - radius * 0.5, y + radius * 0.1
            );
            ctx.lineTo(x - radius * 0.9, y + radius * 0.2);
            ctx.fill();
            
            // Ear cup highlight ring
            ctx.strokeStyle = helmetHighlight;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.25, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
    }
}

/**
 * Draw flashlight beam
 * @param {object} player - Player object
 */
export function drawFlashlight(player) {
    // Check if WebGPU renderer is active and handling flashlight
    // This prevents double rendering (Canvas 2D + WebGPU)
    const webgpuRenderer = window.webgpuRenderer;
    if (webgpuRenderer && webgpuRenderer.isInitialized && webgpuRenderer.flashlightEnabled && !webgpuRenderer.fallbackMode) {
        return; 
    }

    if (!player.flashlight || !player.flashlight.active) return;

    const { x, y, angle } = player;
    
    ctx.save();
    
    // Flashlight cone
    const beamLength = 400;
    const beamWidth = Math.PI / 4; // 45 degrees
    
    // Use overlay blend mode for better lighting effect
    ctx.globalCompositeOperation = 'screen';
    
    // Gradient for the beam
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, beamLength);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)'); // Bright center start
    gradient.addColorStop(0.4, 'rgba(255, 255, 220, 0.15)'); // Mid beam
    gradient.addColorStop(1, 'rgba(255, 255, 220, 0)'); // Fade out at end
    
    ctx.fillStyle = gradient;
    
    // Draw cone
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, beamLength, angle - beamWidth/2, angle + beamWidth/2);
    ctx.lineTo(x, y);
    ctx.fill();
    
    // Add some glare/bloom at the source
    const glareGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glareGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    glareGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glareGradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw the complete player with hands and gun
 * @param {object} player - Player object
 * @param {boolean} isFiring - Whether player is currently firing
 */
export function drawEnhancedPlayer(player, isFiring = false) {
    // Render ghost trails if player is dodging (skip recursion)
    if (player.isDodging && player.positionHistory && player.positionHistory.length > 0) {
        const originalAlpha = ctx.globalAlpha;
        player.positionHistory.forEach((pos, idx) => {
            const alpha = 0.05 + (idx / player.positionHistory.length) * 0.25;
            ctx.globalAlpha = originalAlpha * alpha;

            const ghostPlayer = {
                ...player,
                x: pos.x,
                y: pos.y,
                angle: pos.angle,
                isDodging: false,
                positionHistory: null,
                _suppressHumanVfx: true,
                flashlight: player.flashlight ? { ...player.flashlight, active: false } : { active: false }
            };
            drawEnhancedPlayer(ghostPlayer, false);
        });
        ctx.globalAlpha = originalAlpha;
    }

    // Draw flashlight first so it's behind the player
    drawFlashlight(player);

    const pose = getMovementPose(player);
    if (!player._suppressHumanVfx) {
        drawHumanVfx(player, pose);
    }

    const { x, y, radius, angle, color, currentWeapon, equippedSkin } = player;

    // Resolve skin colors
    const skin = (equippedSkin && PLAYER_SKINS[equippedSkin]) ? PLAYER_SKINS[equippedSkin] : DEFAULT_PLAYER_SKIN;

    // Determine facing direction based on angle
    const direction = getDirectionFromAngle(angle);

    // Calculate hand positions based on direction
    const handRadius = radius * 0.32;
    const armLength = radius * 1.15;
    const weaponKey = resolveWeaponKey(currentWeapon);
    const gunLengthScale = {
        pistol: 1.15,
        smg: 1.25,
        shotgun: 1.55,
        rifle: 1.65,
        sniper: 1.85,
        flamethrower: 1.45,
        rocketLauncher: 1.7,
        laser: 1.35
    };
    const gunLength = radius * (gunLengthScale[weaponKey] || 1.45);

    // Hand positions for 4 directions
    let leadHandPos, rearHandPos, gunStartPos;

    switch (direction) {
        case DIRECTION.DOWN:
            // Facing screen - gun pointing down-ish
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) - Math.sin(angle) * radius * 0.3,
                y: y + Math.sin(angle) * (armLength * 0.5) + Math.cos(angle) * radius * 0.3
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.3,
                y: y + Math.sin(angle) * radius * 0.3
            };
            break;

        case DIRECTION.UP:
            // Facing away - gun pointing up-ish, hands less visible
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) + Math.sin(angle) * radius * 0.3,
                y: y + Math.sin(angle) * (armLength * 0.5) - Math.cos(angle) * radius * 0.3
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.3,
                y: y + Math.sin(angle) * radius * 0.3
            };
            break;

        case DIRECTION.LEFT:
            // Facing left
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) + radius * 0.15,
                y: y + Math.sin(angle) * (armLength * 0.5) + radius * 0.2
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.35,
                y: y + Math.sin(angle) * radius * 0.35
            };
            break;

        case DIRECTION.RIGHT:
            // Facing right
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) - radius * 0.15,
                y: y + Math.sin(angle) * (armLength * 0.5) + radius * 0.2
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.35,
                y: y + Math.sin(angle) * radius * 0.35
            };
            break;
    }

    // Draw order based on direction for proper layering
    const shoulderLeadX = x + Math.cos(angle + 0.35) * radius * 0.55;
    const shoulderLeadY = y + Math.sin(angle + 0.35) * radius * 0.15 + radius * 0.05;
    const shoulderRearX = x - Math.cos(angle - 0.35) * radius * 0.45;
    const shoulderRearY = y + radius * 0.12;

    if (direction === DIRECTION.UP) {
        // Back view: rear arm/hand/gun first, body on top.
        drawArm(shoulderRearX, shoulderRearY, rearHandPos.x, rearHandPos.y, color, skin, radius);
        drawArm(shoulderLeadX, shoulderLeadY, leadHandPos.x, leadHandPos.y, color, skin, radius);
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.9, skin, false, angle);
        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true, angle);
        drawPlayerBody(player, direction, skin, pose);
    } else if (direction === DIRECTION.DOWN) {
        drawPlayerBody(player, direction, skin, pose);
        drawArm(shoulderLeadX, shoulderLeadY, leadHandPos.x, leadHandPos.y, color, skin, radius);
        drawArm(shoulderRearX, shoulderRearY, rearHandPos.x, rearHandPos.y, color, skin, radius);
        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.9, skin, false, angle);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true, angle);
    } else {
        drawPlayerBody(player, direction, skin, pose);
        const sideShoulderX = x + (direction === DIRECTION.LEFT ? -1 : 1) * radius * 0.35;
        const sideShoulderY = y + radius * 0.08;
        drawArm(sideShoulderX, sideShoulderY, leadHandPos.x, leadHandPos.y, color, skin, radius);
        drawArm(x, y + radius * 0.15, rearHandPos.x, rearHandPos.y, color, skin, radius * 0.9);
        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.85, skin, false, angle);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true, angle);
    }
}

/**
 * Get the current direction a player is facing
 * @param {object} player - Player object
 * @returns {string} Direction name ('up', 'down', 'left', 'right')
 */
export function getPlayerDirection(player) {
    const dir = getDirectionFromAngle(player.angle);
    switch (dir) {
        case DIRECTION.DOWN: return 'down';
        case DIRECTION.UP: return 'up';
        case DIRECTION.LEFT: return 'left';
        case DIRECTION.RIGHT: return 'right';
        default: return 'down';
    }
}

/**
 * Draw a non-combat campaign survivor. Model detail lives in
 * `SurvivorNpcRenderer` so quest contacts can carry storytelling detail without
 * bloating the shared player draw path.
 */
export function drawSurvivorNPC(npc, options = {}) {
    drawSurvivorNpcModel(npc, options);
}

export { DIRECTION, getDirectionFromAngle };
