import { ctx } from '../core/canvas.js';
import {
    MERCHANT_INTERACT_RANGE,
    MERCHANT_OFFERS,
    MERCHANT_OFFER_SLOTS,
    MERCHANT_DURATION_MS
} from '../core/constants.js';
import { scaledScrapCost } from '../utils/scrapOfferUtils.js';

/**
 * Wandering Merchant — rare arcade black-market NPC.
 */
export class WanderingMerchant {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [leaveAt]
     */
    constructor(x, y, leaveAt = Date.now() + MERCHANT_DURATION_MS) {
        this.x = x;
        this.y = y;
        // A rare shop should read as a destination at a glance. Interaction
        // distance remains separately fixed below.
        this.radius = 58;
        this.renderRadius = 126;
        this.tooltipOffset = 120;
        this.beaconOffset = 114;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.interactRange = MERCHANT_INTERACT_RANGE;
        this.interactRangeSq = MERCHANT_INTERACT_RANGE * MERCHANT_INTERACT_RANGE;
        this.leaveAt = leaveAt;
        this.selectedIndex = 0;
        this.wanderTarget = { x, y };
        this.wanderRetargetAt = 0;
        this.speed = 0.55;
        this.offers = this._rollOffers();
        this.alive = true;
    }

    _rollOffers() {
        const slots = MERCHANT_OFFER_SLOTS;
        const picked = [];
        const used = new Set();
        let hasRare = false;

        for (let attempt = 0; attempt < 40 && picked.length < slots; attempt++) {
            const offer = this._weightedPick(used);
            if (!offer) break;
            used.add(offer.id);
            picked.push({ ...offer });
            if (offer.rare) hasRare = true;
        }

        if (!hasRare) {
            const rares = MERCHANT_OFFERS.filter(o => o.rare && !used.has(o.id));
            if (rares.length > 0 && picked.length > 0) {
                const rare = rares[Math.floor(Math.random() * rares.length)];
                picked[picked.length - 1] = { ...rare };
            } else if (rares.length > 0) {
                picked.push({ ...rares[0] });
            }
        }

        return picked;
    }

    _weightedPick(excludeIds) {
        let total = 0;
        const pool = [];
        for (let i = 0; i < MERCHANT_OFFERS.length; i++) {
            const o = MERCHANT_OFFERS[i];
            if (excludeIds.has(o.id)) continue;
            pool.push(o);
            total += o.weight || 1;
        }
        if (pool.length === 0 || total <= 0) return null;
        let roll = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
            roll -= pool[i].weight || 1;
            if (roll <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    isExpired(now = Date.now()) {
        return !this.alive || now >= this.leaveAt;
    }

    isPlayerNear(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return (dx * dx + dy * dy) <= this.interactRangeSq;
    }

    getSelectedOffer() {
        if (this.offers.length === 0) return null;
        const idx = ((this.selectedIndex % this.offers.length) + this.offers.length) % this.offers.length;
        return this.offers[idx];
    }

    getPricedOffer(offer) {
        if (!offer) return null;
        return {
            ...offer,
            cost: scaledScrapCost(offer.cost)
        };
    }

    cycleOffer(direction) {
        const len = this.offers.length;
        if (len === 0) return;
        this.selectedIndex = ((this.selectedIndex + direction) % len + len) % len;
    }

    removeSelectedOffer() {
        if (this.offers.length === 0) return;
        const idx = ((this.selectedIndex % this.offers.length) + this.offers.length) % this.offers.length;
        this.offers.splice(idx, 1);
        if (this.selectedIndex >= this.offers.length) {
            this.selectedIndex = Math.max(0, this.offers.length - 1);
        }
        if (this.offers.length === 0) {
            this.alive = false;
        }
    }

    update(now) {
        if (this.isExpired(now)) {
            this.alive = false;
            return;
        }

        if (now >= this.wanderRetargetAt) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 120;
            this.wanderTarget.x = this.x + Math.cos(angle) * dist;
            this.wanderTarget.y = this.y + Math.sin(angle) * dist;
            this.wanderRetargetAt = now + 1800 + Math.random() * 2200;
        }

        const dx = this.wanderTarget.x - this.x;
        const dy = this.wanderTarget.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 4) {
            const dist = Math.sqrt(distSq);
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        const t = Date.now() / 500 + this.pulseOffset;
        const pulse = 0.85 + Math.sin(t) * 0.15;
        const glowRadius = this.radius * 1.85 * pulse;

        ctx.save();

        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glow.addColorStop(0, 'rgba(186, 104, 200, 0.55)');
        glow.addColorStop(0.5, 'rgba(123, 31, 162, 0.25)');
        glow.addColorStop(1, 'rgba(74, 20, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Moving market stall shadow.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 35, 69, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cargo-cart body, wheels, and canopy make the merchant distinct from
        // a normal NPC while retaining its wandering behavior.
        ctx.fillStyle = '#25122f';
        ctx.fillRect(this.x - 58, this.y - 19, 116, 55);
        ctx.strokeStyle = '#d6a9ee';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 58, this.y - 19, 116, 55);
        ctx.fillStyle = '#160c20';
        ctx.fillRect(this.x - 64, this.y + 30, 128, 10);
        for (let i = -1; i <= 1; i += 2) {
            ctx.fillStyle = '#111018';
            ctx.beginPath();
            ctx.arc(this.x + i * 43, this.y + 42, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ab72ca';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.moveTo(this.x - 70, this.y - 22);
        ctx.lineTo(this.x - 48, this.y - 64);
        ctx.lineTo(this.x + 48, this.y - 64);
        ctx.lineTo(this.x + 70, this.y - 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e1bee7';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(229, 190, 255, 0.22)';
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(this.x + i * 28 - 5, this.y - 55, 10, 29);
        }

        // Merchant silhouette inside the kiosk.
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 16, 18, 21, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#180c24';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 30, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f5e6ff';
        ctx.fillRect(this.x - 5, this.y - 33, 3, 3);
        ctx.fillRect(this.x + 3, this.y - 33, 3, 3);

        ctx.fillStyle = '#160d1e';
        ctx.fillRect(this.x - 65, this.y - 92, 130, 25);
        ctx.strokeStyle = '#d6a9ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 65, this.y - 92, 130, 25);

        ctx.font = 'bold 11px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f4dcff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText('NIGHT MARKET', this.x, this.y - 79);

        ctx.font = 'bold 9px "Roboto Mono", monospace';
        ctx.fillStyle = '#e1bee7';
        ctx.fillText('RARE GOODS // MOVING', this.x, this.y + 61);

        ctx.restore();
    }
}
