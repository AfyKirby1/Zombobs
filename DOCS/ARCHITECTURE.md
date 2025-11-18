# Architecture Documentation

## Project Structure

### Single File Architecture
The game is currently implemented as a single HTML file (`zombie-game.html`) containing:
- HTML structure
- CSS styling
- JavaScript game logic

This follows KISS principles for rapid prototyping.

## Core Components

### 1. GameHUD Class
**Location**: Lines 210-279  
**Purpose**: Renders in-game overlay statistics on the canvas

**Methods**:
- `constructor(canvas)` - Initializes HUD with canvas reference
- `drawStat(label, value, icon, color, x, y, width)` - Renders individual stat panel
- `draw()` - Main render method, draws all stats

**Features**:
- Semi-transparent backgrounds (85% opacity)
- Color-coded borders and glow effects
- Dynamic colors based on stat values (e.g., health turns brighter red when low)
- Positioned in top-left corner
- Not affected by screen shake (rendered after shake transform)

### 2. Bullet Class
**Location**: Lines 326-373  
**Purpose**: Projectile system for player shooting

**Properties**:
- `x, y` - Position
- `radius` - Collision radius
- `speed` - Movement speed
- `angle` - Trajectory angle
- `vx, vy` - Velocity components

**Methods**:
- `update()` - Moves bullet based on velocity
- `draw()` - Renders bullet with glow effects
- `isOffScreen()` - Boundary check

### 3. Zombie Class
**Location**: Lines 375-425  
**Purpose**: Enemy AI and rendering

**Properties**:
- `x, y` - Position
- `radius` - Collision radius
- `speed` - Movement speed (scales with wave)
- `health` - Health points (scales with wave)

**Methods**:
- `update()` - AI pathfinding (moves toward player)
- `draw()` - Complex rendering with:
  - Shadow effects
  - Toxic aura (pulsing green glow)
  - Decayed flesh gradient
  - Glowing red eyes (animated)
  - Jagged mouth with teeth
  - Dripping effects
- `takeDamage()` - Damage handling, returns true if dead

### 4. Particle Class
**Location**: Lines 427-453  
**Purpose**: Visual effects particles

**Properties**:
- `x, y` - Position
- `radius` - Size
- `color` - Particle color
- `vx, vy` - Velocity
- `life` - Lifetime counter

**Methods**:
- `update()` - Movement and decay
- `draw()` - Renders with alpha fade

## Game Systems

### Input System
**Location**: Lines 305-321  
- Keyboard state tracking (`keys` object)
- Mouse position tracking
- Event listeners for keydown/keyup/mousemove/click

### Collision Detection
**Location**: Lines 490-494  
- Circle-based collision using distance formula
- Used for: bullet-zombie, player-zombie interactions

### Screen Shake System
**Location**: Lines 219-221, 636-651  
- `shakeAmount` - Current intensity
- `shakeDecay` - Decay rate (0.9)
- Applied via canvas transform
- Triggered on: shooting (intensity 3), damage (intensity 8)

### Damage Indicator System
**Location**: Lines 203-207, 475-478, 485-491, 661-665  
- Red overlay flash on damage
- Intensity decay over time
- Rendered as semi-transparent red rectangle

### Wave System
**Location**: Lines 623-632  
- Progressive difficulty
- `zombiesPerWave` starts at 5, increases by 2 each wave
- Zombie speed and health scale with wave number
- Auto-spawns next wave when all zombies killed

### Weapon System
**Location**: Lines 77-102, 800-872  
- Three weapon types: Pistol, Shotgun, Rifle
- Each weapon has unique: damage, fire rate, ammo capacity, reload time
- Weapon switching with 1/2/3 keys
- `currentWeapon` tracks active weapon
- `lastShotTime` enforces fire rate cooldowns
- Shotgun fires 5 spread bullets per shot (unique mechanic)

**Weapon Properties:**
- **Pistol**: 1 damage, 400ms fire rate, 10 ammo, 1000ms reload
- **Shotgun**: 3 damage per pellet (5 pellets), 800ms fire rate, 5 ammo, 1000ms reload
- **Rifle**: 2 damage, 200ms fire rate, 30 ammo, 1000ms reload

