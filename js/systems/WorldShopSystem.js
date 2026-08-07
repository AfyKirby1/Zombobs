import { gameState } from '../core/gameState.js';
import {
    DEPOT_SPAWN_DIST_MIN,
    DEPOT_SPAWN_DIST_MAX,
    MERCHANT_MIN_WAVE,
    MERCHANT_SPAWN_CHANCE,
    MERCHANT_COOLDOWN_WAVES,
    MERCHANT_DURATION_MS,
    MERCHANT_SPAWN_DIST_MIN,
    MERCHANT_SPAWN_DIST_MAX,
    MERCHANT_FLAVOR_ARRIVE,
    MERCHANT_FLAVOR_LEAVE
} from '../core/constants.js';
import { ScrapDepot } from '../entities/ScrapDepot.js';
import { WanderingMerchant } from '../entities/WanderingMerchant.js';
import { applyScrapOffer } from '../utils/scrapOfferUtils.js';
import { createParticles } from './ParticleSystem.js';
import { DamageNumber } from '../entities/Particle.js';
import { isCampaignMode, isMobileDevice, triggerWaveNotification, isInViewport } from '../utils/gameUtils.js';

/**
 * Arcade-only world shops: fixed Scrap Depot + rare Wandering Merchant.
 */
export class WorldShopSystem {
    constructor() {
        this.lastMerchantWave = -999;
        this.selectedVendor = null; // 'depot' | 'merchant' | null
    }

    /** True for single-player arcade (not campaign / coop / MP). */
    isEnabled() {
        return gameState.gameRunning &&
            !gameState.multiplayer.active &&
            !gameState.isCoop &&
            !isCampaignMode(gameState) &&
            gameState.gameMode === 'arcade';
    }

    reset() {
        gameState.scrapDepot = null;
        gameState.wanderingMerchant = null;
        this.lastMerchantWave = -999;
        this.selectedVendor = null;
    }

    spawnDepot() {
        if (!this.isEnabled()) return;
        if (gameState.scrapDepot) return;

        const player = gameState.players.find(p => p.inputSource === 'mouse') || gameState.players[0];
        if (!player) return;

        const angle = Math.random() * Math.PI * 2;
        const dist = DEPOT_SPAWN_DIST_MIN + Math.random() * (DEPOT_SPAWN_DIST_MAX - DEPOT_SPAWN_DIST_MIN);
        const x = player.x + Math.cos(angle) * dist;
        const y = player.y + Math.sin(angle) * dist;
        gameState.scrapDepot = new ScrapDepot(x, y);
    }

    onWaveBreakStart() {
        if (!this.isEnabled()) return;

        if (gameState.scrapDepot) {
            gameState.scrapDepot.refreshStock();
        }

        this.trySpawnMerchant();
    }

    onWaveBreakEnd() {
        if (!this.isEnabled()) return;
        this.dismissMerchant(true);
    }

    trySpawnMerchant() {
        if (!this.isEnabled()) return;
        if (gameState.wanderingMerchant) return;
        if (gameState.wave < MERCHANT_MIN_WAVE) return;
        if (gameState.wave - this.lastMerchantWave < MERCHANT_COOLDOWN_WAVES) return;
        if (Math.random() >= MERCHANT_SPAWN_CHANCE) return;

        const player = gameState.players.find(p => p.inputSource === 'mouse') || gameState.players[0];
        if (!player || player.health <= 0) return;

        const angle = Math.random() * Math.PI * 2;
        const dist = MERCHANT_SPAWN_DIST_MIN + Math.random() * (MERCHANT_SPAWN_DIST_MAX - MERCHANT_SPAWN_DIST_MIN);
        const x = player.x + Math.cos(angle) * dist;
        const y = player.y + Math.sin(angle) * dist;
        const leaveAt = Date.now() + MERCHANT_DURATION_MS;
        gameState.wanderingMerchant = new WanderingMerchant(x, y, leaveAt);
        this.lastMerchantWave = gameState.wave;

        const line = MERCHANT_FLAVOR_ARRIVE[Math.floor(Math.random() * MERCHANT_FLAVOR_ARRIVE.length)];
        triggerWaveNotification('WANDERING MERCHANT', 160, line);
        this._spawnFeedback(x, y - 40, line, '#e1bee7');
    }

