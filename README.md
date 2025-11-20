<div align="center">

# 🧟 ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS
### The Ultimate Vanilla JS Zombie Survival Experience

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
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" height="30" alt="License" />
  </a>
</p>

![Gameplay Banner](https://via.placeholder.com/800x400/0f0f0f/ff0000?text=SURVIVE+THE+HORDE)

<p align="center">
  <br>
  <b>No Engines. No Frameworks. Just Pure Adrenaline.</b><br>
  A fast-paced, top-down shooter built entirely with raw HTML5 Canvas and JavaScript.
  <br><br>
  <a href="https://github.com/AfyKirby1/Zombobs/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/DOWNLOAD_SOURCE-FF0000?style=for-the-badge&logo=github&logoColor=white&labelColor=101010" height="50" alt="Download Source" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-quick-start">
    <img src="https://img.shields.io/badge/PLAY_NOW-00C853?style=for-the-badge&logo=google-play&logoColor=white&labelColor=101010" height="50" alt="Play Now" />
  </a>
  <br>
</p>

[🎮 Features](#-features) • [🕹️ Controls](#-controls) • [🛠️ Tech](#-technology-stack) • [🗺️ Roadmap](#-roadmap)

</div>

---

## 🔥 What's New in v0.2.6

> **The horde is evolving. Are you?**

- **🔥 Flamethrower Weapon** - Burn through crowds with short-range, high-fire-rate devastation. Sets zombies ablaze with damage-over-time effects.
- **🌙 Day/Night Cycle** - Dynamic 2-minute cycle where zombies move 20% faster at night. Survive the darkness.
- **👥 Local Co-op** - Full 2-player shared-screen mode with split HUD, distinct player colors, and smart input detection.
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

- **Local Co-op**: 2-player shared screen mode with split HUD and distinct player colors
  - Player 1: Mouse/Keyboard or Gamepad 1
  - Player 2: Keyboard (Arrows) or Gamepad 2
  - Smart input assignment (mix keyboard and gamepads)
  - Zombies target closest living player
  - Both players must die for Game Over

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
4. **Player 2**: Press Start/A/Enter to join, use Keyboard (Arrow keys) or Gamepad 2
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

### Local Co-op (2 Players) ✅ **FULLY FUNCTIONAL**
- Shared screen gameplay with split HUD
- Distinct player colors (Blue/Red)
- Smart input assignment (mix keyboard and gamepads)
- Zombies target the closest living player
- Both players must die for Game Over

### Multiplayer Lobby 🔄 **LOBBY ONLY** (Full gameplay coming soon)
- Live player list with auto-generated names (or custom handles)
- Status pulses (`Connecting…`, `Connected!`) with minimalist spinner
- Ready/Back controls drawn directly on the canvas UI
- PowerShell logs mirror every join/leave with IDs for LAN parties
- Future-proof: lobby broadcasts `lobby:update` events for upcoming networked gameplay

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

---

## 🛠️ Technology Stack

We believe in the power of the platform.

### Frontend Core
- **100% Vanilla JavaScript (ES6+)** - No frameworks, no libraries, no bloat
- **HTML5 Canvas API (2D Context)** - Hand-optimized rendering pipeline
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

### ✅ Recently Completed
- [x] **Flamethrower** - Short-range DoT weapon with burning effects
- [x] **Spitter Zombies** - Ranged enemies with acid projectiles
- [x] **Day/Night Cycle** - Dynamic atmosphere with difficulty scaling
- [x] **Local Co-op** - Full 2-player shared-screen mode
- [x] **Background Reloading** - Tactical weapon switching
- [x] **Weapon Persistence** - Independent ammo tracking

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

## 📄 License

MIT License. Do whatever you want with it. Just don't get bitten.

---

<div align="center">

**Made with 🩸, 💦, and 💻 by [AfyKirby1](https://github.com/AfyKirby1)**

*Survive. Adapt. Dominate.*

</div>
