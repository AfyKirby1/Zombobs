# Changelog

All notable changes to the Zombie Survival Game project will be documented in this file.

## [0.2.2] - 2025-11-19

### Added
- **Menu Music** - Background music for main menu
  - "Shadows of the Wasteland.mp3" plays on main menu
  - Loops continuously while in menu
  - Automatically stops when game starts
  - Resumes when returning to menu
  - Connected to master volume control system
  - Browser autoplay-friendly (starts on first user interaction)

- **Main Menu UI Enhancements**
  - Added music tip text: "🎵 Click anywhere to enable audio"
  - Enhanced visibility with red glow shadow effect
  - Improved button positioning to prevent overlap with username hover text
  - Creepy background effects (pulsing red gradient, scanlines, static noise, vignette)

- **Itch.io Publishing Guide**
  - Created `DOCS/ITCH_IO_GUIDE.md` with step-by-step instructions
  - Documented build preparation process
  - Noted multiplayer server limitations for web hosting

### Changed
- **Main Menu Layout** - Improved spacing and positioning
  - Moved buttons down to accommodate username hover text
  - Adjusted music tip positioning and styling for better visibility
  - Enhanced background with atmospheric effects

- **Audio System** - Extended with music support
  - Added `playMenuMusic()` and `stopMenuMusic()` functions
  - HTMLAudioElement integration with Web Audio API for volume control
  - Graceful fallback if audio context unavailable

## [0.2.2] - 2025-11-19

### Added
- **Local Co-op Mode** - Full 2-player implementation
  - **Shared Screen Gameplay**: Two players can play simultaneously on the same screen.
  - **Input Handling**: 
    - Player 1: Mouse & Keyboard (WASD) OR Gamepad 1.
    - Player 2: Keyboard (Arrows + Enter) OR Gamepad 2.
    - Smart controller assignment: Locks controller to player once assigned.
  - **Co-op Lobby**: Dedicated lobby screen for P2 to join by pressing Start/A/Enter.
  - **Dynamic HUD**: 
    - Split-screen HUD layout (P1 stats on left, P2 stats on right).
    - Shared game stats (Wave, Kills, Remaining) centered at top.
  - **Player Colors**: 
    - Player 1 is Blue (default).
    - Player 2 is Red (default).
    - System supports 5 colors (Blue, Red, Green, Orange, Purple).
  - **Mechanics**:
    - Zombies target closest living player.
    - Shared camera view (clamped to screen bounds).
    - Both players must die for Game Over.

- **Main Menu Effects** - Horror atmosphere enhancements
  - **Creepy Background**: 
    - Pulsing dark red gradient center.
    - animated scanlines overlay.
    - Dynamic static noise/grain effect.
    - Heavy vignette.
  - **Blood Splatter System**: 
    - Random blood splatters appear and fade on the menu background.
    - Organic shape generation with main blot and droplets.
    - Layered behind text/ui but over background for depth.

### Changed
- **HUD System** - Refactored for multi-player support
  - `drawPlayerStats()` helper method created to render individual player UI.
  - `drawSharedStats()` helper method for common game info.
  - Updated Game Over and Pause screens to handle co-op state.
- **Game State** - Core refactoring
  - Converted `player` object to `players` array to support N players.
  - Added compatibility getters to ensure single-player code remains functional.
  - Added `color` property to player objects for visual distinction.

## [0.2.1] - 2025-01-XX

### Added
- **Bullet Trails** - Visual polish enhancement
  - Bullets now render a fading trail behind them based on velocity
  - Improves visual feedback for bullet direction and speed
  - Trail fades smoothly using semi-transparent yellow/orange gradient

- **Ghost Zombie** - New enemy variant
  - Semi-transparent spectral zombie (50% opacity)
  - Moves 1.3x faster than normal zombies
  - Pale blue/white spectral appearance with ethereal glow
  - Wobble animation effect for ghostly movement
  - Spawns from Wave 4+ with ~10% chance
  - Slightly weaker health (80% of normal)

