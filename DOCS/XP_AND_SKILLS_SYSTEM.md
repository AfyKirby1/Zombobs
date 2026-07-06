# XP and Skills System Documentation

## Overview

The XP (Experience Points) and Skills System is a core progression mechanic in Zombobs that allows players to level up by defeating zombies and choose skills to enhance their combat effectiveness. The system features 16 flat skills plus 15 class-tree skills (hybrid 3×5), a 3-choice level-up selection screen, and linear XP scaling.

[AMENDED 2026-07-05]: Expanded to **63 flat + 30 tree skills**, **6 class trees**, **15 synergies**, **4 cards**/level-up, **10 slots**, corrupted wildcards + reroll. **See § Skills Expansion** at document end for current reference.

[AMENDED 2026-06-25]: Added hybrid **Class Tree System** — see § Class Tree System at document end.

---

## Table of Contents

1. [XP System](#xp-system)
2. [Level-Up System](#level-up-system)
3. [Skills System](#skills-system)
4. [Skill Effects Integration](#skill-effects-integration)
5. [Multiplayer Synchronization](#multiplayer-synchronization)
6. [Technical Implementation](#technical-implementation)

---

## XP System

### XP Gain Sources

Players gain XP exclusively by **killing zombies**. The amount of XP awarded depends on the zombie type:

| Zombie Type | XP Awarded | Notes |
|------------|-----------|-------|
| Normal | 7 XP | Basic zombie, most common |
| Fast (Runner) | 14 XP | Faster movement speed |
| Exploding (Boomer) | 21 XP | Explodes on death, AOE damage |
| Armored (Tank) | 16 XP | Higher health, slower movement |
| Ghost | 24 XP | Can phase through obstacles |
| Spitter | 21 XP | Ranged acid projectile attacks |
| Flying | 18 XP | Flies with wings, faster but weaker |
| Boss | 338 XP | Large health pool, special abilities |

**Note**: XP values were reduced by 10% from previous values (8, 15, 23, 18, 27, 23, 375) to slow down progression slightly.

### XP Award Locations

XP is awarded in the following combat scenarios:

1. **Bullet Kills** (`js/utils/combatUtils.js` - `handleBulletZombieCollisions()`)
   - When a bullet collides with and kills a zombie
   - XP is awarded immediately upon zombie death

2. **Explosion Kills** (`js/utils/combatUtils.js` - `triggerExplosion()`)
   - When zombies are killed by explosion damage (grenades, exploding zombies)
   - XP is awarded for each zombie killed in the explosion radius

3. **Melee Kills** (`js/systems/MeleeSystem.js`)
   - When zombies are killed by melee attacks
   - XP is awarded on successful melee kill

### XP Rate Balance

XP values have been balanced to provide a steady, predictable progression rate. The values were reduced by 10% from previous rates to slightly slow down leveling and make each level-up feel more meaningful.

---

## Level-Up System

### Level Progression

Players start at **Level 1** with **0 XP**. Each level requires progressively more XP to reach the next level.

**XP Requirements Formula**:
```
nextLevelXP = 100 + (level - 1) × 20
```

**Constants**:
- `XP_BASE_REQUIREMENT = 100` (base XP for level 1 → 2)
- Linear progression: +20 XP per level

**Example Progression**:
- Level 1 → 2: 100 XP
- Level 2 → 3: 120 XP (100 + 1 × 20)
- Level 3 → 4: 140 XP (100 + 2 × 20)
- Level 4 → 5: 160 XP (100 + 3 × 20)
- Level 5 → 6: 180 XP (100 + 4 × 20)
- Level 10 → 11: 280 XP (100 + 9 × 20)

### Level-Up Process

1. **XP Accumulation**: As players kill zombies, XP is added to `gameState.xp`
2. **Level Check**: Each time XP is gained, the system checks if `gameState.xp >= gameState.nextLevelXP`
3. **Level-Up Trigger**: When threshold is reached, `levelUp()` is called
4. **Skill Selection**: A 3-choice skill selection screen appears
5. **XP Reset**: XP is reset to 0 after leveling up, ensuring the XP bar starts at 0% for the next level

### Level-Up UI

The level-up screen displays **3 skill choices** (expanded from the original 2). Players can:
- Click on any of the 3 skill cards to select that skill
- See skill icon, name, and description
- Skills are randomly selected from the available pool
- If skill slots are full (6 max), only upgrades to existing skills are offered

**Location**: `js/ui/GameHUD.js` - Level-up screen rendering

---

## Skills System

### Skill Pool

There are **16 total skills** available in the game, divided into categories:

#### Survival Skills
1. **Vitality Boost** (❤️)
   - Effect: Increase Max HP by 25%
   - Implementation: Adds 25% of current maxHealth to both maxHealth and current health
   - Upgradeable: Yes (stacks multiplicatively)

2. **Regeneration** (💚)
   - Effect: Passive Health Regen (1 HP/sec)
   - Implementation: Sets `player.hasRegeneration = true`, processed in game loop
   - Upgradeable: Yes (effect stacks)

#### Combat Skills
3. **Thick Skin** (🛡️)
   - Effect: Reduce damage taken by 10%
   - Implementation: Multiplies `player.damageReduction` by 0.9 (stacks multiplicatively)
   - Upgradeable: Yes

4. **Lucky Strike** (🍀)
   - Effect: 15% chance for double damage
   - Implementation: Adds 0.15 to `player.luckyStrikeChance` (stacks additively)
   - Upgradeable: Yes

5. **Bloodlust** (🩸)
   - Effect: Heal 2 HP per kill
   - Implementation: Sets `player.hasBloodlust = true`, triggers on zombie kill
   - Upgradeable: Yes

6. **Adrenaline** (💉)
   - Effect: 20% speed boost for 3 seconds after kill
   - Implementation: Sets `player.hasAdrenaline = true`, triggers speed boost on kill
   - Upgradeable: Yes

#### Movement Skills
7. **Swift Steps** (👟)
   - Effect: Increase Movement Speed by 15%
   - Implementation: Multiplies `player.speedMultiplier` by 1.15 (stacks multiplicatively)
   - Upgradeable: Yes

#### Accuracy Skills
8. **Eagle Eye** (🎯)
   - Effect: Increase Critical Hit Chance by 10%
   - Implementation: Adds 0.10 to `player.critChance` (stacks additively)
   - Upgradeable: Yes

9. **Steady Aim** (🎯)
   - Effect: 30% reduced bullet spread
   - Implementation: Multiplies `player.bulletSpreadReduction` by 0.7 (stacks multiplicatively)
   - Upgradeable: Yes

10. **Long Range** (📏)
    - Effect: 20% increased bullet range
    - Implementation: Multiplies `player.bulletRangeMultiplier` by 1.2 (stacks multiplicatively)
    - Upgradeable: Yes

#### Weapon Skills
11. **Iron Grip** (⚙️)
    - Effect: Increase Reload Speed by 20%
    - Implementation: Multiplies `player.reloadSpeedMultiplier` by 0.8 (stacks multiplicatively)
    - Upgradeable: Yes

12. **Fast Fingers** (👆)
    - Effect: 15% faster reload (stacks with Iron Grip)
    - Implementation: Multiplies `player.reloadSpeedMultiplier` by 0.85 (stacks multiplicatively)
    - Upgradeable: Yes

13. **Quick Hands** (⚡)
    - Effect: 50% faster weapon switching
    - Implementation: Multiplies `player.weaponSwitchSpeedMultiplier` by 0.5 (stacks multiplicatively)
    - Upgradeable: Yes

14. **Hoarder** (📦)
    - Effect: Increase Max Ammo capacity by 30%
    - Implementation: Multiplies `player.ammoMultiplier` by 1.30, updates maxAmmo and refills ammo
    - Upgradeable: Yes

#### Utility Skills
15. **Scavenger** (🔍)
    - Effect: 25% more pickup spawn rate
    - Implementation: Multiplies `player.pickupSpawnRateMultiplier` by 1.25 (stacks multiplicatively)
    - Upgradeable: Yes

16. **Armor Plating** (🛡️)
    - Effect: Gain 10 shield points
    - Implementation: Adds 10 to `player.shield` (capped at 100)
    - Upgradeable: Yes

### Skill Slots

- **Maximum Active Skills**: 6 skills can be active simultaneously
- **Skill Upgrading**: Skills can be upgraded multiple times by selecting them again
- **Upgrade Behavior**: 
  - Multiplicative effects (speed, damage reduction, etc.) stack multiplicatively
  - Additive effects (crit chance, lucky strike chance) stack additively
  - Boolean effects (regeneration, bloodlust, adrenaline) can stack (multiple instances)

### Skill Selection Logic

When leveling up, the system generates 3 random skill choices:

1. **If skill slots are available** (< 6 active skills):
   - All 16 skills are available for selection
   - Randomly selects 3 from the full pool

2. **If skill slots are full** (6 active skills):
   - Only upgrades to existing skills are offered
   - Randomly selects 3 from currently active skills

3. **Fallback**: If fewer than 3 choices are available, fills remaining slots with random skills from the pool

**Location**: `js/systems/SkillSystem.js` - `generateChoices()`

---

## Skill Effects Integration

Skills are integrated throughout the game systems. Here's where each skill effect is applied:

### Combat System (`js/utils/combatUtils.js`)

- **Thick Skin**: Applied in damage calculation when player takes damage
- **Lucky Strike**: Checked in bullet damage calculation, doubles damage on proc
- **Bloodlust**: Triggers on zombie kill, heals player 2 HP
- **Adrenaline**: Triggers on zombie kill, applies 20% speed boost for 3 seconds
- **Eagle Eye**: Critical hit chance checked in damage calculation

### Player Movement (`js/systems/PlayerSystem.js`)

- **Swift Steps**: `player.speedMultiplier` applied to base movement speed
- **Adrenaline**: Speed boost multiplier applied when `adrenalineBoostActive` is true
- **Regeneration**: Health regeneration processed in game loop (1 HP/sec)

### Weapon System (`js/utils/combatUtils.js` - `shootBullet()`)

- **Long Range**: `player.bulletRangeMultiplier` applied to bullet max distance
- **Steady Aim**: `player.bulletSpreadReduction` applied to bullet spread angle
- **Iron Grip / Fast Fingers**: `player.reloadSpeedMultiplier` applied to reload time
- **Quick Hands**: `player.weaponSwitchSpeedMultiplier` applied to weapon switch time
- **Hoarder**: `player.ammoMultiplier` applied to max ammo capacity

### Pickup System (`js/systems/PickupSpawnSystem.js`)

- **Scavenger**: `player.pickupSpawnRateMultiplier` applied to all pickup spawn chance calculations

### Shield System

- **Armor Plating**: Directly adds shield points to `player.shield` (capped at 100)

---

## Multiplayer Synchronization

### Leader-Client Architecture

In multiplayer (co-op) mode, the **leader** (host) controls XP and skill selection:

1. **XP Gain**: Only the leader awards XP and broadcasts it to clients via `game:xp` event
2. **Level-Up**: Leader generates skill choices and broadcasts level-up data via `game:levelup` event
3. **Skill Selection**: Leader broadcasts chosen skill via `game:skill` event
4. **Client Sync**: Clients receive XP, level-up data, and skill choices, then apply them locally

### Network Events

- `game:xp` - Broadcasts XP amount to all clients
- `game:levelup` - Broadcasts level, nextLevelXP, and skill choices
- `game:skill` - Broadcasts selected skill ID

**Location**: `js/systems/MultiplayerSystem.js`

---

## Technical Implementation

### Core Files

1. **`js/systems/SkillSystem.js`**
   - Main skill system class
   - XP values configuration
   - `gainXP(amount)` - Adds XP and checks for level-up
   - `levelUp()` - Handles level-up logic and skill choice generation
   - `generateChoices()` - Creates 3 random skill choices
   - `activateSkill(skillId)` - Applies skill effects to all players
   - `getXPForZombieType(zombieType)` - Returns XP value for zombie type

2. **`js/core/gameState.js`**
   - `gameState.xp` - Current XP amount
   - `gameState.level` - Current player level
   - `gameState.nextLevelXP` - XP required for next level
   - `gameState.activeSkills` - Array of active skill objects `{id, level}`
   - `gameState.showLevelUp` - Boolean flag for level-up screen visibility
   - `gameState.levelUpChoices` - Array of 3 skill choices for selection

3. **`js/ui/GameHUD.js`**
   - `drawXPBar()` - Renders XP progress bar (bottom middle of screen)
   - Level-up screen rendering with 3 skill cards
   - Skill selection click handling

4. **`js/utils/combatUtils.js`**
   - XP award calls: `skillSystem.gainXP(xpAmount)` on zombie kills
   - Skill effect applications in combat calculations

### Constants

```javascript
export const MAX_SKILL_SLOTS = 6;
export const XP_BASE_REQUIREMENT = 100;
// Note: XP_SCALING_FACTOR is no longer used - progression is now linear
```

### XP Gain Flow

```
Zombie Killed
    ↓
combatUtils.js calls skillSystem.gainXP(xpAmount)
    ↓
SkillSystem.gainXP() adds XP to gameState.xp
    ↓
Checks if gameState.xp >= gameState.nextLevelXP
    ↓
If true: SkillSystem.levelUp() is called
    ↓
Level increments, nextLevelXP recalculated
    ↓
3 skill choices generated
    ↓
Level-up screen displayed (gameState.showLevelUp = true)
    ↓
Player selects skill
    ↓
SkillSystem.activateSkill(skillId) applies effect
    ↓
Level-up screen closes
```

### Skill Application Flow

```
Player selects skill from level-up screen
    ↓
GameHUD.js click handler calls skillSystem.activateSkill(skillId)
    ↓
SkillSystem.activateSkill() finds skill in SKILLS_POOL
    ↓
Checks if skill already exists in activeSkills
    ↓
If exists: Increments skill level
If new: Adds to activeSkills (if slots available)
    ↓
Applies skill.effect(player) to all players
    ↓
If multiplayer leader: Broadcasts skill selection
    ↓
Level-up screen closes (gameState.showLevelUp = false)
```

---

## Balance Notes

### XP Rate History

- **Original Values**: Normal: 10, Fast: 20, Exploding: 30, Armored: 25, Ghost: 35, Spitter: 30, Boss: 500
- **Balanced Values** (50% reduction): Normal: 5, Fast: 10, Exploding: 15, Armored: 12, Ghost: 18, Spitter: 15, Boss: 250
- **Previous Values** (1.5x increase): Normal: 8, Fast: 15, Exploding: 23, Armored: 18, Ghost: 27, Spitter: 23, Boss: 375
- **Current Values** (10% reduction): Normal: 7, Fast: 14, Exploding: 21, Armored: 16, Ghost: 24, Spitter: 21, Boss: 338

The current values provide a balanced progression rate with linear XP requirements (+20 per level), making each level-up predictable and meaningful.

### Skill Balance

- **Multiplicative Skills**: Stack multiplicatively to prevent exponential power growth
- **Additive Skills**: Stack additively for predictable scaling
- **Max Slots**: 6-skill limit prevents players from becoming overpowered
- **Upgrade System**: Allows players to specialize in preferred skills

---

## Future Considerations

Potential enhancements to the XP and Skills System:

1. **XP Bonuses**: Kill streak multipliers, wave completion bonuses
2. **Skill Synergies**: Special effects when certain skill combinations are active
3. **Skill Rarities**: Common, rare, epic skill tiers with varying power levels
4. **Prestige System**: Reset levels for permanent bonuses
5. **Skill Trees**: Branching skill paths instead of random selection
6. **XP Display**: Show XP gain numbers when zombies are killed

[AMENDED 2026-06-25]: Item 5 partially shipped — **hybrid class trees** (3 linear paths × 5 skills). See § Class Tree System at end of this doc. Full branching / pause-menu tree viewer still future work.

---

## Summary

The XP and Skills System provides a rewarding progression loop where players:
1. Kill zombies to gain XP
2. Level up to unlock skill choices
3. Select skills to enhance their playstyle
4. Upgrade skills for increased effectiveness
5. Build powerful skill combinations

The system is fully integrated across combat, movement, weapons, and pickups, ensuring skills feel impactful and meaningful throughout gameplay.

---

## Class Tree System [AMENDED 2026-06-25]

Hybrid progression: **16 flat skills** (random pool, unchanged) + **15 tree-exclusive skills** in **3 linear trees** (Nation Red–style build identity).

### Trees

| Tree | Theme | T1 → T5 capstone |
|------|-------|------------------|
| **Gunner** 🔫 | Firepower | Trigger Happy → … → **Coup de Grace** (+50% dmg vs &lt;30% HP enemies) |
| **Survivor** 🛡️ | Durability | Grit → … → **Revenant** (Second Wind — survive fatal once at 50% HP) |
| **Scavenger** 🔍 | Economy | Plunderer → … → **Killing Spree** (+25% speed 4s after kill) |

Definitions: `js/core/skillTreeDefinitions.js` (`SKILL_TREES`, `TREE_SKILLS_POOL`).

### Rules

- **Prerequisites**: Tier N requires tier N−1 skill from the **same tree** owned (level ≥ 1).
- **Weighting**: Tree skills use `TREE_SKILL_WEIGHT_MULT = 0.35` vs flat pool in `generateChoices()`.
- **Slots**: Still `MAX_SKILL_SLOTS = 6` across flat + tree combined.
- **Upgrades**: T1–T4 tree skills upgradeable to level 3; T5 capstones are single-pick.

### Selection flow

1. `getAvailableSkills()` merges `SKILLS_POOL` + `TREE_SKILLS_POOL`.
2. Filters: max level reached, slots full (upgrades only), tree prereqs not met.
3. Weighted pick × 3 for level-up overlay (`LevelUpScreen`).

### UI

- Level-up cards: tree badge (`GUNNER · T2/5`), tagline, rarity styling.
- HUD `drawActiveSkills`: tree-colored left accent bar on tree skills.

### Combat integration (tree-only hooks)

| Effect | File |
|--------|------|
| Fire rate (`fireRateSkillMultiplier`) | `combatUtils.js` `shootBullet()` |
| Pierce chance (`pierceChance`) | `bulletZombieCollisions.js` |
| Damage mult + Executioner | `applySkillDamageModifiers()` in `combatUtils.js` |
| Second Wind | `trySecondWind()` in `handlePlayerZombieCollisions()` |
| Scrap magnet (`pickupMagnetBonus`) | `PickupSpawnSystem.updateScrapPickups()` |
| Bloodlust heal amount / adrenaline duration | kill handlers in `bulletZombieCollisions.js`, `combatUtils.js` |

### Profile & achievements

- `PlayerProfileSystem.recordSkillUnlock(skillId, isTreeSkill)` — separate `unlockedSkillIds` vs `unlockedTreeSkillIds`.
- **Skill Collector** — still 16 flat skills lifetime.
- **Tree Master** — 15 tree skills lifetime (`treeSkillsUnlocked` achievement type).

### Key exports (`SkillSystem.js`)

- Re-exports: `SKILL_TREES`, `TREE_SKILLS_POOL`
- Methods: `getSkillById()`, `isTreeSkillUnlocked()`, `getAvailableSkills()`

---

## Skills Expansion [AMENDED 2026-07-05]

Major expansion to the level-up / skill system. **Do not use the legacy counts below** (16 flat + 15 tree) for current builds — see updated totals.

### Current totals (v0.8.4+ skill pass)

| Category | Count |
|----------|------:|
| **Flat skills** (`SKILLS_POOL`) | **63** |
| **Class-tree skills** (`TREE_SKILLS_POOL`) | **30** (6 trees × 5 tiers) |
| **Skill synergies** | **15** combo unlocks |
| **Max active slots** | **10** |
| **Choices per level-up** | **4** cards |
| **Rerolls per level-up** | **1** free reroll |
| **Corrupted wildcards** | ~**14%** chance one card is ☠ CORRUPTED (+35% effect, −12% max HP) |

### Class trees (6)

| Tree | Theme | Capstone |
|------|-------|----------|
| **Gunner** 🔫 | Firepower | Coup de Grace |
| **Survivor** 🛡️ | Durability | Revenant (Second Wind) |
| **Scavenger** 🔍 | Economy | Killing Spree |
| **Brawler** 👊 | Melee / dodge | Feral Rage |
| **Pyromancer** 🔥 | Fire / molotovs | Inferno (burning kills explode) |
| **Shadow** 🌑 | Stealth / lifesteal | Grim Reaper (execute heals) |

Definitions: `js/core/skillTreeDefinitions.js`. Synergies: `js/core/skillSynergies.js`.

### Level-up UI (2026-07-05)

- **4 skill cards** per level (was 3) — responsive card width in `LevelUpScreen.getCardLayout()`.
- **Reroll button** — `SkillSystem.rerollChoices()`, 1 reroll per level.
- **Corrupted cards** — purple border, `☠ CORRUPTED` label; `activateSkill(id, { corrupted: true })`.
- **Skill slot counter** — `Skills: N/10` on level-up overlay.
- **Synergy toasts** — `GameHUD.drawSynergyNotifications()` when combo unlocks.

### Notable flat skills (sample — full list in `SkillSystem.js`)

**Wave 3 additions (2026-07-05):** Deep Pockets, Fortified, Score Hunter, Boss Hunter, Ammo Echo, Lucky Reload, Ricochet, Wave Rider, Vengeance, Juggernaut, Cold Snap, Guardian Angel, Nova Core, Gold Rush, Bullet Storm.

**Earlier expansion:** Magnetism, Grenadier, Vampiric Rounds, Glass Cannon, Last Stand, Chain Lightning, Kill Momentum, Headhunter, Corpse Bloom, Static Charge, Toxic Rounds, Phantom Decoy, Riposte, etc.

### Skill synergies (15)

Pair owned skills to unlock a bonus + HUD toast. Examples:

| Synergy | Requires |
|---------|----------|
| Death Wish | Glass Cannon + Berserker |
| Plague Doctor | Toxic Rounds + Corpse Bloom |
| Frozen Fury | Cold Snap + Nova Core |
| Bounty Hunter | Score Hunter + XP Hunter |
| Ghost Blade | Phantom Decoy + Riposte |
| War Economy | Ammo Echo + Lucky Reload |
| Midnight Reaper | Nightfall + Grim Reaper (tree) |

Full list: `js/core/skillSynergies.js` → `SKILL_SYNERGIES`.

### Combat hooks (new / expanded)

| Mechanic | Player fields | Integration |
|----------|---------------|-------------|
| Lifesteal | `lifestealPercent` | `applyLifesteal()` in bullet/melee |
| Chain lightning | `chainLightningChance` | `tryChainLightning()` |
| Ricochet | `ricochetChance` | `tryRicochet()` |
| Static charge | `staticCharge`, `staticChargeMax` | `PlayerSystem` build; `shootBullet()` damage |
| Kill switch | `killSwitchCounter`, `killSwitchArmed` | `consumeKillSwitch()` on shot |
| Cold snap | `coldSnapCounter`, `coldSnapThreshold` | `tickColdSnap()` → mini frost |
| Nova core | `frostNovaOnKillChance` | `tryFrostNovaOnKill()` |
| Vengeance | `vengeanceEndTime`, `vengeanceDamageMult` | `applyPlayerDamage()` / `applySkillDamageModifiers()` |
| Guardian Angel | `guardianAngelUsedThisWave` | `applyPlayerDamage()`; reset each wave |
| Wave Rider | `waveRiderEndTime` | `applyWaveRiderBoost()` on new wave |
| Gold Rush | `goldRushEndTime` | double scrap; triggers on level-up |
| Bullet Storm | `bulletStormRefundPercent` | multi-kill ammo refund |
| Grim Reaper | `grimReaperHeal` | `processGrimReaperKill()` |
| Nightfall | `hasNightfall` | +dmg / −dmg taken at night |
| Combo King | `multiplierGraceHits` | `tryResetMultiplier()` |
| Corrupted pick | `entry.corrupted` | +35% `damageSkillMultiplier`, −12% HP |

Central damage: `applyPlayerDamage()` in `combatUtils.js`.

### Constants (`SkillSystem.js`)

```javascript
export const MAX_SKILL_SLOTS = 10;
export const LEVEL_UP_CHOICE_COUNT = 4;
export const LEVEL_UP_REROLLS = 1;
export const CORRUPTED_CHOICE_CHANCE = 0.14;
export const TREE_SKILL_WEIGHT_MULT = 0.35;
```

### Files touched (expansion)

| File | Role |
|------|------|
| `js/systems/SkillSystem.js` | Pool, choices, reroll, activate |
| `js/core/skillTreeDefinitions.js` | 6 class trees |
| `js/core/skillSynergies.js` | Combo unlocks |
| `js/utils/combatUtils.js` | Damage, frost, scrap, ammo hooks |
| `js/utils/bulletZombieCollisions.js` | On-hit / on-kill skill procs |
| `js/systems/MeleeSystem.js` | Melee skill hooks |
| `js/systems/PlayerSystem.js` | Dodge, static charge, wave rider speed |
| `js/systems/GameLoopSystem.js` | Wave-start boosts |
| `js/ui/LevelUpScreen.js` | 4-card layout, corrupted styling |
| `js/ui/GameHUD.js` | Synergy notifications |
| `js/core/gameState.js` | Skill field resets, synergies set |

---
