# Zombobs - Zombie Survival Game Project Context

## Project Overview
Zombobs is a fast-paced, 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. The game features wave-based gameplay where the player must survive as long as possible by shooting zombies that spawn from the edges of the screen. The project emphasizes performance and visual polish with features like screen shake, particle effects, damage indicators, and audio generated via the Web Audio API.

## Technology Stack
- **Frontend Core**: 100% Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API (2D Context)
- **Audio**: Web Audio API (Oscillators & Gain Nodes)
- **Styling**: CSS3 for UI overlays and game styling
- **Fonts**: Google Fonts (Creepster, Roboto Mono)
- **Backend Server** (Optional): Node.js + Express + socket.io for multiplayer
- **Client Dependencies**: **ZERO external runtime dependencies.** None. Nada.

## Project Structure
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
│   │   ├── Zombie.js             # Zombie classes (Normal, Fast, Exploding, Armored, Ghost)
│   │   ├── Particle.js           # Particle and damage number classes
│   │   ├── Pickup.js             # Health, ammo, damage, and nuke pickup classes
│   │   ├── Grenade.js            # Grenade class
│   │   └── Shell.js              # Shell casing class
│   ├── systems/
│   │   ├── AudioSystem.js        # Web Audio API sound generation
│   │   ├── GraphicsSystem.js     # Graphics utilities (ground texture loading)
│   │   ├── ParticleSystem.js     # Particle effects and blood splatter
│   │   ├── SettingsManager.js    # Settings persistence and management
│   │   └── InputSystem.js        # Gamepad input handling (HTML5 Gamepad API)
│   ├── ui/
│   │   ├── GameHUD.js            # In-game HUD component
│   │   └── SettingsPanel.js      # Settings UI panel
│   └── utils/
│       ├── combatUtils.js        # Combat functions (shooting, explosions, collisions)
│       └── gameUtils.js          # General game utilities
├── server/
│   ├── server.js                 # Express + socket.io server
│   └── package.json              # Node.js dependencies
├── sample_assets/
│   └── tiles/
│       ├── bloody_dark_floor.png # Ground texture tile
│       └── bloody_hospital_tile.png # Alternative texture
├── DOCS/
│   ├── roadmap.md                # Feature roadmap
│   ├── CHANGELOG.md              # Version history
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── SUMMARY.md                # Project summary
│   ├── SCRATCHPAD.md             # Development notes
│   ├── STYLE_GUIDE.md            # Design system documentation
│   ├── SBOM.md                   # Software Bill of Materials
│   ├── REFACTOR_PLAN.md          # Refactoring strategy
│   └── ...                       # Other docs
└── README.md                     # Project documentation
```

## Core Features Implemented
- **Wave-based zombie spawning**: Zombies spawn from map edges with increasing difficulty
- **Smooth controls**: WASD for movement, mouse for aiming, continuous firing when holding mouse
- **Visual polish**: Screen shake, particle effects, damage indicators, muzzle flash, blood splatter, bullet trails
- **Weapon system**: 3 weapons (Pistol, Shotgun, Rifle) with unique stats
- **Ammo system**: Limited ammo per weapon with reloading functionality
- **In-game HUD**: Health, ammo, kills, wave, and high score display
- **Audio system**: Generated sound effects (gunshots, damage, footsteps, restart)
- **Pause/resume functionality**: ESC to pause, R to restart
- **High score tracking**: Saved in localStorage
- **Dynamic zombie AI**: Zombies chase player and get progressively harder
- **Multiplayer Lobby**: Canvas-driven lobby tied to socket.io backend with PowerShell launcher
- **Local Co-op**: 2-player shared screen gameplay with dynamic split-screen HUD
- **Power-ups**: Double damage buff and nuke pickup system
- **Kill Streak System**: Combo tracking with visual feedback
- **Controller Support**: Full Xbox controller support with analog movement and aiming

## Game Mechanics
- **Health System**: Player starts with 100 HP, loses health when touched by zombies
- **Scoring**: 10 points per zombie kill, with kill streak bonuses
- **Difficulty Scaling**: Zombies get faster and tougher each wave, with special types appearing at higher waves
- **Weapon Switching**: Press 1/2/3 to switch between weapons or use controller buttons
- **Reload System**: Press R to reload manually, or auto-reload when ammo is depleted
- **Melee Attack**: Right-click or controller button to perform melee attacks
- **Wave Break System**: 3s pause between waves with UI notification
- **Pickup System**: Health and ammo pickups spawn randomly when needed

## Building and Running

### Option A · Instant Arcade (Single Player)
1. Open `zombie-game.html` in Chrome / Edge / Firefox
2. Blast zombies until the sun comes up

### Option B · Multiplayer Lobby (New!)
1. Install [Node.js](https://nodejs.org/) if you don't already have it
2. Double-click `launch.bat`
    ```powershell
    # launch.bat
    powershell.exe -ExecutionPolicy Bypass -File ".\launch.ps1"
    ```
    The PowerShell wrapper:
    - Checks for Node.js
    - Installs dependencies on first run
    - Launches the Express + socket.io server
    - Prints live connection logs with color-coded badges
3. Visit `http://localhost:3000/zombie-game.html`
4. Click **Multiplayer** → hang out in the neon lobby → hit **Start Game** when your squad is ready

