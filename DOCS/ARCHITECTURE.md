# Architecture Documentation

## Project Structure

### Modular Architecture (ES6 Modules)
The game has been refactored into a modular ES6 architecture:
- `zombie-game.html`: Entry point and structure
- `css/style.css`: Visual styling
- `js/main.js`: Main game loop and initialization (entry point)
- `js/core/`: Core game systems (constants, canvas, game state)
- `js/companions/`: AI NPC companion system (CompanionSystem)
- `js/entities/`: Game entity classes (Bullet, Zombie, Particle, etc.)
- `js/systems/`: Game systems (Audio, Graphics, Particle, Settings, Input)
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
- `WEAPONS` - Weapon definitions (pistol, shotgun, rifle, flamethrower)
- `PLAYER_MAX_HEALTH`, `PLAYER_BASE_SPEED`, `PLAYER_SPRINT_SPEED` - Player stats
- `MELEE_RANGE`, `MELEE_DAMAGE`, `MELEE_COOLDOWN` - Melee settings
- `GRENADE_...` - Grenade settings
- `..._PICKUP_...` - Pickup settings
- `WAVE_BREAK_DURATION` - Wave timing
- `MAX_PARTICLES` - Particle system limit
- `RENDERING` - Rendering performance constants object
  - Alpha values (GROUND_PATTERN_ALPHA, VIGNETTE_ALPHA, DAMAGE_INDICATOR_ALPHA, SHADOW_ALPHA)
  - Timing constants (ZOMBIE_PULSE_PERIOD, BURN_TICK_INTERVAL, zombie pulse periods)
  - Viewport culling (CULL_MARGIN)
  - Cache thresholds (CANVAS_SIZE_CHANGE_THRESHOLD, PLAYER_POSITION_CHANGE_THRESHOLD)

#### canvas.js
**Purpose**: Canvas initialization and management

**Exports**:
- `canvas` - Canvas DOM element
- `ctx` - Canvas 2D rendering context
- `gpuCanvas` - WebGPU canvas element used by the GPU renderer
- `resizeCanvas(player)` - Resize canvas to fit window

**Dependencies**: `constants.js`

#### WebGPURenderer.js
**Purpose**: GPU-accelerated background rendering and compute-driven particles

**Responsibilities**:
- Initialize WebGPU device/context and configure preferred canvas format
- Maintain a uniform buffer for time, resolution, bloom intensity, distortion toggle, and lighting quality level
- Render a full-screen procedural background with noise/fog/vignette and optional distortion and rim lighting
- Update particles via a compute shader and render them with a point-list pipeline
- Gracefully fall back to Canvas 2D if WebGPU is unavailable
- **Performance**: Dirty flag system for efficient uniform buffer updates

**Runtime Controls**:
- `setBloomIntensity(value)` — 0.0–1.0 (marks uniforms dirty when changed)
- `setDistortionEffects(enabled)` — boolean (marks uniforms dirty when changed)
- `setLightingQuality(level)` — `off` | `simple` | `advanced` (marks uniforms dirty when changed)
- `setParticleCount(level)` — `low` (CPU/off) | `high` (10k) | `ultra` (50k) (optimized buffer reuse)
- `static isWebGPUAvailable()` — Consolidated WebGPU availability check

**Performance Features**:
- **Dirty Flag System**: Only writes to uniform buffer when values actually change
- **Buffer Reuse**: Particle buffers reused when count doesn't change, only recreated when size increases
- **Error Handling**: Graceful fallback to Canvas 2D on render errors
- **Bind Group Caching**: Efficient bind group management with `_createParticleBindGroups()` helper

**Integration**:
- Reads settings from `SettingsManager` via `js/main.js` and applies changes live
- Respects `video.webgpuEnabled` and only renders when enabled and available
- Consolidated checks via `isWebGPUActive()` helper in main.js

#### gameState.js
**Purpose**: Centralized game state management

**Exports**:
- `gameState` - Main state object containing all game variables
- `resetGameState(canvasWidth, canvasHeight)` - Reset game to initial state

**Game State Properties**:
- `gameTime` - Day/night cycle position (0 to 1)
- `dayNightCycle` - Cycle configuration (duration, startTime)
- `isNight` - Boolean flag for night time
- `acidProjectiles[]` - Active acid projectiles
- `acidPools[]` - Active acid pool hazards

**Dependencies**: `constants.js`

### Entity Modules (`js/entities/`)

