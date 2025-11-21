# Project Summary

## Overview
A 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. Features wave-based gameplay, smooth controls, and visual effects.

## Current Status
✅ **Playable** - Core gameplay loop is functional
✅ **Visual Polish** - Screen shake, muzzle flash, blood splatter, particles, damage indicators, bullet trails
✅ **Audio System** - Gunshots, damage sounds, footsteps, restart sounds, menu music (Web Audio API + HTMLAudioElement)
✅ **Weapon System** - 4 weapons (Pistol, Shotgun, Rifle, Flamethrower) with unique stats
✅ **Ammo System** - Limited ammo, reloading, weapon-specific ammo counts, persistent ammo tracking
✅ **Weapon Controls** - Keyboard switching (1/2/3/4) and scroll wheel cycling (toggleable)
✅ **Background Reload** - Weapons auto-reload when holstered long enough
✅ **Auto-Reload** - Automatic reload when ammo reaches 0
✅ **UI Systems** - In-game HUD component with pause menu and game over screens
✅ **Multiplayer Lobby** - Modern glassmorphism lobby with animated background, player cards, and enhanced UI
✅ **Leader System** - First player designated as lobby leader with game start control
✅ **Ready System** - Players can toggle ready status; all must be ready to start
✅ **Synchronized Game Start** - All players enter game simultaneously in same session
✅ **News Ticker** - Scrolling announcement bar on main menu displaying version highlights
✅ **Modular Architecture** - ES6 modules with organized file structure
✅ **System Refactoring** - Large systems extracted from main.js into dedicated modules
  - ZombieUpdateSystem: Zombie AI, multiplayer sync, interpolation (~173 lines extracted)
  - EntityRenderSystem: Entity rendering with viewport culling (~102 lines extracted)
  - PickupSpawnSystem: Pickup spawning logic (~52 lines extracted)
  - main.js reduced from ~3,230 to ~2,537 lines (21% reduction)
✅ **Power-ups** - Double damage buff and nuke pickup system
✅ **Kill Streaks** - Combo tracking with visual feedback
✅ **Enemy Variety** - 6 zombie types (Normal, Fast, Exploding, Armored, Ghost, Spitter)
✅ **Day/Night Cycle** - Dynamic time-based atmosphere with difficulty scaling
✅ **Flamethrower Weapon** - Short-range weapon with burning damage over time
✅ **Environmental Hazards** - Acid pools from Spitter Zombie attacks
✅ **Performance Optimizations** - Comprehensive rendering performance improvements (V0.5.0+)
  - RenderingCache system for intelligent gradient/pattern caching
  - Viewport culling for efficient entity rendering
  - Update culling (skip updating entities far off-screen) - 40-60% FPS win
  - Small feature culling (skip rendering entities <1px)
  - WebGPU optimizations (dirty flags, buffer management)
  - Particle system optimization with improved update loops
  - Entity loop optimization (forEach → for loops)
  - Squared distance calculations (eliminates sqrt in hot paths)
  - Off-screen indicator distance optimizations
  - 30-50% FPS improvement on Canvas 2D, 20-40% on WebGPU, 40-60% with update culling
✅ **Engine Micro-Optimizations** - 15 small performance improvements (V0.5.2)
  - Math.sqrt() elimination (26+ locations) - squared distance comparisons
  - forEach() to for loops in hot paths (5-10% faster iteration)
  - Quadtree instance reuse (reduces GC pressure)
  - Settings lookup caching (reduces repeated property access)
  - Viewport bounds caching (calculated once per frame)
  - Property caching in loops (faster iterations)
  - Early return optimizations (skips unnecessary work)
  - Math constants caching (TWO_PI)
  - Expected 5-15% additional FPS improvement on low-end hardware
