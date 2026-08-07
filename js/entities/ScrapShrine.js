import { ctx } from '../core/canvas.js';
import { SCRAP_SHRINE_INTERACT_RANGE } from '../core/constants.js';

/**
 * Scrap Shrine — wave-break upgrade station. One random offer per spawn.
 */
export class ScrapShrine {
    /**
     * @param {number} x
     * @param {number} y
     * @param {{ id: string, label: string, cost: number, icon: string }} offer
     */
    constructor(x, y, offer) {
        this.x = x;
        this.y = y;
        // Landmark scale is visual only; player interaction keeps using the
        // separately defined shrine range.
        this.radius = 62;
        this.renderRadius = 112;
        this.tooltipOffset = 108;
        this.offer = offer;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.interactRange = SCRAP_SHRINE_INTERACT_RANGE;
        this.interactRangeSq = SCRAP_SHRINE_INTERACT_RANGE * SCRAP_SHRINE_INTERACT_RANGE;
    }

    isPlayerNear(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return (dx * dx + dy * dy) <= this.interactRangeSq;
    }

    draw() {
        const t = Date.now() / 600 + this.pulseOffset;
        const pulse = 0.85 + Math.sin(t) * 0.15;
        const glowRadius = this.radius * 1.7 * pulse;

        ctx.save();

        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.55)');
        glowGradient.addColorStop(0.5, 'rgba(184, 134, 11, 0.25)');
        glowGradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ground shadow and stepped plinth make the temporary upgrade station
        // feel substantial without adding collision geometry.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 39, 67, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        const pedestalGradient = ctx.createLinearGradient(this.x - 55, this.y - 42, this.x + 55, this.y + 45);
        pedestalGradient.addColorStop(0, '#ffe082');
        pedestalGradient.addColorStop(0.45, '#b8860b');
        pedestalGradient.addColorStop(1, '#4a3015');
        ctx.fillStyle = pedestalGradient;
        ctx.beginPath();
        ctx.moveTo(this.x - 58, this.y + 28);
        ctx.lineTo(this.x - 42, this.y - 18);
        ctx.lineTo(this.x - 21, this.y - 43);
        ctx.lineTo(this.x + 21, this.y - 43);
        ctx.lineTo(this.x + 42, this.y - 18);
        ctx.lineTo(this.x + 58, this.y + 28);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#6d4517';
        ctx.fillRect(this.x - 68, this.y + 27, 136, 16);
        ctx.strokeStyle = '#f3c557';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 68, this.y + 27, 136, 16);

        // Floating relic ring is a much clearer upgrade read than the old disc.
        ctx.strokeStyle = `rgba(255, 235, 120, ${0.65 + pulse * 0.25})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 61, 29 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff6c7';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 61, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(this.offer.icon, this.x, this.y - 8);

        ctx.font = 'bold 10px "Roboto Mono", monospace';
        ctx.fillStyle = '#fff0a5';
        ctx.fillText(`UPGRADE // ${this.offer.cost}`, this.x, this.y + 59);

        ctx.restore();
    }
}
