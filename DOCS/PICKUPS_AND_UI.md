# Pickups and UI Documentation

This document covers all pickup items, their mechanics, visual design, spawn conditions, and UI feedback systems in Zombobs.

## Table of Contents
- [Basic Pickups](#basic-pickups)
- [Powerup Pickups](#powerup-pickups)
- [UI Feedback Systems](#ui-feedback-systems)
- [Collection Mechanics](#collection-mechanics)
- [UI Overlay System](#ui-overlay-system)

---

## Basic Pickups

### Health Pickup

**Visual Design:**
- **Color Scheme:** Red/Pink gradient (`#ff8a80` to `#d50000`)
- **Icon:** White cross (+) symbol
- **Size:** 10px radius
- **Animation:** Pulsing glow effect (0.8-0.95 scale, 500ms cycle)
- **Glow:** White to red radial gradient

**Spawn Conditions:**
- Spawns every **15 seconds** (`HEALTH_PICKUP_SPAWN_INTERVAL`)
- Maximum **3** health pickups can exist simultaneously (`MAX_HEALTH_PICKUPS`)
- Only spawns if at least one player has health < 100% and health > 0

**Collection Requirements:**
- Player must have health < `PLAYER_MAX_HEALTH` (100)
- Collision detection via radius-based check

**Effects:**
- Restores **25 HP** (`HEALTH_PICKUP_HEAL_AMOUNT`)
- Cannot exceed maximum health (100)
- Creates 8 red particles (`#ff1744`) at pickup location
- Floating text: `"+25 HP"` in red (`#ff1744`) if floating text enabled

**File Location:** `js/entities/Pickup.js` - `HealthPickup` class

---

### Ammo Pickup

**Visual Design:**
- **Color Scheme:** Yellow/Orange gradient (`#ffd54f` to `#ff9800`)
- **Icon:** White bullet shape (rectangle with pointed tip)
- **Size:** 10px radius
- **Animation:** Pulsing glow effect (0.8-0.95 scale, 500ms cycle)
- **Glow:** Yellow-white to orange radial gradient

**Spawn Conditions:**
- Spawns every **20 seconds** (`AMMO_PICKUP_SPAWN_INTERVAL`)
- Maximum **2** ammo pickups can exist simultaneously (`MAX_AMMO_PICKUPS`)
- Only spawns if at least one player has ammo < 50% of max ammo

**Collection Requirements:**
- Player must have `currentAmmo < maxAmmo` OR `grenadeCount < MAX_GRENADES`
- Collision detection via radius-based check

**Effects:**
- Restores **15 ammo** (`AMMO_PICKUP_AMOUNT`) for current weapon
- Refills grenades to maximum (`MAX_GRENADES` = 3)
- Creates 8 orange particles (`#ff9800`) at pickup location
- Floating text: `"+15 AMMO"` in cyan (`#00ffff`) if floating text enabled

**File Location:** `js/entities/Pickup.js` - `AmmoPickup` class

---

## Powerup Pickups

Powerup pickups are rare items that spawn randomly and provide temporary or instant powerful effects.

**Spawn System:**
- Check every **30 seconds** for powerup spawn opportunity
- **60% chance** to spawn a powerup each check
- Only **1** of each powerup type can exist simultaneously
- Distribution probabilities:
  - Damage Pickup: 20%
  - Nuke Pickup: 8%
  - Speed Pickup: 18%
  - Rapid Fire Pickup: 18%
  - Shield Pickup: 24%
  - Adrenaline Pickup: 12%

---

### Damage Pickup (Double Damage)

**Visual Design:**
- **Color Scheme:** Purple gradient (`#e1bee7` to `#7b1fa2`)
- **Icon:** White "2x" text
- **Size:** 12px radius
- **Animation:** Fast pulsing glow (0.8-1.0 scale, 300ms cycle)
- **Glow:** Purple radial gradient (`rgba(224, 64, 251, 0.9)`)

**Spawn Conditions:**
- Part of powerup spawn system (20% chance when powerup spawns)
- Maximum 1 damage pickup can exist

**Collection Requirements:**
- Any player can collect (no health/ammo restrictions)
- Collision detection via radius-based check

**Effects:**
- Activates **Double Damage** buff for **10 seconds**
- Sets `gameState.damageBuffEndTime` to current time + 10000ms
- All weapon damage is multiplied by 2 during this time
- Creates 12 purple particles (`#9c27b0`) at pickup location
- Floating text: `"DOUBLE DAMAGE!"` in yellow (default DamageNumber style)

**File Location:** `js/entities/Pickup.js` - `DamagePickup` class

---

### Nuke Pickup

**Visual Design:**
- **Color Scheme:** Black center with yellow border (`#212121` with `#ffeb3b` border)
- **Icon:** Radiation symbol (3 yellow triangles arranged in circle with center dot)
- **Size:** 14px radius
- **Animation:** Very fast pulsing glow (0.8-1.0 scale, 200ms cycle)
- **Glow:** Hazard yellow radial gradient (`rgba(255, 235, 59, 0.9)`)

**Spawn Conditions:**
- Part of powerup spawn system (8% chance when powerup spawns)
- Maximum 1 nuke pickup can exist
- Rarest powerup type

**Collection Requirements:**
- Any player can collect
- Collision detection via radius-based check

**Effects:**
- **Instant Effect:** Triggers tactical nuke explosion
- Kills all zombies on screen instantly
- Creates massive screen shake (30 intensity)
- Creates 20 yellow particles (`#ffeb3b`) at pickup location
- Floating text: `"TACTICAL NUKE!"` appears at explosion center
- No duration (instant effect)

**File Location:** `js/entities/Pickup.js` - `NukePickup` class  
**Trigger Function:** `triggerNuke()` in `js/utils/combatUtils.js`

---

### Speed Pickup

**Visual Design:**
- **Color Scheme:** Cyan/Turquoise gradient (`#80deea` to `#00acc1`)
- **Icon:** White double arrow "»" symbol
- **Size:** 12px radius
- **Animation:** Pulsing glow (0.8-1.0 scale, 250ms cycle)
- **Glow:** Cyan radial gradient (`rgba(0, 255, 255, 0.9)`)

**Spawn Conditions:**
- Part of powerup spawn system (18% chance when powerup spawns)
- Maximum 1 speed pickup can exist

**Collection Requirements:**
- Any player can collect
- Collision detection via radius-based check

**Effects:**
- Activates **Speed Boost** buff for **8 seconds**
- Sets `gameState.speedBoostEndTime` to current time + 8000ms
- Increases player movement speed by **1.5x** multiplier
- Applies to both base speed and sprint speed
- Creates 12 cyan particles (`#00bcd4`) at pickup location
- Floating text: `"SPEED BOOST!"` in yellow (default DamageNumber style)

**File Location:** `js/entities/Pickup.js` - `SpeedPickup` class

---

### Rapid Fire Pickup

**Visual Design:**
- **Color Scheme:** Orange/Red gradient (`#ffcc80` to `#f57c00`)
- **Icon:** White lightning bolt "⚡" symbol
- **Size:** 12px radius
- **Animation:** Pulsing glow (0.8-1.0 scale, 250ms cycle)
- **Glow:** Orange-red radial gradient (`rgba(255, 152, 0, 0.9)`)

**Spawn Conditions:**
- Part of powerup spawn system (18% chance when powerup spawns)
- Maximum 1 rapid fire pickup can exist

**Collection Requirements:**
- Any player can collect
- Collision detection via radius-based check

**Effects:**
- Activates **Rapid Fire** buff for **10 seconds**
- Sets `gameState.rapidFireEndTime` to current time + 10000ms
- Reduces weapon fire rate cooldown (faster shooting)
- Creates 12 orange particles (`#ff9800`) at pickup location
- Floating text: `"RAPID FIRE!"` in yellow (default DamageNumber style)

**File Location:** `js/entities/Pickup.js` - `RapidFirePickup` class

---

### Shield Pickup

**Visual Design:**
- **Color Scheme:** Light Blue gradient (`#b3e5fc` to `#0288d1`)
- **Icon:** White hexagon shield shape
- **Size:** 12px radius
- **Animation:** Pulsing glow (0.8-1.0 scale, 300ms cycle)
- **Glow:** Light blue radial gradient (`rgba(129, 212, 250, 0.9)`)

**Spawn Conditions:**
- Part of powerup spawn system (24% chance when powerup spawns)
- Maximum 1 shield pickup can exist

**Collection Requirements:**
- Any player can collect
- Collision detection via radius-based check

**Effects:**
- Adds **50 shield points** to player
- Cannot exceed maximum shield (`maxShield` = 50)
- Shield absorbs damage before health (damage overflow applies to health)
- Creates 12 light blue particles (`#03a9f4`) at pickup location
- Floating text: `"+50 SHIELD!"` in yellow (default DamageNumber style)
- No duration (permanent until depleted)

**File Location:** `js/entities/Pickup.js` - `ShieldPickup` class

---

### Adrenaline Pickup

**Visual Design:**
- **Color Scheme:** Green/Yellow gradient (`#c8e6c9` to `#4caf50`)
- **Icon:** White Syringe/Cross symbol
- **Size:** 12px radius
- **Animation:** Pulsing glow (0.8-1.0 scale, 200ms cycle)
- **Glow:** Green-Yellow radial gradient (`rgba(76, 175, 80, 0.6)`)

**Spawn Conditions:**
- Part of powerup spawn system (12% chance when powerup spawns)
- Maximum 1 adrenaline pickup can exist

**Collection Requirements:**
- Any player can collect
- Collision detection via radius-based check

**Effects:**
- **Triple Buff Effect:** Activates Speed Boost, Rapid Fire, and Reload Speed buffs
- **Duration:** **12 seconds** (longer than individual buffs)
- Sets `gameState.adrenalineEndTime`, `gameState.speedBoostEndTime`, and `gameState.rapidFireEndTime`
- Creates 15 green particles (`#4caf50`) at pickup location
- Floating text: `"ADRENALINE RUSH!"` in yellow
- HUD Indicator: Shows "Adrenaline ⚡⚡⚡" with timer

**File Location:** `js/entities/Pickup.js` - `AdrenalinePickup` class

---

## UI Feedback Systems

### Floating Text System

The game uses a `DamageNumber` class to display floating text feedback for various events.

**Class:** `DamageNumber` in `js/entities/Particle.js`

**Features:**
- Supports numeric values and text strings
- Custom color support (hex color codes)
- Critical hit styling (larger, yellow-red gradient)
- Fade-out animation over 1 second (60 frames)
- Upward floating motion with slight horizontal drift
- Gravity effect slows ascent over time

**Usage Examples:**
```javascript
// Damage number (yellow, default)
new DamageNumber(x, y, damage)

// Critical hit (yellow-red gradient, larger)
new DamageNumber(x, y, damage, true)

// Custom color text
new DamageNumber(x, y, "+25 HP", false, '#ff1744')
```

**Settings:**
- Can be toggled via Video Settings: `floatingText` (default: enabled)
- When disabled, only powerup messages still show (for gameplay clarity)

**Color Conventions:**
- **Red (`#ff1744`):** Health-related (healing, damage taken)
- **Cyan (`#00ffff`):** Ammo-related
- **Yellow (default):** Damage dealt, general notifications
- **Yellow-Red Gradient:** Critical hits, important powerups
- **Green:** Adrenaline/Buffs

---

### Particle Effects

Particle effects are created when pickups are collected to provide visual feedback.

**Function:** `createParticles(x, y, color, count)` in `js/systems/ParticleSystem.js`

**Pickup Particle Details:**

| Pickup Type | Color | Count | Purpose |
|------------|-------|-------|---------|
| Health | `#ff1744` (Red) | 8 | Visual confirmation of healing |
| Ammo | `#ff9800` (Orange) | 8 | Visual confirmation of ammo restore |
| Damage | `#9c27b0` (Purple) | 12 | Powerup activation feedback |
| Nuke | `#ffeb3b` (Yellow) | 20 | Massive explosion effect |
| Speed | `#00bcd4` (Cyan) | 12 | Speed boost activation |
| Rapid Fire | `#ff9800` (Orange) | 12 | Rapid fire activation |
| Shield | `#03a9f4` (Light Blue) | 12 | Shield gain feedback |
| Adrenaline | `#4caf50` (Green) | 15 | Adrenaline rush activation |

**Particle Behavior:**
- Particles fade out over time
- Random velocity and direction
- Limited by `MAX_PARTICLES` constant (500 total)

---

### Screen Effects

**Screen Shake:**
- Nuke pickup triggers intense screen shake (30 intensity)
- Other pickups may trigger minor shake effects

**Visual Indicators:**
- HUD displays active buffs (damage multiplier, speed boost, rapid fire, adrenaline)
- Shield bar appears in HUD when shield > 0
- Buff timers shown in HUD shared stats area

---

## Collection Mechanics

### Collision Detection

**Method:** Radius-based collision detection
- Each pickup has a `radius` property (10-14px depending on type)
- Each player has a `radius` property (15px)
- Collision occurs when distance between centers < (pickup.radius + player.radius)

**Function:** `checkCollision(player, pickup)` in `js/utils/gameUtils.js`

**Implementation:**
```javascript
const dx = player.x - pickup.x;
const dy = player.y - pickup.y;
const dist = Math.sqrt(dx * dx + dy * dy);
return dist < (player.radius + pickup.radius);
```

---

### Multiplayer Handling

**Collection Rules:**
- Only **one player** can collect each pickup
- First player to collide collects the pickup
- Pickup is immediately removed from game state
- All players can see pickups before collection

**Cooperative Play:**
- Pickups spawn based on any player's needs (health/ammo)
- Powerups benefit the collecting player only
- Visual feedback appears at pickup location (not player location for basic pickups)

---

### Spawn Limits

**Basic Pickups:**
- Health: Maximum 3 simultaneous
- Ammo: Maximum 2 simultaneous

**Powerups:**
- Each type: Maximum 1 simultaneous
- Total powerups: No global limit (but only 1 per type)

**Spawn Prevention:**
- System checks current count before spawning
- Prevents overcrowding of pickups
- Ensures balanced gameplay

---

### Pickup Persistence

**Lifetime:**
- Pickups persist until collected
- No expiration timer
- Remain on screen indefinitely until picked up

**Spawn Location:**
- Random position within canvas bounds
- 40px margin from edges
- No collision checking with other objects (may overlap)

**Removal:**
- Removed immediately upon collection
- Filtered out of game state arrays
- No cleanup needed (garbage collected)

---

## Technical Implementation

### File Structure

**Pickup Classes:**
- `js/entities/Pickup.js` - All pickup class definitions

**Collection Logic:**
- `js/utils/combatUtils.js` - `handlePickupCollisions()` function

**Spawn Logic:**
- `js/main.js` - `updateGame()` function (spawn checks)

**UI Feedback:**
- `js/entities/Particle.js` - `DamageNumber` class
- `js/systems/ParticleSystem.js` - Particle creation
- `js/ui/GameHUD.js` - HUD overlay and buff timers

**Constants:**
- `js/core/constants.js` - Spawn intervals, amounts, limits

---

### Game State Arrays

Pickups are stored in `gameState` object:
```javascript
gameState.healthPickups = []
gameState.ammoPickups = []
gameState.damagePickups = []
gameState.nukePickups = []
gameState.speedPickups = []
gameState.rapidFirePickups = []
gameState.shieldPickups = []
gameState.adrenalinePickups = []
```

---

### Buff State Tracking

Temporary buffs tracked in `gameState`:
```javascript
gameState.damageBuffEndTime = 0      // Double damage
gameState.speedBoostEndTime = 0      // Speed boost
gameState.rapidFireEndTime = 0       // Rapid fire
gameState.adrenalineEndTime = 0      // Adrenaline
```

Buffs are checked each frame:
```javascript
const isActive = Date.now() < buffEndTime
```

---

## Settings Integration

**Video Settings:**
- `floatingText` (boolean) - Toggle floating pickup text
  - Default: `true`
  - Location: Video Settings panel
  - Affects: Health and Ammo pickup text only
  - Powerup messages always show (gameplay critical)

**Gameplay Settings:**
- `showFps` (boolean) - Toggle FPS counter
- `autoSprint` (boolean) - Invert sprint behavior (Run by default)
- `pauseOnFocusLoss` (boolean) - Auto-pause when window loses focus

---

## UI Overlay System

**Architecture**: Hybrid rendering approach (Canvas 2D + HTML/CSS overlays)

The game uses a hybrid UI system where:
- **Game Rendering**: Canvas 2D + WebGPU for game entities, particles, and visual effects
- **UI Overlays**: HTML/CSS for complex menu screens (Battlepass, Achievements, Profile)
- **In-Game HUD**: Canvas 2D for real-time game information overlay

This hybrid approach provides:
- Better performance for UI-heavy screens (HTML layout engine)
- More flexible styling and animations (CSS)
- Native accessibility and browser features
- Smooth transitions and modern aesthetics

### HTML Overlay Screens

**Battlepass Screen** (`js/ui/BattlepassScreen.js`):
- Modern AAA game aesthetic with glassmorphism effects
- Horizontal scrollable tier track (50 tiers)
- Animated progress bar with shine effects
- 3D-style tier cards with hover effects
- Glowing borders for unlocked items
- Pulse animation for current tier
- CSS: `css/ui-overlay.css` (`.battlepass-main`, `.tier-card`, `.progress-bar-fill`)

**Achievement Screen** (`js/ui/AchievementScreen.js`):
- Gallery-style 2-column layout with sidebar category filters
- Responsive achievement grid layout
- Progress bars for locked achievements
- Gold glow effects for unlocked achievements
- Smooth category switching
- Native DOM scrolling with custom scrollbar styling
- CSS: `css/ui-overlay.css` (`.achievements-main`, `.achievement-card`, `.category-button`)

**Profile Screen** (`js/ui/ProfileScreen.js`):
- Post-apocalyptic "Confidential Dossier" theme
- Typewriter fonts (Courier Prime, Special Elite) for authentic feel
- Paper texture background with typed report aesthetic
- "TOP SECRET" stamp animation
- Paperclip decorations
- 2-column grid layout (Personnel Info + Field Statistics & Commendations)
- Grid layout for statistics looking like typed reports
- CSS: `css/ui-overlay.css` (`.dossier-container`, `.personnel-file`, `.stamp-secret`, `.stat-grid`)

### Overlay Lifecycle

**Mount/Unmount Pattern**:
- Screens mount when shown (`mount()` method)
- Screens unmount when hidden (`unmount()` method)
- Clean DOM cleanup on screen transitions
- Event listeners properly attached/removed

**Event Handling**:
- Native DOM event listeners for buttons and interactions
- Click handling via HTML button elements
- Scroll handling via DOM wheel events
- No canvas coordinate-based click detection needed

**Styling**:
- Centralized CSS variables for consistent theming
- CSS keyframe animations for smooth effects
- Responsive design with media queries
- Glassmorphism effects with backdrop blur

**File Locations**:
- HTML overlay styles: `css/ui-overlay.css`
- Screen components: `js/ui/BattlepassScreen.js`, `js/ui/AchievementScreen.js`, `js/ui/ProfileScreen.js`
- Font imports: `zombie-game.html` (Google Fonts: Courier Prime, Special Elite)

---

## Future Considerations

**Potential Enhancements:**
- Pickup expiration timers
- Spawn location collision avoidance
- Visual pickup indicators on minimap
- Sound effects for pickup collection
- Pickup rarity tiers
- Stacking buffs (multiple of same type)
- Buff duration indicators in HUD
- Additional HTML overlay screens (Settings panel, Inventory screen)
