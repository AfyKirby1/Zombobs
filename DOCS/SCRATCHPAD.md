# Development Scratchpad

*This file is for continuous reference and quick notes. Never delete, only compact old updates.*

## 2025 - Active Development Notes

### AI Companion System Refactoring [2025-01-XX]
- ✅ **CompanionSystem Module**: Extracted AI companion logic into dedicated module
  - Created `js/companions/CompanionSystem.js` to manage AI NPC companions
  - Separated AI behavior from main game loop (`js/main.js`)
  - Modular structure prepares for future enhancements (roles, commands, state machines)
  - `addCompanion()` method handles adding new AI companions
  - `update(player)` method handles AI decision-making per frame
  - Configurable parameters: leash distance, follow distance, combat range, kite distance
  - Behavior unchanged: AI still follows player, engages zombies, maintains leash distance
  - Cleaner code organization and separation of concerns

### Landing Page Visual Updates [2025-01-XX]
- ✅ **UI Transparency**: Increased panel transparency for better visual depth
  - Dark mode card background opacity reduced from 0.65 to 0.45
  - Light mode card background opacity reduced from 0.85 to 0.65
  - Background animations now show through more prominently
- ✅ **Fly-out Animation**: Restored Star Wars-style fly-out effect
  - Icons (Zombie, Bullet, Health Pickup) spawn from screen center
  - Elements fly out in random directions, fade and scale as they move away
  - Fixed center point (not mouse-tracking) for consistent visual effect
  - Creates dynamic, engaging background on landing page

### Power-up UI Polish [2025-01-XX]
- ✅ **HUD Improvements**: Added remaining time indicators for power-ups
  - **Speed Boost**: Timer displayed in shared stats area
  - **Rapid Fire**: Timer displayed in shared stats area
  - **Shield**: Dynamic shield bar in player stats area
- ✅ **Consistency**: Matched styling with existing Damage buff UI

### Menu Music & UI Polish [2025-11-19]
- ✅ **Menu Music**: Added "Shadows of the Wasteland.mp3" background music
  - Plays on main menu, loops continuously
  - Stops when game starts, resumes when returning to menu
  - Connected to master volume control
  - Browser autoplay-friendly (requires user interaction)
- ✅ **Main Menu UI**: Enhanced with music tip and improved layout
  - Added visible music tip text with red glow effect
  - Fixed button positioning to prevent overlap with username hover text
  - Added creepy background effects (pulsing gradient, scanlines, static, vignette)
- ✅ **Itch.io Guide**: Created publishing documentation for web distribution

### Local Co-op & Horror UI [2025-11-19]
- ✅ **Local Co-op Mode**: Implemented full 2-player shared screen support
  - P1 (Mouse/Keys or Gamepad) + P2 (Keys or Gamepad)
  - Dedicated Co-op lobby with join/leave mechanics
  - Split-screen HUD stats + Shared central game stats
  - Distinct player colors (P1 Blue, P2 Red)
- ✅ **Main Menu Overhaul**: 
  - Replaced static background with animated "horror monitor" effect
  - Pulsing red gradient, scanlines, and static noise
  - Dynamic blood splatter system (random spawning/fading stains)
  - Improved UI layout and music tooltips

### Quick Feature Additions [2025-01-XX]
- ✅ **Bullet Trails**: Added visual trail rendering behind bullets for better direction/speed feedback
- ✅ **Ghost Zombie**: New semi-transparent enemy variant (Wave 4+, ~10% spawn chance)
  - 50% opacity, pale blue/white spectral appearance
  - 1.3x speed, 80% health, wobble animation effect
- ✅ **Double Damage Pickup**: Purple power-up that doubles weapon damage for 10 seconds
  - HUD displays remaining buff time
  - Rare spawn (30s interval, 50% chance, 80% of powerups)
- ✅ **Nuke Pickup**: Yellow/black hazard-styled instant clear power-up
  - Kills all active zombies instantly
  - Massive screen shake and explosion effects
  - Very rare spawn (30s interval, 50% chance, 20% of powerups)
- ✅ **Kill Streak System**: Combo tracking with visual feedback
  - Tracks consecutive kills within 1.5s window
  - Floating combo text for streaks 3+ ("3 HIT COMBO!", "RAMPAGE!", "UNSTOPPABLE!")
  - Encourages aggressive playstyle

### Controller Support & UI Updates [2025-11-19]
- ✅ **Controller Support (Beta)**: Full Xbox controller integration
  - Left Stick: Analog movement
  - Right Stick: Analog aiming (character direction now properly follows stick input)
  - Automatic input source detection (switches between mouse/keyboard and gamepad)
  - Virtual crosshair follows controller aim direction instead of being locked to mouse cursor
  - Hot-plug support for controller connection/disconnection
  - Controller keybind settings UI with rebind support
- ✅ **Main Menu**: Added "Local Co-op" button (placeholder for future implementation)
- ✅ **Graphics System**: 
  - Renamed `initGrassPattern()` to `initGroundPattern()` for clarity
  - Increased ground pattern opacity from 0.4 to 0.6 for better visibility

