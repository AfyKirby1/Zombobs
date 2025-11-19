# Project Summary

## Overview
A 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. Features wave-based gameplay, smooth controls, and visual effects.

## Current Status
✅ **Playable** - Core gameplay loop is functional
✅ **Visual Polish** - Screen shake, muzzle flash, blood splatter, particles, damage indicators
✅ **Audio System** - Gunshots, damage sounds, footsteps, restart sounds (Web Audio API)
✅ **Weapon System** - 3 weapons (Pistol, Shotgun, Rifle) with unique stats
✅ **Ammo System** - Limited ammo, reloading, weapon-specific ammo counts
✅ **UI Systems** - In-game HUD component with pause menu and game over screens
✅ **Multiplayer Lobby** - Canvas-driven lobby tied to socket.io backend (PowerShell launcher)
✅ **Modular Architecture** - ES6 modules with organized file structure

## Technology Stack
- **Frontend**: HTML5 Canvas, Vanilla JavaScript (ES6 Modules)
- **Styling**: CSS3 with gradients and animations
- **Fonts**: Google Fonts (Creepster, Roboto Mono)
- **Backend**: Node.js + Express + socket.io (for multiplayer)

## File Structure
```
Zombobs/
├── zombie-game.html              # Main entry point
├── index.html                    # Landing page
├── launch.bat                    # Windows launcher (calls PowerShell)
├── launch.ps1                    # Styled PowerShell server launcher
├── assets/
│   └── zombie.png                # Zombie sprite asset
├── css/
│   └── style.css                 # Game styles
├── js/
│   ├── main.js                   # Main game loop and initialization
│   ├── core/
│   │   ├── constants.js          # Game constants and configuration
│   │   ├── canvas.js             # Canvas initialization and management
│   │   └── gameState.js          # Centralized game state management
│   ├── entities/
│   │   ├── Bullet.js             # Bullet projectile class
│   │   ├── Zombie.js             # Zombie classes (Normal, Fast, Exploding, Armored)
│   │   ├── Particle.js           # Particle and damage number classes
│   │   ├── Pickup.js             # Health and ammo pickup classes
│   │   ├── Grenade.js            # Grenade class
│   │   └── Shell.js              # Shell casing class
│   ├── systems/
│   │   ├── AudioSystem.js        # Web Audio API sound generation
│   │   ├── GraphicsSystem.js     # Graphics utilities (grass pattern)
│   │   ├── ParticleSystem.js     # Particle effects and blood splatter
│   │   └── SettingsManager.js    # Settings persistence and management
│   ├── ui/
│   │   ├── GameHUD.js            # In-game HUD component
│   │   └── SettingsPanel.js      # Settings UI panel
│   └── utils/
│       ├── combatUtils.js        # Combat functions (shooting, explosions, collisions)
│       └── gameUtils.js          # General game utilities
├── server/
│   ├── server.js                 # Express + socket.io server
│   └── package.json              # Node.js dependencies
├── DOCS/
│   ├── roadmap.md                # Feature roadmap
│   ├── CHANGELOG.md              # Version history
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── SUMMARY.md                # This file
│   ├── SCRATCHPAD.md             # Development notes
│   ├── SBOM.md                   # Software Bill of Materials
│   ├── REFACTOR_PLAN.md          # Refactoring strategy
│   └── ...                       # Other docs
└── README.md                     # Project documentation
```

## Key Components

### Game Classes
- **Bullet** - Projectile physics and rendering (weapon-specific damage)
- **Zombie** - Enemy AI, pathfinding, visual design (with variants)
- **Particle** - Visual effects system (supports custom blood particles)
- **GameHUD** - In-game overlay for stats, pause menu, game over screen

### Systems
- **Input Handler** - Keyboard and mouse input (continuous firing support)
- **Weapon System** - 3 weapons with unique stats, switching, reloading
- **Ammo System** - Limited bullets, manual/auto reload, weapon-specific ammo
- **Audio System** - Web Audio API sound generation
- **Collision Detection** - Circle-based collision
- **Wave Manager** - Spawning and progression
- **Screen Shake** - Camera shake effects
- **Damage Indicator** - Visual feedback on damage
- **Blood Splatter** - Directional blood particle effects
- **Pause System** - ESC to pause/resume, game state management

### Game State
- Player position, health, angle
- Current weapon, ammo count, reload status
- Bullets array
- Zombies array
- Particles array (supports custom blood objects)
- Wave counter, score, high score (localStorage)
- Game running/paused states

## Recent Updates
- **Multiplayer Lobby**: GameHUD now renders a socket-powered lobby with live player list, start/back buttons, and connection states
- **Server Visibility**: `server.js` tracks players, broadcasts `lobby:update`, and prints rich logs surfaced by `launch.ps1`
- **Backend Server Setup**: Node.js server with Express and socket.io for multiplayer foundation
- **Server Launcher**: Styled PowerShell wrapper with automatic dependency installation
- **Modular Refactoring**: Split game into ES6 modules for better maintainability
- Implemented Wave Break System (3s pause between waves with UI notification)
- Implemented complete weapon system (3 weapons with unique stats)
- Full ammo system with reloading (R key manual reload, 1 second reload time)
- Health and Ammo pickups
- Melee attack mechanism
- Continuous mouse button firing (hold to fire automatically)
- Blood splatter system with directional particles
- Complete audio system (gunshot, damage, footsteps, restart sounds)
- Muzzle flash visual effects
- Pause menu and game over screens integrated in HUD
- High score persistence with localStorage

## Next Steps
See `roadmap.md` for planned features including:
- Boss waves
- Score multiplier (combo system)
