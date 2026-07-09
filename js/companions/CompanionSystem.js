// [TRACE: CAMPAIGN_DESIGN.md] Guild Wars-style hireable hero companions.

import { gameState, createPlayer } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { PLAYER_BASE_SPEED, WEAPONS } from '../core/constants.js';
import { shootBullet, reloadWeapon } from '../utils/combatUtils.js';
import { CompanionDialogue } from './CompanionDialogue.js';
import { getHeroById, getHireableHeroes, HERO_DEFINITIONS } from '../core/heroDefinitions.js';

/**
 * CompanionSystem — AI party members + hireable heroes (Guild Wars vibe).
 */
export class CompanionSystem {
    constructor() {
        this.maxCompanions = 4;
        this.leashDistance = 500;
        this.followDistance = 150;
        this.combatRange = 500;
        this.kiteDistance = 200;
        this.engageDistance = 350;
        this.hiredHeroIds = new Set();
    }

    resetHired() {
        this.hiredHeroIds.clear();
    }

    getHiredHeroIds() {
        return this.hiredHeroIds;
    }

    getHireableList() {
        return getHireableHeroes(gameState.wave || 1, this.hiredHeroIds);
    }

    /**
     * Hire a named hero for scrap. Spawns near P1.
     * @returns {{ ok: boolean, reason?: string, hero?: Object }}
     */
    hireHero(heroId) {
        const def = getHeroById(heroId);
        if (!def) return { ok: false, reason: 'Unknown hero' };
        if (this.hiredHeroIds.has(heroId)) return { ok: false, reason: 'Already hired' };
        if (gameState.players.length >= this.maxCompanions) {
            return { ok: false, reason: 'Party full (max 4)' };
        }
        if ((gameState.wave || 1) < def.unlockWave) {
            return { ok: false, reason: `Unlocks wave ${def.unlockWave}` };
        }

        const p1 = gameState.players[0];
        if (!p1) return { ok: false, reason: 'No player' };
        const scrap = p1.scrap || 0;
        if (scrap < def.cost) return { ok: false, reason: `Need ${def.cost} scrap` };

        p1.scrap = scrap - def.cost;
        const hero = this._spawnHero(def, p1);
        this.hiredHeroIds.add(heroId);
        return { ok: true, hero };
    }

    _spawnHero(def, leader) {
        const offset = gameState.players.length * 40;
        const ai = createPlayer(
            (leader?.x || canvas.width / 2) + offset,
            (leader?.y || canvas.height / 2) + 20,
            def.colorIndex
        );
        ai.inputSource = 'ai';
        ai.gamepadIndex = null;
        ai.name = def.name;
        ai.heroId = def.id;
        ai.heroRole = def.role;
        ai.isHero = true;
        ai.maxHealth = def.maxHealth;
        ai.health = def.maxHealth;
        ai.heroDamageMult = def.damageMult || 1;
        ai.heroFireRateMult = def.fireRateMult || 1;
        ai.heroFollowDistance = def.followDistance ?? this.followDistance;
        ai.heroCombatRange = def.combatRange ?? this.combatRange;
        ai.heroKiteDistance = def.kiteDistance ?? this.kiteDistance;
        ai.heroEngageDistance = def.engageDistance ?? this.engageDistance;
        ai.heroHealAmount = def.healAmount || 0;
        ai.heroHealCooldownMs = def.healCooldownMs || 0;
        ai.heroHealRange = def.healRange || 0;
        ai.heroScrapAura = def.scrapAura || 0;
        ai.lastHeroHealTime = 0;

        const weapon = WEAPONS[def.weaponKey] || WEAPONS.pistol;
        ai.currentWeapon = weapon;
        ai.currentAmmo = weapon.ammo;
        ai.maxAmmo = weapon.maxAmmo;
        if (ai.weaponStates && ai.weaponStates[def.weaponKey]) {
            ai.weaponStates[def.weaponKey].ammo = weapon.ammo;
        }

        ai.dialogue = new CompanionDialogue(ai);
        if (def.lines?.hire) {
            const line = def.lines.hire[Math.floor(Math.random() * def.lines.hire.length)];
            ai.dialogue.addMessage(line, 2);
        } else {
            ai.dialogue.trigger('spawn');
        }

        gameState.players.push(ai);
        gameState.waveNotification = {
            active: true,
            text: `HERO JOINED — ${def.name.toUpperCase()}`,
            life: 0,
            maxLife: 150
        };
        return ai;
    }

    /** Generic lobby AI companion (non-hero). */
    addCompanion() {
        if (gameState.players.length >= this.maxCompanions) return null;

        const colorIndex = gameState.players.length;
        const spawnOffset = gameState.players.length * 50;
        const p1 = gameState.players[0];
        const aiPlayer = createPlayer(
            (p1?.x || canvas.width / 2) + spawnOffset,
            (p1?.y || canvas.height / 2),
            colorIndex
        );
        aiPlayer.inputSource = 'ai';
        aiPlayer.gamepadIndex = null;
        aiPlayer.dialogue = new CompanionDialogue(aiPlayer);
        aiPlayer.dialogue.trigger('spawn');
        gameState.players.push(aiPlayer);
        return aiPlayer;
    }

