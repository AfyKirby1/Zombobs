# Difficulty Progression Analysis

## Overview

The game uses a **wave-based difficulty system** with three main scaling factors:
1. **Zombie Count** - Linear increase per wave
2. **Zombie Speed** - Linear increase per wave  
3. **Zombie Health** - Step increase every 3 waves

## Scaling Formulas

### Zombie Count
```javascript
zombiesPerWave = 5 + (wave - 1) * 2
```
- **Wave 1**: 5 zombies
- **Wave 2**: 7 zombies (+2)
- **Wave 3**: 9 zombies (+2)
- **Wave 4**: 11 zombies (+2)
- **Pattern**: +2 zombies every wave

### Zombie Speed
```javascript
speed = 1 + (wave * 0.1)
```
- **Wave 1**: 1.1 speed
- **Wave 2**: 1.2 speed
- **Wave 3**: 1.3 speed
- **Wave 10**: 2.0 speed (2x faster than Wave 1)
- **Wave 20**: 3.0 speed (3x faster than Wave 1)
- **Pattern**: Linear increase of +0.1 per wave

### Zombie Health
```javascript
health = 2 + Math.floor(wave / 3)
```
- **Waves 1-2**: 2 HP
- **Waves 3-5**: 3 HP
- **Waves 6-8**: 4 HP
- **Waves 9-11**: 5 HP
- **Waves 12-14**: 6 HP
- **Pattern**: +1 HP every 3 waves

## Detailed Wave Breakdown

| Wave | Zombies | Speed | Health | Total HP | Shots to Kill* | Notes |
|------|---------|-------|--------|----------|----------------|-------|
| 1 | 5 | 1.1 | 2 | 10 | 2 (Pistol) | Tutorial wave |
| 2 | 7 | 1.2 | 2 | 14 | 2 (Pistol) | Still easy |
| 3 | 9 | 1.3 | 3 | 27 | 3 (Pistol) | **First health increase** |
| 4 | 11 | 1.4 | 3 | 33 | 3 (Pistol) | Speed ramping up |
| 5 | 13 | 1.5 | 3 | 39 | 3 (Pistol) | Getting crowded |
| 6 | 15 | 1.6 | 4 | 60 | 4 (Pistol) | **Health increase** |
| 7 | 17 | 1.7 | 4 | 68 | 4 (Pistol) | Noticeably faster |
| 8 | 19 | 1.8 | 4 | 76 | 4 (Pistol) | Pressure building |
| 9 | 21 | 1.9 | 5 | 105 | 5 (Pistol) | **Health increase** |
| 10 | 23 | 2.0 | 5 | 115 | 5 (Pistol) | **2x speed milestone** |
| 15 | 33 | 2.5 | 6 | 198 | 6 (Pistol) | Very challenging |
| 20 | 43 | 3.0 | 7 | 301 | 7 (Pistol) | **3x speed milestone** |
| 25 | 53 | 3.5 | 9 | 477 | 9 (Pistol) | Extreme difficulty |
| 30 | 63 | 4.0 | 12 | 756 | 12 (Pistol) | **4x speed milestone** |

*Shots to kill assumes Pistol (1 damage per shot). Shotgun and Rifle have different damage values.

## Difficulty Milestones

### Early Game (Waves 1-5)
- **Zombies**: 5-13
- **Speed**: 1.1-1.5 (manageable)
- **Health**: 2-3 HP
- **Challenge**: Learning mechanics, weapon switching
- **Strategy**: Focus on accuracy, learn reload timing

### Mid Game (Waves 6-15)
- **Zombies**: 15-33
- **Speed**: 1.6-2.5 (noticeably faster)
- **Health**: 4-6 HP
- **Challenge**: Crowd control, ammo management
- **Strategy**: Use Shotgun for groups, Rifle for sustained fire

### Late Game (Waves 16-25)
- **Zombies**: 35-53
- **Speed**: 2.6-3.5 (very fast)
- **Health**: 7-9 HP
- **Challenge**: Overwhelming numbers, tanky enemies
- **Strategy**: Perfect movement, weapon efficiency, health pickup timing

