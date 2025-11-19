<div align="center">

# 🧟 ZOMBOBS
### The Ultimate Vanilla JS Zombie Survival Experience

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Canvas](https://img.shields.io/badge/Canvas-2D-FF6B6B?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

![Gameplay Banner](https://via.placeholder.com/800x400/0f0f0f/ff0000?text=SURVIVE+THE+HORDE)

<p align="center">
  <b>No Engines. No Frameworks. Just Pure Adrenaline.</b><br>
  A fast-paced, top-down shooter built entirely with raw HTML5 Canvas and JavaScript.
</p>

[🎮 Play Now](#-play-now) • [✨ Features](#-features) • [🕹️ Controls](#-controls) • [🛠️ Tech](#-technology-stack)

</div>

---

## 💀 Survive the Night

**Zombobs** strips away the bloat of modern game engines to deliver a raw, high-performance survival experience. You are alone against an endless tide of the undead. How long can you last?

> "It's like Left 4 Dead met a geometry textbook and had a very angry baby." - *Beta Tester*

## ✨ Features

### 🔫 Arsenal of Destruction
*   **Pistol**: Reliable, accurate, infinite potential.
*   **Shotgun**: Crowd control at its finest. Spread the love (and the lead).
*   **Rifle**: High rate of fire for when precision isn't enough.
*   **Grenades**: Clear the screen with satisfying AOE explosions.

### 🧠 Intelligent Enemies
*   **5 Zombie Variants**: Normal, Fast (Runners), Armored (Tanks), Exploding (Boomers), and Ghost (Spectral)
*   **Boss Waves**: Epic boss zombies spawn periodically with massive health and devastating attacks
*   **Progressive Difficulty**: Waves get harder, faster, and more chaotic
*   **Crowd Control**: Bullets slow zombies on hit, allowing strategic kiting

### 🎨 Visual & Audio Feast
*   **Juicy Combat**: Screen shake, particle blood splatters, muzzle flashes, and bullet trails
*   **Dynamic Audio**: Procedurally generated sound effects using the Web Audio API + menu music
*   **Retro Aesthetics**: Glowing neon zombies against a dark, gritty backdrop
*   **Horror Atmosphere**: Animated menu backgrounds with pulsing effects, scanlines, and dynamic blood splatters
*   **Theme Toggle**: Light/dark mode with Material Design toggle button

### 💪 Power-Up System
*   **Double Damage Buff**: Purple pickup that doubles weapon damage for 10 seconds
*   **Nuke Pickup**: Rare yellow/black radiation symbol that instantly clears all zombies
*   **Kill Streak Combos**: Chain kills within 1.5s for combo notifications ("RAMPAGE!", "UNSTOPPABLE!")

### 👥 Multiplayer & Co-op
*   **Local Co-op**: 2-player shared screen mode with split HUD and distinct player colors
*   **Multiplayer Lobby**: Socket.io powered matchmaking with live player list and connection tracking
*   **Controller Support**: Full Xbox/gamepad support with analog sticks and automatic input detection

## ⚡ Quick Start

> Pick your vibe: zero-setup arcade mode, local co-op, or the socket.io-powered multiplayer lobby.

### Option A · Instant Arcade
1.  **[Download the source](https://github.com/AfyKirby1/Zombobs/archive/refs/heads/main.zip)**
2.  Open `index.html` for the landing page or `zombie-game.html` directly
3.  Blast zombies until the sun comes up

### Option B · Local Co-op
1.  Open `zombie-game.html` in your browser
2.  Click **Local Co-op** from the main menu
3.  Player 1: Use Mouse/Keyboard or Gamepad 1
4.  Player 2: Press Start/A/Enter to join, use Keyboard (Arrow keys) or Gamepad 2
5.  Survive together!

### Option C · Multiplayer Lobby
1.  Install [Node.js](https://nodejs.org/) if you don't already have it  
2.  Double-click `launch.bat` (Windows) or run `launch.ps1` directly
    ```powershell
    # launch.bat
    powershell.exe -ExecutionPolicy Bypass -File ".\launch.ps1"
    ```
    The PowerShell wrapper:
    - Checks for Node.js
    - Installs dependencies on first run
    - Launches the Express + socket.io server
    - Prints live connection logs with color-coded badges
3.  Visit `http://localhost:3000/zombie-game.html`
4.  Click **Multiplayer** → hang out in the neon lobby → hit **Start Game** when your squad is ready

<sub>Want to theme the launcher banner or rename yourself? Edit `launch.ps1` or tweak `gameState.username` before connecting.</sub>

## 🎮 Game Modes

### Single Player
Classic survival mode. Just you against the horde. How long can you last?

### Local Co-op (2 Players)
- Shared screen gameplay with split HUD
- Distinct player colors (Blue/Red)
- Smart input assignment (mix keyboard and gamepads)
- Zombies target the closest living player
- Both players must die for Game Over

### Multiplayer Lobby
- Live player list with auto-generated names (or custom handles)
- Status pulses (`Connecting…`, `Connected!`) with minimalist spinner
- Ready/Back controls drawn directly on the canvas UI
- PowerShell logs mirror every join/leave with IDs for LAN parties
- Future-proof: lobby broadcasts `lobby:update` events for upcoming networked gameplay

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
| **Switch Weapon** | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> |
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

## 🛠️ Technology Stack

We believe in the power of the platform.

*   **Frontend Core**: 100% Vanilla JavaScript (ES6+)
*   **Rendering**: HTML5 Canvas API (2D Context)
*   **Audio**: Web Audio API (Oscillators & Gain Nodes)
*   **Styling**: CSS3 for UI overlays
*   **Backend Server** (Optional): Node.js + Express + socket.io for multiplayer
*   **Client Dependencies**: **ZERO external runtime dependencies.** None. Nada.

## 🧰 Power Tools

| Script | What it does |
| :--- | :--- |
| `launch.bat` | One-click entry: opens the styled PowerShell wrapper |
| `launch.ps1` | Checks Node.js, installs deps, prints neon banner + live socket.io logs |
| `server/server.js` | Serves the entire game and coordinates lobby updates over socket.io |

## 📊 Weapon Stats

| Weapon | DMG | Fire Rate | Mag Size | Special |
| :--- | :---: | :---: | :---: | :--- |
| **Pistol** | 🩸 | ⚡ | 10 | Balanced & Reliable |
| **Shotgun** | 🩸🩸🩸 | ⚡ | 5 | 5-Pellet Spread |
| **Rifle** | 🩸🩸 | ⚡⚡⚡ | 30 | Full Auto Mayhem |

## 🗺️ Roadmap

The horde is growing. Here's what's coming next:

- [ ] **Online Multiplayer**: Full networked gameplay (lobby system ready)
- [ ] **Base Building**: Walls, gates, and auto-turrets
- [ ] **New Arsenal**: Flamethrower, Rocket Launcher, Crossbow, Chainsaw
- [ ] **More Zombie Variants**: Crawlers, Jumpers, Swarmers, Spitters, Summoners
- [ ] **Progression System**: Skill trees and permanent perks
- [ ] **More Power-ups**: Quad-damage, Speed Boost, Shield
- [ ] **Dynamic World**: Day/Night cycle and weather effects
- [ ] **Multiple Maps**: Urban, forest, military base environments

See [DOCS/roadmap.md](DOCS/roadmap.md) for the full plan.

## 🤝 Contributing

Found a bug? Want to add a flamethrower?

1.  Fork it.
2.  Branch it (`git checkout -b feature/flamethrower`).
3.  Code it.
4.  Push it.
5.  PR it.

## 📄 License

MIT License. Do whatever you want with it. Just don't get bitten.

---

<div align="center">

**Made with 🩸, 💦, and 💻 by AfyKirby1**

</div>