#### Bullet.js
**Purpose**: Bullet projectile classes

**Exports**: `Bullet` class, `FlameBullet` class

**Methods**:
- `update()` - Move bullet (flame bullets slow down over time)
- `draw()` - Render bullet with visual trail (flame bullets have orange/red gradient)
- `isOffScreen(canvasWidth, canvasHeight)` - Boundary check

**Features**:
- Visual trail rendering based on velocity
- Weapon-specific damage (can be modified by damage multiplier)
- **FlameBullet**: Short-lived flame particles with dissipating velocity, applies burn effect on hit

**Dependencies**: `core/canvas.js`

#### Zombie.js
**Purpose**: Zombie enemy classes

**Exports**: `Zombie` (base), `NormalZombie`, `FastZombie`, `ExplodingZombie`, `ArmoredZombie`, `GhostZombie`, `SpitterZombie`

**Zombie Variants**:
- **NormalZombie**: Default enemy type
- **FastZombie**: 1.6x speed, 60% health, smaller hitbox, reddish/orange visuals
- **ExplodingZombie**: Explodes on death, AOE damage, orange/yellow pulsing glow
- **ArmoredZombie**: Slower, heavily armored, absorbs damage before health
- **GhostZombie**: Semi-transparent (50% opacity), 1.3x speed, spectral blue/white, wobble animation
- **SpitterZombie**: Ranged enemy with kiting AI, fires acid projectiles, toxic green appearance, Wave 6+

**Methods**:
- `update(player)` - AI pathfinding (kiting for SpitterZombie)
- `draw()` - Complex rendering (variant-specific visuals)
- `takeDamage(bulletDamage)` - Damage handling

**Burning State** (Base Zombie):
- `burnTimer` - Milliseconds remaining for burn effect
- `burnDamage` - Damage per tick (200ms intervals)
- Fire particles spawn while burning

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `systems/*`

#### Particle.js
**Purpose**: Particle effects and damage numbers

**Exports**: `Particle` class, `DamageNumber` class

**Dependencies**: `core/canvas.js`

#### Pickup.js
**Purpose**: Pickup and power-up classes

**Exports**: `HealthPickup`, `AmmoPickup`, `DamagePickup`, `NukePickup`

**Pickup Types**:
- **HealthPickup**: Red cross icon, restores player health
- **AmmoPickup**: Yellow/orange bullet icon, restores ammo and grenades
- **DamagePickup**: Purple "2x" icon, doubles weapon damage for 10 seconds
- **NukePickup**: Yellow/black radiation symbol, instantly kills all active zombies

**Dependencies**: `core/canvas.js`

#### Grenade.js
**Purpose**: Grenade projectile class

**Exports**: `Grenade` class

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `core/constants.js`, `utils/combatUtils.js`

#### Shell.js
**Purpose**: Shell casing class

**Exports**: `Shell` class

**Dependencies**: `core/canvas.js`

#### AcidProjectile.js
**Purpose**: Acid projectile from Spitter Zombie

**Exports**: `AcidProjectile` class

**Methods**:
- `update()` - Move toward target position
- `draw()` - Render toxic green projectile with trail
- `land()` - Create acid pool at impact location
- `isOffScreen(canvasWidth, canvasHeight)` - Boundary check

**Features**:
- Targets player position at time of firing
- Creates `AcidPool` on impact (within 20px tolerance)
- Toxic green visual with glow effect

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `entities/AcidPool.js` (via global reference)

#### AcidPool.js
**Purpose**: Ground hazard that damages players

**Exports**: `AcidPool` class

**Methods**:
- `update()` - Damage players standing in pool, decrement lifetime
- `draw()` - Render bubbling acid pool with fade-out
- `isExpired()` - Check if pool has expired (5 second duration)

**Features**:
- Damages players every 200ms while standing in pool (0.3 damage per tick)
- Respects shield before health
- Animated bubbling effect
- Fades out over 5 second lifetime

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `utils/gameUtils.js` (via global reference)

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
**Purpose**: Graphics utilities, texture loading, and quality scaling system

**Exports**:
- `initGroundPattern()` - Load and cache ground texture pattern (renamed from `initGrassPattern`)
- `graphicsSettings` - Getter object for video settings (quality, maxParticles, vignette, shadows, lighting, effectIntensity, postProcessingQuality, particleDetail)
- `getQualityMultipliers()` - Returns quality-based multipliers (glow, size, detail, opacity) based on preset
- `getQualityValues(effectType)` - Returns quality-specific values for visual effects (eyeGlow, muzzleFlash, explosion, aura, damageNumber)