### Ammo System
**Location**: Lines 104-111, 800-862  
- Weapon-specific ammo counts (`currentAmmo`, `maxAmmo`)
- Each weapon maintains independent ammo state
- Ammo consumption on each shot
- Auto-reload when ammo reaches 0
- Manual reload with R key
- Ammo displayed in HUD with reload status

### Reload System
**Location**: Lines 856-862  
- `isReloading` boolean flag tracks reload state
- `reloadStartTime` timestamp for reload duration
- All weapons have 1000ms (1 second) reload time
- Reload blocks shooting during animation
- HUD displays "Reloading..." during reload
- Reload can be cancelled by weapon switch

### Audio System
**Location**: Lines 334-400+  
- Web Audio API for programmatic sound generation
- `audioContext` initialized on first user interaction
- **Gunshot Sound**: Sharp crack with low-frequency boom
- **Damage Sound**: Low-frequency grunt (175Hz) on player hit
- **Footstep Sound**: Impact thud with bass (every 350ms while moving)
- **Restart Sound**: Rising tone (200-800Hz) on game restart
- No external audio files required

### Pause System
**Location**: Lines 69, 850-900+  
- `gamePaused` boolean flag
- ESC key toggles pause state
- Game loop skips update/render when paused
- HUD displays pause menu overlay
- R key restarts from pause menu
- Instructions shown at bottom of canvas

## Rendering Pipeline

### drawGame() Function
**Execution Order**:
1. Apply screen shake transform
2. Clear canvas with gradient background
3. Draw vignette effect
4. Draw damage indicator overlay (if active)
5. Draw particles
6. Draw bullets
7. Draw zombies
8. Draw player
9. Restore transform (undo shake)
10. **Draw HUD** (not affected by shake)

### Update Loop
**updateGame() Function**:
1. Check pause state (skip if paused)
2. Update player movement
3. Handle continuous mouse firing (if mouse.isDown)
4. Update bullets (filter off-screen)
5. Update zombies
6. Update particles (filter by lifetime, supports custom blood objects)
7. Update damage indicator decay
8. Update muzzle flash decay
9. Update screen shake decay
10. Check reload timer completion
11. Check bullet-zombie collisions (weapon-specific damage)
12. Check player-zombie collisions
13. Check wave completion
14. Update UI elements

## State Management

### Global State Variables
- `gameRunning` - Game loop control
- `gamePaused` - Pause state flag
- `score` - Current score
- `wave` - Current wave number
- `zombiesKilled` - Kill counter
- `currentWeapon` - Active weapon reference
- `currentAmmo` / `maxAmmo` - Ammo state (weapon-specific, dynamic)
- `isReloading` - Reload state flag
- `reloadStartTime` - Reload timer timestamp
- `lastShotTime` - Fire rate cooldown tracker
- `player` - Player object
- `bullets[]` - Active bullets array
- `zombies[]` - Active zombies array
- `particles[]` - Active particles array (supports custom blood objects)
- `shakeAmount` - Screen shake intensity
- `damageIndicator` - Damage flash state
- `muzzleFlash` - Muzzle flash effect state
- `audioContext` - Web Audio API context

## Event Flow

1. **Input Events** → Update `keys` object or `mouse` position
2. **Game Loop** → `updateGame()` → `drawGame()`
3. **Collision Events** → Update game state (health, score, particles)
4. **State Changes** → Trigger effects (screen shake, damage indicator)
5. **UI Update** → External HUD elements updated

## Design Patterns

### Object-Oriented
- Classes used for: Bullet, Zombie, Particle, GameHUD
- Encapsulation of behavior and rendering

### Component-Based
- GameHUD as reusable component
- Modular stat rendering
- Weapon system as modular configuration objects

### Update-Render Loop
- Classic game loop pattern
- Clear separation of update logic and rendering

## Performance Considerations

- Arrays filtered instead of deleted for efficiency
- Particles and bullets cleaned up when off-screen/dead
- Canvas optimizations:
  - Gradient caching where possible
  - Transform stack management (save/restore)
  - Single gradient per frame for backgrounds

## Future Architecture Considerations

- Potential refactoring into separate files (HTML/CSS/JS)
- Module system for better organization
- Entity Component System (ECS) for complex entities
- State management pattern for game state

