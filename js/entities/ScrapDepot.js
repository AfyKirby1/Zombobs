import { ctx } from '../core/canvas.js';
import { DEPOT_INTERACT_RANGE, DEPOT_OFFERS } from '../core/constants.js';
import { scaledScrapCost } from '../utils/scrapOfferUtils.js';

/**
 * Scrap Depot — fixed arcade restock stall with multi-offer stock.
 */
export class ScrapDepot {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 32;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.interactRange = DEPOT_INTERACT_RANGE;
        this.interactRangeSq = DEPOT_INTERACT_RANGE * DEPOT_INTERACT_RANGE;
        this.selectedIndex = 0;
        this.stock = {};
        this.refreshStock();
    }

    refreshStock() {
        for (let i = 0; i < DEPOT_OFFERS.length; i++) {
            const offer = DEPOT_OFFERS[i];
            this.stock[offer.id] = offer.stock;
        }
        this.selectedIndex = 0;
    }

    isPlayerNear(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return (dx * dx + dy * dy) <= this.interactRangeSq;
    }

    getOffers() {
        return DEPOT_OFFERS;
    }

    getSelectedOffer() {
        const offers = this.getOffers();
        if (offers.length === 0) return null;
        const idx = ((this.selectedIndex % offers.length) + offers.length) % offers.length;
        return offers[idx];
    }

    cycleOffer(direction) {
        const len = this.getOffers().length;
        if (len === 0) return;
        this.selectedIndex = ((this.selectedIndex + direction) % len + len) % len;
    }

    getStock(offerId) {
        return this.stock[offerId] || 0;
    }

    consumeStock(offerId) {
        if ((this.stock[offerId] || 0) <= 0) return false;
        this.stock[offerId]--;
        return true;
    }

    getPricedOffer(offer) {
        if (!offer) return null;
        return {
            ...offer,
            cost: scaledScrapCost(offer.cost)
        };
    }

    draw() {
        const t = Date.now() / 700 + this.pulseOffset;
        const pulse = 0.85 + Math.sin(t) * 0.15;
        const glowRadius = this.radius * 2.6 * pulse;

        ctx.save();

        // Beacon pillar glow (bronze)
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glow.addColorStop(0, 'rgba(205, 127, 50, 0.55)');
        glow.addColorStop(0.5, 'rgba(184, 115, 51, 0.22)');
        glow.addColorStop(1, 'rgba(120, 60, 20, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Mast / beacon shaft
        ctx.fillStyle = '#5c3d1e';
        ctx.fillRect(this.x - 3, this.y - 55, 6, 40);
        ctx.fillStyle = `rgba(255, 180, 60, ${0.5 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 58, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Stall base
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(this.x - 28, this.y - 8, 56, 22);
        ctx.fillStyle = '#cd7f32';
        ctx.beginPath();
        ctx.moveTo(this.x - 32, this.y - 8);
        ctx.lineTo(this.x, this.y - 28);
        ctx.lineTo(this.x + 32, this.y - 8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 215, 150, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 28, this.y - 8, 56, 22);

        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff8e1';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText('🏪', this.x, this.y + 2);

        ctx.font = 'bold 10px "Roboto Mono", monospace';
        ctx.fillStyle = '#cd7f32';
        ctx.fillText('DEPOT', this.x, this.y + 28);

        ctx.restore();
    }
}