### Option C · Local Co-op (2-Player)
1. Open `zombie-game.html` in Chrome / Edge / Firefox
2. On main menu, click "Local Co-op"
3. Player 2 can join using keyboard (Enter/Backspace) or gamepad (A/Back)
4. Blast zombies together until the sun comes up

## Core Classes
- **Bullet**: Projectile physics and rendering with visual trails and weapon-specific damage
- **Zombie**: Enemy AI, pathfinding, and detailed visual rendering (5 variants: Normal, Fast, Exploding, Armored, Ghost)
- **Player**: Supports multiple player instances (P1/P2) with independent input and state
- **Particle**: Visual effects system supporting custom blood particle objects
- **Pickup**: Power-up system (Health, Ammo, Damage Buff, Nuke)
- **GameHUD**: In-game overlay component with pause menu, game over screens, and buff indicators

## Current Game Systems
- **Input Handler**: Keyboard, mouse, and gamepad input with continuous firing support
  - Automatic input source detection (mouse/keyboard vs gamepad)
  - Multi-gamepad support for local co-op
  - Controller support with analog sticks for movement and aiming
  - Virtual crosshair for controller aiming
- **Weapon System**: 3 weapons with unique stats, switching, reloading
- **Ammo System**: Limited bullets, manual/auto reload, weapon-specific ammo
- **Audio System**: Web Audio API sound generation
- **Collision Detection**: Circle-based collision system
- **Wave Manager**: Spawning and progression system with special zombie types
- **Screen Shake**: Visual impact feedback
- **Damage Indicator**: Visual feedback when player takes damage
- **Blood Splatter**: Directional particle effects
- **Pause System**: ESC to pause/resume, game state management
- **Power-up System**: Temporary buffs (double damage) and instant effects (nuke)
- **Kill Streak System**: Combo tracking with visual feedback for rapid kills

## Development Conventions
- The project follows modular ES6 architecture for better maintainability
- Game state is centralized in a single gameState object to prevent synchronization issues
- Components are built to be reusable (GameHUD, SettingsPanel)
- Clear separation of update logic and rendering in the game loop
- Performance considerations with efficient array filtering and canvas optimizations
- All sound effects are generated programmatically using the Web Audio API
- Keyboard controls are customizable through the settings system
- Gamepad controls follow standard Xbox controller mapping conventions

## Planned Features (Roadmap)
- **Boss Waves**: Giant mutations every 5 rounds.
- **Power-ups**: Temporary buffs like Quad Damage and Speed Boost.
- **New Enemies**: Spitters and Exploders.
- **Base Building**: Simple barricades to hold the line.
- **More weapons**: Additional weapon types with unique mechanics
- **More zombie types**: Additional enemy variants with special abilities

## Key Code Sections
- Main game loop: `js/main.js`
- HUD component: `js/ui/GameHUD.js`
- Bullet class: `js/entities/Bullet.js`
- Zombie classes: `js/entities/Zombie.js`
- Particle class: `js/entities/Particle.js`
- Weapon definitions: `js/core/constants.js`
- Shooting logic: `js/utils/combatUtils.js`
- Settings management: `js/systems/SettingsManager.js`

## Audio Implementation
All sound effects are generated programmatically using the Web Audio API:
- Gunshot: Sharp crack with low-frequency boom
- Damage: Low-frequency grunt sound (175Hz)
- Footsteps: Impact thud with bass (every 350ms while moving)
- Explosion: Low rumble with high crack (400ms duration)
- Restart: Rising tone (200-800Hz)

## Visual Effects
- Screen shake on shooting and taking damage
- Muzzle flash with spark particles
- Blood splatter particles with directional spread
- Particle effects for zombie kills and player damage
- Glowing zombie eyes with animation
- Gradient backgrounds and vignette effects
- Player shadow and glow effects
- Bullet trails for improved visual feedback
- Dynamic blood splatter effects on main menu
- Creepy animated main menu background (pulsing red, scanlines, noise)