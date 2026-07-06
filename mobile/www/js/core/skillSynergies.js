// [TRACE: XP_AND_SKILLS_SYSTEM.md] — Combo bonuses when skill pairs unlock

import { gameState } from './gameState.js';

export const SKILL_SYNERGIES = [
    {
        id: 'sanguine_pact',
        requires: ['bloodlust', 'vampiric_rounds'],
        name: 'Sanguine Pact',
        icon: '🩸',
        tagline: 'Blood feeds blood',
        bonus: (player) => {
            player.lifestealPercent = Math.min(0.5, (player.lifestealPercent || 0) + 0.04);
            player.bloodlustHealAmount = (player.bloodlustHealAmount || 2) + 1;
        }
    },
    {
        id: 'death_wish',
        requires: ['glass_cannon', 'berserker'],
        name: 'Death Wish',
        icon: '💀',
        tagline: 'No fear, only fury',
        bonus: (player) => {
            if (!player.damageSkillMultiplier) player.damageSkillMultiplier = 1.0;
            player.damageSkillMultiplier *= 1.12;
            player.hasBerserker = true;
        }
    },
    {
        id: 'storm_caller',
        requires: ['chain_lightning', 'overclock'],
        name: 'Storm Caller',
        icon: '⛈️',
        tagline: 'Thunder follows lead',
        bonus: (player) => {
            player.chainLightningChance = Math.min(0.6, (player.chainLightningChance || 0) + 0.08);
            if (!player.fireRateSkillMultiplier) player.fireRateSkillMultiplier = 1.0;
            player.fireRateSkillMultiplier *= 0.92;
        }
    },
    {
        id: 'blast_artist',
        requires: ['grenadier', 'demolitionist'],
        name: 'Blast Artist',
        icon: '🎆',
        tagline: 'Everything burns',
        bonus: (player) => {
            if (!player.explosionDamageMultiplier) player.explosionDamageMultiplier = 1.0;
            player.explosionDamageMultiplier *= 1.15;
            if (!player.grenadeRadiusMultiplier) player.grenadeRadiusMultiplier = 1.0;
            player.grenadeRadiusMultiplier *= 1.1;
        }
    },
    {
        id: 'marksman',
        requires: ['headhunter', 'eagle_eye'],
        name: 'Marksman',
        icon: '🎯',
        tagline: 'One shot, one kill',
        bonus: (player) => {
            player.critChance = Math.min(1.0, (player.critChance || 0) + 0.08);
            player.headhunterXpBonus = (player.headhunterXpBonus || 0) + 0.25;
        }
    },
    {
        id: 'iron_maiden',
        requires: ['thorn_skin', 'thick_skin'],
        name: 'Iron Maiden',
        icon: '🌹',
        tagline: 'Hug of spikes',
        bonus: (player) => {
            player.thornDamage = (player.thornDamage || 1) + 1.5;
            if (!player.damageReduction) player.damageReduction = 1.0;
            player.damageReduction *= 0.92;
        }
    },
    {
        id: 'redline',
        requires: ['kill_momentum', 'adrenaline'],
        name: 'Redline',
        icon: '🏎️',
        tagline: 'Never lift',
        bonus: (player) => {
            player.hasAdrenaline = true;
            player.adrenalineDurationMs = (player.adrenalineDurationMs || 3000) + 1500;
            player.killMomentumMaxStacks = (player.killMomentumMaxStacks || 5) + 2;
        }
    },
    {
        id: 'plague_doctor',
        requires: ['toxic_rounds', 'corpse_bloom'],
        name: 'Plague Doctor',
        icon: '☣️',
        tagline: 'The ground itself sickens',
        bonus: (player) => {
            player.toxicDamagePerTick = (player.toxicDamagePerTick || 0.4) + 0.3;
            player.corpseBloomChance = Math.min(0.35, (player.corpseBloomChance || 0) + 0.1);
        }
    },
    {
        id: 'overcharged',
        requires: ['static_charge', 'lucky_strike'],
        name: 'Overcharged',
        icon: '🔋',
        tagline: 'Stored violence',
        bonus: (player) => {
            player.staticChargeMax = (player.staticChargeMax || 100) + 40;
            player.luckyStrikeChance = Math.min(0.5, (player.luckyStrikeChance || 0) + 0.1);
        }
    },
    {
        id: 'inferno_heart',
        requires: ['pyromaniac', 'pyro_t4_immolation'],
        name: 'Inferno Heart',
        icon: '❤️‍🔥',
        tagline: 'Fire is home',
        bonus: (player) => {
            player.fireHealPerTick = (player.fireHealPerTick || 0) + 0.5;
            if (!player.firePoolDurationMult) player.firePoolDurationMult = 1.0;
            player.firePoolDurationMult *= 1.25;
        }
    },
    {
        id: 'frozen_fury',
        requires: ['cold_snap', 'nova_core'],
        name: 'Frozen Fury',
        icon: '🧊',
        tagline: 'Winter never ends',
        bonus: (player) => {
            player.coldSnapThreshold = Math.max(3, (player.coldSnapThreshold || 8) - 2);
            player.frostNovaOnKillChance = Math.min(0.25, (player.frostNovaOnKillChance || 0) + 0.04);
        }
    },
    {
        id: 'bounty_hunter',
        requires: ['score_hunter', 'xp_hunter'],
        name: 'Bounty Hunter',
        icon: '🎯',
        tagline: 'Everything pays',
        bonus: (player) => {
            if (!player.scoreGainMultiplier) player.scoreGainMultiplier = 1.0;
            player.scoreGainMultiplier *= 1.15;
            if (!player.xpGainMultiplier) player.xpGainMultiplier = 1.0;
            player.xpGainMultiplier *= 1.15;
        }
    },
    {
        id: 'ghost_blade',
        requires: ['phantom_decoy', 'riposte'],
        name: 'Ghost Blade',
        icon: '👻',
        tagline: 'Strike from nowhere',
        bonus: (player) => {
            player.riposteDamage = (player.riposteDamage || 35) + 25;
            player.hasPhantomDecoy = true;
        }
    },
    {
        id: 'war_economy',
        requires: ['ammo_echo', 'lucky_reload'],
        name: 'War Economy',
        icon: '♻️',
        tagline: 'Ammo is infinite-ish',
        bonus: (player) => {
            player.freeShotChance = Math.min(0.45, (player.freeShotChance || 0) + 0.08);
            player.instantReloadChance = Math.min(0.55, (player.instantReloadChance || 0) + 0.1);
        }
    },
    {
        id: 'midnight_reaper',
        requires: ['shadow_t4_nightfall', 'shadow_t5_reaper'],
        name: 'Midnight Reaper',
        icon: '🌑',
        tagline: 'Darkness collects',
        bonus: (player) => {
            player.hasGrimReaper = true;
            player.grimReaperHeal = (player.grimReaperHeal || 6) + 4;
            player.hasNightfall = true;
        }
    }
];

/**
 * Unlock synergies when required skills are all active
 * @returns {Array} Newly unlocked synergy objects this call
 */
export function checkSkillSynergies(activeSkills, players) {
    if (!gameState.unlockedSynergies) {
        gameState.unlockedSynergies = new Set();
    }
    if (!gameState.synergyNotifications) {
        gameState.synergyNotifications = [];
    }

    const ids = new Set(activeSkills.map(s => s.id));
    const newlyUnlocked = [];

    for (let i = 0; i < SKILL_SYNERGIES.length; i++) {
        const syn = SKILL_SYNERGIES[i];
        if (gameState.unlockedSynergies.has(syn.id)) continue;
        if (!syn.requires.every(req => ids.has(req))) continue;

        gameState.unlockedSynergies.add(syn.id);
        for (let p = 0; p < players.length; p++) {
            if (players[p].health > 0) {
                syn.bonus(players[p]);
            }
        }
        gameState.synergyNotifications.push({
            id: syn.id,
            name: syn.name,
            icon: syn.icon,
            tagline: syn.tagline,
            createdAt: Date.now()
        });
        newlyUnlocked.push(syn);
    }

    return newlyUnlocked;
}
