import { gameState } from '../core/gameState.js';
import {
    WEAPONS,
    SCRAP_SHOP_OVERCLOCK_DURATION_MS,
    SCRAP_SHOP_SHIELD_AMOUNT,
    DEPOT_MEDKIT_HEAL,
    DEPOT_PRICE_SCALE_PER_WAVE,
    DEPOT_PRICE_SCALE_CAP,
    MAX_MOLOTOVS,
    MERCHANT_OVERCLOCK_DURATION_MS,
    MERCHANT_SCRAP_MAGNET_DURATION_MS,
    MERCHANT_XP_BURST
} from '../core/constants.js';
import { SentryTurret } from '../entities/SentryTurret.js';
import {
    HealthPickup,
    AmmoPickup,
    SpeedPickup,
    RapidFirePickup,
    ShieldPickup
} from '../entities/Pickup.js';
import { triggerNuke, getPlayerMaxGrenades } from './combatUtils.js';
import { skillSystem } from '../systems/SkillSystem.js';
import { equipmentSystem } from '../systems/EquipmentSystem.js';
import { EquipmentPickup } from '../entities/EquipmentPickup.js';

/**
 * Wave-scaled scrap cost. Caps at DEPOT_PRICE_SCALE_CAP× base.
 * @param {number} baseCost
 * @param {number} [wave]
 * @returns {number}
 */
export function scaledScrapCost(baseCost, wave = gameState.wave) {
    const scale = Math.min(
        DEPOT_PRICE_SCALE_CAP,
        1 + DEPOT_PRICE_SCALE_PER_WAVE * Math.max(0, (wave || 1) - 1)
    );
    return Math.floor(baseCost * scale);
}

/**
 * Apply a scrap-shop offer effect to the player.
 * Shared by shrine, depot, and wandering merchant.
 * @param {Object} player
 * @param {string} offerId
 * @returns {boolean}
 */
export function applyScrapOffer(player, offerId) {
    if (!player || player.health <= 0) return false;
    const now = Date.now();

    if (offerId === 'ammo') {
        const ammoMultiplier = player.ammoMultiplier || 1.0;
        player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * ammoMultiplier);
        player.currentAmmo = player.maxAmmo;
        player.isReloading = false;
        const weaponKeys = Object.keys(WEAPONS);
        const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);
        if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
            player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
        }
        return true;
    }

    if (offerId === 'shield') {
        player.shield = Math.min(player.maxShield, (player.shield || 0) + SCRAP_SHOP_SHIELD_AMOUNT);
        return true;
    }

    if (offerId === 'overclock') {
        gameState.rapidFireEndTime = Math.max(
            gameState.rapidFireEndTime,
            now + SCRAP_SHOP_OVERCLOCK_DURATION_MS
        );
        return true;
    }

    if (offerId === 'overclock_syringe') {
        gameState.rapidFireEndTime = Math.max(
            gameState.rapidFireEndTime,
            now + MERCHANT_OVERCLOCK_DURATION_MS
        );
        return true;
    }

    if (offerId === 'sentry_turret') {
        const turretX = player.x + Math.cos(player.angle) * 35;
        const turretY = player.y + Math.sin(player.angle) * 35;
        gameState.sentryTurrets.push(new SentryTurret(turretX, turretY));
        return true;
    }

    if (offerId === 'orbital_strike') {
        player.orbitalStrikeCount = (player.orbitalStrikeCount || 0) + 1;
        player.activeThrowable = 'orbital_strike';
        return true;
    }

    if (offerId === 'medkit') {
        player.health = Math.min(player.maxHealth, player.health + DEPOT_MEDKIT_HEAL);
        return true;
    }

    if (offerId === 'grenade') {
        const maxG = getPlayerMaxGrenades(player);
        if ((player.grenadeCount || 0) >= maxG) return false;
        player.grenadeCount = (player.grenadeCount || 0) + 1;
        return true;
    }

    if (offerId === 'molotov') {
        const maxM = MAX_MOLOTOVS + (player.maxMolotovBonus || 0);
        if ((player.molotovCount || 0) >= maxM) return false;
        player.molotovCount = (player.molotovCount || 0) + 1;
        return true;
    }

    if (offerId === 'scrap_magnet') {
        gameState.scrapMagnetEndTime = Math.max(
            gameState.scrapMagnetEndTime || 0,
            now + MERCHANT_SCRAP_MAGNET_DURATION_MS
        );
        return true;
    }

    if (offerId === 'panic_nuke') {
        triggerNuke(player.x, player.y, true);
        return true;
    }

    if (offerId === 'reroll_token') {
        player.bonusLevelUpRerolls = (player.bonusLevelUpRerolls || 0) + 1;
        return true;
    }

    if (offerId === 'xp_burst') {
        skillSystem.gainXP(MERCHANT_XP_BURST, { source: 'merchant' });
        return true;
    }

    if (offerId === 'mystery_crate') {
        spawnMysteryCratePickups(player.x, player.y);
        return true;
    }

    if (offerId === 'gear_crate') {
        spawnMerchantGearCrate(player);
        return true;
    }

    return false;
}

/**
 * Merchant gear crate — rare+ biased equipment drop near player.
 * @param {Object} player
 */
function spawnMerchantGearCrate(player) {
    const r = Math.random();
    let rarity = 'rare';
    if (r > 0.75) rarity = 'legendary';
    else if (r > 0.40) rarity = 'epic';

    const item = equipmentSystem.createRandomItem(rarity);
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 30;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    if (!gameState.equipmentPickups) gameState.equipmentPickups = [];
    gameState.equipmentPickups.push(new EquipmentPickup(x, y, item));
}

/**
 * @param {number} x
 * @param {number} y
 */
function spawnMysteryCratePickups(x, y) {
    const pool = [HealthPickup, AmmoPickup, SpeedPickup, RapidFirePickup, ShieldPickup];
    const arrays = [
        gameState.healthPickups,
        gameState.ammoPickups,
        gameState.speedPickups,
        gameState.rapidFirePickups,
        gameState.shieldPickups
    ];
    const count = 3;
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const PickupClass = pool[idx];
        const pickup = new PickupClass(800, 600);
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        pickup.x = x + Math.cos(angle) * (50 + Math.random() * 40);
        pickup.y = y + Math.sin(angle) * (50 + Math.random() * 40);
        arrays[idx].push(pickup);
    }
}