**Dependencies**: `core/canvas.js`, `systems/SettingsManager.js`

**Quality Scaling System**:
- **Quality Presets**: Low, Medium, High, Ultra, Custom
  - Low: Minimal effects (0.3-0.5x multipliers), basic visuals, performance-focused
  - Medium: Balanced effects (0.7-0.75x multipliers), some detail
  - High: Rich effects (1.0x multipliers), good detail
  - Ultra: Maximum effects (1.2-1.5x multipliers), cinematic quality
- **Effect Intensity**: Multiplier (0.0-2.0) applied to all quality-based effects
- **Quality Values**: Effect-specific quality scaling
  - Eye Glows: Shadow blur (4px Low → 18px Ultra), gradient stops (3-5)
  - Muzzle Flash: Size multiplier (0.5x Low → 1.2x Ultra), gradient layers (1-3), trails
  - Explosions: Particle counts, large flash, shockwave rings, trails
  - Auras: Opacity (20% Low → 80% Ultra), pulse complexity, multi-layer
  - Damage Numbers: Font size, outline quality, glow intensity

**Notes**:
- Loads ground texture from `sample_assets/tiles/bloody_dark_floor.png`
- Creates tiling pattern for canvas background
- Replaces previous procedural grass generation
- Ground pattern opacity set to 0.6 for better visibility
- Provides reactive getters for video settings that check SettingsManager
- Used throughout rendering pipeline for conditional effect rendering
- Centralized quality scaling logic ensures consistent quality differentiation

#### RenderingCache.js
**Purpose**: Intelligent caching system for expensive rendering operations

**Exports**:
- `RenderingCache` class - Caching system for gradients and patterns
- `renderingCache` singleton instance

**Methods**:
- `needsInvalidation(player)` - Check if cache needs invalidation based on canvas size/player position
- `invalidate(player)` - Invalidate cache and update cached values
- `getBackgroundGradient()` - Get or create cached background gradient
- `getVignetteGradient()` - Get or create cached vignette gradient
- `getLightingGradient(player)` - Get or create cached lighting gradient (position-dependent)
- `getGroundPattern()` - Get or create cached ground pattern
- `updateSettings(vignetteEnabled, lightingEnabled)` - Update settings cache

**Dependencies**: `core/canvas.js`, `core/constants.js`, `systems/GraphicsSystem.js`

**Performance Features**:
- Caches gradients until canvas size changes >10px threshold
- Caches lighting gradient until player moves >50px threshold
- Reduces expensive gradient creation from every frame to only when needed
- Settings-aware caching to avoid redundant recreation

#### ParticleSystem.js
**Purpose**: Particle effects and blood splatter with quality scaling

**Exports**:
- `addParticle(particle)` - Add particle to system
- `createParticles(x, y, color, count)` - Create particle burst (quality-aware)
- `createBloodSplatter(x, y, angle, isKill)` - Create blood effect (quality-scaled)
- `createExplosion(x, y)` - Create explosion visual (quality-scaled)
- `updateParticles()` - Update all particles (optimized with filter pattern)
- `drawParticles()` - Render all particles (quality-aware rendering)
- `spawnParticle(x, y, color, props)` - Spawn particle using object pool (respects limits)

**Dependencies**: `core/gameState.js`, `entities/Particle.js`, `core/constants.js`, `utils/ObjectPool.js`, `systems/GraphicsSystem.js`

**Quality Features**:
- **Quality-Based Limits**: Particle count enforced based on quality preset (50/100/200/500)
- **Quality-Aware Spawning**: Early returns prevent spawning at limit
- **Quality-Scaled Effects**: Explosions and blood splatter scale particle counts by quality
  - Explosions: 15-40 fire particles, 8-20 smoke particles, shockwave rings at Ultra
  - Blood Splatter: 60-150% particle counts, color variation, pooling effects at Ultra
- **Particle Detail**: Rendering quality controlled by particleDetail setting
  - Minimal: Simple solid circles
  - Standard: Current particle system
  - Detailed: Gradients and light glow
  - Ultra: Multi-layer gradients, glow, enhanced effects

**Performance Features**:
- **Object Pooling**: Uses `ObjectPool` for efficient particle reuse
- **Optimized Update Loop**: Replaced reverse loop + splice with efficient filter pattern
- **Memory Management**: Particles returned to pool when expired
- **Quality-Based Culling**: Reduces particle counts at lower quality settings

