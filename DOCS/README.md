# 🧟 Zombie Survival Game

A fast-paced 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. Fight through waves of zombies, survive as long as you can, and see how high your score can go!

![Game Screenshot](https://via.placeholder.com/800x600/000000/FF0000?text=ZOMBIE+SURVIVAL)

## 🎮 How to Play

### Keyboard & Mouse
- **WASD** or **Arrow Keys** - Move your character
- **Mouse** - Aim your weapon
- **Click** - Shoot at zombies
- **Survive** - Don't let the zombies touch you!

### Controller (Xbox/Gamepad)
- **Left Stick** - Move your character (analog)
- **Right Stick** - Aim your weapon (analog)
- **RT** - Fire (hold for continuous)
- **RB** - Throw grenade
- **X** - Reload
- **Y** - Next weapon
- **LB** - Previous weapon
- **R3** - Melee attack
- **L3** - Sprint
- **Start** - Pause/Resume

## ✨ Features

### Implemented
- ✅ Wave-based zombie spawning
- ✅ Progressive difficulty scaling
- ✅ Screen shake effects
- ✅ Damage indicators (red flash on hit)
- ✅ Particle effects (blood splatter, muzzle flash, spark particles)
- ✅ In-game HUD component (Health, Weapon/Ammo, Kills, Wave, High Score)
- ✅ **Controller Support (Beta)** - Full Xbox controller support with analog movement and aiming
- ✅ **Complete Ammo System** - Limited bullets, manual/auto reload, weapon-specific ammo
- ✅ **Weapon Variety** - 3 weapons (Pistol, Shotgun, Rifle) with unique stats
- ✅ **Special Zombie Types** - Normal, Fast, Exploding, and Armored variants
- ✅ **Health Pickups** - Pulsing healing orbs that restore player health (+25 HP)
- ✅ **Ammo Pickups** - Yellow/orange ammo boxes that restore ammo for current weapon (+15 ammo)
- ✅ **Grenades** - Throwable explosives with AOE damage (G key, 3 per game, 2s cooldown)
- ✅ **Main Menu** - Landing page with single-player, local co-op (placeholder), settings, and multiplayer options
- ✅ **Animated Landing Page** - Star Wars-style fly-out animation with game elements (zombies, bullets, grenades, pickups)
- ✅ **Audio System** - Web Audio API generated sounds (gunshots, damage, footsteps, restart, explosions)
- ✅ **High Score System** - Track and persist best run (localStorage)
- ✅ **Pause System** - ESC to pause/resume, in-game menu
- ✅ **Game Over Screen** - Integrated in HUD with restart option
- ✅ **Settings System** - Remappable keybinds and controller button mapping
- ✅ Beautiful visual effects and animations

### Coming Soon
- 🔜 Additional special zombie types (spitter, summoner, crawler)
- 🔜 Boss waves
- 🔜 Temporary power-up pickups

## 🚀 Getting Started

Simply open `zombie-game.html` in your web browser. No build process, no dependencies, just pure fun!

## 🛠️ Technology

- **HTML5 Canvas** - Rendering engine
- **Vanilla JavaScript** - Game logic
- **CSS3** - Styling and animations

## 📁 Project Structure

```
warped/
├── zombie-game.html              # Main game (all-in-one file)
├── roadmap.md                    # Feature roadmap
├── CHANGELOG.md                  # Version history
├── ARCHITECTURE.md                # Technical architecture
├── SUMMARY.md                     # Project overview
├── SCRATCHPAD.md                  # Development notes
├── SBOM.md                        # Software Bill of Materials
├── guns.md                        # Weapon system documentation
├── base-defense-design.md         # Base defense feature design
├── base-defense-implementation.md # Base defense implementation plan
├── GEMINI.md                      # AI assistant notes
├── QWEN.md                        # AI assistant notes
└── README.md                      # This file
```

## 🎨 Game Design

The game features:
- **Smooth controls** - Responsive WASD + mouse aiming
- **Visual polish** - Screen shake, particles, glows, and effects
- **Dynamic difficulty** - Zombies get faster and tougher each wave
- **Clean UI** - Both external and in-game HUD systems

## 📊 Game Mechanics

- **Health System** - Start with 100 HP, lose health when touched by zombies
- **Waves** - Survive increasingly difficult waves of zombies
- **Scoring** - 10 points per zombie kill
- **Spawning** - Zombies spawn from map edges

## 🔧 Development

Built following:
- **KISS** (Keep It Simple Stupid)
- **DOTI** (Don't Over Think It)
- **YAGI** (You Aren't Gonna Need It)

## 📝 Documentation

- See `ARCHITECTURE.md` for technical details
- See `CHANGELOG.md` for version history
- See `roadmap.md` for planned features
- See `SUMMARY.md` for project overview

## 🎯 Roadmap

Check `roadmap.md` for the full feature list including:
- Weapon variety
- Ammo system
- Health pickups
- Special zombies
- Boss waves
- And more!

## 🐛 Known Issues

- No pickups system yet (health/ammo drops)
- No special zombie types yet
- No boss waves implemented

## 📄 License

Free to use and modify!

---

**Made with ❤️ and zombies** 🧟