### End Game (Waves 26+)
- **Zombies**: 55+
- **Speed**: 3.6+ (extremely fast)
- **Health**: 10+ HP
- **Challenge**: Survival becomes extremely difficult
- **Strategy**: Maximum efficiency, perfect execution required

## Weapon Effectiveness by Wave

### Pistol (1 damage)
- **Waves 1-2**: 2 shots per zombie (efficient)
- **Waves 3-5**: 3 shots per zombie (still viable)
- **Waves 6-8**: 4 shots per zombie (getting inefficient)
- **Waves 9+**: 5+ shots per zombie (not recommended)

### Shotgun (3 damage per pellet, 5 pellets)
- **Waves 1-2**: 1 pellet = kill (very efficient)
- **Waves 3-5**: 1-2 pellets = kill (efficient)
- **Waves 6-8**: 2 pellets = kill (good)
- **Waves 9-11**: 2 pellets = kill (still viable)
- **Waves 12+**: 2-3 pellets = kill (ammo intensive)

### Rifle (2 damage)
- **Waves 1-2**: 1 shot = kill (very efficient)
- **Waves 3-5**: 2 shots = kill (efficient)
- **Waves 6-8**: 2 shots = kill (good)
- **Waves 9-11**: 3 shots = kill (viable)
- **Waves 12+**: 3+ shots = kill (ammo intensive)

## Difficulty Curve Analysis

### Linear Scaling (Speed & Count)
- **Speed**: Increases smoothly, predictable
- **Count**: Increases smoothly, predictable
- **Result**: Steady, consistent difficulty increase

### Step Scaling (Health)
- **Health**: Jumps every 3 waves
- **Result**: Creates "difficulty spikes" at waves 3, 6, 9, 12, etc.
- **Effect**: These waves feel noticeably harder than the previous wave

### Combined Effect
The combination creates:
- **Smooth baseline increase** (speed + count)
- **Periodic difficulty spikes** (health jumps)
- **Exponential total HP** (count × health = total enemy HP)

## Total Enemy HP Per Wave

| Wave | Total HP | vs Wave 1 |
|------|----------|-----------|
| 1 | 10 | 1.0x |
| 5 | 39 | 3.9x |
| 10 | 115 | 11.5x |
| 15 | 198 | 19.8x |
| 20 | 301 | 30.1x |
| 25 | 477 | 47.7x |
| 30 | 756 | 75.6x |

**Note**: Total HP scales roughly quadratically due to both count and health increasing.

## Player Resources (Static)

- **Health**: 100 HP (fixed)
- **Health Pickups**: +25 HP every 15 seconds (if below max)
- **Ammo**: Weapon-specific, limited
- **No ammo pickups**: Ammo is finite per wave

## Difficulty Balance Observations

### Strengths
✅ **Predictable scaling** - Players can anticipate difficulty
✅ **Multiple scaling factors** - Creates varied challenge
✅ **Health spikes** - Creates memorable difficulty moments
✅ **Speed scaling** - Forces movement skill improvement

### Potential Issues
⚠️ **No player power scaling** - Player doesn't get stronger
⚠️ **Limited resources** - No ammo pickups means resource scarcity
⚠️ **Exponential HP growth** - Late game becomes very difficult
⚠️ **No difficulty plateaus** - Constant increase may feel relentless

## Recommendations for Balance

### Current System Works Well For:
- Short to medium play sessions (waves 1-15)
- Skill-based progression
- High score chasing
- Learning curve

### Could Be Enhanced With:
- Ammo pickups from zombies (resource management)
- Player upgrades/perks (power scaling)
- Difficulty plateaus (waves 20, 30, etc. maintain difficulty)
- Boss waves (periodic major challenges)
- Health regeneration (sustain for longer runs)

## Code References

**Zombie Speed**: `zombie-game.html:782`
```javascript
this.speed = 1 + (wave * 0.1);
```

**Zombie Health**: `zombie-game.html:783`
```javascript
this.health = 2 + Math.floor(wave / 3);
```

**Zombie Count**: `zombie-game.html:1565`
```javascript
zombiesPerWave += 2; // Each wave
```

**Initial Count**: `zombie-game.html:89`
```javascript
let zombiesPerWave = 5; // Starting count
```

