import { gameState } from '../core/gameState.js';
import { PLAYER_MAX_HEALTH, PLAYER_BASE_SPEED } from '../core/constants.js';

// Constants
export const MAX_SKILL_SLOTS = 6;
export const XP_BASE_REQUIREMENT = 100;
export const XP_SCALING_FACTOR = 1.2;

// Skills Pool
export const SKILLS_POOL = [
    {
        id: 'vitality_boost',
        name: 'Vitality Boost',
        icon: '❤️',
        description: 'Increase Max HP by 25%',
        effect: (player) => {
            const bonus = Math.floor(player.maxHealth * 0.25);
            player.maxHealth += bonus;
            player.health += bonus; // Also heal the bonus amount
        },
        upgradeable: true
    },
    {
        id: 'swift_steps',
        name: 'Swift Steps',
        icon: '👟',
        description: 'Increase Movement Speed by 15%',
        effect: (player) => {
            // Speed is handled in updatePlayers, we'll track it via a multiplier
            if (!player.speedMultiplier) player.speedMultiplier = 1.0;
            player.speedMultiplier *= 1.15;
        },
        upgradeable: true
    },
    {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        icon: '🎯',
        description: 'Increase Critical Hit Chance by 10%',
        effect: (player) => {
            if (!player.critChance) player.critChance = 0;
            player.critChance += 0.10;
        },
        upgradeable: true
    },
    {
        id: 'iron_grip',
        name: 'Iron Grip',
        icon: '⚙️',
        description: 'Increase Reload Speed by 20%',
        effect: (player) => {
            if (!player.reloadSpeedMultiplier) player.reloadSpeedMultiplier = 1.0;
            player.reloadSpeedMultiplier *= 0.8; // 20% faster = 80% of original time
        },
        upgradeable: true
    },
    {
        id: 'hoarder',
        name: 'Hoarder',
        icon: '📦',
        description: 'Increase Max Ammo capacity by 30%',
        effect: (player) => {
            if (!player.ammoMultiplier) player.ammoMultiplier = 1.0;
            player.ammoMultiplier *= 1.30;
            // Update current weapon's max ammo
            player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * player.ammoMultiplier);
            // Refill ammo to new max
            player.currentAmmo = player.maxAmmo;
        },
        upgradeable: true
    },
    {
        id: 'regeneration',
        name: 'Regeneration',
        icon: '💚',
        description: 'Passive Health Regen (1 HP/sec)',
        effect: (player) => {
            player.hasRegeneration = true;
        },
        upgradeable: true
    }
];

class SkillSystem {
    constructor() {
        this.xpValues = {
            normal: 10,
            fast: 20,
            exploding: 30,
            armored: 25,
            ghost: 35,
            spitter: 30,
            boss: 500
        };
    }

    gainXP(amount) {
        if (!gameState.gameRunning || gameState.showLevelUp) return;

        gameState.xp += amount;

        // Check if we should level up
        if (gameState.xp >= gameState.nextLevelXP) {
            this.levelUp();
        }
    }

    levelUp() {
        gameState.level++;

        // Calculate next level XP requirement
        const baseXP = XP_BASE_REQUIREMENT;
        const scaling = Math.pow(XP_SCALING_FACTOR, gameState.level - 1);
        gameState.nextLevelXP = Math.floor(baseXP * scaling);

        // Multiplayer Logic
        if (gameState.isCoop && gameState.multiplayer.active) {
            if (!gameState.multiplayer.isLeader) {
                // Client: Don't generate choices or show UI yet. Wait for Leader.
                return;
            }

            // Leader: Generate and broadcast
            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;

            gameState.multiplayer.socket.emit('game:levelup', {
                level: gameState.level,
                nextLevelXP: gameState.nextLevelXP,
                choices: gameState.levelUpChoices
            });
        } else {
            // Single Player
            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;
        }
    }

    generateChoices() {
        const activeSkillIds = gameState.activeSkills.map(s => s.id);
        const availableSkills = SKILLS_POOL.filter(skill => {
            // If we have less than MAX_SKILL_SLOTS, allow new skills
            if (activeSkillIds.length < MAX_SKILL_SLOTS) {
                return true; // All skills available
            }
            // If slots are full, only offer upgrades to existing skills
            return activeSkillIds.includes(skill.id);
        });

        // Shuffle and pick 2
        const shuffled = [...availableSkills].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 2);

        // If we only have 1 or 0 choices, duplicate one or pick from all
        if (choices.length < 2) {
            while (choices.length < 2) {
                const randomSkill = SKILLS_POOL[Math.floor(Math.random() * SKILLS_POOL.length)];
                if (!choices.find(c => c.id === randomSkill.id)) {
                    choices.push(randomSkill);
                }
            }
        }

        return choices;
    }

    activateSkill(skillId) {
        const skill = SKILLS_POOL.find(s => s.id === skillId);
        if (!skill) return;

        // Check if skill already exists
        const existingSkill = gameState.activeSkills.find(s => s.id === skillId);

        if (existingSkill) {
            // Upgrade existing skill
            existingSkill.level = (existingSkill.level || 1) + 1;
        } else {
            // Add new skill
            if (gameState.activeSkills.length >= MAX_SKILL_SLOTS) {
                console.warn('Cannot add more skills, max slots reached');
                return;
            }
            gameState.activeSkills.push({
                id: skillId,
                level: 1
            });
        }

        // Apply effect to all players
        gameState.players.forEach(player => {
            if (player.health > 0) {
                skill.effect(player);
            }
        });

        // Broadcast choice if Leader
        if (gameState.isCoop && gameState.multiplayer.active && gameState.multiplayer.isLeader) {
            gameState.multiplayer.socket.emit('game:skill', skillId);
        }
    }

    getXPForZombieType(zombieType) {
        return this.xpValues[zombieType] || this.xpValues.normal;
    }
}

export const skillSystem = new SkillSystem();