✅ **Enhanced Graphics Quality System** - Quality presets affect all visual effects (V0.5.1)
  - Ultra quality preset added (50k particles, 1.25x resolution, advanced lighting)
  - Three new graphics settings: Effect Intensity, Post-Processing Quality, Particle Detail
  - Quality-scaled visual effects: zombie glows, auras, muzzle flashes, explosions, blood splatter, damage numbers
  - Quality multipliers system for consistent scaling across all effects
✅ **Multiplayer Speed Sync & Engine Optimizations** - Complete multiplayer synchronization improvements (V0.5.1)
  - Zombie speed synchronization prevents position desync from modifiers
  - Delta compression reduces network bandwidth by 50-80% for large hordes
  - Adaptive update rate (5-20Hz) based on zombie count and network latency
  - Advanced interpolation (adaptive lerp + velocity extrapolation) reduces jitter by 60-80%
  - Socket.IO binary add-ons (bufferutil, utf-8-validate) reduce CPU by 10-20%
  - Latency measurement with exponential moving average for adaptive adjustments
  - Velocity tracking for smooth movement prediction between network updates
✅ **UI Scaling System** - Complete UI scaling support (50%-150%) for accessibility (V0.5.2+)
  - Scales all UI elements: fonts, buttons, panels, spacing, padding
  - Applied to both in-game HUD and settings menu
  - All fonts now properly scale (buttons, menus, lobbies, about screen) - V0.5.3 fix
  - Settings panel header/tab layout scales fluidly - V0.5.3 fix
  - UI scale preset buttons (Small 70%, Medium 100%, Large 130%) in settings
  - Real-time scaling with immediate visual feedback
  - Consistent scaling pattern: `Math.max(minSize, baseSize * scale)`
  - Dynamic viewport calculations based on scaled element heights
  - News ticker font reduced to 85% size to fit more content

## Technology Stack
- **Frontend**: HTML5 Canvas, Vanilla JavaScript (ES6 Modules)
- **Styling**: CSS3 with gradients and animations
- **Fonts**: Google Fonts (Creepster, Roboto Mono)
- **Backend**: Node.js + Express + socket.io (for multiplayer)

## File Structure
```
ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS/
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
│   │   ├── gameState.js          # Centralized game state management
│   ├── companions/
│   │   └── CompanionSystem.js   # AI NPC companion behavior and lifecycle
│   ├── entities/
│   │   ├── Bullet.js             # Bullet and FlameBullet projectile classes
│   │   ├── Zombie.js             # Zombie classes (Normal, Fast, Exploding, Armored, Ghost, Spitter)
│   │   ├── Particle.js           # Particle and damage number classes
│   │   ├── Pickup.js             # Health, ammo, damage, and nuke pickup classes
│   │   ├── Grenade.js            # Grenade class
│   │   ├── Shell.js              # Shell casing class
│   │   ├── AcidProjectile.js    # Acid projectile from Spitter Zombie
│   │   └── AcidPool.js          # Acid pool ground hazard
│   ├── systems/
│   │   ├── AudioSystem.js        # Web Audio API sound generation
│   │   ├── GraphicsSystem.js     # Graphics utilities (ground texture loading)
│   │   ├── ParticleSystem.js     # Particle effects and blood splatter
│   │   ├── SettingsManager.js    # Settings persistence and management
│   │   ├── InputSystem.js        # Gamepad input handling (HTML5 Gamepad API)
│   │   ├── ZombieUpdateSystem.js # Zombie AI updates and multiplayer sync
│   │   ├── EntityRenderSystem.js # Entity rendering with viewport culling
│   │   └── PickupSpawnSystem.js  # Pickup spawning logic
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
│   ├── SUMMARY.md                # This file
│   ├── SCRATCHPAD.md             # Development notes
│   ├── STYLE_GUIDE.md            # Design system documentation
│   ├── SBOM.md                   # Software Bill of Materials
│   ├── REFACTOR_PLAN.md          # Refactoring strategy
│   └── ...                       # Other docs
└── README.md                     # Project documentation
```

## Key Components

