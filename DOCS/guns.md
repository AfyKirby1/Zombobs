# 🔫 Weapon System Documentation

## Overview

The zombie survival game features a weapon system with **3 unique firearms**, each with distinct characteristics designed for different combat situations. All weapons use weapon-specific ammo counters and have individual reload mechanics.

---

## Available Weapons

### 1. **Pistol** 🎯
**Default Starting Weapon**

- **Damage**: `1` point per shot
- **Fire Rate**: `400ms` between shots (2.5 shots/second)
- **Ammo Capacity**: `10` rounds per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: Single bullet, precise
- **Best For**: Balanced combat, conserving ammo, medium-range engagements

**Characteristics:**
- Most balanced weapon in terms of damage, fire rate, and ammo
- Moderate screen shake (3 units on shot)
- Standard muzzle flash effect
- Single bullet per click

---

### 2. **Shotgun** 💥
**High Damage, Spread Fire**

- **Damage**: `3` points per pellet × `5` pellets = **15 total damage potential**
- **Fire Rate**: `800ms` between shots (1.25 shots/second)
- **Ammo Capacity**: `5` shells per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: **5 spread bullets** with random spread angle (0.5 radian spread)
- **Best For**: Close-range combat, clearing groups, high burst damage

**Unique Mechanics:**
- Fires **5 bullets simultaneously** in a spread pattern
- Each pellet does `3` damage independently
- Spread angle: `±0.25 radians` (approximately ±14.3 degrees from center)
- Lower ammo capacity but devastating up close
- All pellets can hit the same target for maximum damage

---

### 3. **Rifle** ⚡
**High Rate of Fire**

- **Damage**: `2` points per shot
- **Fire Rate**: `200ms` between shots (5 shots/second)
- **Ammo Capacity**: `30` rounds per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: Single bullet, rapid fire
- **Best For**: Sustained fire, long-range precision, high-volume combat

**Characteristics:**
- Highest fire rate of all weapons
- Largest magazine capacity (30 rounds)
- Slightly higher damage than pistol but less than shotgun per shot
- Best for sustained engagements and clearing waves
- Longest reload time due to magazine size

---

## Weapon Statistics Comparison

| Weapon | Damage | Fire Rate | Ammo | Reload | DPS* | Total Damage/Mag |
|--------|--------|-----------|------|--------|------|------------------|
| **Pistol** | 1 | 400ms | 10 | 1000ms | 2.5 | 10 |
| **Shotgun** | 3×5 | 800ms | 5 | 1000ms | ~9.4 | 75 (ideal) |
| **Rifle** | 2 | 200ms | 30 | 1000ms | 10 | 60 |

*DPS calculated assuming all shots hit and accounting for fire rate only (not reload time)

---

## Controls

### Weapon Switching
- **Press `1`**: Switch to Pistol
- **Press `2`**: Switch to Shotgun  
- **Press `3`**: Switch to Rifle

**Switching Behavior:**
- Switching weapons **cancels any ongoing reload**
- Fire rate cooldown is **reset** when switching
- Ammo count updates to the selected weapon's current ammo
- Each weapon maintains its own ammo state