    dismissMerchant(announce = false) {
        const merchant = gameState.wanderingMerchant;
        if (!merchant) return;
        if (announce) {
            const line = MERCHANT_FLAVOR_LEAVE[Math.floor(Math.random() * MERCHANT_FLAVOR_LEAVE.length)];
            this._spawnFeedback(merchant.x, merchant.y - 40, line, '#ce93d8');
        }
        gameState.wanderingMerchant = null;
    }

    update() {
        if (!this.isEnabled()) return;
        const now = Date.now();
        const merchant = gameState.wanderingMerchant;
        if (!merchant) return;

        merchant.update(now);
        if (merchant.isExpired(now) || !merchant.alive) {
            this.dismissMerchant(true);
        }
    }

    draw(viewport) {
        if (!this.isEnabled()) return;
        if (!viewport) return;

        const left = viewport.left;
        const top = viewport.top;
        const right = viewport.right;
        const bottom = viewport.bottom;

        const depot = gameState.scrapDepot;
        if (depot && isInViewport(depot, left, top, right, bottom)) {
            depot.draw();
        }

        const merchant = gameState.wanderingMerchant;
        if (merchant && isInViewport(merchant, left, top, right, bottom)) {
            merchant.draw();
        }
    }

    getNearbyDepot(player) {
        if (!player || player.health <= 0) return null;
        const depot = gameState.scrapDepot;
        if (!depot || !depot.isPlayerNear(player)) return null;
        return depot;
    }

    getNearbyMerchant(player) {
        if (!player || player.health <= 0) return null;
        const merchant = gameState.wanderingMerchant;
        if (!merchant || !merchant.alive || !merchant.isPlayerNear(player)) return null;
        return merchant;
    }

    /**
     * Cycle selected offer on nearby depot or merchant.
     * @param {Object} player
     * @param {number} direction
     * @returns {boolean}
     */
    tryCycleOffer(player, direction) {
        if (!this.isEnabled() || !player) return false;
        const merchant = this.getNearbyMerchant(player);
        if (merchant) {
            merchant.cycleOffer(direction);
            return true;
        }
        const depot = this.getNearbyDepot(player);
        if (depot) {
            depot.cycleOffer(direction);
            return true;
        }
        return false;
    }

    /**
     * Purchase selected offer. Priority: merchant > depot.
     * @param {Object} player
     * @returns {boolean}
     */
    tryPurchase(player) {
        if (!this.isEnabled() || !gameState.gameRunning || gameState.gamePaused) {
            return false;
        }
        if (!player || player.health <= 0) return false;

        const merchant = this.getNearbyMerchant(player);
        if (merchant) {
            return this._buyFromMerchant(player, merchant);
        }

        const depot = this.getNearbyDepot(player);
        if (depot) {
            return this._buyFromDepot(player, depot);
        }

        return false;
    }

    _buyFromDepot(player, depot) {
        const offer = depot.getPricedOffer(depot.getSelectedOffer());
        if (!offer) return false;

        if (depot.getStock(offer.id) <= 0) {
            this._spawnFeedback(depot.x, depot.y - 30, 'Out of stock', '#ff5252');
            return false;
        }

        const scrap = player.scrap || 0;
        if (scrap < offer.cost) {
            this._spawnFeedback(depot.x, depot.y - 30, `Need ${offer.cost} scrap`, '#ff5252');
            return false;
        }

        if (!applyScrapOffer(player, offer.id)) {
            this._spawnFeedback(depot.x, depot.y - 30, 'Cannot buy', '#ff5252');
            return false;
        }

        if (!depot.consumeStock(offer.id)) return false;
        player.scrap = scrap - offer.cost;
        createParticles(depot.x, depot.y, '#cd7f32', 12);
        this._spawnFeedback(depot.x, depot.y - 40, offer.label, '#76ff03');
        return true;
    }