### Game Classes
- **Bullet** - Projectile physics and rendering (weapon-specific damage, visual trails)
- **FlameBullet** - Short-range flame projectile with burn effect
- **Zombie** - Enemy AI, pathfinding, visual design (6 variants: Normal, Fast, Exploding, Armored, Ghost, Spitter)
- **Player** - Supports multiple player instances (P1/P2) with independent input and state
- **Particle** - Visual effects system (supports custom blood particles)
- **Pickup** - Power-up system (Health, Ammo, Damage Buff, Nuke)
- **AcidProjectile** - Acid glob projectile from Spitter Zombie
- **AcidPool** - Ground hazard that damages players over time
- **GameHUD** - In-game overlay for stats, pause menu, game over screen, buff indicators, co-op split layout

### Systems
- **Input Handler** - Keyboard, mouse, and gamepad input (continuous firing support)
  - Automatic input source detection (mouse/keyboard vs gamepad)
  - Multi-gamepad support for local co-op
  - Controller support with analog sticks for movement and aiming
  - Virtual crosshair for controller aiming
- **Weapon System** - 4 weapons with unique stats (Pistol, Shotgun, Rifle, Flamethrower), switching, reloading
- **Ammo System** - Limited bullets, manual/auto reload, weapon-specific ammo
- **Day/Night Cycle** - Dynamic time-based atmosphere with visual overlay and difficulty scaling
- **Audio System** - Web Audio API sound generation
- **Collision Detection** - Circle-based collision
- **Wave Manager** - Spawning and progression
- **Screen Shake** - Camera shake effects
- **Damage Indicator** - Visual feedback on damage
- **Blood Splatter** - Directional blood particle effects
- **Pause System** - ESC to pause/resume, game state management
- **Power-up System** - Temporary buffs (double damage) and instant effects (nuke)
- **Kill Streak System** - Combo tracking with visual feedback for rapid kills

### Game State
- Player position, health, angle
- Current weapon, ammo count, reload status
- Bullets array (including flame bullets)
- Zombies array (with burning state)
- Particles array (supports custom blood objects)
- Acid projectiles and acid pools arrays
- Pickups arrays (health, ammo, damage, nuke)
- Wave counter, score, high score (localStorage)
- Day/night cycle state (gameTime, isNight)
- Damage multiplier and buff timers
- Kill streak counter and timing
- Game running/paused states

## Recent Updates (V0.5.3)
- **Main Menu UI Adjustments**: Improved proportions and layout
  - Reduced button sizes (180×36px scaled, down from 200×40px)
  - Widened news ticker (650px, up from 480px)
  - Moved high score text up (80px from bottom, up from 40px)
- **UI Font Scaling Fixes**: Comprehensive fix for all hardcoded fonts
  - All button fonts now scale properly (18px base, min 12px)
  - All main menu fonts scale (title, subtitle, music tip, high score, speaker icon)
  - All AI lobby and about screen fonts scale properly
  - Consistent scaling across entire UI (50%-150% range)
- **UI Scale Control Enhancements**: Added preset buttons in settings
  - Small (70%), Medium (100%), Large (130%) quick presets
  - Preset buttons highlight when active
- **Settings Panel Layout Improvements**: Fixed header intersection and improved scaling
  - Header title and divider now scale with UI scale
  - Increased spacing between header and tabs to prevent intersection
  - All fonts and spacing in settings panel scale proportionally
  - Dynamic viewport calculations for proper layout at all scales
- **Multiplayer Lobby UI Redesign**: Modern glassmorphism design
  - Animated background with scanlines, noise, pulsing gradients
  - Glassmorphism player cards with avatar placeholders
  - Enhanced connection status panel with animated indicators
  - Pill-shaped buttons with pulse animations
  - Improved visual hierarchy and spacing
- **Performance**: Optimized off-screen indicator distance calculations
  - Replaced Math.sqrt() with squared distance comparisons
  - Reduces expensive sqrt operations in rendering loop

