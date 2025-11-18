# Development Scratchpad

*This file is for continuous reference and quick notes. Never delete, only compact old updates.*

## 2024 - Active Development Notes

### HUD Implementation
- Created modular `GameHUD` class component
- Renders directly on canvas (not DOM)
- Top-left positioning for non-intrusive overlay
- Dynamic color changes (health warning, ammo empty warning)
- Glow effects match game aesthetic

### Ammo System Status
- ✅ Fully implemented
- Weapon-specific ammo (Pistol: 10, Shotgun: 5, Rifle: 30)
- Ammo consumption on each shot
- Manual reload with R key
- Auto-reload when empty
- 1 second reload time for all weapons
- Reload timer runs in game update loop (completes automatically)
- Displayed in in-game HUD with weapon name

### Damage Indicator
- Red flash overlay on damage
- Intensity-based fade-out
- Decay rate: 0.95 per frame
- Triggered on player-zombie collision

### Screen Shake
- ✅ Implemented
- Intensity: 3 (shoot), 8 (damage)
- Decay rate: 0.9 per frame
- Applied via canvas transform

### Visual Effects
- Particle system for kill/damage effects
- Zombie aura (pulsing green glow)
- Zombie eyes (animated red glow)
- Player glow (blue aura)
- Gradient backgrounds and vignette

### Technical Notes
- Canvas size: 800x600
- Game loop: requestAnimationFrame
- Collision: Circle-based distance calculation
- Zombies spawn from edges
- Wave progression: +2 zombies per wave, speed/health scale
- Particles: Supports both Particle class and custom objects (blood)
- Reload system: Uses Date.now() for accurate timing
- Mouse firing: Continuous check in update loop while mouse.isDown

### UI Systems
- External HUD: Below canvas (HTML elements)
- In-game HUD: On canvas (GameHUD component)
- Game Over: Modal overlay
- Both HUDs update via `updateUI()` function

### Color Scheme
- Health: Red (#ff1744, brightens to #ff0000 when low)
- Ammo: Orange (#ff9800, darkens to #ff5722 when empty)
- Kills: Green (#76ff03)
- Wave: Yellow (#ffc107)
- Zombies: Green tones with red eyes
- Player: Blue tones

### Weapon System
- ✅ Fully implemented
- 3 weapons: Pistol, Shotgun, Rifle
- Unique damage, fire rate, ammo for each
- Shotgun fires 5 spread bullets
- Weapon switching with 1/2/3 keys
- Weapon-specific reload times (all 1 second)

### Audio System
- ✅ Fully implemented
- Web Audio API generated sounds (no external files)
- Gunshot, damage, footsteps, restart sounds
- All programmatically generated
- Initializes on first user interaction

### Input System
- WASD/Arrow keys: Movement
- Mouse: Aiming
- Click/Hold: Shoot (continuous firing)
- 1/2/3: Weapon switching
- R: Reload (or restart when paused/game over)
- ESC: Pause/Resume

### Wave Break System
- ✅ Implemented
- 3-second pause between waves
- Visual countdown and "Wave Cleared" text
- Allows reloading and mental break

### Known Areas for Enhancement
- Special zombie types
- Boss waves
- Score multiplier

### Code Quality Notes
- All-in-one file structure (KISS principle)
- Clean separation of classes
- Consistent naming conventions
- Comments for clarity
- No external dependencies (pure vanilla JS)

