# 🧟 Zombobs - Zombie Survival Game

> A fast-paced 2D top-down zombie survival game built with **pure vanilla HTML5 Canvas and JavaScript**. No engines, no frameworks, no dependencies—just you, your weapons, and endless waves of the undead.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Canvas](https://img.shields.io/badge/Canvas-2D-FF6B6B?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![Gameplay](https://via.placeholder.com/800x450/1a1a1a/ff1744?text=ZOMBOBS+-+SURVIVE+THE+HORDE)

## 🎮 Play Now

**No installation required!** Simply open [`zombie-game.html`](zombie-game.html) in your web browser, or visit the [landing page](index.html) for a better experience.

## ✨ Features

### 🎯 Core Gameplay
- **Wave-Based Survival** - Endless waves of zombies with progressive difficulty scaling
- **3 Unique Weapons** - Pistol, Shotgun, and Rifle, each with distinct damage, fire rate, and ammo capacity
- **Ammo Management** - Limited ammo with manual/auto-reload mechanics
- **Health Pickups** - Pulsing med-orbs spawn periodically to keep you alive (+25 HP)
- **Ammo Pickups** - Yellow/orange ammo boxes restore ammo for current weapon (+15 ammo, also refills grenades)
- **Grenades** - Throwable explosives with AOE damage (G key, 3 per game, 2s cooldown)
- **Normal & Armored Zombies** - Standard infected plus slow, tanky armored variants that soak more damage

### 🎨 Visual Polish
- **Screen Shake** - Dynamic camera shake on shooting and taking damage
- **Particle Effects** - Blood splatter, muzzle flash, and spark particles
- **Glowing Zombies** - Animated red eyes and toxic green aura
- **Damage Indicators** - Red screen flash on player damage
- **Custom Crosshair** - Precise aiming with mouse-following reticle
- **Wave Notifications** - Dramatic text overlay when new waves begin

### 🔊 Audio System
- **Web Audio API** - All sounds generated programmatically (no external files)
- **Gunshot Sounds** - Sharp crack with low-frequency boom
- **Damage Feedback** - Low-frequency grunt on player hit
- **Footstep Audio** - Impact thuds while moving
- **Explosion Sounds** - Dynamic boom for grenade detonations

### 🖥️ UI & Feedback
- **Main Menu** - Beautiful landing page with animated Star Wars-style background
- **In-Game HUD** - Real-time stats overlay (Health, Ammo, Grenades, Kills, Wave, High Score)
- **Low Ammo Warning** - Pulsing red indicator when ammo drops below 25%
- **FPS Counter** - Performance monitor in top-right corner
- **Pause Menu** - ESC to pause/resume with restart option
- **Game Over Screen** - Final stats and high score tracking
- **High Score Persistence** - Best run saved to localStorage
- **Animated Landing Page** - Interactive background with game elements (zombies, bullets, grenades, pickups) flying out in Star Wars-style

### ⚡ Performance
- **Render Scaling** - Optimized canvas resolution for smooth 60+ FPS
- **Particle Capping** - Intelligent particle limit to prevent slowdowns
- **Cached Audio** - Pre-generated sound buffers for instant playback
- **Efficient Collision** - Circle-based collision detection

## 🎮 Controls

| Action | Input |
|--------|-------|
| **Move** | `WASD` or `Arrow Keys` |
| **Aim** | `Mouse` |
| **Shoot** | `Left Click` (hold for continuous fire) |
| **Switch Weapon** | `1` (Pistol), `2` (Shotgun), `3` (Rifle) |
| **Throw Grenade** | `G` |
| **Reload** | `R` |
| **Pause** | `ESC` |
| **Restart** | `R` (when paused/game over) |

## 🛠️ Technology Stack

- **HTML5 Canvas** - 2D rendering engine
- **Vanilla JavaScript** - Pure ES6+ game logic
- **CSS3** - Styling and animations
- **Web Audio API** - Programmatic sound generation
- **Google Fonts** - Creepster & Roboto Mono

**Zero dependencies.** No build process. No package managers. Just open and play.

## 📊 Weapon Stats

| Weapon | Damage | Fire Rate | Ammo | Reload Time | Special |
|--------|--------|-----------|------|-------------|---------|
| **Pistol** | 1 | 400ms | 10 | 1s | Balanced starter |
| **Shotgun** | 3×5 | 800ms | 5 | 1s | Spread fire (5 pellets) |
| **Rifle** | 2 | 200ms | 30 | 1s | Rapid fire |

## 🏗️ Project Structure

```
zombobs/
├── zombie-game.html          # Main game (all-in-one)
├── index.html                # Landing page
├── README.md                 # This file
├── DOCS/                     # Documentation
│   ├── ARCHITECTURE.md       # Technical architecture
│   ├── CHANGELOG.md          # Version history
│   ├── roadmap.md            # Feature roadmap
│   ├── SUMMARY.md            # Project overview
│   ├── SCRATCHPAD.md         # Development notes
│   ├── SBOM.md               # Software Bill of Materials
│   └── guns.md               # Weapon system docs
└── sounds/                   # (Empty - using Web Audio API)
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/AfyKirby1/Zombobs.git
   cd Zombobs
   ```

2. **Open the game**
   - Option 1: Open `zombie-game.html` directly in your browser
   - Option 2: Open `index.html` for the landing page experience
   - Option 3: Serve with a local server (optional):
     ```bash
     # Python
     python -m http.server 8000
     
     # Node.js
     npx serve
     ```

3. **Play!** No installation, no build step, just pure zombie-slaying fun.

## 🎯 Game Mechanics

### Health System
- Start with **100 HP**
- Lose **0.5 HP** per frame when touched by zombies
- Collect **health pickups** (+25 HP) that spawn every 15 seconds
- Health capped at 100

### Wave Progression
- **Wave 1**: 5 zombies
- Each wave adds **+2 zombies**
- Zombie speed: `1 + (wave × 0.1)`
- Zombie health: `2 + floor(wave / 3)`
- Auto-advance when all zombies are eliminated

### Scoring
- **10 points** per zombie kill
- High score persists across sessions (localStorage)
- Score displayed in HUD and game over screen

## 🔧 Development

Built following core principles:
- **KISS** (Keep It Simple Stupid)
- **DOTI** (Don't Over Think It)
- **YAGI** (You Aren't Gonna Need It)

### Architecture
- **Single-file game** - All code in `zombie-game.html` for simplicity
- **Object-oriented** - Classes for Bullet, Zombie, Particle, GameHUD
- **Update-render loop** - Classic game loop pattern
- **State management** - Global state variables with clear separation

See [`DOCS/ARCHITECTURE.md`](DOCS/ARCHITECTURE.md) for detailed technical documentation.

## 📈 Roadmap

Check out [`DOCS/roadmap.md`](DOCS/roadmap.md) for the full feature list. Highlights:

### ✅ Completed
- Weapon variety (3 weapons)
- Ammo system with reloading
- Health & Ammo pickups
- Grenades with AOE damage
- Normal & Armored zombie variants
- Main menu system
- Animated landing page with Star Wars-style effects
- Visual effects (screen shake, particles, blood, explosions)
- Audio system (gunshots, explosions, footsteps)
- HUD with pause/game over
- Crosshair and FPS counter
- Wave notifications

### 🔜 Coming Soon
- Additional special zombie types (spitter, summoner, crawler)
- Boss waves (every 5 rounds)
- Temporary power-up pickups
- Melee attack
- Floating damage numbers
- Wave progress indicator

## 🐛 Known Issues

- Performance may vary on lower-end devices (render scaling helps)
- Some browsers may have audio context restrictions (requires user interaction)

## 📝 Documentation

- **[ARCHITECTURE.md](DOCS/ARCHITECTURE.md)** - Technical deep-dive
- **[CHANGELOG.md](DOCS/CHANGELOG.md)** - Version history
- **[roadmap.md](DOCS/roadmap.md)** - Feature roadmap
- **[SUMMARY.md](DOCS/SUMMARY.md)** - Project overview
- **[guns.md](DOCS/guns.md)** - Weapon system details

## 🤝 Contributing

Contributions are welcome! This is a learning project, so feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your high scores!

## 📄 License

Free to use and modify! This project is open source and available under the MIT License.

## 🎮 Credits

- **Fonts**: [Creepster](https://fonts.google.com/specimen/Creepster) & [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) via Google Fonts
- **Audio**: Web Audio API** - All sounds generated programmatically
- **Built with**: Pure HTML5 Canvas and JavaScript

---

**Made with ❤️ and zombies** 🧟

*Survive the horde. Beat your high score. Repeat.*

