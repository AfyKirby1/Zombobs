// [TRACE: CAMPAIGN_DESIGN.md] Equipment definitions for the broad equipment system.

export const EQUIPMENT_SLOTS = [
    'weapon',
    'armor',
    'helmet',
    'gloves',
    'boots',
    'accessory'
];

export const EQUIPMENT_RARITIES = {
    common: { label: 'Common', color: '#aaaaaa', weight: 0.60, multiplier: 1.0 },
    uncommon: { label: 'Uncommon', color: '#33cc33', weight: 0.25, multiplier: 1.6 },
    rare: { label: 'Rare', color: '#3399ff', weight: 0.10, multiplier: 2.6 },
    epic: { label: 'Epic', color: '#aa33ff', weight: 0.04, multiplier: 4.2 },
    legendary: { label: 'Legendary', color: '#ffaa00', weight: 0.01, multiplier: 7.0 }
};

const EQUIPMENT_NAMES = {
    weapon: ['Rusty Wrench', 'Bloodied Crowbar', 'Tactical Knife', 'Plasma Blade', 'Zombie Slayer'],
    armor: ['Torn Vest', 'Kevlar Plate', 'Reinforced Jacket', 'Exo-Suit', 'Aegis Armor'],
    helmet: ['Hard Hat', 'Riot Helmet', 'Night Vision Goggles', 'Skull Mask', 'Crown of Survival'],
    gloves: ['Work Gloves', 'Tactical Grips', 'Steady Hands', 'Rending Claws', 'Gauntlets of Fury'],
    boots: ['Combat Boots', 'Sprint Shoes', 'Trench Runners', 'Hover Soles', 'Boots of the Wasteland'],
    accessory: ['Lucky Charm', 'Dog Tags', "Scavenger's Satchel", "Hero's Insignia", 'Artifact of the Ancients']
};

const EQUIPMENT_ICONS = {
    weapon: '⚔',
    armor: '🛡',
    helmet: '⛑',
    gloves: '✊',
    boots: '👢',
    accessory: '💍'
};

const BONUS_RANGES = {
    maxHealth: [10, 25],
    speed: [0.04, 0.10],
    damage: [0.04, 0.10],
    fireRate: [0.04, 0.10],
    reloadSpeed: [0.05, 0.12],
    xpGain: [0.05, 0.12],
    scrapGain: [0.05, 0.12]
};

function rollRarity() {
    const r = Math.random();
    let cumulative = 0;
    const entries = Object.entries(EQUIPMENT_RARITIES);
    for (const [key, data] of entries) {
        cumulative += data.weight;
        if (r <= cumulative) return key;
    }
    return 'common';
}

function rollBonusType() {
    const types = Object.keys(BONUS_RANGES);
    return types[Math.floor(Math.random() * types.length)];
}

function rollBonusValue(type, rarity) {
    const [min, max] = BONUS_RANGES[type];
    const mult = EQUIPMENT_RARITIES[rarity].multiplier;
    const val = min + Math.random() * (max - min);
    return val * mult;
}

export function generateEquipmentItem(preferredRarity) {
    const rarity = preferredRarity || rollRarity();
    const slot = EQUIPMENT_SLOTS[Math.floor(Math.random() * EQUIPMENT_SLOTS.length)];
    const tierIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(rarity);
    const nameIndex = Math.min(tierIndex, EQUIPMENT_NAMES[slot].length - 1);
    const name = EQUIPMENT_NAMES[slot][nameIndex];

    const bonusCount = rarity === 'common' || rarity === 'uncommon' ? 1 : 2;
    const bonuses = {};
    const usedTypes = new Set();
    for (let i = 0; i < bonusCount; i++) {
        let type = rollBonusType();
        while (usedTypes.has(type)) {
            type = rollBonusType();
        }
        usedTypes.add(type);
        bonuses[type] = rollBonusValue(type, rarity);
    }

    return {
        id: `${slot}_${rarity}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        name,
        slot,
        rarity,
        icon: EQUIPMENT_ICONS[slot],
        bonuses,
        level: 1
    };
}

export function formatBonus(type, value) {
    if (type === 'maxHealth') return `+${Math.round(value)} HP`;
    const pct = Math.round(value * 100);
    return `+${pct}% ${type}`;
}

export function getRarityColor(rarity) {
    return EQUIPMENT_RARITIES[rarity]?.color || EQUIPMENT_RARITIES.common.color;
}