- **Double Damage Pickup** - Temporary power-up
  - Purple pickup with "2x" icon
  - Doubles weapon damage for 10 seconds
  - Visual indicator in HUD showing remaining time
  - Rare spawn (every 30 seconds, 50% chance, 80% of powerup spawns)
  - Purple particle effects on collection

- **Nuke Pickup** - Rare instant clear power-up
  - Yellow/black hazard-styled pickup with radiation symbol
  - Instantly kills all active zombies when collected
  - Massive screen shake (30 units) and explosion effects
  - Very rare spawn (every 30 seconds, 50% chance, 20% of powerup spawns)
  - "TACTICAL NUKE!" floating text notification

- **Kill Streak System** - Combo tracking and feedback
  - Tracks consecutive kills within 1.5 second window
  - Displays floating combo text for streaks of 3+
  - Combo messages: "3 HIT COMBO!", "5 KILL RAMPAGE!", "UNSTOPPABLE!" (10+)
  - Resets streak if more than 1.5 seconds pass between kills
  - Visual feedback encourages aggressive playstyle

### Changed
- **Pickup System** - Expanded pickup variety
  - Added `damagePickups` and `nukePickups` arrays to game state
  - Powerup spawning logic checks every 30 seconds
  - Damage multiplier system integrated into bullet damage calculation

- **Zombie Spawning** - Updated spawn logic
  - Ghost zombies added to spawn pool (Wave 4+, ~10% chance)
  - Adjusted spawn probability distribution for all zombie types

- **Combat System** - Enhanced damage calculation
  - Bullet damage now applies damage multiplier from buffs
  - Kill streak tracking integrated into collision handling
  - Nuke pickup triggers mass zombie elimination

- **HUD** - Added buff display
  - Shows active damage buff with remaining time
  - Purple color scheme matches pickup aesthetic

## [0.2.0] - 2025-11-19

### Changed
- **Landing Page UI** - Major cleanup and layout fixes.
  - Fixed a critical layout bug caused by conflicting external CSS (`display: flex` on body), restoring standard block flow.
  - **Hidden Game Container**: The game canvas is now hidden by default and only reveals when "Play in Browser" is clicked, reducing visual clutter.
  - **Compacted Design**: Further reduced padding, font sizes, and card dimensions to fit more content on screen.
  - **Footer**: Ensured the "Made with..." footer is correctly positioned at the bottom of the page.
  - Removed redundant "Play Zombobs" header and buttons from the game section.
- **Graphics System** - Ground pattern improvements
  - Renamed `initGrassPattern()` to `initGroundPattern()` for better clarity
  - Increased ground pattern opacity from 0.4 to 0.6 for better visibility
  - Ground pattern now uses tile assets from `sample_assets/tiles/`

### Added
- **Controller Support (Beta)**
  - Full Xbox controller support (and other HTML5 compatible gamepads).
  - **Movement**: Left Stick to move (analog).
  - **Aiming**: Right Stick to aim (character direction now properly follows stick input).
  - **Actions**: 
    - RT: Fire (Continuous)
    - RB: Grenade
    - X: Reload
    - Y: Next Weapon
    - LB: Previous Weapon
    - R3: Melee
    - L3: Sprint
    - Start: Pause
  - Hot-plug support (detects controller connection/disconnection).
  - **Settings UI**: Added specific Controller settings tab with rebind support.
  - **Input Source Detection**: Automatically switches between mouse/keyboard and gamepad based on active input
  - **Virtual Crosshair**: When using controller, crosshair follows right stick aim direction instead of being locked to mouse cursor
- **Main Menu** - Local Co-op button
  - Added "Local Co-op" button to main menu (placeholder for future implementation)
  - Positioned between Single Player and Settings buttons