#### SettingsManager.js
**Purpose**: Settings persistence and management

**Exports**: `SettingsManager` class, `settingsManager` singleton

**Methods**:
- `loadSettings()` - Load from localStorage
- `saveSettings()` - Save to localStorage
- `getSetting(category, key)` - Get setting value
- `setSetting(category, key, value)` - Set setting value
- `applyVideoPreset(preset)` - Apply quality preset (low/medium/high/custom)

**Dependencies**: None (localStorage only)

**Settings Structure**:
- `audio.masterVolume` - Master volume (0.0 to 1.0)
- `video.vignette` - Enable/disable vignette overlay
- `video.shadows` - Enable/disable shadows under entities
- `video.lighting` - Enable/disable lighting overlay
- `video.resolutionScale` - Canvas resolution scale (0.5 to 2.0)
- `video.uiScale` - UI scaling factor (0.5 to 1.5, default 1.0 = 100%)
- `video.floatingText` - Enable/disable floating pickup text
- `video.fpsLimit` - FPS limit (0 = unlimited, 30, 60, 120)
- `video.vsync` - Enable/disable VSync (browser handles frame timing)
- `video.effectIntensity` - Visual effects multiplier (0.0 to 2.0)
- `video.postProcessingQuality` - Post-processing quality (off, low, medium, high)
- `video.particleDetail` - Particle rendering quality (minimal, standard, detailed, ultra)
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
- `getUIScale()` - Get current UI scale factor from settings (50%-150%)
- `getScaledPadding()` - Get scaled padding value
- `getScaledItemSpacing()` - Get scaled item spacing value
- `getScaledFontSize()` - Get scaled font size (minimum 8px for readability)

**UI Scaling System**:
- All UI elements scale dynamically based on `uiScale` setting (50%-150%)
- All fonts properly scale using pattern: `Math.max(minSize, baseSize * scale)`
- Button fonts, menu text, lobby UI, and all UI elements scale consistently
- UI scale preset buttons in settings panel (Small 70%, Medium 100%, Large 130%)
- Settings panel header/tab layout uses dynamic calculations to prevent intersection
- Header height: `(35 * scale) + (30 * scale) + (15 * scale)` for title + divider + spacing
- Viewport height calculated dynamically based on scaled header/tab/footer heights
- Base dimensions stored separately from scaled dimensions for clean calculations
- Scaling applied to: fonts, padding, spacing, button sizes, panel dimensions, health displays
- Minimum font size enforced (8px) for readability at low scales
- Real-time scaling - changes apply immediately on next render

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `core/constants.js`, `systems/SettingsManager.js`

#### SettingsPanel.js
**Purpose**: Settings UI panel

**Exports**: `SettingsPanel` class

**Methods**:
- `draw(mouse)` - Render settings panel
- `handleClick(x, y)` - Handle mouse clicks
- `handleMouseMove(x, y)` - Handle mouse movement
- `updateSlider(x)` - Update volume slider
- `getUIScale()` - Get current UI scale factor from settings (50%-150%)
- `getScaledPanelWidth()` - Get scaled panel width
- `getScaledPanelHeight()` - Get scaled panel height
- `getScaledPadding()` - Get scaled padding value
- `getScaledTabHeight()` - Get scaled tab height

**UI Scaling System**:
- All settings UI elements scale dynamically based on `uiScale` setting (50%-150%)
- Base dimensions stored separately from scaled dimensions for clean calculations
- Scaling applied to: panel dimensions, tabs, headers, footers, sliders, toggles, dropdowns
- Row heights, font sizes, and interactive element sizes all scale proportionally
- Real-time scaling - changes apply immediately on next render

**Dependencies**: `core/canvas.js`, `core/gameState.js`, `systems/SettingsManager.js`, `systems/AudioSystem.js`

### Companion Modules (`js/companions/`)

#### CompanionSystem.js
**Purpose**: AI NPC companion behavior and lifecycle management

**Exports**: `CompanionSystem` class

**Methods**:
- `addCompanion()` - Creates and adds a new AI companion to the game
  - Returns the created companion player object, or null if max reached
  - Automatically assigns color and spawn position
  - Sets `inputSource` to 'ai' for identification
- `update(player)` - Updates AI companion behavior for a single frame
  - Determines movement, aiming, and shooting decisions
  - Modifies player object directly (angle, isSprinting, speed)
  - Returns movement vector {moveX, moveY} for physics integration