### Shooting
- **Left Click**: Fire weapon
- Auto-reloads when ammo reaches 0
- Respects fire rate cooldown (can't spam click)
- Shooting is blocked during reload animation

### Reloading
- **Press `R`**: Manual reload (when game is running)
- **Auto-reload**: Automatically triggers when ammo reaches 0
- **Reload Blocking**: Cannot fire while reloading
- Each weapon has independent reload timing

**Reload Mechanics:**
- Reload cannot be interrupted by shooting (will queue reload)
- All weapons have 1 second (1000ms) reload time
- Ammo refills to full capacity after reload completes
- HUD shows "Reloading..." during reload animation
- Reload can be cancelled by switching weapons

---

## Bullet System

### Bullet Properties
```javascript
{
    radius: 4 pixels,
    speed: 8 pixels/frame,
    damage: (weapon-specific),
    collision: circle-based (4px radius)
}
```

### Bullet Behavior
- Bullets travel at **8 pixels per frame** in the direction of the mouse cursor
- **Spawn position**: Slightly ahead of player (1.8× player radius)
- Bullets retain weapon damage values from when they were fired
- Bullets despawn on collision with zombies or when leaving screen bounds
- Visual effect: Yellow/white glowing bullets with gradient core

### Shotgun Spread Mechanics
- **Shotgun fires 5 bullets per shot**
- Spread angle: `angle ± (random - 0.5) × 0.5 radians`
- Each bullet can independently hit and damage zombies
- Spread pattern creates a cone of fire
- Maximum theoretical damage: 15 (if all 5 pellets hit same target)

---

## Visual Effects

### Muzzle Flash
- Triggers on every shot at gun position
- Visual intensity fades over `5 frames`
- Positioned at gun barrel (1.8× player radius from center)
- Directional based on shooting angle

### Screen Shake
- **Shooting**: `3 units` of shake
- **Taking Damage**: `8 units` of shake
- Decay rate: `0.9` per frame
- Provides tactile feedback for weapon impact

### Blood Splatter
- Triggered on zombie hit/kill
- **On Hit**: 5 blood particles
- **On Kill**: 12 blood particles + 3 ground patches
- Directional splatter based on bullet impact angle
- Blood particles have longer lifetime on kills (40 frames vs 25)

---

## Audio Effects

### Gunshot Sounds
- Unique sound generated per weapon type using Web Audio API
- Played on every shot
- Sound characteristics vary by weapon (pitch/tone)

### Reload Sounds
- Reload audio can be implemented (currently placeholder)

---

## Combat Strategy Tips

### Pistol Strategy
- **Best for**: Starting weapon, balanced playstyle
- Use for precise single-target elimination
- Good ammo economy with moderate damage
- Switch when low on ammo mid-battle

### Shotgun Strategy
- **Best for**: Close-range crowd control
- Position yourself in close-quarters for maximum effect
- 5 pellets = higher chance to hit fast-moving targets
- Limited ammo means make every shot count
- Ideal for tight spaces and zombie clusters

### Rifle Strategy
- **Best for**: Sustained fire and wave clearing
- High ammo count allows extended engagements
- Rapid fire compensates for lower per-shot damage
- Switch during reload downtime of other weapons
- Best DPS for sustained combat

---

## Technical Implementation

### Weapon Object Structure
```javascript
{
    name: String,
    damage: Number,
    fireRate: Number (milliseconds),
    ammo: Number,
    maxAmmo: Number,
    reloadTime: Number (milliseconds)
}
```

### Ammo System
- Each weapon maintains independent ammo count
- `currentAmmo` tracks remaining rounds
- `maxAmmo` defined per weapon
- Switching weapons preserves ammo state (each weapon has its own)

### Fire Rate System
- `lastShotTime` tracks timestamp of last shot
- Shooting blocked if `(currentTime - lastShotTime) < fireRate`
- Fire rate cooldown resets on weapon switch
- Applies globally to all weapons

### Reload System
- `isReloading` boolean flag
- `reloadStartTime` timestamp for reload duration
- Reload completes when `(currentTime - reloadStartTime) >= reloadTime`
- Auto-reload triggers when `currentAmmo <= 0` and player attempts to shoot

---

## Code References

### Weapon Definitions
```62:87:zombie-game.html
const weapons = {
    pistol: { /* ... */ },
    shotgun: { /* ... */ },
    rifle: { /* ... */ }
};
```

### Shooting Logic
```775:829:zombie-game.html
function shootBullet() { /* ... */ }
```

### Weapon Switching
```839:847:zombie-game.html
function switchWeapon(weapon) { /* ... */ }
```

### Reload Function
```831:837:zombie-game.html
function reloadWeapon() { /* ... */ }
```

---

## Future Enhancement Ideas

- [ ] Weapon upgrades/perks system
- [ ] Additional weapon types (SMG, sniper rifle, etc.)
- [ ] Weapon pickups from defeated zombies
- [ ] Ammo drops/pickups
- [ ] Weapon attachments (scopes, silencers, extended mags)
- [ ] Alternative fire modes (burst, full-auto toggle)
- [ ] Weapon durability/wear system
- [ ] Reload animations/UI feedback
- [ ] Weapon-specific audio effects differentiation

---

*Last Updated: Based on current game implementation*

