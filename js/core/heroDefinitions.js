// [TRACE: CAMPAIGN_DESIGN.md] Guild Wars-style hireable hero definitions.

export const HERO_ROLES = {
    warrior: { label: 'Warrior', color: '#e53935', icon: '⚔' },
    ranger: { label: 'Ranger', color: '#43a047', icon: '🏹' },
    medic: { label: 'Medic', color: '#29b6f6', icon: '✚' },
    scavenger: { label: 'Scavenger', color: '#ffb300', icon: '⚙' }
};

/**
 * Addable heroes — hire with scrap (Guild Wars party feel).
 */
export const HERO_DEFINITIONS = [
    {
        id: 'rex',
        name: 'Rex "Bulwark"',
        role: 'warrior',
        cost: 40,
        unlockWave: 1,
        blurb: 'Frontline bruiser. High HP, shotgun focus.',
        colorIndex: 1,
        weaponKey: 'shotgun',
        maxHealth: 140,
        damageMult: 1.15,
        fireRateMult: 1.05,
        followDistance: 120,
        combatRange: 280,
        kiteDistance: 90,
        engageDistance: 220,
        lines: {
            hire: ['Bulwark reporting.', 'Point me at the horde.', "Let's crack some skulls."],
            idle: ['Shield up.', 'Still standing.', 'Waiting on you.'],
            kill: ['Down!', 'Next.', 'Cleared.']
        }
    },
    {
        id: 'mira',
        name: 'Mira "Longshot"',
        role: 'ranger',
        cost: 55,
        unlockWave: 2,
        blurb: 'Sniper overwatch. Keeps distance, high damage.',
        colorIndex: 2,
        weaponKey: 'sniper',
        maxHealth: 90,
        damageMult: 1.35,
        fireRateMult: 0.85,
        followDistance: 200,
        combatRange: 700,
        kiteDistance: 280,
        engageDistance: 450,
        lines: {
            hire: ['Scope ready.', 'I have the high ground… sort of.', 'Call the shots.'],
            idle: ['Scanning.', 'Quiet out there.', 'Eyes open.'],
            kill: ['Confirmed.', 'Headshot.', 'Target down.']
        }
    },
    {
        id: 'doc',
        name: 'Doc "Patch"',
        role: 'medic',
        cost: 50,
        unlockWave: 2,
        blurb: 'Field medic. Heals you when close and hurt.',
        colorIndex: 3,
        weaponKey: 'smg',
        maxHealth: 100,
        damageMult: 0.85,
        fireRateMult: 1.1,
        followDistance: 100,
        combatRange: 400,
        kiteDistance: 160,
        engageDistance: 300,
        healAmount: 8,
        healCooldownMs: 4000,
        healRange: 180,
        lines: {
            hire: ['Medkit locked.', "Don't die on me.", 'Patchwork online.'],
            idle: ['Vitals stable.', 'Need a bandage?', 'Stay close.'],
            kill: ['Clear!', 'Keep moving!', 'Next patient.']
        }
    },
    {
        id: 'nix',
        name: 'Nix "Magpie"',
        role: 'scavenger',
        cost: 45,
        unlockWave: 1,
        blurb: 'Loot rat. Boosts scrap finds while alive.',
        colorIndex: 4,
        weaponKey: 'pistol',
        maxHealth: 85,
        damageMult: 0.95,
        fireRateMult: 1.2,
        followDistance: 140,
        combatRange: 420,
        kiteDistance: 180,
        engageDistance: 320,
        scrapAura: 0.20,
        lines: {
            hire: ['Show me the scrap.', 'I smell loot.', 'Magpie in.'],
            idle: ['Anything shiny?', 'Checking corners.', 'Pocket space free.'],
            kill: ['Mine now.', 'Loot drop!', 'Nice.']
        }
    },
    {
        id: 'kira',
        name: 'Kira "Ember"',
        role: 'ranger',
        cost: 70,
        unlockWave: 3,
        blurb: 'Flamethrower specialist. Burns packs.',
        colorIndex: 5,
        weaponKey: 'flamethrower',
        maxHealth: 95,
        damageMult: 1.1,
        fireRateMult: 1.0,
        followDistance: 110,
        combatRange: 220,
        kiteDistance: 80,
        engageDistance: 160,
        lines: {
            hire: ['Light it up.', 'Ember online.', 'Fuel tanks full.'],
            idle: ['Warming up.', 'Smell that smoke?', 'Ready to cook.'],
            kill: ['Toasted.', 'Ash.', 'Crispy.']
        }
    },
    {
        id: 'voss',
        name: 'Voss "Breach"',
        role: 'warrior',
        cost: 80,
        unlockWave: 4,
        blurb: 'Rifle assault. Aggressive push.',
        colorIndex: 1,
        weaponKey: 'rifle',
        maxHealth: 120,
        damageMult: 1.2,
        fireRateMult: 1.15,
        followDistance: 130,
        combatRange: 520,
        kiteDistance: 140,
        engageDistance: 360,
        lines: {
            hire: ['Breach ready.', 'On your six.', 'Move and shoot.'],
            idle: ['Holding.', 'Stack up.', 'Waiting.'],
            kill: ['Drop!', 'Stack cleared.', 'Push!']
        }
    }
];

export function getHeroById(id) {
    return HERO_DEFINITIONS.find(h => h.id === id) || null;
}

export function getHireableHeroes(wave, hiredIds) {
    const hired = hiredIds || new Set();
    return HERO_DEFINITIONS.filter(h =>
        (wave || 1) >= h.unlockWave && !hired.has(h.id)
    );
}