**Features**:
- **Following Behavior**: Maintains preferred distance from player 1 (150px when idle)
- **Leash System**: Forces return to player 1 if too far (500px max distance)
- **Combat AI**: Engages nearest zombie within range (500px)
  - Kites away if too close (200px)
  - Approaches if safe distance (350px+)
  - Faces and shoots at nearest zombie
- **Ammo Management**: Automatically reloads when empty
- **Shooting**: Fires at zombies with slight random inaccuracy for realism
- **Configurable Parameters**: All distances and ranges are configurable class properties

**Dependencies**: `core/gameState.js`, `core/canvas.js`, `core/constants.js`, `utils/combatUtils.js`

**Future Enhancements** (Prepared Structure):
- Support for different companion roles (Medic, Sniper, etc.)
- Command system (HOLD, ATTACK, FOLLOW)
- State machine for complex behaviors (Idle, Combat, Revive)

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
- `isInViewport(entity, viewportLeft, viewportTop, viewportRight, viewportBottom)` - Viewport culling check
- `getViewportBounds(canvas)` - Get viewport bounds for culling
- `triggerDamageIndicator()` - Show damage flash
- `triggerWaveNotification()` - Show wave start notification
- `triggerMuzzleFlash(x, y, angle)` - Show muzzle flash
- `loadHighScore()` - Load from localStorage
- `saveHighScore()` - Save to localStorage

**Dependencies**: `core/gameState.js`, `core/constants.js`

**Performance Features**:
- **Viewport Culling**: `isInViewport()` performs efficient entity bounds checking with configurable margin
- **Bounds Calculation**: `getViewportBounds()` provides reusable viewport bounds for culling

### Main Entry Point (`js/main.js`)

**Purpose**: Game loop, initialization, and event handlers

**Responsibilities**:
- Initialize game systems (including `CompanionSystem`)
- Set up event listeners
- Run game loop (`gameLoop()`)
- Coordinate all modules
- Handle input (keyboard, mouse)
- Handle melee attacks (`performMeleeAttack`)
- Update game state (`updateGame()`)
- Render game (`drawGame()`)
- Delegate AI companion updates to `CompanionSystem`

**Dependencies**: All other modules

**AI Companion Integration**:
- `addAIPlayer()` function delegates to `companionSystem.addCompanion()`
- `updatePlayers()` calls `companionSystem.update(player)` for AI-controlled players
- Movement vectors returned from `CompanionSystem` integrated with existing physics

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
**Location**: `js/utils/gameUtils.js`, `js/utils/combatUtils.js`
- Circle-based collision using squared distance formula (optimized, no sqrt)
- Quadtree spatial partitioning for bullet-zombie collisions (reused instance)
- Used for: bullet-zombie, player-zombie, player-pickup interactions
- Special handling for exploding zombies (position stored before removal)
- **Performance**: Squared distance comparisons eliminate expensive sqrt operations

### Screen Shake System
**Location**: `js/core/gameState.js`, `js/main.js`
- `shakeAmount` - Current intensity
- `shakeDecay` - Decay rate (0.9)
- Applied via canvas transform in `drawGame()`
- Triggered on: shooting (intensity 3), damage (intensity 8), explosions (intensity 15), melee (intensity 2-5), nuke (intensity 30)

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
  - Wave 4+: Ghost zombies (~10% chance)
  - Wave 3+: Armored zombies (scaling chance, 10%+ up to 50%)
  - Wave 6+: Spitter zombies (~8% chance)
- Auto-spawns next wave when all zombies killed

### Day/Night Cycle System
**Location**: `js/core/gameState.js`, `js/main.js`
- 2-minute cycle (120 seconds) transitioning between day and night
- `gameTime` tracks cycle position (0.0 to 1.0)
- `isNight` boolean flag (true when `gameTime >= 0.5`)
- Visual overlay: Dark blue/black rectangle with alpha based on time
  - Day (0.0-0.5): Transparent to slightly dark
  - Night (0.5-1.0): Dark overlay (0.5 to 0.7 alpha)
- Difficulty scaling: Zombies move 20% faster during night (`nightSpeedMultiplier = 1.2`)
- Rendered after vignette but before UI elements