### Version V0.3.0 ALPHA Release [2025-01-XX]
- ✅ **Version Bump**: Updated to V0.3.0 ALPHA across all relevant files
- ✅ **Engine Naming**: Officially named the game engine "ZOMBS-XFX-NGIN V0.3.0 ALPHA"
- ✅ **Engine Info Box**: Added engine name and version display to landing page

### Version 0.2.5 Release [2025-01-XX]
- ✅ **Version Bump**: Updated to v0.2.5 across all relevant files
- ✅ **Visual Upgrade**: Replaced procedural grass pattern with textured bloody dark floor tile
- ✅ **GraphicsSystem Update**: Now loads and caches ground texture from `sample_assets/tiles/bloody_dark_floor.png`
- ✅ **Landing Page Improvements**: 
  - Widened page layout (1200px max-width, improved grid: 2.2fr / 1.2fr)
  - Expanded feature grid to 10 items with detailed descriptions
  - Enhanced roadmap section with 11 notable future features
  - Updated run details with technical specs (Input, Perspective, Audio tech)
- ✅ **Style Guide**: Created comprehensive `DOCS/STYLE_GUIDE.md` documenting color palette, typography, UI components, and visual effects
- ✅ **Documentation Sync**: Updated CHANGELOG.md, SUMMARY.md, ARCHITECTURE.md, SCRATCHPAD.md, and My_Thoughts.md

### Multiplayer Backend Setup [2025]
- ✅ **Server Folder**: Created `server/` directory with Node.js backend
- ✅ **Express Server**: Static file serving from project root
- ✅ **Socket.io Setup**: WebSocket server attached to Express, ready for multiplayer events
- ✅ **PowerShell Launcher**: Styled `launch.ps1` with colored output and ASCII art banner
- ✅ **Windows Launcher**: `launch.bat` calls PowerShell wrapper
- ✅ **Auto-Install**: Dependencies automatically installed on first launch
- ✅ **Port Configuration**: Default port 3000 (configurable via PORT env var)
- ✅ **Server accessible at `http://localhost:3000`**
- ✅ **Socket.io connection handlers in place for future multiplayer implementation**

### Multiplayer Lobby & Logging [2025-11-19]
- ✅ **Canvas Lobby**: GameHUD renders lobby state (connecting pulse, player list, Ready/Back buttons)
- ✅ **State Flags**: Added `showLobby`, `multiplayer` object, and `username` to `gameState`
- ✅ **Client Wiring**: `connectToMultiplayer()` lazily loads socket.io and registers players
- ✅ **Server Broadcasts**: `server.js` now tracks players, emits `lobby:update`, and prints join/leave summaries
- ✅ **Launcher UX**: PowerShell window mirrors socket events so LAN sessions stay visible

### Refactoring [2025-11-19]
- ✅ **Phase 1**: Split `zombie-game.html` into `css/style.css` and `js/game.js`
- ✅ **Phase 2**: Modularized `js/game.js` into ES6 modules:
  - Core: constants, canvas, gameState
  - Entities: Bullet, Zombie (all variants), Particle, Pickup, Grenade, Shell
  - Systems: Audio, Graphics, Particle, Settings
  - UI: GameHUD, SettingsPanel
  - Utils: combatUtils, gameUtils
  - Main: Entry point with game loop
- Updated all documentation to reflect new structure
- Logic remains identical, just organized for maintainability

### HUD Implementation
- Created modular `GameHUD` class component
- Renders directly on canvas (not DOM)
- Top-left positioning for non-intrusive overlay
- Dynamic color changes (health warning, ammo empty warning)
- Glow effects match game aesthetic

### Ammo System Status
- ✅ Fully implemented
- Weapon-specific ammo (Pistol: 10, Shotgun: 5, Rifle: 30)
- Ammo consumption on each shot
- Manual reload with R key
- Auto-reload when empty
- 1 second reload time for all weapons
- Reload timer runs in game update loop (completes automatically)
- Displayed in in-game HUD with weapon name

### Damage Indicator
- Red flash overlay on damage
- Intensity-based fade-out
- Decay rate: 0.95 per frame
- Triggered on player-zombie collision

### Screen Shake
- ✅ Implemented
- Intensity: 3 (shoot), 8 (damage)
- Decay rate: 0.9 per frame
- Applied via canvas transform

### Visual Effects
- Particle system for kill/damage effects
- Zombie aura (pulsing green glow)
- Zombie eyes (animated red glow)
- Player glow (blue aura)
- Gradient backgrounds and vignette

### Technical Notes
- Canvas size: Dynamic (fills window)
- Render scale: 0.75 (performance optimization)
- Game loop: requestAnimationFrame
- Collision: Circle-based distance calculation
- Zombies spawn from edges
- Wave progression: +2 zombies per wave, speed/health scale
- Zombie type spawning: Fast (Wave 3+, 15%), Exploding (Wave 5+, 10%), Armored (Wave 3+, scaling)
- Particles: Supports both Particle class and custom objects (blood)
- Reload system: Uses Date.now() for accurate timing
- Mouse firing: Continuous check in update loop while mouse.isDown
- Explosion handling: Zombie removed from array before explosion to avoid iteration issues
- ES6 Modules: Native module system, no bundler required

