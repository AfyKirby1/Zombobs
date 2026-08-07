// [TRACE: CAMPAIGN_DESIGN.md] Equipment system — drops, inventory, sets, stat bonuses.

import { PLAYER_MAX_HEALTH } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import {
    generateEquipmentItem,
    getActiveSetBonuses
} from '../core/equipmentDefinitions.js';
import { DamageNumber } from '../entities/Particle.js';

/** Scrap value when player scraps inventory items */
export const EQUIPMENT_SCRAP_VALUES = {
    common: 8,
    uncommon: 14,
    rare: 22,
    epic: 35,
    legendary: 55
};

/**
 * Boss / Warden / flagged boss entity check for loot + scrap.
 * @param {Object} zombie
 * @returns {boolean}
 */
export function isBossEntity(zombie) {
    return !!(zombie && (
        zombie.isBoss === true ||
        zombie.type === 'boss' ||
        zombie.type === 'warden' ||
        zombie === gameState.boss
    ));
}

export class EquipmentSystem {
    constructor() {
        this.maxInventorySize = 24;
        this.visibleInventoryRows = 10;
    }

    createRandomItem(rarity, opts) {
        return generateEquipmentItem(rarity, opts);
    }

    addItemToInventory(player, item) {
        if (!player.inventory) player.inventory = [];
        if (player.inventory.length < this.maxInventorySize) {
            player.inventory.push(item);
            return true;
        }
        return false;
    }

    /**
     * @returns {boolean} true if equip succeeded
     */
    equipItem(player, item) {
        if (!player || !item) return false;
        if (!player.equippedItems) player.equippedItems = {};
        const slot = item.slot;
        const current = player.equippedItems[slot];

        // Abort swap if inventory cannot hold the unequipped piece
        if (current) {
            const invLen = (player.inventory || []).length;
            const removingSelf = player.inventory && player.inventory.indexOf(item) >= 0;
            const freeSlots = this.maxInventorySize - invLen + (removingSelf ? 1 : 0);
            if (freeSlots < 1) {
                return false;
            }
            this.addItemToInventory(player, current);
        }

        player.equippedItems[slot] = item;

        if (player.inventory) {
            const idx = player.inventory.indexOf(item);
            if (idx >= 0) player.inventory.splice(idx, 1);
        }

        this.recalcPlayerEquipment(player);
        return true;
    }

    unequipItem(player, slot) {
        if (!player.equippedItems || !player.equippedItems[slot]) return false;
        const item = player.equippedItems[slot];
        if (this.addItemToInventory(player, item)) {
            delete player.equippedItems[slot];
            this.recalcPlayerEquipment(player);
            return true;
        }
        return false;
    }

    /**
     * Scrap inventory item for scrap currency.
     * @param {Object} player
     * @param {number} index - absolute inventory index
     * @returns {boolean}
     */
    scrapItem(player, index) {
        if (!player || !player.inventory) return false;
        if (index < 0 || index >= player.inventory.length) return false;

        const item = player.inventory[index];
        if (!item) return false;

        const value = EQUIPMENT_SCRAP_VALUES[item.rarity] || EQUIPMENT_SCRAP_VALUES.common;
        player.inventory.splice(index, 1);
        player.scrap = (player.scrap || 0) + value;
        gameState.scrapCollected = (gameState.scrapCollected || 0) + value;

        if (gameState.damageNumbers) {
            gameState.damageNumbers.push(
                new DamageNumber(player.x, player.y - 36, `+${value} SCRAP`, false, '#ffd700')
            );
        }
        return true;
    }

    getScrapValue(item) {
        if (!item) return 0;
        return EQUIPMENT_SCRAP_VALUES[item.rarity] || EQUIPMENT_SCRAP_VALUES.common;
    }

    _mergeBonuses(target, source) {
        for (const [type, value] of Object.entries(source)) {
            if (type === 'maxHealth' || type === 'critChance' || type === 'damageReduction') {
                target[type] = (target[type] || 0) + value;
            } else {
                target[type] = (target[type] || 1) + value;
            }
        }
    }

