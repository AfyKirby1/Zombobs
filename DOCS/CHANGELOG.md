# Changelog

All notable changes to the Zombie Survival Game project will be documented in this file.

## [Unreleased]

### Added
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
  - `js/systems/` - Game systems (Audio, Graphics, Particle, Settings)
  - `js/ui/` - User interface components (GameHUD, SettingsPanel)
  - `js/utils/` - Utility functions (combat, game utilities)
  - `js/main.js` - Main game loop and initialization
  - Updated HTML to use ES6 modules (`type="module"`)

### Added
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
- Player movement (WASD / Arrow keys)
- Mouse aiming
- Click or hold to shoot (continuous firing)
- Bullet physics with weapon-specific damage
- Zombie AI (tracks and chases player)
- Multiple zombie types: Normal, Fast, Exploding, Armored
- Collision detection (player-zombie, bullet-zombie)
- Wave-based spawning with type variety
- Progressive difficulty scaling
- Weapon switching (1/2/3 keys)
- Manual reloading (R key)
- Explosion system (grenades and exploding zombies)

### Visual Effects
- Screen shake on shoot and damage
- Muzzle flash with spark particles
- Blood splatter particles (directional, color-varied)
- Particle effects for zombie kills and player damage
- Damage indicator (red flash on hit)
- Glowing zombie eyes and aura
- Gradient backgrounds and vignette effects
- Player shadow and glow effects

### UI Systems
- In-game HUD component on canvas (Health, Weapon/Ammo, Kills, Wave, High Score)
- Pause menu integrated in HUD
- Game Over screen integrated in HUD
- Restart functionality (R key when paused or game over)
- Instructions displayed at bottom of canvas

### Game State
- Health system (player takes damage from zombies)
- Score tracking (kills)
- High score persistence (localStorage)
- Wave progression
- Zombie spawning system
- Weapon state (current weapon, ammo, reload status)
- Game over condition
- Pause state
