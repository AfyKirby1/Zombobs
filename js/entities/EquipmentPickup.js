// [TRACE: CAMPAIGN_DESIGN.md] Equipment pickup dropped by zombies.

import { getRarityColor } from '../core/equipmentDefinitions.js';

export class EquipmentPickup {
    constructor(x, y, item) {
        this.x = x;
        this.y = y;
        this.item = item;
        this.radius = 14;
        this.bob = Math.random() * Math.PI * 2;
        this.life = 900;
        this.maxLife = 900;
        this.collected = false;
    }

    update() {
        this.bob += 0.05;
        this.life--;
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

        ctx.restore();
    }
}
