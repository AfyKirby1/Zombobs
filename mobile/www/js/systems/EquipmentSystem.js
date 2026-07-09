// [TRACE: CAMPAIGN_DESIGN.md] Equipment system — drops, inventory, and stat bonuses.

import { PLAYER_MAX_HEALTH } from '../core/constants.js';
import { generateEquipmentItem } from '../core/equipmentDefinitions.js';

export class EquipmentSystem {
    constructor() {
        this.maxInventorySize = 16;
    }

    createRandomItem(rarity) {
        return generateEquipmentItem(rarity);
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

    recalcPlayerEquipment(player) {
        const bonuses = {
            maxHealth: 0,
            speed: 1,
            damage: 1,
            fireRate: 1,
            reloadSpeed: 1,
            xpGain: 1,
            scrapGain: 1
        };

        if (player.equippedItems) {
            for (const slot of Object.keys(player.equippedItems)) {
                const item = player.equippedItems[slot];
                if (!item || !item.bonuses) continue;
                for (const [type, value] of Object.entries(item.bonuses)) {
                    if (type === 'maxHealth') {
                        bonuses.maxHealth += value;
                    } else {
                        bonuses[type] = (bonuses[type] || 1) + value;
                    }
                }
            }
        }

        player.equipmentMaxHealthBonus = bonuses.maxHealth;
        player.equipmentSpeedMultiplier = bonuses.speed;
        player.equipmentDamageMultiplier = bonuses.damage;
        player.equipmentFireRateMultiplier = bonuses.fireRate;
        player.equipmentReloadSpeedMultiplier = bonuses.reloadSpeed;
        player.equipmentXpGainMultiplier = bonuses.xpGain;
        player.equipmentScrapMultiplier = bonuses.scrapGain;

        const newMaxHealth = PLAYER_MAX_HEALTH + bonuses.maxHealth;
        const healthDiff = newMaxHealth - player.maxHealth;
        player.maxHealth = newMaxHealth;
        player.health = Math.min(player.maxHealth, player.health + healthDiff);
    }

    resetPlayerEquipment(player) {
        player.equippedItems = {};
        player.inventory = [];
        player.equipmentMaxHealthBonus = 0;
        player.equipmentSpeedMultiplier = 1;
        player.equipmentDamageMultiplier = 1;
        player.equipmentFireRateMultiplier = 1;
        player.equipmentReloadSpeedMultiplier = 1;
        player.equipmentXpGainMultiplier = 1;
        player.equipmentScrapMultiplier = 1;
    }

    tryDropFromZombie(zombie) {
        if (Math.random() > 0.07) return null;
        const r = Math.random();
        let rarity = 'common';
        if (r > 0.96) rarity = 'legendary';
        else if (r > 0.88) rarity = 'epic';
        else if (r > 0.70) rarity = 'rare';
        else if (r > 0.40) rarity = 'uncommon';
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
