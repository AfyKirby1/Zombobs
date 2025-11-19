# Architecture Documentation

## Project Structure

### Modular Architecture (ES6 Modules)
The game has been refactored into a modular ES6 architecture:
- `zombie-game.html`: Entry point and structure
- `css/style.css`: Visual styling
- `js/main.js`: Main game loop and initialization (entry point)
- `js/core/`: Core game systems (constants, canvas, game state)
- `js/entities/`: Game entity classes (Bullet, Zombie, Particle, etc.)
- `js/systems/`: Game systems (Audio, Graphics, Particle, Settings)
- `js/ui/`: User interface components (HUD, Settings Panel)
- `js/utils/`: Utility functions (combat, game utilities)

This modular structure improves maintainability, testability, and scalability.

### Backend Server (`server/`)
- `server.js`: Express + socket.io server
  - Serves static files from project root
  - Socket.io WebSocket server for multiplayer
  - Default port: 3000 (configurable via PORT env var)
- `package.json`: Node.js dependencies (Express, socket.io)
- `launch.ps1`: Styled PowerShell launcher script
- `launch.bat`: Windows batch file that calls PowerShell wrapper

## Module Structure

### Core Modules (`js/core/`)

#### constants.js
**Purpose**: Centralized game constants and configuration

**Exports**:
- `RENDER_SCALE` - Canvas render scale
- `WEAPONS` - Weapon definitions (pistol, shotgun, rifle)
- `PLAYER_MAX_HEALTH`, `PLAYER_BASE_SPEED`, `PLAYER_SPRINT_SPEED` - Player stats
- `MELEE_RANGE`, `MELEE_DAMAGE`, `MELEE_COOLDOWN` - Melee settings
- `GRENADE_...` - Grenade settings
- `..._PICKUP_...` - Pickup settings
- `WAVE_BREAK_DURATION` - Wave timing

#### canvas.js
**Purpose**: Canvas initialization and management

**Exports**:
- `canvas` - Canvas DOM element
- `ctx` - Canvas 2D rendering context
- `resizeCanvas(player)` - Resize canvas to fit window

**Dependencies**: `constants.js`

#### gameState.js
**Purpose**: Centralized game state management

**Exports**:
- `gameState` - Main state object containing all game variables
- `resetGameState(canvasWidth, canvasHeight)` - Reset game to initial state

**Dependencies**: `constants.js`

### Entity Modules (`js/entities/`)

#### Bullet.js
**Purpose**: Bullet projectile class

**Exports**: `Bullet` class

**Methods**:
- `update()` - Move bullet
- `draw()` - Render bullet
- `isOffScreen(canvasWidth, canvasHeight)` - Boundary check

**Dependencies**: `core/canvas.js`

#### Zombie.js
**Purpose**: Zombie enemy classes

**Exports**: `Zombie` (base), `NormalZombie`, `FastZombie`, `ExplodingZombie`, `ArmoredZombie`

**Methods**:
- `update(player)` - AI pathfinding
- `draw()` - Complex rendering
- `takeDamage(bulletDamage)` - Damage handling

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `systems/*`

#### Particle.js
**Purpose**: Particle effects and damage numbers

**Exports**: `Particle` class, `DamageNumber` class

**Dependencies**: `core/canvas.js`

#### Pickup.js
**Purpose**: Health and ammo pickup classes

**Exports**: `HealthPickup`, `AmmoPickup`

**Dependencies**: `core/canvas.js`

#### Grenade.js
**Purpose**: Grenade projectile class

**Exports**: `Grenade` class

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `core/constants.js`, `utils/combatUtils.js`

#### Shell.js
**Purpose**: Shell casing class

**Exports**: `Shell` class

**Dependencies**: `core/canvas.js`

### System Modules (`js/systems/`)

#### AudioSystem.js
**Purpose**: Web Audio API sound generation

