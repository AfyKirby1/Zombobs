// [TRACE: CAMPAIGN_DESIGN.md] Campaign survivor NPCs — meet → quest → recruit teammate.

/**
 * World survivors found in Act 1 zones. Not shop heroes — quest-gated recruits.
 * Quest types: kill_count | scrap_have | reach_wave | survive_seconds
 */
export const SURVIVOR_DEFINITIONS = [
    {
        id: 'rook',
        name: 'Rook',
        role: 'warrior',
        zone: 1,
        mapId: 'crash_site',
        blurb: 'Chopper crew. Wants blood for the bird.',
        colorIndex: 1,
        weaponKey: 'shotgun',
        maxHealth: 125,
        damageMult: 1.1,
        fireRateMult: 1.0,
        followDistance: 110,
        combatRange: 260,
        kiteDistance: 85,
        engageDistance: 200,
        quest: {
            type: 'kill_count',
            amount: 8,
            label: 'Kill 8 infected near the crash'
        },
        lines: {
            greet: ["You're Echo? Bird's dead. I'm not.", 'Help me clear this ring and I ride with you.'],
            quest: ['Eight bodies. Then we talk.', 'Make them pay for the crash.'],
            progress: ['Keep stacking.', 'Almost enough.'],
            complete: ["That's enough. I'm with you.", 'Bulwark-lite reporting — call me Rook.'],
            refuse_full: ["Party's full. Take this scrap instead.", "Can't squeeze in — here's salvage."]
        },
        scrapConsolation: 20
    },
    {
        id: 'pip',
        name: 'Pip',
        role: 'ranger',
        zone: 2,
        mapId: 'maintenance_tunnels',
        blurb: 'Tunnel rat. Fast, twitchy, good eyes.',
        colorIndex: 2,
        weaponKey: 'smg',
        maxHealth: 85,
        damageMult: 1.05,
        fireRateMult: 1.2,
        followDistance: 160,
        combatRange: 420,
        kiteDistance: 200,
        engageDistance: 320,
        quest: {
            type: 'reach_wave',
            amount: 2,
            label: 'Reach wave 2 in the tunnels'
        },
        lines: {
            greet: ["Shh — vents. I'm Pip.", 'Get me to wave two alive and I stick.'],
            quest: ['Hold the corridor. Wave two.', "Don't die in the steam."],
            progress: ['Still breathing…', 'Wave clock ticking.'],
            complete: ["Okay. I'm yours. Don't get me killed.", 'Pip on your six.'],
            refuse_full: ['No room? Fine — take ammo scrap.', 'Crowded. Salvage for you.']
        },
        scrapConsolation: 25
    },
    {
        id: 'june',
        name: 'June',
        role: 'scavenger',
        zone: 3,
        mapId: 'switching_yard',
        blurb: 'Yard scavenger. Scrap talks louder than guns.',
        colorIndex: 4,
        weaponKey: 'pistol',
        maxHealth: 95,
        damageMult: 0.95,
        fireRateMult: 1.15,
        followDistance: 140,
        combatRange: 380,
        kiteDistance: 170,
        engageDistance: 280,
        scrapAura: 0.15,
        quest: {
            type: 'scrap_have',
            amount: 30,
            label: 'Bring 30 scrap to June'
        },
        lines: {
            greet: ['June. I strip trains for a living.', 'Show me thirty scrap and I join the run.'],
            quest: ['Thirty. Not twenty-nine.', 'Gate needs power — I need scrap.'],
            progress: ['Counting…', 'Keep looting.'],
            complete: ["Deal. I'll find more on the way.", 'Scavenger online.'],
            refuse_full: ["You're stacked. Here's a cut anyway.", 'No slot — take the finders fee.']
        },
        scrapConsolation: 15
    },
    {
        id: 'holt',
        name: 'Holt',
        role: 'medic',
        zone: 4,
        mapId: 'control_tower',
        blurb: 'Tower medic. Kept the lobby breathing.',
        colorIndex: 3,
        weaponKey: 'rifle',
        maxHealth: 110,
        damageMult: 0.9,
        fireRateMult: 1.05,
        followDistance: 100,
        combatRange: 450,
        kiteDistance: 150,
        engageDistance: 300,
        healAmount: 10,
        healCooldownMs: 3500,
        healRange: 200,
        quest: {
            type: 'kill_count',
            amount: 12,
            label: 'Clear 12 infected on the apron'
        },
        lines: {
            greet: ['Holt. Med kit, rifle, bad news.', 'Clear a dozen on the apron — then I climb with you.'],
            quest: ['Twelve down. Then the terminal.', 'Warden hears everything — hurry.'],
            progress: ['Keep the lobby clear.', 'Almost.'],
            complete: ["I'm in. Don't bleed out on me.", 'Patch kit ready.'],
            refuse_full: ['Full squad? Take stims — scrap value.', "Can't join — here's medical salvage."]
        },
        scrapConsolation: 30
    }
];

export function getSurvivorById(id) {
    return SURVIVOR_DEFINITIONS.find(s => s.id === id) || null;
}

export function getSurvivorsForMap(mapId) {
    return SURVIVOR_DEFINITIONS.filter(s => s.mapId === mapId);
}
