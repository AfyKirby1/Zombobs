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
        this.radius = 18;
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
        const glowRadius = this.radius * 3.2 * pulse;

        ctx.save();

        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glow.addColorStop(0, 'rgba(186, 104, 200, 0.55)');
        glow.addColorStop(0.5, 'rgba(123, 31, 162, 0.25)');
        glow.addColorStop(1, 'rgba(74, 20, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(224, 190, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hood / coat
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 6, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText('🧙', this.x, this.y - 1);

        ctx.font = 'bold 9px "Roboto Mono", monospace';
        ctx.fillStyle = '#e1bee7';
        ctx.fillText('MERCHANT', this.x, this.y + this.radius + 12);

        ctx.restore();
    }
}