### Weapon System
**Location**: `js/core/constants.js`, `js/utils/combatUtils.js`
- Four weapon types: Pistol, Shotgun, Rifle, Flamethrower
- Each weapon has unique: damage, fire rate, ammo capacity, reload time, range
- Weapon switching with 1/2/3/4 keys (customizable) or scroll wheel (toggleable)
- `currentWeapon` tracks active weapon
- `lastShotTime` enforces fire rate cooldowns
- Shotgun fires 5 spread bullets per shot
- Flamethrower fires 3 flame particles with spread pattern
- Damage multiplier system: Bullet damage multiplied by `gameState.damageMultiplier` (applies double damage buff)
- Burning mechanic: Flame bullets apply damage over time (burn timer) instead of instant damage
- **Persistent ammo tracking**: Each weapon maintains its own ammo state in `player.weaponStates` map
- **Background reload**: Weapons auto-reload when holstered for longer than reload time

**Weapon Properties:**
- **Pistol**: 1 damage, 400ms fire rate, 10 ammo, 1000ms reload
- **Shotgun**: 3 damage per pellet (5 pellets), 800ms fire rate, 5 ammo, 1000ms reload
- **Rifle**: 2 damage, 200ms fire rate, 30 ammo, 1000ms reload
- **Flamethrower**: 0.5 damage per tick, 50ms fire rate, 100 ammo, 2000ms reload, 200px range, applies burn effect

**Weapon Switching:**
- Keyboard: 1/2/3/4 keys (customizable in settings)
- Scroll wheel: Up/down to cycle weapons (toggleable in settings, enabled by default)
- Switching saves current weapon's ammo state and restores target weapon's saved state
- Background reload: If weapon was holstered for >= reload time, it auto-reloaded and restores max ammo
- Fire rate cooldown resets on weapon switch
- Reload animation cancelled on weapon switch

### Ammo System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`
- Weapon-specific ammo counts (`currentAmmo`, `maxAmmo`)
- Each weapon maintains independent ammo state in `player.weaponStates` map
- Ammo state structure: `{ ammo: number, lastHolsteredTime: timestamp }`
- Ammo consumption on each shot
- **Auto-reload on empty**: Triggers immediately when ammo reaches 0 after a shot
- Manual reload with R key (customizable)
- Ammo displayed in HUD with reload status
- **Persistent ammo**: Switching weapons preserves each weapon's ammo count

### Reload System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`
- `isReloading` boolean flag tracks reload state
- `reloadStartTime` timestamp for reload duration
- All weapons have 1000ms (1 second) reload time (Flamethrower: 2000ms)
- Reload blocks shooting during animation
- HUD displays "Reloading..." during reload
- Reload can be cancelled by weapon switch
- **Background reload**: Weapons automatically reload when holstered for >= reload time
- **Auto-reload on empty**: Automatically triggers when ammo depletes to 0
- Weapon state synced when reload completes (updates `weaponStates` map)

### Audio System
**Location**: `js/systems/AudioSystem.js`
- Web Audio API for programmatic sound generation
- `audioContext` initialized on first user interaction
- **Gunshot Sound**: Sharp crack with low-frequency boom
- **Damage Sound**: Low-frequency grunt (175Hz) on player hit
- **Kill Sound**: Satisfying pop/thud (350Hz) on zombie kill
- **Footstep Sound**: Impact thud with bass (350ms while walking, 130ms while sprinting)
- **Explosion Sound**: Low rumble with high crack (400ms duration)
- **Restart Sound**: Rising tone (200-800Hz) on game restart
- Master volume control via `masterGainNode`
- No external audio files required

### Power-up System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`, `js/main.js`
- **Damage Pickup**: Purple "2x" icon, doubles weapon damage for 10 seconds
  - Spawns every 30 seconds (50% chance, 80% of powerup spawns)
  - `damageMultiplier` state variable (default 1, becomes 2 when active)
  - `damageBuffEndTime` tracks expiration timestamp
  - HUD displays remaining buff time
- **Nuke Pickup**: Yellow/black radiation symbol, instantly kills all zombies
  - Very rare spawn (every 30 seconds, 50% chance, 20% of powerup spawns)
  - Triggers massive screen shake (30 units) and explosion effects
  - Clears entire zombie array instantly
- Powerup arrays: `damagePickups[]`, `nukePickups[]` in game state
- Spawn logic checks every 30 seconds for powerup opportunities

