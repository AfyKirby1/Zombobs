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
        // Render radius intentionally exceeds the interact radius: this is a
        // landmark-sized restock station, not a chest players need to stand on.
        this.radius = 86;
        this.renderRadius = 194;
        this.tooltipOffset = 194;
        this.beaconOffset = 188;
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
        const glowRadius = this.radius * 1.65 * pulse;

        ctx.save();

        // Ground shadow anchors the larger stall in the world.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 37, 88, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Beacon pillar glow (bronze)
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glow.addColorStop(0, 'rgba(205, 127, 50, 0.55)');
        glow.addColorStop(0.5, 'rgba(184, 115, 51, 0.22)');
        glow.addColorStop(1, 'rgba(120, 60, 20, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Tall, readable beacon mast.
        ctx.fillStyle = '#3f2a16';
        ctx.fillRect(this.x - 5, this.y - 153, 10, 98);
        ctx.fillStyle = '#8c5a28';
        ctx.fillRect(this.x - 2, this.y - 151, 4, 94);
        ctx.strokeStyle = 'rgba(255, 212, 134, 0.38)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y - 48);
        ctx.lineTo(this.x - 5, this.y - 82);
        ctx.lineTo(this.x + 30, this.y - 48);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 180, 60, ${0.5 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 158, 13 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Back wall and canopy make the depot read as a proper field shop.
        const wallGradient = ctx.createLinearGradient(this.x - 70, this.y - 54, this.x + 70, this.y + 36);
        wallGradient.addColorStop(0, '#5a3820');
        wallGradient.addColorStop(0.5, '#2b211c');
        wallGradient.addColorStop(1, '#171310');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - 70, this.y - 51, 140, 83);
        ctx.strokeStyle = '#1b120b';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 70, this.y - 51, 140, 83);

        ctx.fillStyle = '#8c5525';
        ctx.beginPath();
        ctx.moveTo(this.x - 86, this.y - 56);
        ctx.lineTo(this.x - 62, this.y - 82);
        ctx.lineTo(this.x + 62, this.y - 82);
        ctx.lineTo(this.x + 86, this.y - 56);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e2a34a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Sun-faded awning ribs add scale without changing gameplay bounds.
        ctx.strokeStyle = 'rgba(255, 220, 150, 0.45)';
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
            const x = this.x + i * 25;
            ctx.beginPath();
            ctx.moveTo(x * 0.72 + this.x * 0.28, this.y - 80);
            ctx.lineTo(x, this.y - 57);
            ctx.stroke();
        }

        // Side supply stacks give the station a wide, stable silhouette.
        const crateXs = [-57, 35];
        for (let i = 0; i < crateXs.length; i++) {
            const crateX = this.x + crateXs[i];
            const crateY = this.y + (i === 0 ? 5 : 10);
            ctx.fillStyle = i === 0 ? '#604021' : '#4a321f';
            ctx.fillRect(crateX, crateY, 25, 23);
            ctx.strokeStyle = '#1a120b';
            ctx.lineWidth = 2;
            ctx.strokeRect(crateX, crateY, 25, 23);
            ctx.strokeStyle = 'rgba(255, 205, 110, 0.28)';
            ctx.beginPath();
            ctx.moveTo(crateX + 3, crateY + 3);
            ctx.lineTo(crateX + 22, crateY + 20);
            ctx.moveTo(crateX + 22, crateY + 3);
            ctx.lineTo(crateX + 3, crateY + 20);
            ctx.stroke();
        }

        // Armored front counter and illuminated stock drawer.
        ctx.fillStyle = '#2e211a';
        ctx.fillRect(this.x - 80, this.y + 17, 160, 30);
        ctx.strokeStyle = '#d7963e';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 80, this.y + 17, 160, 30);
        ctx.fillStyle = 'rgba(255, 196, 86, 0.24)';
        ctx.fillRect(this.x - 64, this.y + 24, 128, 6);

        // Dedicated sign remains clear at combat zoom, unlike the old emoji marker.
        ctx.fillStyle = '#17120e';
        ctx.fillRect(this.x - 62, this.y - 125, 124, 27);
        ctx.strokeStyle = '#e2a34a';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 62, this.y - 125, 124, 27);
        ctx.font = 'bold 12px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff1bf';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText('SCRAP DEPOT', this.x, this.y - 112);

        ctx.font = 'bold 10px "Roboto Mono", monospace';
        ctx.fillStyle = '#ffd180';
        ctx.fillText('RESTOCK // ARMORY', this.x, this.y + 61);

        ctx.restore();
    }
}
