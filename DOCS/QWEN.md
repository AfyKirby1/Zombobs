# Zombie Survival Game - Project Context

## Project Overview
This is a 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. The game features wave-based gameplay where the player must survive as long as possible by shooting zombies that spawn from the edges of the screen. The project follows KISS (Keep It Simple Stupid), DOTI (Don't Over Think It), and YAGI (You Aren't Gonna Need It) principles for rapid prototyping.

## Technology Stack
- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Styling**: CSS3 with gradients and animations
- **Fonts**: Google Fonts (Creepster, Roboto Mono)
- **Audio**: Web Audio API for generated sound effects

## Project Structure
```
warped/
├── zombie-game.html    # Main game file (all-in-one implementation)
├── README.md           # Project documentation
├── ARCHITECTURE.md     # Technical architecture documentation
├── SUMMARY.md          # Project summary
├── roadmap.md          # Feature roadmap
├── CHANGELOG.md        # Version history
├── guns.md             # Weapon system documentation
├── SCRATCHPAD.md       # Development notes
├── base-defense-design.md  # Base defense system design
├── base-defense-implementation.md  # Base defense system implementation notes
├── sounds/             # Empty directory (intended for audio files)
└── QWEN.md             # This file (project context)
```

## Core Features Implemented
- **Wave-based zombie spawning**: Zombies spawn from map edges with increasing difficulty
- **Smooth controls**: WASD for movement, mouse for aiming, continuous firing when holding mouse
- **Visual polish**: Screen shake, particle effects, damage indicators, muzzle flash, blood splatter
- **Weapon system**: 3 weapons (Pistol, Shotgun, Rifle) with unique stats
- **Ammo system**: Limited ammo per weapon with reloading functionality
- **In-game HUD**: Health, ammo, kills, wave, and high score display
- **Audio system**: Generated sound effects (gunshots, damage, footsteps, restart)
- **Pause/resume functionality**: ESC to pause, R to restart
- **High score tracking**: Saved in localStorage
- **Dynamic zombie AI**: Zombies chase player and get progressively harder

## Game Mechanics
- **Health System**: Player starts with 100 HP, loses health when touched by zombies
- **Scoring**: 10 points per zombie kill
- **Difficulty Scaling**: Zombies get faster and tougher each wave
- **Weapon Switching**: Press 1/2/3 to switch between weapons
- **Reload System**: Press R to reload manually, or auto-reload when ammo is depleted

## Core Classes
- **Bullet**: Projectile physics and rendering with weapon-specific damage
- **Zombie**: Enemy AI, pathfinding, and detailed visual rendering
- **Particle**: Visual effects system supporting custom blood particle objects
- **GameHUD**: In-game overlay component with pause menu and game over screens

## Current Game Systems
- **Input Handler**: Keyboard and mouse input with continuous firing support
- **Collision Detection**: Circle-based collision system
- **Wave Manager**: Spawning and progression system
- **Screen Shake**: Visual impact feedback
- **Damage Indicator**: Visual feedback when player takes damage
- **Blood Splatter**: Directional particle effects
- **Audio System**: Web Audio API sound generation

## Development Principles
- KISS (Keep It Simple Stupid)
- DOTI (Don't Over Think It)
- YAGI (You Aren't Gonna Need It)

## Building and Running
Simply open `zombie-game.html` in a web browser. No build process or dependencies required.

## Development Status
The core gameplay loop is fully functional with visual polish and audio effects. The game is playable and features a complete weapon system with ammo management.

## Planned Features (Roadmap)
- Health pickups (spawn randomly on map)
- Melee attack (when out of ammo)
- Special zombie types (fast, tank, exploding)
- Base defense system with walls and repair mechanics
- Boss waves (every 5th wave)
- Wave break system (pause between waves)
- Score multiplier (combo system)

## Key Code Sections
- The entire game is implemented in `zombie-game.html`
- HUD component: Lines 210-279
- Bullet class: Lines 326-373
- Zombie class: Lines 375-425
- Particle class: Lines 427-453
- Weapon definitions: Lines 62-87
- Shooting logic: Lines 775-829
- Game loop: Lines 872-876

## Audio Implementation
All sound effects are generated programmatically using the Web Audio API:
- Gunshot: Sharp crack with low-frequency boom
- Damage: Low-frequency grunt sound (175Hz)
- Footsteps: Impact thud with bass (every 350ms while moving)
- Restart: Rising tone (200-800Hz)

## Visual Effects
- Screen shake on shooting and taking damage
- Muzzle flash with spark particles
- Blood splatter particles with directional spread
- Particle effects for zombie kills and player damage
- Glowing zombie eyes with animation
- Gradient backgrounds and vignette effects
- Player shadow and glow effects

## File Architecture
The project currently uses a single-file architecture containing HTML structure, CSS styling, and JavaScript game logic all in `zombie-game.html`. This follows KISS principles for rapid prototyping but may be refactored into separate files in the future as the project grows.