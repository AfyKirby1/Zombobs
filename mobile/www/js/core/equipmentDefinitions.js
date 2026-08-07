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
        'Rusty Pipe', 'Shiv', 'Trench Spade', 'Bloodied Crowbar', 'Nail Bat',
        'Riot Baton', 'Tactical Knife', 'Fire Axe', 'Combat Machete', 'Bone Saw',
        'Chainsaw Blade', 'Katana', 'Rail Spike', 'Frost Edge', 'Viper Fang',
        'Plasma Blade', 'Thunder Maul', 'Echo Cleaver', 'Zombie Slayer', 'Apex Reaver'
    ],
    armor: [
        'Torn Vest', 'Leather Rig', 'Padded Coat', 'Scrap Plate', 'Cargo Harness',
        'Reinforced Jacket', 'Riot Vest', 'Spiked Vest', 'Trench Plate', 'Kevlar Plate',
        'Ballistic Coat', 'Hazard Suit', 'Night Weave', 'Bastion Frame', 'Titan Shell',
        'Exo-Suit', 'Phoenix Mail', 'Dread Plate', 'Warden Carapace', 'Aegis Armor'
    ],
    helmet: [
        'Beanie', 'Hard Hat', 'Bike Helmet', 'Scrap Helm', 'Welding Mask',
        'Hunter Hood', 'Riot Helmet', 'Gas Mask', 'Optic Rig', 'Tactical Visor',
        'Night Vision Goggles', 'Bone Crown', 'Skull Mask', 'Spectre Cowl', 'Ballistic Helm',
        'Fortress Helm', 'Halo Visor', 'Signal Crown', 'Apex Casque', 'Crown of Survival'
    ],
    gloves: [
        'Rag Wraps', 'Work Gloves', 'Leather Grips', 'Fingerless Tapes', 'Grip Tape',
        'Mechanic Mitts', 'Trigger Mitts', 'Tactical Grips', 'Steady Hands', 'Riot Gauntlets',
        'Shock Knuckles', 'Talon Grips', 'Phantom Wraps', 'Rending Claws', 'Crusher Fists',
        'Venom Claws', 'Power Fists', 'Echo Gauntlets', 'Apex Handguards', 'Gauntlets of Fury'
    ],
    boots: [
        'Worn Sneakers', 'Combat Boots', 'Hiking Boots', 'Steel Toes', 'Mud Stompers',
        'Scout Treads', 'Trench Runners', 'Sprint Shoes', 'Cleated Stompers', 'Wader Boots',
        'Silent Soles', 'Shock Absorbers', 'Night Runners', 'Phantom Striders', 'Mag Boots',
        'Bulwark Greaves', 'Hover Soles', 'Rail Striders', 'Apex Skates', 'Boots of the Wasteland'
    ],
    accessory: [
        'Bottle Cap Chain', 'Lucky Charm', 'Dog Tags', 'Compass Rose', 'Bandolier',
        'Radio Relic', "Scavenger's Satchel", 'Field Medal', 'Scrap Magnet', 'Wolf Fang',
        'Blood Talisman', 'Adrenal Injector', 'Void Locket', 'Storm Core', 'Echo Badge',
        "Hero's Insignia", 'Titan Heart', 'Day-0 Medallion', 'Apex Sigil', 'Artifact of the Ancients'
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
    },
    nightstalker: {
        id: 'nightstalker',
        name: 'Nightstalker',
        color: '#7e57c2',
        pieces: {
            weapon: 'Viper Fang',
            armor: 'Night Weave',
            helmet: 'Spectre Cowl',
            gloves: 'Phantom Wraps',
            boots: 'Night Runners',
            accessory: 'Wolf Fang'
        },
        bonuses: {
            2: { critChance: 0.05 },
            4: { critChance: 0.09, speed: 0.08 },
            6: { critChance: 0.14, speed: 0.12, damage: 0.15 }
        }
    },
    juggernaut: {
        id: 'juggernaut',
        name: 'Juggernaut',
        color: '#90a4ae',
        pieces: {
            weapon: 'Thunder Maul',
            armor: 'Bastion Frame',
            helmet: 'Fortress Helm',
            gloves: 'Crusher Fists',
            boots: 'Bulwark Greaves',
            accessory: 'Titan Heart'
        },
        bonuses: {
            2: { maxHealth: 30 },
            4: { maxHealth: 60, damageReduction: 0.08 },
            6: { maxHealth: 100, damageReduction: 0.14, damage: 0.10 }
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
    // Scale the tier window to the list length so bigger name pools keep the
    // early-name=common / late-name=legendary ordering bias.
    const start = Math.floor((tierIndex / 5) * list.length);
    const window = Math.max(3, Math.floor(list.length / 5) + 2);
    const bias = Math.min(list.length - 1, start + Math.floor(Math.random() * window));
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