### UI Systems
- In-game HUD: On canvas (GameHUD component)
- Settings Panel: On canvas (SettingsPanel component)
- Main Menu: On canvas (GameHUD component)
- Game Over: On canvas (GameHUD component)
- All UI rendered directly on canvas for consistency

### Color Scheme
- Health: Red (#ff1744, brightens to #ff0000 when low)
- Ammo: Orange (#ff9800, darkens to #ff5722 when empty)
- Kills: Green (#76ff03)
- Wave: Yellow (#ffc107)
- Zombies: Green tones with red eyes
- Player: Blue tones

### Weapon System
- ✅ Fully implemented
- 3 weapons: Pistol, Shotgun, Rifle
- Unique damage, fire rate, ammo for each
- Shotgun fires 5 spread bullets
- Weapon switching with 1/2/3 keys (customizable)
- Weapon-specific reload times (all 1 second)

### Audio System
- ✅ Fully implemented
- Web Audio API generated sounds (no external files)
- Gunshot, damage, footsteps, restart sounds
- Menu music: "Shadows of the Wasteland.mp3" (HTMLAudioElement)
- Music loops on main menu, stops when game starts
- All programmatically generated sounds
- Initializes on first user interaction
- Master volume control via SettingsPanel
- Music connected to Web Audio API gain node for volume control

### Input System
- **Keyboard/Mouse**:
  - WASD/Arrow keys: Movement (customizable)
  - Mouse: Aiming
  - Click/Hold: Shoot (continuous firing)
  - 1/2/3: Weapon switching (customizable)
  - R: Reload (or restart when paused/game over) (customizable)
  - ESC: Pause/Resume
  - G: Grenade (customizable)
  - V: Melee (customizable)
- **Controller (Xbox/HTML5 Gamepad)**:
  - Left Stick: Movement (analog)
  - Right Stick: Aiming (analog, controls character direction)
  - RT: Fire (continuous)
  - RB: Grenade
  - X: Reload
  - Y: Next Weapon
  - LB: Previous Weapon
  - R3: Melee
  - L3: Sprint
  - Start: Pause
  - Automatic input source detection
  - Virtual crosshair follows right stick direction

### Controls & Keybinds System
- ✅ Added Keybinds UI in Settings
- Remappable controls for movement, weapons, reload, etc.
- Persistent settings via localStorage
- Clean "Main" vs "Controls" view in Settings Panel
- Prevents binding Escape key
- Displays proper key names
- Real-time volume control

### Wave Break System
- ✅ Implemented
- 3-second pause between waves
- Visual countdown and "Wave Cleared" text
- Allows reloading and mental break

### Zombie Types
- ✅ **Normal Zombie**: Default enemy, green tones with red eyes
- ✅ **Armored Zombie**: Slower (0.75x speed), heavily armored, absorbs damage before health
- ✅ **Fast Zombie**: Faster (1.6x speed), weaker (60% health), smaller hitbox, reddish/orange visuals
- ✅ **Exploding Zombie**: Explodes on death, AOE damage (60 radius, 30 damage), can hurt player
- ✅ **Ghost Zombie**: Semi-transparent (50% opacity), faster (1.3x speed), spectral blue/white, wobble effect, Wave 4+

### Explosion System
- ✅ Reusable `triggerExplosion(x, y, radius, damage, sourceIsPlayer)` function
- Handles visual effects, audio, screen shake, AOE damage to zombies
- Player damage support (50% damage when sourceIsPlayer = false)
- Used by grenades and exploding zombies

### Pickup System
- ✅ **Health Pickup**: Red cross icon, restores health
- ✅ **Ammo Pickup**: Yellow/orange bullet icon, restores ammo and grenades
- ✅ **Damage Pickup**: Purple "2x" icon, doubles damage for 10 seconds
- ✅ **Nuke Pickup**: Yellow/black radiation symbol, instantly kills all zombies
- Powerup spawn logic: Checks every 30 seconds, 50% chance, then 80% damage / 20% nuke

### Kill Streak System
- ✅ Tracks consecutive kills within 1.5 second window
- ✅ Resets if time between kills exceeds threshold
- ✅ Visual feedback: Floating combo text for streaks 3+
- ✅ Special messages: "RAMPAGE!" at 5 kills, "UNSTOPPABLE!" at 10+

### Known Areas for Enhancement
- Boss waves
- Score multiplier (partially implemented via kill streaks)

### Code Quality Notes
- ✅ **Modular ES6 Architecture**: Clean separation of concerns
- ✅ **Centralized State**: Single `gameState` object prevents globals
- ✅ **No Circular Dependencies**: Careful import structure
- Clean separation of classes
- Consistent naming conventions
- Comments for clarity
- No external dependencies (pure vanilla JS + ES6 modules)