## Recent Updates (V0.5.0)
- **Performance Optimization System**: Comprehensive rendering performance improvements
  - RenderingCache system for intelligent gradient/pattern caching
  - Viewport culling for efficient entity rendering
  - WebGPU optimizations (dirty flags, buffer management)
  - Particle system optimization with improved update loops
  - 30-50% FPS improvement on Canvas 2D, 20-40% on WebGPU
- **Main Menu UI Layout Improvements**:
  - Added version text box (V0.5.0) in bottom-left corner
  - Enhanced news ticker: reduced size and positioned below UI buttons
  - Moved UI buttons up for better spacing and visual balance
  - Smaller, more compact button design (200px x 40px, down from 240px x 50px)
  - Improved overall menu layout and spacing
- **Multiplayer Lobby Synchronization**:
  - Implemented ready system - players toggle ready status before game starts
  - Leader-based game start - first player is leader, can start when all ready
  - Synchronized game start - server validates and broadcasts start to all clients simultaneously
  - Enhanced lobby UI - shows leader indicator (👑) and ready status (✅/❌) for each player
  - Fixed critical issue where players were starting in separate game sessions
- **Main Menu News Ticker**:
  - Added scrolling announcement bar displaying version highlights
  - Continuous right-to-left animation with seamless looping
  - Amber/gold text styling matches game aesthetic
  - Highlights features from V0.4.0 and V0.4.1 updates
- **Server Enhancements**:
  - Added `isReady` and `isLeader` properties to player objects
  - Automatic leader reassignment when leader disconnects
  - Game start validation (checks leader status and all-ready state)
  - Enhanced lobby update broadcasts with ready/leader information
- **Client Improvements**:
  - Context-aware lobby buttons (Leader sees "Start Game", others see "Ready")
  - Local state tracking for leader/ready status
  - Proper event handling for synchronized game start
- **Documentation**:
  - Created `DOCS/MULTIPLAYER.md` - Comprehensive multiplayer architecture guide
  - Documents packet flow, synchronization guarantees, and error handling

## Recent Updates (V0.4.0)
- **Hugging Face Spaces Deployment**:
  - Production-ready server configuration for cloud hosting
  - Automatic server health checking and wake-up system
  - Improved Socket.io connection handling with reverse proxy support
  - Server status indicator on main menu

## Previous Updates (V0.3.1)
- **Bug Fixes**: Fixed critical bullet update crash by ensuring correct removal check. Fixed grenade limit constant bug.
- **WebGPU Rendering Foundation**:
  - Dedicated WebGPURenderer with Canvas 2D fallback
  - Procedural "Void" background with GPU shaders
  - Bloom post-processing and lighting effects
  - Live settings integration for graphics features
- **Settings Overhaul**:
  - Complete redesign with tabbed layout (Video, Audio, Gameplay, Controls)
  - Compact, industrial UI aesthetic
  - Comprehensive video settings (Bloom, Lighting, Particles, Distortion)
- **Landing Page Requirements**:
  - Added "Graphical Requirements" block to sidebar
  - Specs for WebGPU/Canvas and hardware targets

## Recent Updates (V0.3.0 ALPHA)

- **Engine Naming & Version Update**: 
  - Officially named the game engine "ZOMBS-XFX-NGIN V0.3.0 ALPHA"
  - Updated all version references across the project to V0.3.0 ALPHA
  - Added engine info box to landing page displaying engine name and version
  - Standardized version format across UI and documentation

## Previous Updates (v0.2.9)

- **AI Companion System Refactoring**:
  - Extracted AI companion logic into dedicated `js/companions/CompanionSystem.js` module
  - Separated AI behavior from main game loop for better maintainability
  - Modular structure prepares for future enhancements (roles, commands, state machines)
  - AI behavior unchanged: still follows player, engages zombies, maintains leash distance

## Recent Updates (v0.2.6)

