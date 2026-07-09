// [TRACE: CAMPAIGN_DESIGN.md] Equipment system — drops, inventory, sets, stat bonuses.

import { PLAYER_MAX_HEALTH } from '../core/constants.js';
import {
    generateEquipmentItem,
    getActiveSetBonuses
} from '../core/equipmentDefinitions.js';

export class EquipmentSystem {
    constructor() {
        this.maxInventorySize = 24;
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

    equipItem(player, item) {
        if (!player.equippedItems) player.equippedItems = {};
        const slot = item.slot;
        const current = player.equippedItems[slot];

        if (current) {
            this.addItemToInventory(player, current);
        }

        player.equippedItems[slot] = item;

        if (player.inventory) {
            const idx = player.inventory.indexOf(item);
            if (idx >= 0) player.inventory.splice(idx, 1);
        }

        this.recalcPlayerEquipment(player);
    }

    unequipItem(player, slot) {
        if (!player.equippedItems || !player.equippedItems[slot]) return;
        const item = player.equippedItems[slot];
        if (this.addItemToInventory(player, item)) {
            delete player.equippedItems[slot];
            this.recalcPlayerEquipment(player);
        }
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
        const isBoss = zombie && (zombie.type === 'boss' || zombie.isBoss === true);
        const dropChance = isBoss ? 0.55 : 0.09;
        if (Math.random() > dropChance) return null;

        const r = Math.random();
        let rarity = 'common';
        if (isBoss) {
            if (r > 0.85) rarity = 'legendary';
            else if (r > 0.55) rarity = 'epic';
            else if (r > 0.25) rarity = 'rare';
            else rarity = 'uncommon';
        } else {
            if (r > 0.97) rarity = 'legendary';
            else if (r > 0.90) rarity = 'epic';
            else if (r > 0.72) rarity = 'rare';
            else if (r > 0.42) rarity = 'uncommon';
        }
        return this.createRandomItem(rarity);
    }

    autoEquipIfSlotEmpty(player, item) {
        if (!player.equippedItems) player.equippedItems = {};
        if (!player.equippedItems[item.slot]) {
            this.equipItem(player, item);
            return true;
        }
        return this.addItemToInventory(player, item);
    }
}

export const equipmentSystem = new EquipmentSystem();
