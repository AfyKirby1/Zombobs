# 🧟 Zombie Survival Game - Feature Roadmap

## Core Gameplay Enhancements
- [x] **Weapon Variety** - Add different guns (pistol, shotgun, rifle) with different damage, fire rate, and ammo
- [x] **Ammo System** - Limited bullets that require reloading (auto-reload when empty, weapon-specific ammo)
- [x] **Health Pickups** - Medical kits/health packs spawn randomly on the map
- [ ] **Melee Attack** - Close-range melee when out of ammo (knife/bat with cooldown)
- [ ] **Special Zombie Types** - Fast zombies, tank zombies, exploding zombies with different behaviors
- [ ] **Zombie Slow-on-Hit** - Bullets briefly slow zombies (e.g., 0.5s at 30%) to create crowd-control moments
- [ ] **Weapon Accuracy Degradation** - Continuous firing reduces accuracy, requiring periodic pauses
- [ ] **Ammo Pickups from Zombies** - Zombies have a chance to drop small ammo packs on death that restore ammo for current weapon when collected
- [ ] **Player Health Regeneration** - Slow health regeneration when out of combat (no zombie damage for 5 seconds)

## Base Defense System
- [ ] **Base Perimeter Walls** - Four protective walls around player's base that absorb zombie damage ([Design Doc](base-defense-design.md))
- [ ] **Wall Health System** - Walls have health bars that deplete when zombies attack them ([Design Doc](base-defense-design.md))
- [ ] **Wall Repair Mechanic** - Player can repair damaged walls by interacting with them ([Design Doc](base-defense-design.md))
- [ ] **Wall Upgrades** - Reinforce walls to increase their health and damage resistance ([Design Doc](base-defense-design.md))
- [ ] **Gate Mechanism** - Controllable gates in walls for player movement in/out of base ([Design Doc](base-defense-design.md))
- [ ] **Wall Repair Pickups** - Simple drop items that restore a fixed amount of wall health
- [ ] **Deployable Cover** - Place temporary, low-health barricades to slow zombies

## Progression & Difficulty
- [ ] **Wave Break System** - Brief pause between waves to catch your breath and reload
- [ ] **Score Multiplier** - Combo system for consecutive kills without taking damage
- [ ] **Boss Waves** - Every 5 waves, spawn a massive boss zombie with high health
- [x] **Difficulty Scaling** - Zombies get progressively faster, tougher, and more numerous (implemented: speed = 1 + wave*0.1, health = 2 + floor(wave/3), zombiesPerWave increases)
- [ ] **Ammo Scarcity Scaling** - Gradually reduce ammo drop chance with higher waves for tension
- [ ] **Zombie Attraction System** - Noise from gunfire attracts more zombies over time
- [ ] **Kill Streak Counter** - Track consecutive kills and display streak count with bonus score multiplier
- [ ] **Weapon Jamming** - Chance for weapon to jam, requiring a quick key press to clear
- [ ] **Zombie Aggression Timer** - Zombies move faster toward player base over time within a wave

## Polish & Juice
- [x] **Sound Effects** - Gunshots, damage sounds, and walking footsteps (Web Audio API generated)
- [x] **Screen Shake** - Camera shake on shooting and taking damage for impact
- [x] **Blood Splatter** - Particle effects when zombies are hit/killed
- [x] **Muzzle Flash** - Visual effect when player shoots
- [ ] **Kill Confirmed Sound** - Distinct audio feedback (satisfying "pop" or "thud") when zombie is killed, separate from hit sound
- [ ] **Hit Markers & Impact SFX** - Quick visual marker and subtle sound on successful hits
- [ ] **Zombie Spawn Flash** - Brief visual indicator (glow/flash) where zombie will spawn before it appears
- [ ] **Zombie Death Sound** - Distinct sound effect when zombie is killed (different from hit sound) for kill confirmation

## UI & Feedback
- [x] **Ammo Counter** - Display current ammo / total ammo on HUD
- [x] **Damage Indicators** - Red flash or directional arrows when hit
- [x] **High Score System** - Track and display best run (localStorage)
- [x] **Pause Menu** - Press ESC to pause, resume, or restart
- [ ] **Reload Progress Indicator** - Visual progress bar or percentage showing reload completion time in HUD
- [x] **Low Ammo Warning** - Visual pulse/flash on ammo counter when ammo drops below 25% of magazine capacity
- [ ] **Wave Countdown Overlay** - 3-second overlay with reload hint between waves
- [ ] **Wave Progress Indicator** - Visual display of remaining zombies in current wave
- [ ] **Floating Damage Numbers** - Show damage dealt as numbers that float up from zombies when hit
- [x] **Aiming Crosshair** - Simple reticle/crosshair at mouse cursor position for better aiming reference
- [x] **Wave Start Notification** - Brief text overlay showing "Wave X Starting!" when new wave begins
- [ ] **Weapon Accuracy Indicator** - Visual feedback showing current weapon accuracy level during burst-fire sequences

## New Features
- [ ] **Zombie Horde Mechanic** - Periodic large groups of zombies attack simultaneously
- [ ] **Resource Scavenging** - Collect supplies from defeated zombies for crafting/upgrades
- [ ] **Day/Night Cycle** - Zombies become stronger and more numerous at night
- [ ] **Environmental Hazards** - Explosive barrels, electrified fences, and traps
- [ ] **Survivor Companion** - AI-controlled ally that assists in combat
- [ ] **Critical Hit System** - Chance for increased damage with visual feedback

## Future Ideas (Optional)
- [ ] **Power-ups** - Temporary speed boost, rapid fire, invincibility
- [ ] **Different Maps** - Multiple arenas with obstacles and cover
- [ ] **Perks System** - Unlock permanent upgrades between runs
- [ ] **Leaderboard** - Online or local high score tracking
- [ ] **Mobile Support** - Touch controls for mobile devices