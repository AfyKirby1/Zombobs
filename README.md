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
*   **Standard Infected**: Relentless chasers.
*   **Armored Tanks**: Soaks up damage like a sponge. Aim for the head? There is no head. Just shoot more.
*   **Progressive Difficulty**: Waves get harder, faster, and more chaotic.

### 🎨 Visual & Audio Feast
*   **Juicy Combat**: Screen shake, particle blood splatters, and muzzle flashes.
*   **Dynamic Audio**: Procedurally generated sound effects using the Web Audio API. No external assets!
*   **Retro Aesthetics**: Glowing neon zombies against a dark, gritty backdrop.

## ⚡ Quick Start

> Pick your vibe: zero-setup arcade mode or the new socket.io-powered lobby.

### Option A · Instant Arcade
1.  **[Download the source](https://github.com/AfyKirby1/Zombobs/archive/refs/heads/main.zip)**
2.  Open `zombie-game.html` in Chrome / Edge / Firefox
3.  Blast zombies until the sun comes up

### Option B · Multiplayer Lobby (New!)
1.  Install [Node.js](https://nodejs.org/) if you don’t already have it  
2.  Double-click `launch.bat`
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

## 🧑‍🤝‍🧑 Multiplayer Lobby Experience

- Live player list with auto-generated names (or custom handles sent via socket.io)
- Status pulses (`Connecting…`, `Connected!`) plus a minimalist spinner
- Ready/Back controls drawn directly on the canvas UI
- PowerShell logs mirror every join/leave with ids so LAN parties stay organized
- Future-proof: lobby is already broadcasting `lobby:update` events for upcoming co-op syncing

## 🕹️ Controls

| Action | Key |
| :--- | :---: |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Aim** | 🖱️ Mouse |
| **Shoot** | 🖱️ Left Click |
| **Reload** | <kbd>R</kbd> |
| **Grenade** | <kbd>G</kbd> |
| **Switch Weapon** | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> |
| **Pause** | <kbd>ESC</kbd> |

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

- [ ] **Boss Waves**: Giant mutations every 5 rounds.
- [ ] **Power-ups**: Temporary buffs like Quad Damage and Speed Boost.
- [ ] **New Enemies**: Spitters and Exploders.
- [ ] **Base Building**: Simple barricades to hold the line.

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