### Kill Streak System
**Location**: `js/core/gameState.js`, `js/utils/combatUtils.js`
- Tracks consecutive kills within 1.5 second window
- `killStreak` counter increments on rapid kills
- `lastKillTime` timestamp tracks timing between kills
- Resets streak if more than 1.5 seconds pass between kills
- Visual feedback: Floating combo text for streaks 3+
  - "3 HIT COMBO!", "4 HIT COMBO!", etc.
  - "5 KILL RAMPAGE!" at 5 kills
  - "UNSTOPPABLE!" at 10+ kills
- Uses `DamageNumber` class for floating text display

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
5. Draw vignette effect (if enabled via settings)
6. Draw lighting overlay (if enabled via settings, follows player position)
7. Draw day/night cycle overlay
8. Draw damage indicator overlay (if active)
9. Draw particles
8. Draw shells (bullet casings)
9. Draw bullets (including flame bullets)
10. Draw grenades
11. Draw acid projectiles
12. Draw acid pools (ground hazards)
13. Draw pickups (health, ammo, damage, nuke)
14. Draw zombies
15. Draw melee swipe (if active)
16. Draw player
17. Restore transform (undo shake)
18. Draw UI elements (damage numbers, crosshair, HUD, notifications, FPS)

### Update Loop (main.js)
**updateGame() Function**:
1. Check pause state (skip if paused)
2. Spawn health/ammo pickups periodically
3. Spawn powerups (damage/nuke) periodically
4. Update day/night cycle (calculate gameTime, isNight, apply night speed multiplier)
5. Update player movement
6. Handle continuous mouse firing (if mouse.isDown)
7. Update bullets (filter off-screen, including flame bullets)
8. Update grenades (filter exploded)
9. Update acid projectiles (filter off-screen or landed)
10. Update acid pools (filter expired, damage players)
11. Update zombies (all types, including burning state)
12. Update particles (filter by lifetime)
13. Update shells (bullet casings)
14. Update damage numbers (floating text)
15. Update damage indicator decay
16. Update muzzle flash decay
17. Update screen shake decay
18. Update wave notification
19. Update melee swipe animation
20. Check reload timer completion
21. Update damage buff timer (expire if time elapsed)
22. Handle bullet-zombie collisions (includes kill streak tracking, burn effects)
23. Handle player-zombie collisions
24. Handle player-pickup collisions (health, ammo, damage, nuke)
25. Check for game over condition
26. Check wave completion

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
- `bullets[]` - Active bullets array (including flame bullets)
- `zombies[]` - Active zombies array
- `particles[]` - Active particles array
- `grenades[]` - Active grenades array
- `acidProjectiles[]` - Active acid projectiles from spitter zombies
- `acidPools[]` - Active acid pool hazards
- `healthPickups[]` - Active health pickups
- `ammoPickups[]` - Active ammo pickups
- `damagePickups[]` - Active damage buff pickups
- `nukePickups[]` - Active nuke pickups
- `gameTime` - Day/night cycle position (0 to 1)
- `dayNightCycle` - Cycle configuration object
- `isNight` - Boolean flag for night time
- `shakeAmount` - Screen shake intensity
- `damageIndicator` - Damage flash state
- `muzzleFlash` - Muzzle flash effect state
- `waveNotification` - Wave start notification state
- `damageMultiplier` - Current damage multiplier (default 1, 2 when buffed)
- `damageBuffEndTime` - Timestamp when damage buff expires
- `killStreak` - Current kill streak count
- `lastKillTime` - Timestamp of last kill (for streak tracking)
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

### Rendering Optimizations

#### RenderingCache System (`js/systems/RenderingCache.js`)
- **Intelligent Gradient Caching**: Caches expensive-to-create gradients and patterns
  - Background gradients cached until canvas size changes
  - Vignette gradients cached until canvas size changes
  - Lighting gradients cached until player position changes significantly (>50px)
  - Ground pattern cached (initialized once)
  - Invalidates cache only when thresholds exceeded (10px canvas change, 50px player movement)
- **Settings Cache**: Tracks enabled/disabled states to avoid redundant gradient recreation

#### Viewport Culling (`js/utils/gameUtils.js`)
- **Entity Culling**: All entities checked against viewport bounds before rendering
  - `isInViewport()` utility function performs efficient bounds checking
  - Uses `CULL_MARGIN` (100px) to render entities slightly off-screen for smooth entry
  - Significantly reduces draw calls with many entities
  - Viewport bounds calculated once per frame and reused
- **Update Culling** (Biggest FPS Win): Skip updating entities far off-screen
  - `shouldUpdateEntity()` utility function with larger margin (300px vs 100px render margin)
  - Entities far off-screen still update for AI/pathfinding if they might come into view soon
  - Applied to zombies, grenades, acid projectiles, acid pools, shells
  - Major CPU savings when many zombies are off-screen