**Exports**:
- `initAudio()` - Initialize audio context
- `getMasterGainNode()` - Get master volume control
- `playGunshotSound()` - Play gunshot
- `playDamageSound()` - Play damage sound
- `playKillSound()` - Play kill sound
- `playFootstepSound()` - Play footstep
- `playExplosionSound()` - Play explosion
- `playRestartSound()` - Play restart sound

**Dependencies**: `systems/SettingsManager.js`

#### GraphicsSystem.js
**Purpose**: Graphics utilities and texture loading

**Exports**:
- `initGroundPattern()` - Load and cache ground texture pattern (renamed from `initGrassPattern`)

**Dependencies**: `core/canvas.js`

**Notes**:
- Loads ground texture from `sample_assets/tiles/bloody_dark_floor.png`
- Creates tiling pattern for canvas background
- Replaces previous procedural grass generation
- Ground pattern opacity set to 0.6 for better visibility

#### ParticleSystem.js
**Purpose**: Particle effects and blood splatter

**Exports**:
- `addParticle(particle)` - Add particle to system
- `createParticles(x, y, color, count)` - Create particle burst
- `createBloodSplatter(x, y, angle, isKill)` - Create blood effect
- `createExplosion(x, y)` - Create explosion visual

**Dependencies**: `core/gameState.js`, `entities/Particle.js`, `core/constants.js`

#### SettingsManager.js
**Purpose**: Settings persistence and management

**Exports**: `SettingsManager` class, `settingsManager` singleton

**Methods**:
- `loadSettings()` - Load from localStorage
- `saveSettings()` - Save to localStorage
- `getSetting(category, key)` - Get setting value
- `setSetting(category, key, value)` - Set setting value

**Dependencies**: None (localStorage only)

**Settings Structure**:
- `audio.masterVolume` - Master volume (0.0 to 1.0)
- `controls.*` - Keyboard keybinds (moveUp, moveDown, etc.)
- `gamepad.*` - Controller button mappings (fire, reload, etc.)

#### InputSystem.js
**Purpose**: Gamepad input handling via HTML5 Gamepad API

**Exports**: `InputSystem` class, `inputSystem` singleton

**Methods**:
- `update(controlSettings)` - Poll gamepad state and update button/axis states
- `getAimInput()` - Get right stick aim input (x, y)
- `getMoveInput()` - Get left stick movement input (x, y)
- `isConnected()` - Check if gamepad is connected
- `startRebind(callback)` - Enter rebind mode for button mapping
- `cancelRebind()` - Exit rebind mode

**Dependencies**: None (uses browser Gamepad API)

**Features**:
- Hot-plug support (detects controller connection/disconnection)
- Deadzone handling for analog sticks (prevents drift)
- Button state tracking (pressed, justPressed, value)
- Automatic input source detection

### UI Modules (`js/ui/`)

#### GameHUD.js
**Purpose**: In-game HUD + menu + lobby overlay component

**Exports**: `GameHUD` class

**Methods**:
- `draw()` - Delegates to HUD, menu, or lobby render paths
- `drawStat()` - Render individual stat panel
- `drawMainMenu()` - Render main menu (single/multi/settings buttons, username, high score)
- `drawLobby()` - Render multiplayer lobby (status text, player list, back/start buttons)
- `drawGameOver()` - Render game over screen
- `drawPauseMenu()` - Render pause menu
- `checkMenuButtonClick()` / `updateMenuHover()` - Hit testing for both menu and lobby states

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `core/constants.js`

#### SettingsPanel.js
**Purpose**: Settings UI panel

**Exports**: `SettingsPanel` class

**Methods**:
- `draw(mouse)` - Render settings panel
- `handleClick(x, y)` - Handle mouse clicks
- `handleMouseMove(x, y)` - Handle mouse movement
- `updateSlider(x)` - Update volume slider

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `systems/SettingsManager.js`, `systems/AudioSystem.js`

### Utility Modules (`js/utils/`)