    update(player) {
        if (!player || player.health <= 0) {
            return { moveX: 0, moveY: 0 };
        }

        const p1 = gameState.players[0];
        if (!p1 || p1.health <= 0) {
            player.angle = 0;
            player.isSprinting = false;
            player.speed = PLAYER_BASE_SPEED;
            return { moveX: 0, moveY: 0 };
        }

        const followDistance = player.heroFollowDistance || this.followDistance;
        const combatRange = player.heroCombatRange || this.combatRange;
        const kiteDistance = player.heroKiteDistance || this.kiteDistance;
        const engageDistance = player.heroEngageDistance || this.engageDistance;

        // Medic heal pulse
        if (player.heroHealAmount > 0 && player.heroHealCooldownMs > 0) {
            const now = Date.now();
            if (now - (player.lastHeroHealTime || 0) >= player.heroHealCooldownMs) {
                const dx = p1.x - player.x;
                const dy = p1.y - player.y;
                const range = player.heroHealRange || 180;
                if (dx * dx + dy * dy <= range * range && p1.health < p1.maxHealth) {
                    p1.health = Math.min(p1.maxHealth, p1.health + player.heroHealAmount);
                    player.lastHeroHealTime = now;
                    if (player.dialogue) player.dialogue.trigger('help_player', 0.8);
                }
            }
        }

        // Scavenger scrap aura on leader
        if (player.heroScrapAura > 0) {
            p1.heroScrapAuraBonus = Math.max(p1.heroScrapAuraBonus || 0, player.heroScrapAura);
        }

        const dxToP1 = player.x - p1.x;
        const dyToP1 = player.y - p1.y;
        const distToP1Squared = dxToP1 * dxToP1 + dyToP1 * dyToP1;

        let nearestZombie = null;
        let minDistSquared = Infinity;
        for (let i = 0; i < gameState.zombies.length; i++) {
            const zombie = gameState.zombies[i];
            const dx = zombie.x - player.x;
            const dy = zombie.y - player.y;
            const distSquared = dx * dx + dy * dy;
            if (distSquared < minDistSquared) {
                minDistSquared = distSquared;
                nearestZombie = zombie;
            }
        }

        const minDist = Math.sqrt(minDistSquared);
        let moveX = 0;
        let moveY = 0;
        let wantsToMove = false;

        if (nearestZombie) {
            const dx = nearestZombie.x - player.x;
            const dy = nearestZombie.y - player.y;
            const dist = minDist;
            player.angle = Math.atan2(dy, dx);

            const leashDistSquared = this.leashDistance * this.leashDistance;
            if (dist < kiteDistance) {
                moveX = -(dx / dist);
                moveY = -(dy / dist);
                wantsToMove = true;
            } else if (distToP1Squared > leashDistSquared) {
                const distP1 = Math.sqrt(distToP1Squared);
                moveX = -dxToP1 / distP1;
                moveY = -dyToP1 / distP1;
                wantsToMove = true;
            } else if (dist > engageDistance) {
                moveX = (dx / dist) * 0.5;
                moveY = (dy / dist) * 0.5;
                wantsToMove = true;
            }

            if (!player.isReloading && player.currentAmmo > 0 && dist < combatRange) {
                const targetPos = {
                    x: nearestZombie.x + (Math.random() - 0.5) * 20,
                    y: nearestZombie.y + (Math.random() - 0.5) * 20
                };
                // Temporary fire-rate / damage hooks via player multipliers
                const prevFire = player.fireRateSkillMultiplier || 1;
                const prevDmg = player.damageSkillMultiplier || 1;
                player.fireRateSkillMultiplier = prevFire * (player.heroFireRateMult || 1);
                player.damageSkillMultiplier = prevDmg * (player.heroDamageMult || 1);
                shootBullet(targetPos, canvas, player);
                player.fireRateSkillMultiplier = prevFire;
                player.damageSkillMultiplier = prevDmg;
                if (player.dialogue) player.dialogue.trigger('engaging', 0.05);
            } else if (player.currentAmmo <= 0 && !player.isReloading) {
                reloadWeapon(player);
                if (player.dialogue) player.dialogue.trigger('reload');
            }
        } else {
            const followDistSquared = followDistance * followDistance;
            if (distToP1Squared > followDistSquared) {
                const dist = Math.sqrt(distToP1Squared);
                moveX = -dxToP1 / dist;
                moveY = -dyToP1 / dist;
                wantsToMove = true;
                player.angle = Math.atan2(moveY, moveX);
            }
        }

        if (!wantsToMove) {
            moveX = 0;
            moveY = 0;
        }

        player.isSprinting = false;
        player.speed = PLAYER_BASE_SPEED;

        if (player.dialogue) {
            player.dialogue.update();
            if (!nearestZombie && !wantsToMove) {
                player.dialogue.trigger('idle', 0.001);
            }
            if (player.health < player.maxHealth * 0.3) {
                player.dialogue.trigger('low_health', 0.01);
            }
        }

        return { moveX, moveY };
    }
}

export { HERO_DEFINITIONS, getHireableHeroes };
