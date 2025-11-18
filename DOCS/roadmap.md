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
- [ ] **Stamina/Sprint System** - A stamina bar that depletes when sprinting, forcing players to manage their movement more carefully.

## Base Defense System
- [ ] **Base Perimeter Walls** - Four protective walls around player's base that absorb zombie damage ([Design Doc](base-defense-design.md))
- [ ] **Wall Health System** - Walls have health bars that deplete when zombies attack them ([Design Doc](base-defense-design.md))
- [ ] **Wall Repair Mechanic** - Player can repair damaged walls by interacting with them ([Design Doc](base-defense-design.md))
- [ ] **Wall Upgrades** - Reinforce walls to increase their health and damage resistance ([Design Doc](base-defense-design.md))
- [ ] **Gate Mechanism** - Controllable gates in walls for player movement in/out of base ([Design Doc](base-defense-design.md))
- [ ] **Wall Repair Pickups** - Simple drop items that restore a fixed amount of wall health
- [ ] **Deployable Cover** - Place temporary, low-health barricades to slow zombies
- [ ] **Automated Turrets** - Placeable, automated turrets that fire at zombies within a certain range.

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
- [ ] **Bounty System** - A specific, marked "bounty" zombie appears each wave. Killing it grants a significant currency bonus.

## Polish & Juice
- [x] **Sound Effects** - Gunshots, damage sounds, and walking footsteps (Web Audio API generated)
- [x] **Screen Shake** - Camera shake on shooting and taking damage for impact
- [x] **Blood Splatter** - Particle effects when zombies are hit/killed
- [x] **Muzzle Flash** - Visual effect when player shoots
- [ ] **Kill Confirmed Sound** - Distinct audio feedback (satisfying "pop" or "thud") when zombie is killed, separate from hit sound
- [ ] **Hit Markers & Impact SFX** - Quick visual marker and subtle sound on successful hits
- [ ] **Zombie Spawn Flash** - Brief visual indicator (glow/flash) where zombie will spawn before it appears
- [ ] **Zombie Death Sound** - Distinct sound effect when zombie is killed (different from hit sound) for kill confirmation
- [x] **Shell Ejection** - Visual effect of bullet casings being ejected from the gun.

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
- [ ] **Off-screen Zombie Indicator** - Arrows or icons at the edge of the screen pointing towards off-screen zombies that are close to the player.

## New Features
- [ ] **Zombie Horde Mechanic** - Periodic large groups of zombies attack simultaneously
- [ ] **Resource Scavenging** - Collect supplies from defeated zombies for crafting/upgrades
- [ ] **Day/Night Cycle** - Zombies become stronger and more numerous at night
- [ ] **Environmental Hazards** - Explosive barrels, electrified fences, and traps
- [ ] **Survivor Companion** - AI-controlled ally that assists in combat
- [ ] **Critical Hit System** - Chance for increased damage with visual feedback
- [ ] **Crafting System** - Players can collect resources to craft ammo, health kits, or even basic weapons.

## Future Ideas (Optional)
- [ ] **Power-ups** - Temporary speed boost, rapid fire, invincibility
- [ ] **Different Maps** - Multiple arenas with obstacles and cover
- [ ] **Perks System** - Unlock permanent upgrades between runs
- [ ] **Leaderboard** - Online or local high score tracking
- [ ] **Mobile Support** - Touch controls for mobile devices
- [ ] **Procedurally Generated Maps** - Instead of a fixed map, generate a new layout for each run.

## Player Progression & Customization
- [ ] **Persistent Player Profile** - Save progress (unlocks, high scores) across sessions via localStorage.
- [ ] **Selectable Difficulty Modes** - Introduce "Easy", "Normal", and "Hard" modes that adjust zombie stats and spawn rates.
- [ ] **In-Game Currency & Shop** - Earn "scrap" from kills to spend at a shop between waves for weapons, ammo, and repairs.
- [ ] **Weapon Attachments** - Add findable or purchasable attachments like scopes (tighter accuracy) or extended magazines.
- [ ] **Player Skill Tree** - Use skill points earned from leveling up to unlock permanent passive bonuses (e.g., +5% speed).
- [ ] **Character Selection** - Choose from characters with unique starting weapons or passive abilities.
- [ ] **Prestige System** - After reaching the max level, players can "prestige" to reset their level but gain a permanent bonus or cosmetic reward.

## Gameplay Variety & Depth
- [ ] **Minimap/Compass** - A simple UI element to show player position relative to the base.
- [ ] **Advanced Looting System** - Search destroyed objects or special zombies for bonus ammo, health, or currency.
- [ ] **Narrative Story Mode** - A separate mode with handcrafted levels and specific objectives.
- [ ] **Advanced Weather Effects** - Implement dynamic weather like rain (reduces visibility) or fog that cycles periodically.
- [ ] **Destructible Environment** - Add objects like fences or crates that can be destroyed by players and zombies.
- [ ] **Stealth Mechanics** - Zombies are initially unaware of the player unless they make noise or get too close, rewarding strategic repositioning.
- [ ] **Placeable Traps** - Purchase and deploy temporary traps like caltrops (slows zombies) or laser tripwires.
- [ ] **NPC Survivors** - Simple AI characters in the base who provide small passive benefits (e.g., slowly repair walls).
- [ ] **Single-Use Vehicle** - A rare chance for a vehicle like a forklift to spawn, allowing the player to clear a large number of zombies before it breaks.
- [ ] **Side Objectives** - During a wave, optional objectives can appear, like "Protect the generator" or "Rescue a survivor".

## Long-Term Engagement
- [ ] **Advanced Sound Design** - Add more detailed audio cues, like distinct footstep sounds and more varied zombie vocalizations.
- [ ] **Local Co-op Multiplayer** - Allow a second player to join the game on the same screen.
- [ ] **Online Leaderboards** - Integrate a service to display global high scores.
- [ ] **Achievements System** - Add in-game achievements for completing specific challenges.
- [ ] **Daily/Weekly Challenges** - Offer special challenges with currency rewards (e.g., "Survive 5 waves with only a pistol").
- [ ] **Seasonal Events** - Time-limited events with special themes, enemies, and rewards (e.g., a Halloween event with pumpkin-headed zombies).