#### combatUtils.js
**Purpose**: Combat-related functions

**Exports**:
- `shootBullet(mouse, canvas)` - Fire weapon
- `reloadWeapon()` - Reload current weapon
- `switchWeapon(weapon)` - Change weapon
- `throwGrenade(mouse, canvas)` - Throw grenade
- `triggerExplosion(x, y, radius, damage, sourceIsPlayer)` - Create explosion
- `handleBulletZombieCollisions()` - Process bullet hits
- `handlePlayerZombieCollisions()` - Process player damage
- `handlePickupCollisions()` - Process pickup collection

**Dependencies**: `core/gameState.js`, `core/constants.js`, `systems/*`, `entities/*`

#### gameUtils.js
**Purpose**: General game utilities

**Exports**:
- `checkCollision(obj1, obj2)` - Circle collision detection
- `triggerDamageIndicator()` - Show damage flash
- `triggerWaveNotification()` - Show wave start notification
- `triggerMuzzleFlash(x, y, angle)` - Show muzzle flash
- `loadHighScore()` - Load from localStorage
- `saveHighScore()` - Save to localStorage

**Dependencies**: `core/gameState.js`

### Main Entry Point (`js/main.js`)

**Purpose**: Game loop, initialization, and event handlers

**Responsibilities**:
- Initialize game systems
- Set up event listeners
- Run game loop (`gameLoop()`)
- Coordinate all modules
- Handle input (keyboard, mouse)
- Handle melee attacks (`performMeleeAttack`)
- Update game state (`updateGame()`)
- Render game (`drawGame()`)

**Dependencies**: All other modules

## Game Systems

### Input System
**Location**: `js/main.js`, `js/systems/InputSystem.js`
- **Keyboard**: State tracking (`keys` object), event listeners for keydown/keyup
- **Mouse**: Position tracking (`mouse` object), event listeners for mousemove/click
- **Gamepad**: HTML5 Gamepad API integration via `InputSystem`
  - Left Stick: Movement (analog)
  - Right Stick: Aiming (analog)
  - Button mapping: RT (fire), RB (grenade), X (reload), Y (next weapon), LB (prev weapon), R3 (melee), L3 (sprint), Start (pause)
- **Input Source Detection**: Automatically switches between mouse/keyboard and gamepad based on active input
- **Virtual Crosshair**: When using controller, crosshair follows right stick aim direction
- Settings-aware keybind handling (keyboard and gamepad)

### Collision Detection
**Location**: `js/utils/gameUtils.js`
- Circle-based collision using distance formula
- Used for: bullet-zombie, player-zombie, player-pickup interactions
- Special handling for exploding zombies (position stored before removal)

### Screen Shake System
**Location**: `js/core/gameState.js`, `js/main.js`
- `shakeAmount` - Current intensity
- `shakeDecay` - Decay rate (0.9)
- Applied via canvas transform in `drawGame()`
- Triggered on: shooting (intensity 3), damage (intensity 8), explosions (intensity 15), melee (intensity 2-5)

### Damage Indicator System
**Location**: `js/core/gameState.js`, `js/utils/gameUtils.js`
- Red overlay flash on damage
- Intensity decay over time (decay rate: 0.95)
- Rendered as semi-transparent red rectangle
- Triggered on player-zombie collision and explosion damage

### Wave System
**Location**: `js/main.js`
- Progressive difficulty
- `zombiesPerWave` starts at 5, increases by 2 each wave
- Zombie speed and health scale with wave number
- Type-based spawning:
  - Wave 3+: Fast zombies (~15% chance)
  - Wave 5+: Exploding zombies (~10% chance)
  - Wave 3+: Armored zombies (scaling chance, 10%+ up to 50%)
- Auto-spawns next wave when all zombies killed