    _buyFromMerchant(player, merchant) {
        const offer = merchant.getPricedOffer(merchant.getSelectedOffer());
        if (!offer) return false;

        const scrap = player.scrap || 0;
        if (scrap < offer.cost) {
            this._spawnFeedback(merchant.x, merchant.y - 30, `Need ${offer.cost} scrap`, '#ff5252');
            return false;
        }

        if (!applyScrapOffer(player, offer.id)) {
            this._spawnFeedback(merchant.x, merchant.y - 30, 'Cannot buy', '#ff5252');
            return false;
        }

        player.scrap = scrap - offer.cost;
        createParticles(merchant.x, merchant.y, '#ba68c8', 14);
        this._spawnFeedback(merchant.x, merchant.y - 40, offer.label, '#e1bee7');
        merchant.removeSelectedOffer();
        if (!merchant.alive || merchant.offers.length === 0) {
            this.dismissMerchant(true);
        }
        return true;
    }

    getPromptText(player) {
        if (!this.isEnabled() || !player) return null;
        const actionHint = isMobileDevice() ? 'Tap E' : 'Press E';
        const cycleHint = isMobileDevice() ? '' : ' · Q/Scroll cycle';

        const merchant = this.getNearbyMerchant(player);
        if (merchant) {
            const offer = merchant.getPricedOffer(merchant.getSelectedOffer());
            if (!offer) return null;
            const canAfford = (player.scrap || 0) >= offer.cost;
            const tag = canAfford ? '' : ' (low scrap)';
            const rare = offer.rare ? ' ★' : '';
            return `${offer.icon} ${offer.label}${rare} [${offer.cost}] — ${actionHint}${cycleHint}${tag}`;
        }

        const depot = this.getNearbyDepot(player);
        if (depot) {
            const offer = depot.getPricedOffer(depot.getSelectedOffer());
            if (!offer) return null;
            const stock = depot.getStock(offer.id);
            const canAfford = (player.scrap || 0) >= offer.cost;
            const tag = stock <= 0 ? ' (sold out)' : (canAfford ? '' : ' (low scrap)');
            return `${offer.icon} ${offer.label} [${offer.cost}] x${stock} — ${actionHint}${cycleHint}${tag}`;
        }

        return null;
    }

    getNearbyVendorPosition(player) {
        const merchant = this.getNearbyMerchant(player);
        if (merchant) {
            return {
                x: merchant.x,
                y: merchant.y,
                radius: merchant.radius,
                tooltipOffset: merchant.tooltipOffset
            };
        }
        const depot = this.getNearbyDepot(player);
        if (depot) {
            return {
                x: depot.x,
                y: depot.y,
                radius: depot.radius,
                tooltipOffset: depot.tooltipOffset
            };
        }
        return null;
    }

    /**
     * Beacon targets for HUD (depot always, merchant while present).
     * @returns {Array<{x:number,y:number,letter:string,color:string,label:string}>}
     */
    getBeaconTargets() {
        if (!this.isEnabled()) return [];
        const targets = [];
        const depot = gameState.scrapDepot;
        if (depot) {
            targets.push({
                x: depot.x,
                y: depot.y,
                letter: 'D',
                color: '#cd7f32',
                label: 'Depot',
                markerOffset: depot.beaconOffset
            });
        }
        const merchant = gameState.wanderingMerchant;
        if (merchant && merchant.alive) {
            targets.push({
                x: merchant.x,
                y: merchant.y,
                letter: 'M',
                color: '#ba68c8',
                label: 'Merchant',
                markerOffset: merchant.beaconOffset
            });
        }
        return targets;
    }

    _spawnFeedback(x, y, text, color) {
        if (!gameState.damageNumbers) return;
        gameState.damageNumbers.push(new DamageNumber(x, y, text, false, color));
    }
}

export const worldShopSystem = new WorldShopSystem();