- **Small Feature Culling**: Skip rendering entities smaller than 1px on screen
  - `isVisibleOnScreen()` utility function checks entity size
  - Applied to shells and bullets for reduced draw calls
  - Prevents rendering tiny entities that aren't visible

#### Canvas 2D Optimizations
- **Gradient Reuse**: Gradients created once and reused across frames
- **Settings Caching**: Frequently accessed settings cached at frame start
- **Transform Stack Management**: Efficient save/restore operations
- **Batch Entity Drawing**: Entities grouped by type for better cache coherency

### WebGPU Optimizations

#### Uniform Buffer Management (`js/core/WebGPURenderer.js`)
- **Dirty Flag System**: Tracks which uniform values changed
  - Uniform buffer only written when values actually change
  - Cached values for time, resolution, bloom, distortion, lighting
  - Reduces GPU buffer writes significantly (only when settings change or time updates)

#### Particle Buffer Management
- **Buffer Reuse**: Particle buffers reused when count doesn't change
- **Size Tracking**: Only recreates buffers when size increases
- **Bind Group Caching**: Bind groups cached and reused efficiently
- **Helper Methods**: `_createParticleBindGroups()` centralizes bind group creation

#### Error Handling
- **Graceful Fallback**: WebGPU errors trigger automatic fallback to Canvas 2D
- **Consolidated Checks**: Single `isWebGPUActive()` helper for all WebGPU availability checks
- **Error Recovery**: Try-catch blocks prevent game loop crashes

### Particle System Optimizations

- **Efficient Update Loop**: Replaced reverse loop + splice with filter pattern
  - Better performance for array modifications
- **Quality-Based Particle Limits**: Particle count enforced based on quality preset
  - Low: 50 particles, Medium: 100 particles, High: 200 particles, Ultra: 500 particles
  - Early returns prevent spawning particles when at limit
  - Quality-aware particle counts for explosions and blood splatter
- **Particle Detail Setting**: Controls particle rendering quality
  - Minimal: Simple solid circles
  - Standard: Current particle system
  - Detailed: Gradients and light glow
  - Ultra: Multi-layer gradients, glow, and enhanced effects
  - Maintains object pool integration
  - Cleaner code without manual index management

### General Optimizations

- Arrays filtered instead of deleted for efficiency
- Particles and bullets cleaned up when off-screen/dead
- Maximum particle limit (500) prevents performance degradation
- ES6 modules enable better code splitting and tree-shaking
- Constants extracted from magic numbers for better maintainability
- **Math.sqrt() Elimination (V0.5.2)**: 26+ sqrt calls replaced with squared distance comparisons
- **Loop Optimizations (V0.5.2)**: forEach() converted to for loops in hot paths
- **Object Reuse (V0.5.2)**: Quadtree and query range objects reused instead of recreated
- **Settings Caching (V0.5.2)**: Frequently accessed settings cached at frame start
- **Viewport Caching (V0.5.2)**: Viewport bounds calculated once per frame and reused
- **Property Caching (V0.5.2)**: Object properties cached in local variables within loops
- **Early Returns (V0.5.2)**: Early exits for entities that don't need processing
- **Math Constants (V0.5.2)**: TWO_PI constant added to reduce repeated calculations

### Expected Performance Gains

Based on implementation:
- **Canvas 2D**: 30-50% FPS improvement (gradient caching + viewport culling)
- **WebGPU**: 20-40% improvement (dirty flags + buffer optimization)
- **Entity Rendering**: 15-25% improvement (culling + batching)
- **Particle System**: 25-35% improvement (optimized loops)
- **Engine Micro-Optimizations (V0.5.2)**: 5-15% additional FPS improvement
  - Math.sqrt() elimination (26+ locations) - squared distance comparisons
  - forEach() to for loops in hot paths (5-10% faster iteration)
  - Quadtree instance reuse (reduces GC pressure)
  - Settings lookup caching (reduces repeated property access)
  - Viewport bounds caching (calculated once per frame)
  - Property caching in loops (faster iterations)
  - Early return optimizations (skips unnecessary work)
  - Math constants caching (TWO_PI)

Performance improvements are most noticeable with:
- High entity counts (50+ zombies)
- Many particles (explosions, blood splatter)
- Low-end hardware/browsers
- Complex scenes with multiple effects

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