- **Landing Page Visual Enhancements**:
  - Increased UI panel transparency (dark mode: 0.45, light mode: 0.65) for better visual depth
  - Restored Star Wars-style fly-out animation with 3 icon types (Zombie, Bullet, Health Pickup)
  - Icons spawn from screen center and fly out in random directions
  - Dynamic background effect creates engaging landing page atmosphere

## Previous Updates (v0.2.5)
- **Day/Night Cycle**: 
  - 2-minute cycle transitioning between day and night
  - Visual dark overlay during night (0.5-0.7 alpha)
  - Zombies move 20% faster during night for increased difficulty
  - Smooth transitions at dawn and dusk
- **Flamethrower Weapon**:
  - Short-range weapon (200px) with high fire rate (50ms)
  - Applies burning damage over time (3 seconds) instead of instant damage
  - Visual flame particles with spread pattern
  - Weapon 4 key binding
- **Spitter Zombie**:
  - Ranged enemy with kiting AI (maintains 300-500px range)
  - Fires acid projectiles that create hazardous pools on impact
  - Acid pools damage players standing in them (5 second duration)
  - Spawns from Wave 6+ with ~8% chance
  - Toxic green visual design

## Previous Updates (v0.2.2)
- **Local Co-op**: 
  - 4-player shared screen gameplay
  - Dynamic grid HUD (2x2)
  - Dedicated Lobby for joining
  - Distinct player colors
  - Smart input assignment (Keyboard/Gamepad mixing)
- **Horror Atmosphere**:
  - Creepy animated main menu background (pulsing red, scanlines, noise)
  - Dynamic blood splatter effects on menu
- **Menu Music**: Added background music for main menu ("Shadows of the Wasteland.mp3")
  - Loops continuously while in menu
  - Automatically stops when game starts
  - Connected to master volume control
- **Main Menu UI**: Enhanced with music tip and improved layout
  - Visible music activation prompt with red glow effect
  - Fixed button positioning to prevent overlap
- **Documentation**: Created Itch.io publishing guide for web distribution

## Previous Updates (v0.2.1)
- **New Features**: Added 5 quick-impact features for enhanced gameplay variety
  - Bullet trails for improved visual feedback
  - Ghost zombie variant (semi-transparent, fast, Wave 4+)
  - Double damage pickup (10-second damage buff)
  - Nuke pickup (instant clear all zombies)
  - Kill streak system with combo notifications
- **Power-up System**: Rare powerup spawns every 30 seconds (damage buff or nuke)
- **Enhanced Combat**: Damage multiplier system integrated, kill streak tracking
- **Visual Polish**: Bullet trails, buff indicators in HUD, combo text notifications

## Previous Updates (v0.2.0)
- **Version Release**: Bumped to v0.2.0 with comprehensive feature set
- **Controller Support (Beta)**: Full Xbox controller support with analog movement and aiming
  - Left Stick: Movement (analog)
  - Right Stick: Aiming (character direction follows stick input)
  - Automatic input source detection (switches between mouse/keyboard and gamepad)
  - Virtual crosshair follows controller aim direction
  - Hot-plug support (detects controller connection/disconnection)
  - Controller keybind settings UI with rebind support
- **Main Menu Enhancement**: Added "Local Co-op" button (placeholder for future implementation)
- **Visual Upgrade**: Replaced procedural grass with textured bloody dark floor tile for grittier atmosphere
  - Renamed `initGrassPattern()` to `initGroundPattern()` for clarity
  - Increased ground pattern opacity from 0.4 to 0.6 for better visibility
- **Landing Page Improvements**: 
  - Widened layout (1200px max-width, improved grid ratios)
  - Enhanced feature grid with 10 items (added Melee, Crowd Control, Respite, Custom Controls)
  - Expanded roadmap section with 11 future features
  - Updated run details with more technical information
- **Style Guide**: Created comprehensive `STYLE_GUIDE.md` documenting design system
- **Documentation Updates**: Updated CHANGELOG.md, SUMMARY.md, ARCHITECTURE.md, and SCRATCHPAD.md
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