### Weapon System
**Location**: `js/core/constants.js`, `js/utils/combatUtils.js`
- Three weapon types: Pistol, Shotgun, Rifle
- Each weapon has unique: damage, fire rate, ammo capacity, reload time
- Weapon switching with 1/2/3 keys (customizable)
- `currentWeapon` tracks active weapon
- `lastShotTime` enforces fire rate cooldowns
- Shotgun fires 5 spread bullets per shot

**Weapon Properties:**
- **Pistol**: 1 damage, 400ms fire rate, 10 ammo, 1000ms reload
- **Shotgun**: 3 damage per pellet (5 pellets), 800ms fire rate, 5 ammo, 1000ms reload
- **Rifle**: 2 damage, 200ms fire rate, 30 ammo, 1000ms reload

### Ammo System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`
- Weapon-specific ammo counts (`currentAmmo`, `maxAmmo`)
- Each weapon maintains independent ammo state
- Ammo consumption on each shot
- Auto-reload when ammo reaches 0
- Manual reload with R key (customizable)
- Ammo displayed in HUD with reload status

### Reload System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`
- `isReloading` boolean flag tracks reload state
- `reloadStartTime` timestamp for reload duration
- All weapons have 1000ms (1 second) reload time
- Reload blocks shooting during animation
- HUD displays "Reloading..." during reload
- Reload can be cancelled by weapon switch

### Audio System
**Location**: `js/systems/AudioSystem.js`
- Web Audio API for programmatic sound generation
- `audioContext` initialized on first user interaction
- **Gunshot Sound**: Sharp crack with low-frequency boom
- **Damage Sound**: Low-frequency grunt (175Hz) on player hit
- **Kill Sound**: Satisfying pop/thud (350Hz) on zombie kill
- **Footstep Sound**: Impact thud with bass (every 350ms while moving)
- **Explosion Sound**: Low rumble with high crack (400ms duration)
- **Restart Sound**: Rising tone (200-800Hz) on game restart
- Master volume control via `masterGainNode`
- No external audio files required

### Pause System
**Location**: `js/core/gameState.js`, `js/main.js`
- `gamePaused` boolean flag
- ESC key toggles pause state
- Game loop skips update/render when paused
- HUD displays pause menu overlay
- R key restarts from pause menu
- M key returns to main menu

## Rendering Pipeline

### drawGame() Function (main.js)
**Execution Order**:
1. Check for settings panel or main menu (draw and return early if active)
2. Apply screen shake transform
3. Clear canvas with gradient background
4. Draw ground pattern (textured tile)
5. Draw vignette effect
6. Draw damage indicator overlay (if active)
7. Draw particles
8. Draw shells (bullet casings)
9. Draw bullets
10. Draw grenades
11. Draw pickups (health, ammo)
12. Draw zombies
13. Draw melee swipe (if active)
14. Draw player
15. Restore transform (undo shake)
16. Draw UI elements (damage numbers, crosshair, HUD, notifications, FPS)

### Update Loop (main.js)
**updateGame() Function**:
1. Check pause state (skip if paused)
2. Spawn health/ammo pickups periodically
3. Update player movement
4. Handle continuous mouse firing (if mouse.isDown)
5. Update bullets (filter off-screen)
6. Update grenades (filter exploded)
7. Update zombies (all types)
8. Update particles (filter by lifetime)
9. Update shells (bullet casings)
10. Update damage numbers (floating text)
11. Update damage indicator decay
12. Update muzzle flash decay
13. Update screen shake decay
14. Update wave notification
15. Update melee swipe animation
16. Check reload timer completion
17. Handle bullet-zombie collisions
18. Handle player-zombie collisions
19. Handle player-pickup collisions
20. Check for game over condition
21. Check wave completion

## State Management

### Centralized Game State (`js/core/gameState.js`)
All game state is managed through the `gameState` object:

- `gameRunning` - Game loop control
- `gamePaused` - Pause state flag
- `showMainMenu` - Main menu visibility
- `showSettingsPanel` - Settings panel visibility
- `showLobby` - Multiplayer lobby overlay visibility
- `multiplayer` - Socket.io metadata (`active`, `connected`, `socket`, `playerId`, `players[]`)
- `username` - Display name sent to the lobby when connecting
- `score` - Current score
- `wave` - Current wave number
- `zombiesKilled` - Kill counter
- `highScore` - Best score
- `player` - Player object (x, y, radius, speed, health, angle)
- `currentWeapon` - Active weapon reference
- `currentAmmo` / `maxAmmo` - Ammo state
- `isReloading` - Reload state flag
- `bullets[]` - Active bullets array
- `zombies[]` - Active zombies array
- `particles[]` - Active particles array
- `grenades[]` - Active grenades array
- `healthPickups[]` - Active health pickups
- `ammoPickups[]` - Active ammo pickups
- `shakeAmount` - Screen shake intensity
- `damageIndicator` - Damage flash state
- `muzzleFlash` - Muzzle flash effect state
- `waveNotification` - Wave start notification state
- `fps` - FPS counter value

## Event Flow

1. **Input Events** → Update `keys` object or `mouse` position (main.js)
2. **Game Loop** → `updateGame()` → `drawGame()` (main.js)
3. **Collision Events** → Update game state (combatUtils.js)
4. **State Changes** → Trigger effects (gameUtils.js)
5. **UI Update** → HUD renders updated state (GameHUD.js)

## Design Patterns

### ES6 Modules
- Each module exports specific functionality
- Clear dependency graph
- No global namespace pollution
- Tree-shakeable

### Centralized State
- Single source of truth (`gameState` object)
- All modules import and modify shared state
- Prevents state synchronization issues

### Component-Based
- GameHUD as reusable component
- SettingsPanel as reusable component
- Entity classes encapsulate behavior and rendering

### Update-Render Loop
- Classic game loop pattern
- Clear separation of update logic and rendering
- Consistent frame timing via `requestAnimationFrame`

## Performance Considerations

- Arrays filtered instead of deleted for efficiency
- Particles and bullets cleaned up when off-screen/dead
- Maximum particle limit (500) prevents performance degradation
- Canvas optimizations:
  - Gradient caching where possible
  - Transform stack management (save/restore)
  - Single gradient per frame for backgrounds
- ES6 modules enable better code splitting and tree-shaking

## Server Architecture

### Express Server (`server/server.js`)
**Purpose**: HTTP server for static file serving and WebSocket multiplayer support

**Features**:
- Serves static files from project root (Express static middleware)
- Socket.io WebSocket server attached to HTTP server
- Tracks connected players in memory and broadcasts `lobby:update` rosters
- Accepts `player:register` events so clients can set display names
- Color-coded PowerShell output mirrors join/leave events
- Configurable port (default: 3000, via PORT environment variable)

**Dependencies**:
- `express` - HTTP server framework
- `socket.io` - WebSocket library for real-time multiplayer

**Usage**:
- Run `launch.bat` from project root (Windows)
- Or run `launch.ps1` directly in PowerShell
- Server starts at `http://localhost:3000`
- Game accessible at `http://localhost:3000/zombie-game.html`

### Multiplayer Setup (Current)
- `connectToMultiplayer()` (client) lazily loads socket.io when the lobby opens
- PowerShell launcher (`launch.ps1`) boots the server and surfaces logs
- GameHUD lobby displays connection status + live player list from `lobby:update`
- Clients send `player:register` payloads immediately after connecting
- Ready for the next step: synchronizing in-game state across players

## Future Architecture Considerations

- State management pattern improvements (event system for state changes)
- Entity Component System (ECS) for complex entities
- Web Workers for heavy computations (pathfinding, particle physics)
- Asset loading system for external resources
- Save/load system for game state persistence
- Multiplayer game state synchronization via socket.io
- Client-side socket.io integration for real-time multiplayer
