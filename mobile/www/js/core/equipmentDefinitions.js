// [TRACE: CAMPAIGN_DESIGN.md] Equipment definitions — expanded loot + set bonuses.

export const EQUIPMENT_SLOTS = [
    'weapon',
    'armor',
    'helmet',
    'gloves',
    'boots',
    'accessory'
];

export const EQUIPMENT_RARITIES = {
    common: { label: 'Common', color: '#aaaaaa', weight: 0.52, multiplier: 1.0 },
    uncommon: { label: 'Uncommon', color: '#33cc33', weight: 0.28, multiplier: 1.55 },
    rare: { label: 'Rare', color: '#3399ff', weight: 0.13, multiplier: 2.4 },
    epic: { label: 'Epic', color: '#aa33ff', weight: 0.055, multiplier: 3.8 },
    legendary: { label: 'Legendary', color: '#ffaa00', weight: 0.015, multiplier: 6.2 }
};

const EQUIPMENT_NAMES = {
    weapon: [
        'Rusty Pipe', 'Bloodied Crowbar', 'Tactical Knife', 'Plasma Blade', 'Zombie Slayer',
        'Nail Bat', 'Fire Axe', 'Combat Machete', 'Rail Spike', 'Echo Cleaver'
    ],
    armor: [
        'Torn Vest', 'Kevlar Plate', 'Reinforced Jacket', 'Exo-Suit', 'Aegis Armor',
        'Scrap Plate', 'Riot Vest', 'Hazard Suit', 'Ballistic Coat', 'Warden Carapace'
    ],
    helmet: [
        'Hard Hat', 'Riot Helmet', 'Night Vision Goggles', 'Skull Mask', 'Crown of Survival',
        'Welding Mask', 'Tactical Visor', 'Gas Mask', 'Ballistic Helm', 'Signal Crown'
    ],
    gloves: [
        'Work Gloves', 'Tactical Grips', 'Steady Hands', 'Rending Claws', 'Gauntlets of Fury',
        'Mechanic Mitts', 'Fingerless Tapes', 'Grip Tape', 'Power Fists', 'Echo Gauntlets'
    ],
    boots: [
        'Combat Boots', 'Sprint Shoes', 'Trench Runners', 'Hover Soles', 'Boots of the Wasteland',
        'Steel Toes', 'Mud Stompers', 'Silent Soles', 'Mag Boots', 'Rail Striders'
    ],
    accessory: [
        'Lucky Charm', 'Dog Tags', "Scavenger's Satchel", "Hero's Insignia", 'Artifact of the Ancients',
        'Radio Relic', 'Blood Talisman', 'Scrap Magnet', 'Echo Badge', 'Day-0 Medallion'
    ]
};

const EQUIPMENT_ICONS = {
    weapon: '⚔',
    armor: '🛡',
    helmet: '⛑',
    gloves: '✊',
    boots: '👢',
    accessory: '💍'
};

export const BONUS_RANGES = {
    maxHealth: [8, 28],
    speed: [0.03, 0.11],
    damage: [0.03, 0.12],
    fireRate: [0.03, 0.11],
    reloadSpeed: [0.04, 0.14],
    xpGain: [0.04, 0.14],
    scrapGain: [0.04, 0.15],
    critChance: [0.02, 0.08],
    damageReduction: [0.02, 0.08]
};