- **Multiplayer Lobby & Socket Sync**
  - Clickable Multiplayer button now opens an in-canvas lobby (status pulses, player list, ready/back controls)
  - Clients register usernames and receive live `lobby:update` payloads over socket.io
  - Lobby blocks gameplay rendering until a run starts, preserving FPS
- **Server Visibility Enhancements**
  - PowerShell launcher relays colorized join/leave logs directly from `server.js`
  - Express/socket.io server now tracks players, broadcasts lobby roster, and prints concise connection summaries
- **Readme Glow-Up**
  - Added Quick Start paths, multiplayer instructions, and tooling table to highlight `launch.bat` / `launch.ps1`

- **Multiplayer Backend Server** - Node.js server with Express and socket.io
  - Server folder with Express for static file serving
  - Socket.io WebSocket server ready for multiplayer implementation
  - Styled PowerShell launcher script (`launch.ps1`) with colored output
  - Windows batch launcher (`launch.bat`) that calls PowerShell wrapper
  - Automatic dependency installation on first launch
  - Server runs on port 3000 (configurable via PORT env var)
  - Server serves all game files (index.html, zombie-game.html, assets, css, js)
  - Socket.io connection handling ready for multiplayer events

### Refactoring
- **Code Separation** - Split monolithic `zombie-game.html` into `css/style.css` and `js/game.js` to improve maintainability and development workflow.
- **Modular Architecture** - Refactored `js/game.js` (~3,700 lines) into ES6 modules:
  - `js/core/` - Core game state, constants, and canvas management
  - `js/entities/` - Game entities (Bullet, Zombie, Particle, Pickup, Grenade, Shell)
  - `js/systems/` - Game systems (Audio, Graphics, Particle, Settings, Input)
  - `js/ui/` - User interface components (GameHUD, SettingsPanel)
  - `js/utils/` - Utility functions (combat, game utilities)
  - `js/main.js` - Main game loop and initialization
  - Updated HTML to use ES6 modules (`type="module"`)

### Added (Gameplay)
- **Zombie Slow-on-Hit** - Bullets now briefly slow zombies (30% slow for 0.5s) to add a crowd-control element to gameplay.

- **Special Zombie Types** - Multiple zombie variants with unique behaviors
  - **Fast Zombie (The Runner)**: 1.6x speed, 60% health, smaller hitbox, reddish/orange visuals with speed trail particles
  - **Exploding Zombie (The Boomer)**: Explodes on death dealing AOE damage (60 radius, 30 damage), orange/yellow pulsing glow, can damage player
  - **Armored Zombie (The Tank)**: Slower but heavily armored, absorbs most damage before health is affected
  - Wave-based spawning: Fast zombies appear at Wave 3+ (~15% chance), Exploding zombies at Wave 5+ (~10% chance), Armored zombies at Wave 3+ (scaling chance)
  - Refactored explosion system into reusable `triggerExplosion()` function

- **Controls & Keybinds System**
  - Remappable keybinds in Settings menu
  - Persistent control settings (saved to localStorage)
  - Custom UI for rebinding keys
  - Separate "Main" and "Controls" views in Settings

- **Wave Break System**
  - 3-second pause between waves
  - "Wave Cleared!" notification with countdown
  - Gives player time to reload and prepare

- **In-Game HUD Component** - Modular HUD system that renders stats directly on the canvas
  - Health display with dynamic color (bright red when low)
  - Weapon name and ammo counter
  - Kills tracker
  - Wave indicator
  - High score display
  - All stats have colored borders, glow effects, and icons
  - Positioned in top-left corner, not affected by screen shake
  - Built-in pause menu and game over screens
  
- **Weapon System** - Multiple weapons with unique characteristics
  - **Pistol**: 10 ammo, 1 damage, 400ms fire rate
  - **Shotgun**: 5 ammo, 3 damage, 800ms fire rate, fires 5 spread bullets
  - **Rifle**: 30 ammo, 2 damage, 200ms fire rate
  - Weapon switching with 1/2/3 keys
  - Weapon-specific ammo counts and reload times

