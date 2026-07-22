// [TRACE: CAMPAIGN_DESIGN.md] Equipment pickup dropped by zombies.

import { getRarityColor } from '../core/equipmentDefinitions.js';

const EQUIP_MAGNET_RANGE = 180;
const EQUIP_MAGNET_RANGE_SQ = EQUIP_MAGNET_RANGE * EQUIP_MAGNET_RANGE;
const EQUIP_MAGNET_SPEED = 3.2;

export class EquipmentPickup {
    constructor(x, y, item) {
        this.x = x;
        this.y = y;
        this.item = item;
        this.radius = 14;
        this.bob = Math.random() * Math.PI * 2;
        this.life = 1200;
        this.maxLife = 1200;
        this.collected = false;
        this._fullInvToastAt = 0;
    }

    /**
     * @param {number} [playerX]
     * @param {number} [playerY]
     */
    update(playerX, playerY) {
        this.bob += 0.05;
        this.life--;

        if (playerX === undefined || playerY === undefined) return;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0 && distSq <= EQUIP_MAGNET_RANGE_SQ) {
            const dist = Math.sqrt(distSq);
            this.x += (dx / dist) * EQUIP_MAGNET_SPEED;
            this.y += (dy / dist) * EQUIP_MAGNET_SPEED;
        }
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 60);
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        const yOffset = Math.sin(this.bob) * 3;
        const color = getRarityColor(this.item.rarity);

        // Glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;

        // Crate/box
        ctx.fillStyle = '#2a2a2a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(this.x - 10, this.y - 10 + yOffset, 20, 20);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.item.icon, this.x, this.y + yOffset);

        // Short name / rarity label above crate
        const label = this.item.name
            ? (this.item.name.length > 14 ? `${this.item.name.slice(0, 12)}…` : this.item.name)
            : (this.item.rarity || 'gear');
        ctx.font = 'bold 9px "Roboto Mono", monospace';
        ctx.fillStyle = color;
        ctx.fillText(label, this.x, this.y - 18 + yOffset);

        ctx.restore();
    }
}