/** Named sets — equip 2+ pieces for set bonuses. */
export const EQUIPMENT_SETS = {
    scavenger: {
        id: 'scavenger',
        name: 'Scavenger Kit',
        color: '#c9a227',
        pieces: {
            weapon: 'Nail Bat',
            armor: 'Scrap Plate',
            helmet: 'Welding Mask',
            gloves: 'Mechanic Mitts',
            boots: 'Mud Stompers',
            accessory: "Scavenger's Satchel"
        },
        bonuses: {
            2: { scrapGain: 0.15 },
            4: { scrapGain: 0.25, xpGain: 0.10 },
            6: { scrapGain: 0.40, xpGain: 0.20, maxHealth: 40 }
        }
    },
    echo: {
        id: 'echo',
        name: 'Fireteam Echo',
        color: '#ff6b35',
        pieces: {
            weapon: 'Echo Cleaver',
            armor: 'Warden Carapace',
            helmet: 'Signal Crown',
            gloves: 'Echo Gauntlets',
            boots: 'Rail Striders',
            accessory: 'Echo Badge'
        },
        bonuses: {
            2: { damage: 0.10 },
            4: { damage: 0.18, fireRate: 0.10 },
            6: { damage: 0.28, fireRate: 0.15, maxHealth: 60 }
        }
    },
    survivor: {
        id: 'survivor',
        name: 'Last Survivor',
        color: '#4caf50',
        pieces: {
            weapon: 'Fire Axe',
            armor: 'Hazard Suit',
            helmet: 'Gas Mask',
            gloves: 'Work Gloves',
            boots: 'Combat Boots',
            accessory: 'Day-0 Medallion'
        },
        bonuses: {
            2: { maxHealth: 25, damageReduction: 0.05 },
            4: { maxHealth: 50, damageReduction: 0.10 },
            6: { maxHealth: 80, damageReduction: 0.15, speed: 0.08 }
        }
    }
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

function pickName(slot, rarity, forceSetPiece) {
    if (forceSetPiece) return forceSetPiece;
    const list = EQUIPMENT_NAMES[slot];
    const tierIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(rarity);
    const bias = Math.min(list.length - 1, Math.max(0, tierIndex + Math.floor(Math.random() * 3)));
    return list[bias];
}

function findSetIdForName(slot, name) {
    for (const set of Object.values(EQUIPMENT_SETS)) {
        if (set.pieces[slot] === name) return set.id;
    }
    return null;
}

/**
 * @param {string} [preferredRarity]
 * @param {{ slot?: string, setId?: string }} [opts]
 */
export function generateEquipmentItem(preferredRarity, opts = {}) {
    const rarity = preferredRarity || rollRarity();
    const slot = opts.slot || EQUIPMENT_SLOTS[Math.floor(Math.random() * EQUIPMENT_SLOTS.length)];

    let forceName = null;
    let setId = opts.setId || null;
    if (setId && EQUIPMENT_SETS[setId]?.pieces[slot]) {
        forceName = EQUIPMENT_SETS[setId].pieces[slot];
    } else if (Math.random() < 0.18) {
        const setKeys = Object.keys(EQUIPMENT_SETS);
        setId = setKeys[Math.floor(Math.random() * setKeys.length)];
        forceName = EQUIPMENT_SETS[setId].pieces[slot];
    }

    const name = pickName(slot, rarity, forceName);
    if (!setId) setId = findSetIdForName(slot, name);

    const bonusCount = rarity === 'common' ? 1
        : rarity === 'uncommon' ? 1 + (Math.random() < 0.35 ? 1 : 0)
        : rarity === 'rare' ? 2
        : rarity === 'epic' ? 2 + (Math.random() < 0.5 ? 1 : 0)
        : 3;

    const bonuses = {};
    const usedTypes = new Set();
    for (let i = 0; i < bonusCount; i++) {
        let type = rollBonusType();
        let guard = 0;
        while (usedTypes.has(type) && guard++ < 12) {
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
        setId,
        level: 1
    };
}

export function formatBonus(type, value) {
    if (type === 'maxHealth') return `+${Math.round(value)} HP`;
    const pct = Math.round(value * 100);
    const labels = {
        speed: 'SPD',
        damage: 'DMG',
        fireRate: 'ROF',
        reloadSpeed: 'RLD',
        xpGain: 'XP',
        scrapGain: 'SCRAP',
        critChance: 'CRIT',
        damageReduction: 'DR'
    };
    return `+${pct}% ${labels[type] || type}`;
}

export function getRarityColor(rarity) {
    return EQUIPMENT_RARITIES[rarity]?.color || EQUIPMENT_RARITIES.common.color;
}

export function countSetPieces(equippedItems, setId) {
    if (!equippedItems || !setId) return 0;
    let n = 0;
    for (const slot of Object.keys(equippedItems)) {
        const item = equippedItems[slot];
        if (item && item.setId === setId) n++;
    }
    return n;
}

export function getActiveSetBonuses(equippedItems) {
    const active = [];
    for (const set of Object.values(EQUIPMENT_SETS)) {
        const count = countSetPieces(equippedItems, set.id);
        if (count < 2) continue;
        let bestTier = null;
        for (const tier of Object.keys(set.bonuses).map(Number).sort((a, b) => a - b)) {
            if (count >= tier) bestTier = tier;
        }
        if (bestTier) {
            active.push({
                setId: set.id,
                name: set.name,
                color: set.color,
                pieces: count,
                tier: bestTier,
                bonuses: set.bonuses[bestTier]
            });
        }
    }
    return active;
}