- **Ammo System** - Complete ammo management
  - Limited bullets per weapon
  - Ammo consumption on each shot
  - Manual reload with R key
  - Auto-reload when ammo depleted
  - 1 second reload time for all weapons
  - Reload timer runs independently in game loop
  - "Reloading..." status display in HUD

- **Continuous Firing** - Hold mouse button to fire automatically
  - Mouse button held = continuous fire
  - Respects weapon fire rate cooldowns
  - Works with ammo and reload systems
  - Stops firing when mouse leaves canvas

- **Blood Splatter System** - Directional blood effects
  - Blood particles on zombie hit (5 particles)
  - Enhanced blood splatter on zombie kill (12 particles + 3 ground patches)
  - Directional spread based on bullet impact angle
  - Multiple blood color variations (dark reds to bright reds)
  - Custom particle system handles blood objects

- **Audio System** - Web Audio API generated sounds
  - **Gunshot sound**: Sharp crack with low-frequency boom
  - **Damage sound**: Low-frequency grunt/hurt sound (175Hz)
  - **Footstep sound**: Impact thud with bass (every 350ms while moving)
  - **Restart sound**: Rising tone (200-800Hz) for game restart
  - All sounds programmatically generated (no external files)

- **Damage Indicator System**
  - Red screen flash when player takes damage
  - Intensity decay for smooth fade-out effect
  - Integrated with zombie collision system

### Implemented
- **Screen Shake** - Camera shake on shooting and taking damage for visual impact
- **Muzzle Flash** - Visual effect when player shoots (bright white/yellow flash with spark particles)
- **Blood Splatter** - Particle effects when zombies are hit/killed
- **Pause Menu** - ESC key to pause/resume, R key to restart from pause
- **Game Over Screen** - Displayed in HUD component with final stats and restart option

## Game Features (Working)

### Core Mechanics
- Player movement (WASD / Arrow keys or Left Stick on controller)
- Mouse aiming or Right Stick aiming (controller)
- Click or hold to shoot (continuous firing)
- Bullet physics with weapon-specific damage (with visual trails)
- Zombie AI (tracks and chases player)
- Multiple zombie types: Normal, Fast, Exploding, Armored, Ghost
- Collision detection (player-zombie, bullet-zombie)
- Wave-based spawning with type variety
- Progressive difficulty scaling
- Weapon switching (1/2/3 keys or LB/Y buttons on controller)
- Manual reloading (R key or X button on controller)
- Explosion system (grenades and exploding zombies)
- Power-up system (damage buff, nuke)
- Kill streak tracking with combo notifications
- Controller support with automatic input source detection

### Visual Effects
- Screen shake on shoot, damage, explosions, and nuke
- Muzzle flash with spark particles
- Bullet trails (fading velocity-based trails)
- Blood splatter particles (directional, color-varied)
- Particle effects for zombie kills and player damage
- Damage indicator (red flash on hit)
- Glowing zombie eyes and aura
- Gradient backgrounds and vignette effects
- Player shadow and glow effects
- Combo text notifications (floating kill streak messages)

### UI Systems
- In-game HUD component on canvas (Health, Weapon/Ammo, Kills, Wave, High Score)
- Buff indicators (damage multiplier with countdown timer)
- Pause menu integrated in HUD
- Game Over screen integrated in HUD
- Restart functionality (R key when paused or game over)
- Instructions displayed at bottom of canvas
- Main menu with Single Player, Local Co-op (placeholder), Settings, and Multiplayer options
- Controller keybind settings UI with keyboard/controller toggle

### Game State
- Health system (player takes damage from zombies)
- Score tracking (kills)
- High score persistence (localStorage)
- Wave progression
- Zombie spawning system
- Weapon state (current weapon, ammo, reload status)
- Power-up state (damage multiplier, buff timers)
- Kill streak tracking (consecutive kills, timing)
- Game over condition
- Pause state