    recalcPlayerEquipment(player) {
        const bonuses = {
            maxHealth: 0,
            speed: 1,
            damage: 1,
            fireRate: 1,
            reloadSpeed: 1,
            xpGain: 1,
            scrapGain: 1,
            critChance: 0,
            damageReduction: 0
        };

        if (player.equippedItems) {
            for (const slot of Object.keys(player.equippedItems)) {
                const item = player.equippedItems[slot];
                if (!item || !item.bonuses) continue;
                this._mergeBonuses(bonuses, item.bonuses);
            }

            const sets = getActiveSetBonuses(player.equippedItems);
            player.activeEquipmentSets = sets;
            for (let i = 0; i < sets.length; i++) {
                this._mergeBonuses(bonuses, sets[i].bonuses);
            }
        } else {
            player.activeEquipmentSets = [];
        }

        player.equipmentMaxHealthBonus = bonuses.maxHealth;
        player.equipmentSpeedMultiplier = bonuses.speed;
        player.equipmentDamageMultiplier = bonuses.damage;
        player.equipmentFireRateMultiplier = bonuses.fireRate;
        player.equipmentReloadSpeedMultiplier = bonuses.reloadSpeed;
        player.equipmentXpGainMultiplier = bonuses.xpGain;
        player.equipmentScrapMultiplier = bonuses.scrapGain;
        player.equipmentCritChance = bonuses.critChance;
        player.equipmentDamageReduction = Math.min(0.45, bonuses.damageReduction);

        const newMaxHealth = PLAYER_MAX_HEALTH + bonuses.maxHealth;
        const healthDiff = newMaxHealth - (player.maxHealth || PLAYER_MAX_HEALTH);
        player.maxHealth = newMaxHealth;
        player.health = Math.min(player.maxHealth, (player.health || 0) + Math.max(0, healthDiff));
    }

    resetPlayerEquipment(player) {
        player.equippedItems = {};
        player.inventory = [];
        player.activeEquipmentSets = [];
        player.equipmentMaxHealthBonus = 0;
        player.equipmentSpeedMultiplier = 1;
        player.equipmentDamageMultiplier = 1;
        player.equipmentFireRateMultiplier = 1;
        player.equipmentReloadSpeedMultiplier = 1;
        player.equipmentXpGainMultiplier = 1;
        player.equipmentScrapMultiplier = 1;
        player.equipmentCritChance = 0;
        player.equipmentDamageReduction = 0;
    }

    tryDropFromZombie(zombie) {
        const isBoss = isBossEntity(zombie);
        const isWarden = zombie && zombie.type === 'warden';
        const isGolden = zombie && zombie.isGolden;
        const isBounty = zombie && zombie.isBounty;
        // Tougher variants are more likely to be carrying something useful
        const eliteTypes = ['armored', 'blight', 'siren', 'spitter', 'splitter'];
        const isElite = zombie && eliteTypes.includes(zombie.type);

        let dropChance = 0.14;
        if (isWarden) dropChance = 1.0;
        else if (isBoss) dropChance = 0.65;
        else if (isGolden) dropChance = 1.0;
        else if (isBounty) dropChance = 0.6;
        else if (isElite) dropChance = 0.22;

        if (Math.random() > dropChance) {
            // Pity system: a drop is guaranteed after enough dry kills
            gameState.equipmentDropPity = (gameState.equipmentDropPity || 0) + 1;
            if (gameState.equipmentDropPity < 45) return null;
        }
        gameState.equipmentDropPity = 0;

        const r = Math.random();
        let rarity = 'common';
        if (isWarden) {
            // Legendary-biased: ~50% legendary / 30% epic / 20% rare
            if (r > 0.50) rarity = 'legendary';
            else if (r > 0.20) rarity = 'epic';
            else rarity = 'rare';
        } else if (isBoss) {
            if (r > 0.85) rarity = 'legendary';
            else if (r > 0.55) rarity = 'epic';
            else if (r > 0.25) rarity = 'rare';
            else rarity = 'uncommon';
        } else if (isGolden || isBounty) {
            // Special kills always feel rewarding: rare floor
            if (r > 0.92) rarity = 'legendary';
            else if (r > 0.68) rarity = 'epic';
            else rarity = 'rare';
        } else if (isElite) {
            if (r > 0.96) rarity = 'legendary';
            else if (r > 0.85) rarity = 'epic';
            else if (r > 0.55) rarity = 'rare';
            else rarity = 'uncommon';
        } else {
            if (r > 0.97) rarity = 'legendary';
            else if (r > 0.90) rarity = 'epic';
            else if (r > 0.72) rarity = 'rare';
            else if (r > 0.42) rarity = 'uncommon';
        }
        return this.createRandomItem(rarity);
    }

    /**
     * @returns {boolean} true if item was equipped or bagged
     */
    autoEquipIfSlotEmpty(player, item) {
        if (!player || !item) return false;
        if (!player.equippedItems) player.equippedItems = {};
        if (!player.equippedItems[item.slot]) {
            return this.equipItem(player, item);
        }
        return this.addItemToInventory(player, item);
    }
}

export const equipmentSystem = new EquipmentSystem();
