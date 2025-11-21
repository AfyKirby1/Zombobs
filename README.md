<div align="center">

# 🧟 ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS
### 💀 The Ultimate Vanilla JS Survival Experience 💀

> **"Left 4 Dead meets Geometry Wars in a browser window."**

<p align="center">
  <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" height="30" alt="HTML5" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" height="30" alt="JavaScript" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API">
    <img src="https://img.shields.io/badge/Canvas-2D-FF6B6B?style=for-the-badge" height="30" alt="Canvas" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" height="30" alt="Node.js" />
  </a>
  <a href="https://socket.io/">
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" height="30" alt="Socket.io" />
  </a>
  <a href="LEGAL/LICENSE.md">
    <img src="https://img.shields.io/badge/License-PROPRIETARY-red.svg?style=for-the-badge" height="30" alt="License" />
  </a>
</p>

![Gameplay Banner](https://via.placeholder.com/800x400/0f0f0f/ff0000?text=SURVIVE+THE+HORDE)

<p align="center">
  <br>
  <b>No Engines. No Frameworks. Just Pure Adrenaline.</b><br>
  A fast-paced, top-down shooter built entirely with raw HTML5 Canvas and JavaScript.
  <br><br>
  <a href="https://afykirby1.github.io/Zombobs/">
    <img src="https://img.shields.io/badge/PLAY_NOW-00C853?style=for-the-badge&logo=google-play&logoColor=white&labelColor=101010" height="50" alt="Play Now" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://otterdays.itch.io/zombobs">
    <img src="https://img.shields.io/badge/PLAY_ON_ITCH.IO-FA5C5C?style=for-the-badge&logo=itch.io&logoColor=white&labelColor=101010" height="50" alt="Play on Itch.io" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://otterdays.itch.io/zombobs">
    <img src="https://img.shields.io/badge/PLAY_ON_ITCH.IO-FA5C5C?style=for-the-badge&logo=itch.io&logoColor=white&labelColor=101010" height="50" alt="Play on Itch.io" />
  </a>
  <br>
</p>

[🎮 Features](#-features) • [🕹️ Controls](#-controls) • [🛠️ Tech](#-technology-stack) • [🗺️ Roadmap](#-roadmap)

</div>

---

## 🔥 What's New in V0.6.0

> **Balance overhaul and critical bug fixes**

- **⚖️ Balance Overhaul** - Major combat balance adjustments
  - **🎯 Crit Rate Reduction**: Base crit chance reduced from 10% to ~3.33% (2/3 reduction)
  - **💪 Zombie HP Doubling**: All zombie HP doubled (except Boss) for more challenging combat
  - **🔫 Weapon Damage Doubling**: All weapon damage values doubled to match increased zombie durability
- **🐛 Bug Fix**: Hoarder skill ammo multiplier now persists correctly across weapon switches

## 🔥 Previously in V0.5.1

> **The horde moves in perfect sync. Ready for optimized multiplayer?**

- **⚡ Zombie Speed Synchronization** - Complete speed sync eliminates position desync from night cycle, wave scaling, and slow effects
- **📉 Delta Compression** - Only sends changed zombies, reducing network bandwidth by 50-80% for large hordes
- **🔄 Adaptive Update Rate** - Dynamic 5-20Hz update frequency based on zombie count and network latency (was fixed 10Hz)
- **✨ Advanced Interpolation** - Adaptive lerp + velocity extrapolation provides 60-80% reduction in movement jitter
- **🚀 Velocity-Based Extrapolation** - Uses tracked velocity for smooth movement prediction between network updates
- **💻 Socket.IO Binary Add-ons** - Optional `bufferutil` and `utf-8-validate` reduce WebSocket CPU usage by 10-20%
- **📊 Latency Measurement** - Real-time network latency tracking with exponential moving average for adaptive quality adjustments

## 🔥 Previously in V0.5.0

> **The horde is connected. Are you ready?**

- **🌐 Hugging Face Spaces Deployment** - Production-ready multiplayer server on Hugging Face Spaces cloud hosting
- **🔌 Enhanced Connection System** - Automatic server health checks, smart status indicators, and auto-wake for sleeping servers
- **🛡️ Improved Stability** - Fixed WebGPU renderer errors and Socket.io connection issues
- **📊 Smart Server Status** - Main menu now shows server readiness even when not in multiplayer lobby
- **🔄 Better Connection Handling** - Polling-first transport, explicit path configuration, and enhanced CORS support
- **⚡ WebGPU Fixes** - Resolved storage buffer binding errors for stable GPU rendering
- **📏 UI Scaling System** - Comprehensive 50-150% UI scale slider for accessibility and customization

## 🔥 Previously in V0.3.0 ALPHA

> **The horde is evolving. Are you?**

- **⚡ WebGPU Rendering Engine** - Next-generation graphics with GPU-accelerated background shaders, bloom post-processing, and procedural "Void" effects. Automatic Canvas 2D fallback for compatibility.
- **🧮 GPU Particle Compute** - Simple compute shader updates thousands of particles per frame; point-list rendering layered over the background.
- **🎨 Settings Overhaul** - Complete redesign with compact tabbed interface (Video, Audio, Gameplay, Controls) and 10+ new customization options.
- **💫 Bloom & Post-Processing** - Physically based bloom effects for glowing elements and cinematic visuals.
- **🎛️ Advanced Settings** - New options including WebGPU toggle, bloom intensity, particle count modes, lighting quality tiers, distortion effects, damage number scale, screen shake multiplier, crosshair color, auto-reload toggle, and spatial audio. All apply live.
- **📊 WebGPU Status Indicator** - Real-time status icon showing WebGPU availability and current state.

## 🔥 Previously in V0.3.0 ALPHA

- **🔥 Flamethrower Weapon** - Burn through crowds with short-range, high-fire-rate devastation. Sets zombies ablaze with damage-over-time effects.
- **🌙 Day/Night Cycle** - Dynamic 2-minute cycle where zombies move 20% faster at night. Survive the darkness.
- **👥 Local Co-op** - Full 4-player shared-screen mode with grid HUD, distinct player colors, and smart input detection.
- **⚡ Background Reloading** - Weapons auto-reload when holstered. Switch weapons tactically during downtime.
- **🎯 Weapon Persistence** - Each weapon maintains its own ammo count. No more losing progress when switching.
- **🎵 Menu Music** - Atmospheric background music sets the mood before the chaos begins.

---

## 💀 Survive the Night

**Zombobs** strips away the bloat of modern game engines to deliver a raw, high-performance survival experience. You are alone against an endless tide of the undead. How long can you last?

> *"It's like Left 4 Dead met a geometry textbook and had a very angry baby."* - *Beta Tester*

**Built from scratch** with zero dependencies. Every particle, every sound, every zombie AI is hand-crafted using pure JavaScript and the Canvas API. No Unity. No Phaser. No Three.js. Just you, the browser, and thousands of lines of optimized code.

---

## ✨ Features

### 🔫 Arsenal of Destruction

| Weapon | Damage | Fire Rate | Mag Size | Range | Special |
|:---|:---:|:---:|:---:|:---:|:---|
| **Pistol** | 🩸 | ⚡ | 10 | Long | Balanced & Reliable |
| **Shotgun** | 🩸🩸🩸 | ⚡ | 5 | Medium | 5-Pellet Spread |
| **Rifle** | 🩸🩸 | ⚡⚡⚡ | 30 | Long | Full Auto Mayhem |
| **Flamethrower** | 🔥 | ⚡⚡⚡⚡⚡ | 100 | Short | DoT Burning Effect |

- **Grenades**: Clear the screen with satisfying AOE explosions (3 per game, 2s cooldown)
- **Melee Attack**: Close-range swipe with 500ms cooldown (V key or right-click)
- **Weapon Switching**: Hotkeys (1-4) or scroll wheel for seamless arsenal management
- **Background Reloading**: Weapons reload automatically when holstered long enough

### 🧠 Intelligent Enemies

- **6 Zombie Variants**:
  - 🟢 **Normal** - Classic shambling horde
  - 🔴 **Fast (Runners)** - 1.6x speed, smaller hitbox, speed trail particles
  - 🛡️ **Armored (Tanks)** - Heavy armor absorbs damage before health
  - 💥 **Exploding (Boomers)** - Explodes on death, AOE damage
  - 👻 **Ghost (Spectral)** - Semi-transparent, 1.3x speed, ethereal glow
  - 🟢 **Spitter (Ranged)** - Kites at optimal range, lobs acid projectiles

- **Boss Waves**: Every 5 waves, a massive boss zombie spawns with devastating attacks
- **Progressive Difficulty**: Waves get harder, faster, and more chaotic
- **Day/Night Cycle**: Dynamic atmosphere with 20% speed boost for zombies at night
- **Environmental Hazards**: Acid pools from Spitter attacks create dangerous zones
- **Crowd Control**: Bullets slow zombies on hit, allowing strategic kiting

### 🎨 Visual & Audio Feast

- **Juicy Combat**: Screen shake, particle blood splatters, muzzle flashes, bullet trails, shell ejection
- **Dynamic Audio**: Procedurally generated sound effects using Web Audio API + atmospheric menu music
- **Retro Aesthetics**: Glowing neon zombies against a dark, gritty backdrop
- **Horror Atmosphere**: Animated menu backgrounds with pulsing effects, scanlines, and dynamic blood splatters
- **Theme Toggle**: Light/dark mode with Material Design toggle button
- **Floating Damage Numbers**: See your damage output in real-time
- **Kill Streak Combos**: Chain kills within 1.5s for combo notifications ("RAMPAGE!", "UNSTOPPABLE!")

### 💪 Power-Up System

- **Double Damage Buff**: Purple pickup that doubles weapon damage for 10 seconds
- **Nuke Pickup**: Rare yellow/black radiation symbol that instantly clears all zombies
- **Speed Boost**: Temporary movement speed increase
- **Rapid Fire**: Increased fire rate for all weapons
- **Shield Pickup**: Temporary overshield that absorbs damage before health
- **Kill Streak Combos**: Chain kills within 1.5s for combo notifications ("RAMPAGE!", "UNSTOPPABLE!")

### 👥 Multiplayer & Co-op

- **Local Co-op**: 4-player shared screen mode with grid HUD and distinct player colors
  - Player 1: Mouse/Keyboard or Gamepad 1
  - Player 2-4: Gamepad 2-4 or Keyboard (Arrows for P2)
  - Smart input assignment (mix keyboard and gamepads)
  - Zombies target closest living player
  - All players must die for Game Over

- **Multiplayer Lobby**: Socket.io powered matchmaking with live player list
  - Real-time connection tracking
  - Custom usernames
  - Ready/Back controls
  - *Note: Full networked gameplay coming soon*

- **Controller Support**: Full Xbox/gamepad support with analog sticks and automatic input detection

---

## ⚡ Quick Start

> **Pick your vibe**: zero-setup arcade mode, local co-op, or the socket.io-powered multiplayer lobby.

### Option A · Instant Arcade

1. **[Download the source](https://github.com/AfyKirby1/Zombobs/archive/refs/heads/main.zip)**
2. Open `index.html` for the landing page or `zombie-game.html` directly
3. Blast zombies until the sun comes up

### Option B · Local Co-op

1. Open `zombie-game.html` in your browser
2. Click **Local Co-op** from the main menu
3. **Player 1**: Use Mouse/Keyboard or Gamepad 1
4. **Players 2-4**: Press Start/A/Enter to join, use Keyboard (Arrow keys) or Gamepads
5. Survive together!

### Option C · Multiplayer Lobby

1. Install [Node.js](https://nodejs.org/) if you don't already have it  
2. Double-click `launch.bat` (Windows) or run `launch.ps1` directly
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

<sub>Want to theme the launcher banner or rename yourself? Edit `launch.ps1` or tweak `gameState.username` before connecting.</sub>

---

## 🎮 Game Modes

### Single Player
Classic survival mode. Just you against the horde. How long can you last?

### Local Co-op (Up to 4 Players) ✅ **FULLY FUNCTIONAL**
- Shared screen gameplay with 2x2 grid HUD
- Distinct player colors (Blue/Red/Green/Orange)
- Smart input assignment (mix keyboard and gamepads)
- Zombies target the closest living player
- All players must die for Game Over

### Multiplayer Lobby ✅ **FULLY FUNCTIONAL**
- **🌐 Cloud Server**: Deployed on Hugging Face Spaces for reliable hosting
- **⚡ Speed Sync (V0.5.1)**: Zombie speed synchronization prevents position desync
- **📉 Delta Compression (V0.5.1)**: 50-80% bandwidth reduction for large hordes
- **🔄 Adaptive Updates (V0.5.1)**: Dynamic 5-20Hz based on zombie count and latency
- **✨ Advanced Interpolation (V0.5.1)**: 60-80% reduction in movement jitter
- **💻 Binary Optimizations (V0.5.1)**: 10-20% CPU reduction for WebSocket operations
- **📊 Latency Measurement (V0.5.1)**: Real-time network quality tracking
- **🔌 Smart Connection**: Automatic server health checks and wake-up system
- **📊 Status Indicator**: Shows "Server Ready" on main menu when server is online
- **👥 Live Player List**: Real-time player roster with custom usernames
- **🔄 Auto-Reconnect**: Automatic reconnection with exponential backoff
- **🌍 Direct Domain**: Uses `.hf.space` domain for stable connections
- Ready/Back controls drawn directly on the canvas UI

---

## 🕹️ Controls

### Keyboard & Mouse
| Action | Key |
| :--- | :---: |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> |
| **Aim** | 🖱️ Mouse |
| **Shoot** | 🖱️ Left Click (hold for continuous) |
| **Melee** | <kbd>V</kbd> |
| **Reload** | <kbd>R</kbd> |
| **Grenade** | <kbd>G</kbd> |
| **Switch Weapon** | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> or 🖱️ Scroll Wheel |
| **Sprint** | <kbd>Shift</kbd> |
| **Pause** | <kbd>ESC</kbd> |

### Controller (Xbox/Gamepad)
| Action | Button |
| :--- | :---: |
| **Move** | 🕹️ Left Stick (analog) |
| **Aim** | 🕹️ Right Stick (analog) |
| **Shoot** | <kbd>RT</kbd> (hold for continuous) |
| **Melee** | <kbd>R3</kbd> |
| **Reload** | <kbd>X</kbd> |
| **Grenade** | <kbd>RB</kbd> |
| **Next Weapon** | <kbd>Y</kbd> |
| **Previous Weapon** | <kbd>LB</kbd> |
| **Sprint** | <kbd>L3</kbd> |
| **Pause** | <kbd>Start</kbd> |

*All controls are fully customizable in the Settings menu*

### ⚙️ Settings & Customization

The game features a comprehensive **tabbed settings panel** with compact, organized sections:

**Video Tab:**
- **WebGPU Settings**: Enable/disable WebGPU features, bloom intensity slider, particle count modes (Low/High/Ultra), lighting quality (Off/Simple/Advanced), distortion effects toggle
- **Quality Presets**: Low, Medium, High, or Custom configurations
- **Visual Effects**: Resolution scale, vignette, shadows, lighting toggles
- **Gameplay Visuals**: Screen shake multiplier, crosshair style & color, damage number style & scale, low health warning, enemy health bars, reload bar
- **Performance**: FPS limit options, debug stats toggle

**Audio Tab:**
- **Volume Controls**: Master, Music, and SFX volume sliders with independent control
- **Advanced**: Spatial audio toggle for 3D positional sound

**Gameplay Tab:**
- **Controls**: Auto-sprint, auto-reload toggle
- **UI**: FPS counter visibility, pause on focus loss

**Controls Tab:**
- **Input Mode Toggle**: Switch between Keyboard and Controller modes
- **Keybinds**: Fully remappable keys and buttons
  - Keyboard: Movement, Sprint, Reload, Grenade, Melee, Weapon hotkeys (1-4), Scroll wheel toggle
  - Controller: Fire, Reload, Grenade, Sprint, Melee, Prev/Next Weapon, Pause
- All settings apply in real-time and persist across sessions via localStorage

---

## 🛠️ Technology Stack

We believe in the power of the platform.

### Frontend Core
- **100% Vanilla JavaScript (ES6+)** - No frameworks, no libraries, no bloat
- **HTML5 Canvas API (2D Context)** - Hand-optimized rendering pipeline for gameplay/UI
- **WebGPU** - Next-generation graphics API for GPU-accelerated background shaders and post-processing (automatic Canvas 2D fallback)
- **Web Audio API** - Procedurally generated sound effects (Oscillators & Gain Nodes)
- **CSS3** - UI overlays and styling
- **Client Dependencies**: **ZERO external runtime dependencies.** None. Nada.

### Backend Server (Optional - for Multiplayer)
- **Node.js** - Runtime environment
- **Express** - Static file serving
- **Socket.io** - WebSocket server for multiplayer lobby

### Custom Systems
Every system is custom-built:
- **Particle System** - Hand-crafted particle engine for blood, fire, explosions
- **Audio System** - Procedural sound generation (no audio files needed)
- **Input System** - Unified keyboard/mouse/gamepad handling
- **Collision Detection** - Optimized quadtree-based spatial partitioning
- **Entity Management** - Object pooling for performance
- **State Management** - Custom game state system

---

## 🧰 Power Tools

| Script | What it does |
| :--- | :--- |
| `launch.bat` | One-click entry: opens the styled PowerShell wrapper |
| `launch.ps1` | Checks Node.js, installs deps, prints neon banner + live socket.io logs |
| `server/server.js` | Serves the entire game and coordinates lobby updates over socket.io |

---

## 🗺️ Roadmap

The horde is growing. Here's what's coming next:

### ✅ Recently Completed (V0.5.1)
- [x] **Zombie Speed Synchronization** - Perfect sync across all clients
- [x] **Delta Compression** - 50-80% bandwidth reduction for large hordes
- [x] **Adaptive Update Rate** - Dynamic 5-20Hz based on conditions
- [x] **Advanced Interpolation** - 60-80% reduction in movement jitter
- [x] **Socket.IO Binary Add-ons** - 10-20% CPU reduction
- [x] **Latency Measurement** - Real-time network quality tracking
- [x] **UI Scaling System** - 50-150% UI scale for accessibility

### ✅ Previously Completed
- [x] **WebGPU Rendering Engine** - GPU-accelerated background shaders and post-processing
- [x] **Settings Overhaul** - Compact tabbed interface with 10+ new options
- [x] **Bloom Post-Processing** - Physically based glow effects
- [x] **Procedural "Void" Background** - Animated shader-based atmospheric effects
- [x] **Flamethrower** - Short-range DoT weapon with burning effects
- [x] **Spitter Zombies** - Ranged enemies with acid projectiles
- [x] **Day/Night Cycle** - Dynamic atmosphere with difficulty scaling
- [x] **Local Co-op** - Full 4-player shared-screen mode
- [x] **Background Reloading** - Tactical weapon switching
- [x] **Weapon Persistence** - Independent ammo tracking
- [x] **Cloud Multiplayer Server** - Hugging Face Spaces deployment

### 🚧 Coming Soon
- [ ] **Online Multiplayer** - Full networked gameplay (lobby system ready)
- [ ] **Base Building** - Walls, gates, and auto-turrets
- [ ] **Progression System** - Skill trees and permanent perks
- [ ] **More Power-ups** - Quad-damage, Speed Boost, Shield (some already implemented!)
- [ ] **Multiple Maps** - Urban, forest, military base environments
- [ ] **More Zombie Variants** - Crawlers, Jumpers, Swarmers, Summoners
- [ ] **Rocket Launcher** - High-damage explosive weapon

See [DOCS/roadmap.md](DOCS/roadmap.md) for the full plan.

---

## 🤝 Contributing

Found a bug? Want to add a flamethrower? *(Wait, we already have one!)* Want to add something else awesome?

1. Fork it.
2. Branch it (`git checkout -b feature/your-awesome-feature`).
3. Code it.
4. Push it.
5. PR it.

We welcome contributions! Check out the [roadmap](DOCS/roadmap.md) for ideas, or come up with your own.

---

## 🚫 PROPRIETARY & CLOSED SOURCE

**Copyright © 2025 AfyKirby1 (OtterDays). All Rights Reserved.**

This project (ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS) and all associated source code, assets, design, and documentation are the sole intellectual property of **AfyKirby1**.

**[📄 CLICK HERE TO READ THE FULL LICENSE AGREEMENT](LEGAL/LICENSE.md)**

**⚠️ STRICT ACCESS AGREEMENT:**

By downloading, cloning, forking, or viewing this repository, you explicitly agree to the following terms:

1.  **🚫 CLOSED SOURCE:** This is **NOT** open-source software. The code is visible for portfolio/showcase purposes only.
2.  **🚫 NO REDISTRIBUTION:** You may NOT re-upload, host, mirror, or distribute this code or the game executable on any platform (itch.io, Steam, GitHub, etc.) without signed written consent.
3.  **🚫 NO DERIVATIVE WORKS:** You may NOT use this codebase to build your own game. "Reskinning" or "forking" for release is strictly prohibited.
4.  **🚫 NO COMMERCIAL USE:** You may NOT use any part of this project for commercial gain, including but not limited to ads, donations, or sales.
5.  **👁️ REFERENCE ONLY:** You may read the code for educational inspiration, but you may not copy-paste logic into your own commercial projects.

**Any violation of these terms will result in immediate takedown notices and potential legal action.**

*Play fair. Create your own apocalypse.*

---

<div align="center">

**Made with 🩸, 💦, and 💻 by [AfyKirby1](https://github.com/AfyKirby1)**

*Survive. Adapt. Dominate.*

</div>
