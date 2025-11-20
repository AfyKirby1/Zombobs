# 🧟 ZOMBOBS - Development Roadmap

**Legend:**

- 🟢 **Novice** (UI tweaks, CSS, simple logic)
- 🟡 **Survivor** (New mechanics, state expansion, canvas updates)
- 🔴 **Veteran** (Complex algorithms, networking, heavy systems)
- ⚫ **Nightmare** (Extreme difficulty, unforgiving mechanics)
- 🟣 **Mystery** (Easter eggs, secrets, anomalies, classified content)

---

## Phase 1: Survival Essentials (Core Loop) 💀

- [x] **Health Pickups** - Medical kits/health packs spawn randomly on the map 🟢
- [x] **Ammo System** - Limited bullets that require reloading (auto-reload when empty, weapon-specific ammo) 🟡
- [x] **Ammo Pickups** - Ammo boxes spawn periodically when player has low ammo, restoring ammo for current weapon when collected 🟡
- [x] **Ammo Counter** - Display current ammo / total ammo on HUD 🟢
- [x] **Health Regeneration** - Slow health regeneration when out of combat (no zombie damage for 5 seconds) 🟡
- [x] **Stamina/Sprint System** - A stamina bar that depletes when sprinting, forcing players to manage their movement more carefully 🟡
- [x] **Damage Indicators** - Red flash or directional arrows when hit 🟢
- [x] **High Score System** - Track and display best run (localStorage) 🟡
- [x] **Pause Menu** - Press ESC to pause, resume, or restart 🟢
- [x] **Reload Progress Indicator** - Visual progress bar or percentage showing reload completion time in HUD 🟢
- [x] **Low Ammo Warning** - Visual pulse/flash on ammo counter when ammo drops below 25% of magazine capacity 🟢
- [x] **Wave Countdown Overlay** - 3-second overlay with reload hint between waves 🟢
- [x] **Wave Progress Indicator** - Visual display of remaining zombies in current wave 🟢
- [x] **Wave Start Notification** - Brief text overlay showing "Wave X Starting!" when new wave begins 🟢
- [x] **Aiming Crosshair** - Simple reticle/crosshair at mouse cursor position for better aiming reference 🟢
- [x] **Off-screen Zombie Indicator** - Arrows or icons at the edge of the screen pointing towards off-screen zombies that are close to the player 🟡
- [ ] **Player Health Regeneration** - Slow health regeneration when out of combat (no zombie damage for 5 seconds) 🟡
- [ ] **Weapon Accuracy Indicator** - Visual feedback showing current weapon accuracy level during burst-fire sequences 🟡
- [ ] **Minimap/Compass** - A simple UI element to show player position relative to the base 🟡

---

## Phase 2: Tools of Destruction (Arsenal) 🔫

- [x] **Weapon Variety** - Add different guns (pistol, shotgun, rifle) with different damage, fire rate, and ammo 🟡
- [x] **Melee Attack** - Close-range melee attack (V key or right-click) with swipe animation, 500ms cooldown, 3 damage, 40px range 🟡
- [x] **Scroll Wheel Switching** - Cycle weapons with mouse wheel (toggleable in settings) 🟢
- [x] **Background Reload** - Weapons reload automatically when holstered 🟡
- [x] **Weapon Accuracy Degradation** - Continuous firing reduces accuracy, requiring periodic pauses 🟡
- [x] **Grenades** - Throwable explosives (G key) with arc trajectory, AOE damage, and fuse timer. 3 per game, 2s cooldown 🟡
- [x] **Flamethrower / DoT Weapons** - Short-range weapons that apply burning damage over time to groups of zombies at close range 🟡
- [x] **Temporary Power-Up Pickups** - Short-duration buffs like double damage, rapid fire, or movement speed boost that drop rarely from zombies 🟡
- [x] **Armor / Shield Pickups** - Pickups that grant a temporary overshield layer which absorbs a portion of incoming damage before health 🟡
- [ ] **Rocket Launcher** - More powerful explosive weapon with self-damage risk 🔴
- [ ] **Alternate Fire Modes** - Weapons with secondary fire (burst, single-shot, charged shot) toggled via right-click or a hotkey 🟡
- [ ] **Elemental Ammo Types** - Special ammo pickups (incendiary, shock, freeze) that temporarily change how the current weapon behaves 🟡
- [ ] **Ammo Crates** - Rare, high-value pickups that fully refill ammo for the current weapon or all weapons in your inventory 🟢
- [ ] **Risk/Reward Pickups** - Powerful pickups placed in dangerous positions (edges of the map or near spawners) to encourage risky plays 🟡
- [ ] **Weapon Attachments** - Add findable or purchasable attachments like scopes (tighter accuracy) or extended magazines 🟡
- [ ] **Weapon Jamming** - Chance for weapon to jam, requiring a quick key press to clear 🟡
- [ ] **Critical Hit System** - Chance for increased damage with visual feedback 🟡
- [ ] **Chainsaw** - Melee weapon dealing high damage but requiring fuel 🟡
- [ ] **Decoy Grenade** - Thrown tool that attracts zombies to its location before exploding 🟡
- [ ] **Dual Wielding** - Ability to use two one-handed weapons simultaneously (e.g., pistols) 🟡
- [ ] **Laser Sword** - High-tech melee weapon that cuts through multiple enemies 🔴
- [ ] **Gravity Gun** - Pick up and throw objects (or zombies) at other zombies 🔴
- [ ] **Minigun** - Heavy weapon with massive fire rate but slows movement speed 🟡
- [ ] **Orbital Strike** - Call down a devastating laser beam from space 🔴
- [ ] **Smoke Grenade** - Creates a visual cover that confuses zombie pathfinding 🟢
- [ ] **Weapon Crafting System** - Combine weapon parts to create custom guns with unique stats 🔴

---

## Phase 3: The Horde Evolves (Enemies & AI) 🧠

- [x] **Special Zombie Types** - Fast zombies, tank zombies, exploding zombies with different behaviors 🟡
- [x] **Zombie Slow-on-Hit** - Bullets briefly slow zombies (e.g., 0.5s at 30%) to create crowd-control moments 🟡
- [x] **Armored Zombies** - Slower, heavily armored zombies whose armor absorbs most incoming damage before their health is affected 🟡
- [x] **Spitter Zombies** - Ranged infected that lob corrosive projectiles, forcing the player to move and break out of safe positions 🟡
- [x] **Boss Waves** - Every 5 waves, spawn a massive boss zombie with high health 🟡
- [x] **Difficulty Scaling** - Zombies get progressively faster, tougher, and more numerous (implemented: speed = 1 + wave*0.1, health = 2 + floor(wave/3), zombiesPerWave increases) 🟡
- [x] **Day/Night Cycle** - Zombies become stronger and more numerous at night 🟡
- [ ] **Summoner/Necromancer Zombies** - Rare support enemies that periodically revive or buff nearby zombies if not prioritized and killed quickly 🔴
- [ ] **Crawler Variants** - Low-profile crawlers that are hard to spot in the grass and can slip through tight gaps in base defenses 🟡
- [ ] **Zombie Attraction System** - Noise from gunfire attracts more zombies over time 🟡
- [ ] **Zombie Aggression Timer** - Zombies move faster toward player base over time within a wave 🟡
- [ ] **Zombie Horde Mechanic** - Periodic large groups of zombies attack simultaneously 🟡
- [ ] **Stealth Mechanics** - Zombies are initially unaware of the player unless they make noise or get too close, rewarding strategic repositioning 🔴
- [ ] **Advanced Looting System** - Search destroyed objects or special zombies for bonus ammo, health, or currency 🟡
- [ ] **Sewer Rat Swarm** - Small, fast, hard-to-hit enemies that swarm the player 🟡
- [ ] **Medic Zombie** - Support enemy that heals nearby zombies 🔴
- [ ] **Mutated Boss: The Colossus** - Massive, slow-moving tank enemy with devastating area attacks 🔴
- [ ] **Infected Dogs** - Extremely fast enemies that lunge at the player 🟡
- [ ] **Adaptive AI Director** - Dynamic system that adjusts spawn rates and intensity based on player stress levels 🔴
- [ ] **Parasitic Infestation** - Enemies that split into smaller creatures upon death 🔴
- [ ] **Flying Gargoyles** - Aerial enemies that swoop down and pick up players 🔴
- [ ] **Zombie Mutation System** - Zombies evolve new abilities mid-wave 🔴

---

## Phase 4: Fortification (Base Building) 🏰

- [ ] **Base Perimeter Walls** - Four protective walls around player's base that absorb zombie damage 🔴
- [ ] **Wall Health System** - Walls have health bars that deplete when zombies attack them 🟡
- [ ] **Wall Repair Mechanic** - Player can repair damaged walls by interacting with them 🟡
- [ ] **Wall Upgrades** - Reinforce walls to increase their health and damage resistance 🟡
- [ ] **Gate Mechanism** - Controllable gates in walls for player movement in/out of base 🟡
- [ ] **Wall Repair Pickups** - Simple drop items that restore a fixed amount of wall health 🟢
- [ ] **Deployable Cover** - Place temporary, low-health barricades to slow zombies 🟡
- [ ] **Automated Turrets** - Placeable, automated turrets that fire at zombies within a certain range 🔴
- [ ] **Placeable Traps** - Purchase and deploy temporary traps like caltrops (slows zombies) or laser tripwires 🟡
- [ ] **Destructible Environment** - Add objects like fences or crates that can be destroyed by players and zombies 🟡
- [ ] **Environmental Hazards** - Explosive barrels, electrified fences, and traps 🟡
- [ ] **NPC Survivors** - Simple AI characters in the base who provide small passive benefits (e.g., slowly repair walls) 🔴
- [ ] **Tesla Coil** - Defensive structure that zaps nearby enemies with chain lightning 🔴
- [ ] **Landmines** - Placeable explosive traps that trigger when zombies step on them 🟡
- [ ] **Sniper Tower** - Elevated structure allowing long-range defense 🔴
- [ ] **Barbed Wire** - Placeable hazard that slows and damages zombies 🟢
- [ ] **Hydraulic Physics** - Destructible buildings with realistic collapse mechanics 🔴
- [ ] **Power Grid Management** - Maintain generators to keep lights and turrets active 🔴
- [ ] **Moat Building** - Dig trenches and fill them with water (or lava) 🔴
- [ ] **Underground Bunkers** - Construct multi-level subterranean bases 🔴
- [ ] **Automation Logic Gates** - Programmable wiring system (AND/OR/NOT gates) for advanced trap triggers 🔴
- [ ] **Hydroponics & Farming** - Grow food and medicinal herbs within the safety of the base 🟡
- [ ] **Recycler Unit** - Breakdown useless loot into raw materials for crafting 🟡
- [ ] **Teleporter Pads** - Build instant travel points between distant base sections 🔴
- [ ] **Safe Zone Building** - Construct and upgrade a persistent home base 🔴
- [ ] **Shield Generator** - Base structure providing temporary player overshield 🔴

---

## Phase 5: Global Infection (Multiplayer) 🌐

- [x] **Local Co-op Multiplayer** - Allow a second player to join the game on the same screen 🟡
- [ ] **Online Multiplayer** - Full networked gameplay (lobby system ready) 🔴
- [ ] **Cross-Platform Sync** - Synchronize game state across different platforms 🔴
- [ ] **Guilds & Clans** - Form groups with other survivors 🔴
- [ ] **Online Leaderboards** - Integrate a service to display global high scores 🔴
- [ ] **Achievements System** - Add in-game achievements for completing specific challenges 🟡
- [ ] **Daily/Weekly Challenges** - Offer special challenges with currency rewards (e.g., "Survive 5 waves with only a pistol") 🟡
- [ ] **Battle Royale Mode** - PvP mode where players fight to be the last survivor amidst the horde 🔴
- [ ] **Global Event System** - Live server-side events affecting all ongoing games (e.g., "Blood Moon") 🔴
- [ ] **Spectator Mode** - Watch other players' games in real-time after dying 🟢
- [ ] **Voice Chat** - Proximity-based voice communication for multiplayer 🔴
- [ ] **Revive/Rescue System** - Downed players/AI companions enter a "downed" state (30-45s bleed-out timer). Teammates can revive by holding interact near downed teammate (3-5s channel). Adds critical co-op teamwork mechanic with visual feedback (downed state indicator, revive progress bar) 🟡
- [ ] **Shared Resource Pool & Item Sharing** - Players and AI companions draw from a shared ammo pool (configurable). Players can share ammo/health with teammates, drop items for others to pick up, and use medkits on teammates. UI shows shared resource bar with total ammo/medkits 🟡
- [ ] **Tactical Ping/Marker System** - Players can mark zombies, locations, or resources with visual indicators and audio cues for better coordination in co-op. Contextual commands like "Revive [Player Name]" when teammate is down 🟢
- [ ] **Character Customization** - Skins, outfits, and avatar personalization 🟡

---

## Phase 5.5: Experience & Meta-Progression 📊

### Core XP Mechanics

- [ ] **XP Gain System** - Earn XP from kills, scaled by zombie type and wave number (e.g., Normal = 10 XP, Fast = 15 XP, Armored = 25 XP, Boss = 100 XP) 🟡
- [ ] **Level-Up System** - Visual feedback and sound effects when leveling up, with satisfying animations 🟢
- [ ] **Persistent XP Tracking** - Save XP and level progress across runs using localStorage 🟡
- [ ] **XP Multipliers** - Bonus XP for combos, headshots, and special achievements (e.g., 2x for kill streaks, 1.5x for headshots) 🟡
- [ ] **Level Cap** - Set maximum level (e.g., Level 50) before prestige becomes available 🔴
- [ ] **XP Display in HUD** - Show current XP, level, and progress to next level during gameplay 🟢
- [ ] **Post-Game XP Summary** - Display XP gained breakdown after each run ends 🟢

### Currency System ("Scrap")

- [ ] **Scrap Earnings** - Earn scrap from kills (scaled by zombie type) and wave completion bonuses 🟡
- [ ] **Persistent Scrap Balance** - Save scrap balance across sessions using localStorage 🟡
- [ ] **Visual Scrap Counter** - Display current scrap balance in HUD during gameplay 🟢
- [ ] **Post-Game Scrap Summary** - Show scrap earned breakdown after each run ends 🟢
- [ ] **Scrap Multiplier Upgrades** - Permanent upgrades that increase scrap earnings per kill 🟡

### Permanent Upgrade Shop

- [ ] **Between-Run Upgrade Menu** - Accessible upgrade shop from main menu between runs 🟢
- [ ] **Tiered Upgrade System** - Multiple levels per upgrade with increasing costs 🟡
- [ ] **Upgrade Categories** - Organize upgrades into Combat, Survival, Utility, and Special categories 🟢

**Combat Upgrades:**

- [ ] **Max Health** - Increase maximum health (+10 HP per level, 5 levels max) 🟡
- [ ] **Critical Hit Chance** - Increase crit chance (+2% per level, 5 levels max) 🟡
- [ ] **Damage Multiplier** - Increase base weapon damage (+5% per level, 5 levels max) 🟡
- [ ] **Reload Speed** - Faster reload times (+10% per level, 5 levels max) 🟡
- [ ] **Starting Weapon Unlock** - Unlock better starting weapons (Rifle, Shotgun, Flamethrower) 🟡

**Survival Upgrades:**

- [ ] **Movement Speed** - Increase base movement speed (+3% per level, 5 levels max) 🟡
- [ ] **Stamina Capacity** - Increase max stamina (+20% per level, 3 levels max) 🟡
- [ ] **Health Regeneration Rate** - Faster out-of-combat health regen (+25% per level, 3 levels max) 🟡
- [ ] **Shield Capacity** - Increase max shield from shield pickups (+25 per level, 3 levels max) 🟡

**Utility Upgrades:**

- [ ] **Starting Ammo** - Increase starting ammo for all weapons (+20% per level, 3 levels max) 🟡
- [ ] **Grenade Capacity** - Start with more grenades (+1 per level, 3 levels max) 🟡
- [ ] **Ammo Drop Rate** - Increase chance of ammo pickups spawning (+10% per level, 5 levels max) 🟡
- [ ] **Health Drop Rate** - Increase chance of health pickups spawning (+10% per level, 5 levels max) 🟡

**Special Upgrades:**

- [ ] **Scrap Multiplier** - Increase scrap earnings (+10% per level, 5 levels max) 🟡
- [ ] **XP Multiplier** - Increase XP gain rate (+15% per level, 3 levels max) 🟡
- [ ] **Power-Up Duration** - Increase duration of temporary power-ups (+20% per level, 3 levels max) 🟡
- [ ] **Starting Power-Up** - Start each run with a random power-up active 🟡

### Prestige/Mastery System

- [ ] **Prestige Option** - After reaching max level, option to prestige and reset level for permanent bonuses 🔴
- [ ] **Prestige Tiers** - Multiple prestige tiers (Prestige 1, 2, 3, etc.) with unique cosmetic rewards 🔴
- [ ] **Prestige Bonuses** - Permanent bonuses that persist across prestiges (e.g., +5% scrap multiplier per prestige) 🔴
- [ ] **Prestige-Only Upgrades** - Exclusive upgrades only available after prestiging 🔴
- [ ] **Prestige Visual Indicators** - Show prestige tier in player profile and HUD 🟢

### Player Profile & Stats

- [ ] **Persistent Player Profile** - Save progress (unlocks, high scores, stats) across sessions via localStorage 🟡
- [ ] **Lifetime Statistics** - Track total kills, waves survived, time played, favorite weapon, etc. 🟡
- [ ] **Achievement Progress Display** - Show progress toward achievements in profile 🟢
- [ ] **Stat Categories** - Organize stats into Combat, Survival, Exploration, and Special categories 🟢
- [ ] **Leaderboard Integration** - Display player stats in context of global/local leaderboards 🟡

### Game Modes & Economy

- [ ] **Survival Mode** - Resource management with hunger/thirst/temperature mechanics 🔴
- [ ] **Trading System** - NPC merchants, economy, rare item marketplace 🔴
- [ ] **In-Game Economy/Shop** - Buy/sell/trade items with currency earned 🟡

---

## Phase 6: Progression & Polish 🎨

- [ ] **Tutorial Level** - Guided intro for new players 🟢
- [ ] **Save/Load Progress** - Checkpoint system for sessions 🟡
- [ ] **Horde Rush Mode** - Endless waves with escalating intensity 🔴
- [ ] **Dynamic Events** - Random encounters and emergencies 🟡
- [ ] **Seasonal Events** - Limited-time themes, enemies, or rewards 🟡
- [x] **Wave Break System** - Brief pause between waves to catch your breath and reload 🟢
- [x] **Sound Effects** - Gunshots, damage sounds, and walking footsteps (Web Audio API generated) 🟡
- [x] **Screen Shake** - Camera shake on shooting and taking damage for impact 🟢
- [x] **Blood Splatter** - Particle effects when zombies are hit/killed 🟡
- [x] **Muzzle Flash** - Visual effect when player shoots 🟢
- [x] **Kill Confirmed Sound** - Distinct audio feedback (satisfying "pop" or "thud") when zombie is killed, separate from hit sound 🟢
- [x] **Zombie Spawn Flash** - Brief visual indicator (glow/flash) where zombie will spawn before it appears 🟢
- [x] **Zombie Death Sound** - Distinct sound effect when zombie is killed (different from hit sound) for kill confirmation 🟢
- [x] **Shell Ejection** - Visual effect of bullet casings being ejected from the gun 🟢
- [x] **Floating Damage Numbers** - Show damage dealt as numbers that float up from zombies when hit 🟢
- [ ] **Score Multiplier** - Combo system for consecutive kills without taking damage 🟡
- [ ] **Kill Streak Counter** - Track consecutive kills and display streak count with bonus score multiplier 🟡
- [ ] **Ammo Scarcity Scaling** - Gradually reduce ammo drop chance with higher waves for tension 🟡
- [ ] **Bounty System** - A specific, marked "bounty" zombie appears each wave. Killing it grants a significant currency bonus 🟡
- [x] **Hit Markers & Impact SFX** - Quick visual marker and subtle sound on successful hits 🟢
- [ ] **Resource Scavenging** - Collect supplies from defeated zombies for crafting/upgrades 🟡
- [ ] **Inventory Management** - Limited carrying capacity, item weight system 🟡
- [ ] **Crafting System** - Players can collect resources to craft ammo, health kits, or even basic weapons 🔴
- [ ] **Selectable Difficulty Modes** - Introduce "Easy", "Normal", and "Hard" modes that adjust zombie stats and spawn rates 🟡
- [ ] **Character Selection** - Choose from characters with unique starting weapons or passive abilities 🟡
- [ ] **Narrative Story Mode** - A separate mode with handcrafted levels and specific objectives 🔴
- [ ] **Advanced Weather Effects** - Implement dynamic weather like rain (reduces visibility) or fog that cycles periodically 🟡
- [ ] **Advanced Sound Design** - Add more detailed audio cues, like distinct footstep sounds and more varied zombie vocalizations 🟡
- [ ] **Survivor Companion** - AI-controlled ally that assists in combat 🔴
- [ ] **AI Companion Roles/Classes** - Different AI companion specializations: Medic (heals, revives faster), Heavy Gunner/Tank (tanky, high damage), Scout (fast, marks enemies), Engineer (repairs base, sets traps). Choose 1-3 companions before starting, each with unique abilities and visual distinction (colors/icons per class) 🔴
- [ ] **AI Companion Command System** - Give tactical commands to AI companions via hotkeys or radial menu: "Follow", "Hold Position", "Cover Me", "Scavenge", "Defend Area", "Focus Fire". Visual indicators (command icons above companions) and brief audio confirmations for better control 🟡
- [ ] **AI Companion Upgrade System** - Upgrade AI companions between waves with improved stats, abilities, or equipment. Progression system that enhances companion effectiveness over time 🟡
- [ ] **AI Companion Trust/Loyalty System** - Trust meter increases when players revive companions, share resources, or complete objectives together. Higher trust = better accuracy, faster reactions, more aggressive support. Trust decreases if companions are left to die or ignored. Visual trust indicator in companion HUD 🟡
- [ ] **Single-Use Vehicle** - A rare chance for a vehicle like a forklift to spawn, allowing the player to clear a large number of zombies before it breaks 🟡
- [ ] **Side Objectives** - During a wave, optional objectives can appear, like "Protect the generator" or "Rescue a survivor" 🟡
- [ ] **Different Maps** - Multiple arenas with obstacles and cover 🔴
- [ ] **Procedurally Generated Maps** - Instead of a fixed map, generate a new layout for each run 🔴
- [ ] **Mobile Support** - Touch controls for mobile devices 🔴
- [ ] **Radioactive Storm** - Weather event that drains health slowly unless under cover 🔴
- [ ] **Night Vision Goggles** - Toggleable item for better visibility during the night cycle 🟢
- [x] **Adrenaline Shot** - Consumable that gives a temporary speed and reload boost 🟢
- [ ] **Acid Rain** - Weather hazard that damages entities outside of cover 🟡
- [ ] **Drone Support** - Automated flying ally that shoots at nearby enemies 🔴
- [ ] **Map Editor** - comprehensive tool for players to design and share their own survival arenas 🔴
- [ ] **Procedural City Generation** - Infinite, dynamically generated urban environments to explore 🔴
- [ ] **Vehicle System** - Repair and drive cars, trucks, and motorcycles to traverse large maps 🔴
- [ ] **Dynamic Faction System** - NPC groups that fight each other and the undead 🔴
- [ ] **WebGPU Rendering Backend** - Rewriting the graphics engine for next-gen lighting and millions of particles 🔴
- [ ] **VR / XR Support** - Full Virtual Reality integration with motion controller tracking 🔴
- [ ] **Dismemberment Engine** - Procedural limb destruction and gore physics 🔴

### Visual & Audio Immersion 🎨

- [ ] **Background Music** - Looping tracks for immersion 🟢
- [ ] **Voice Acting or Enhanced Audio** - Better sound experience and immersion 🟡
- [ ] **Dynamic Shadows** - Shadows that lengthen and move with the day/night cycle 🟡
- [ ] **Interactive Vegetation** - Grass and bushes sway and flatten when entities move through them 🟡
- [ ] **Footprint Tracking** - Bloody footprints left by players and zombies after walking through gore 🟢
- [ ] **Volumetric Fog** - Fog that reacts to light sources and player movement for spooky atmosphere 🔴
- [ ] **Neon City Biome** - A unique zone with flickering neon signs and rain-slicked streets 🔴
- [ ] **Graffiti & Lore Decals** - Environmental storytelling through scrawled messages and warnings on walls 🟢
- [ ] **Seasonal Themes** - Map visual changes based on real-world holidays (snow, pumpkins, confetti) 🟢
- [ ] **Aurora Borealis** - Rare night sky event that lights up the darkness with colorful ribbons 🟢

### Interactive World 🌍

- [ ] **Shatterable Glass** - Windows and glass surfaces break dynamically when shot or impacted 🟡
- [ ] **Debris Physics** - Shell casings, magazines, and small objects react to explosions and movement 🟡
- [ ] **Fire Propagation** - Fire from flamethrowers or explosions spreads to nearby flammable materials 🔴
- [ ] **Destructible Lights** - Shoot out streetlights or lamps to create darkness for stealth or ambush 🟡
- [ ] **Environmental Traps** - Interactable objects like hanging logs or cars that can be triggered to crush enemies 🟡
- [ ] **Wildlife System** - Neutral animals (rats, crows, deer) that react to gunfire and zombie presence 🟡

### Advanced Gameplay Depth ⚙️

- [ ] **Flashlight Battery System** - Manage battery life for light sources, adding tension to night exploration 🟡
- [ ] **Weapon Overheating** - Continuous fire heats up weapon barrels, visible glowing and smoke effects 🟡
- [ ] **Radio Frequencies** - Tune into different channels for music, distress signals, or lore broadcasts 🟢
- [ ] **Radio Communication** - Lore delivery and mission briefings 🟢
- [ ] **Lockpicking Minigame** - Interactive system to open locked doors or crates for high-tier loot 🟡
- [ ] **Binoculars / Scouting** - Tool to observe distant enemy types and numbers before engaging 🟢
- [ ] **Photo Mode** - Pause the action to take cinematic screenshots with camera controls and filters 🟢
- [ ] **Replay System** - Watch back and analyze previous play sessions 🔴

### Advanced Physics & Tech 🧪

- [ ] **Fluid Dynamics** - Blood and water flow downhill, pool in depressions, and react to explosions 🔴
- [ ] **Wind System** - Wind speed affects projectile trajectory and spreads smoke/fire dynamically 🔴
- [ ] **Bullet Penetration** - High-caliber rounds shoot through thin walls, doors, and multiple zombies 🟡
- [ ] **Ricochets** - Bullets can bounce off metal surfaces, creating sparks and potential collateral damage 🟡
- [ ] **Mud & Dirt Accumulation** - Mud and gore build up on character models and weapons over time 🟢
- [ ] **Procedural Skybox** - Real-time cloud generation and accurate star maps based on in-game time/season 🟡

### Character & Interaction Polish 🎭

- [ ] **Door Breaching** - Choose between kicking doors open (loud, fast) or peeking/opening slowly (quiet) 🟡
- [ ] **Weapon Inspection** - Animation to admire your weapon and visually check ammo count (HUD-less support) 🟢
- [ ] **Gesture System** - Non-verbal emotes (point, wave, halt) for tactical communication in co-op 🟢
- [ ] **Body Temperature Visuals** - Visible breath in cold weather, sweating in heat, adding to survival immersion 🟢
- [ ] **Sitting & Resting** - Interact with chairs/benches to sit and recover stamina faster 🟢
- [ ] **Ladder Sliding** - Fast descent option for ladders at the risk of fall damage 🟢
- [ ] **Playable Instruments** - Interactive pianos or guitars found in the world for brief musical moments 🟢

### Atmospheric World Building 🌫️

- [ ] **Distant Ambience** - Soundscape of a dying world: distant gunshots, sirens, and screams add tension 🟢
- [ ] **Reactive Wildlife** - Birds flock and scatter when enemies approach, serving as natural alarm systems 🟡
- [ ] **Scavenging Rats** - Rats congregate around corpses and flee from light, enhancing the grim tone 🟢
- [ ] **Fireflies & Night Insects** - Ambient bioluminescence near water and forests at night 🟢
- [ ] **Thunderstorms & Lightning** - Dynamic storms with lightning strikes that can damage entities 🟡
- [ ] **Lore Newspapers & Notes** - Readable items scattered in the world providing backstory on the outbreak 🟢
- [ ] **Story or Lore Codex** - In-game encyclopedia of world info/history 🟢
- [ ] **Destructible Electronics** - Shooting TVs/Computers causes sparks and small explosions 🟢

---

## Phase 6.5: Engine & Architecture Overhaul 🔧

### Core Engine Optimization 🚀

- [ ] **Entity Component System (ECS) Refactor** - Transition core game logic from OOP to ECS for better cache locality and performance 🔴
- [ ] **WebAssembly (Wasm) Physics** - Move heavy physics/collision calculations to a Rust/C++ Wasm module 🔴
- [ ] **OffscreenCanvas Rendering** - Offload rendering logic to a Web Worker to prevent UI thread blocking 🔴
- [ ] **Spatial Partitioning System** - Implement Quadtree/Octree for optimized collision detection and entity queries 🟡
- [ ] **Object Pooling 2.0** - Advanced global pooling system for zero-allocation gameplay loops (bullets, particles) 🟡
- [ ] **Binary Data Serialization** - Use FlatBuffers/Protocol Buffers instead of JSON for faster save/load and network sync 🔴
- [ ] **GPU Particle System** - Move particle simulation to Compute Shaders (WebGPU) or Transform Feedback (WebGL2) 🔴
- [ ] **LOD (Level of Detail) System** - Automatically downgrade animation/model quality based on entity distance 🟡
- [ ] **Asset Streaming System** - Load textures and audio on-demand based on proximity rather than upfront loading 🟡
- [ ] **Input System Rewrite** - Abstracted input handling to support remappable keys, gamepads, and touch interchangeably 🟡

### Backend & Multiplayer Infrastructure 🖥️

- [ ] **Authoritative Server Architecture** - Move game logic to server-side to prevent cheating and sync state 🔴
- [ ] **Client-Side Prediction** - Implement movement smoothing and input prediction to hide network latency 🔴
- [ ] **Delta Compression** - Only transmit changed state data over the network to minimize bandwidth usage 🔴
- [ ] **Area of Interest (AoI) Management** - Network culling system to only send updates for entities visible to the player 🔴
- [ ] **WebTransport Support** - Experiment with HTTP/3 WebTransport for lower latency and unreliable data streams 🔴
- [ ] **Redis State Layer** - Use Redis for fast, ephemeral game state storage (lobbies, player presence) 🔴
- [ ] **Database Sharding** - Prepare database architecture for horizontal scaling of player profiles 🔴
- [ ] **Anti-Cheat Verification** - Server-side validation of movement speed, fire rate, and hit detection 🔴
- [ ] **Headless Simulation** - Run simplified game simulation on server without graphics for collision checks 🔴
- [ ] **Matchmaking Service** - Dedicated service to group players by skill (Elo) and latency 🔴

### Developer Experience & Tooling 🛠️

- [ ] **CI/CD Pipeline** - Automated testing and deployment to production servers on git push 🟡
- [ ] **Crash Reporting Service** - Integrate remote logging to catch and analyze client-side errors in production 🟡
- [ ] **Feature Flags System** - Toggle features on/off remotely without redeploying (A/B testing support) 🟡
- [ ] **Containerization (Docker)** - Dockerize game server and database for consistent dev/prod environments 🟡
- [ ] **Automated Performance Profiling** - Regression testing suite to catch FPS drops in new builds 🔴
- [ ] **Texture Atlasing Pipeline** - Automated build step to combine sprites into atlases to reduce draw calls 🟡
- [ ] **Custom Shader Hot-Reload** - Live editing of shader code without restarting the game engine 🔴
- [ ] **Memory Leak Detection** - Automated tests to analyze heap snapshots for detached DOM nodes 🔴
- [ ] **Audio Mixer Graph** - Visual node-based tool for real-time audio mixing and spatialization effects 🟡
- [ ] **Mock Stress Testing** - Bot system to simulate high player load for server stress testing 🔴

---

## Phase 6.8: User Interface & Accessibility Overhaul 🖥️

### Accessibility & Inclusivity ♿

- [ ] **Colorblind Modes** - Filters for Protanopia, Deuteranopia, and Tritanopia affecting UI and gameplay elements 🟢
- [ ] **Text-to-Speech (TTS)** - Option to read out chat messages and system notifications for visually impaired players 🟡
- [ ] **Speech-to-Text (STT)** - Real-time transcription of voice chat into text messages 🔴
- [ ] **Dyslexia-Friendly Font** - Toggle to switch all game text to a dyslexia-friendly typeface 🟢
- [x] **Screen Shake Intensity** - Slider to reduce or disable camera shake to prevent motion sickness 🟢
- [ ] **Reduced Gore Mode** - Option to disable blood splatters and dismemberment effects 🟡
- [ ] **UI Scaling** - Slider to scale the entire HUD interface (50% - 150%) for 4K or small screens 🟢
- [ ] **Subtitles & Captions** - Closed captions for all dialogue and significant sound effects (e.g., [Zombie Growl]) 🟢

### Graphics & Audio Settings ⚙️

- [ ] **Field of View (FOV) Slider** - Adjust horizontal FOV (60° to 120°) 🟡
- [x] **FPS Limit & V-Sync** - Options to cap frame rate and enable vertical sync to prevent tearing 🟢
- [ ] **Streamer Mode** - Privacy mode hiding server IPs, player names, and copyrighted music 🟡
- [ ] **Audio Device Selection** - Select specific input/output devices for game audio and voice chat independent of OS defaults 🟡
- [ ] **Advanced Audio Mixer** - Individual volume sliders for Master, SFX, Music, Voice, and UI sounds 🟢
- [ ] **Retro/Modern Rendering Presets** - One-click presets to switch between pixel-art style and high-res smooth rendering 🟢
- [ ] **Gamma & Brightness Calibration** - In-game calibration screen to ensure optimal visibility in dark areas 🟢

### Controls & Gameplay Customization 🎮

- [ ] **Input Remapping System** - Complete interface to rebind Keyboard, Mouse, and Gamepad inputs with conflict detection 🟡
- [ ] **Toggle vs Hold Options** - Accessibility settings to switch Aiming, Crouching, and Sprinting between Hold and Toggle modes 🟢
- [ ] **Gamepad Vibration** - Slider to adjust the intensity of controller rumble effects 🟢
- [x] **Cursor Customization** - Options to change the crosshair style, color, size, and opacity 🟢
- [x] **Auto-Sprint Toggle** - Option to invert default movement behavior (Sprint by default, Walk on hold) 🟢
- [x] **Contextual Tooltips** - "Press [Key] to Interact" prompts that dynamically update based on current keybindings 🟢
- [ ] **Minimap Customization** - Options for Fixed North/Rotating, Zoom level, and Opacity 🟢

### Advanced HUD & Interface 📊

- [ ] **Buff/Debuff Tray** - Visual icons with timers showing active status effects (Bleeding, Boosted, etc.) 🟢
- [x] **Detailed Stats Overlay** - Toggleable graph showing FPS, Ping, Packet Loss, and Memory Usage 🟢
- [ ] **Quick Chat Wheel** - Radial menu for fast tactical communication ("Ammo Here", "Group Up") 🟢
- [ ] **Kill Feed** - Scrolling log of player kills, deaths, and disconnects in multiplayer matches 🟢
- [x] **Damage Number Customization** - Options for Floating, Stacking, or Disabling damage numbers 🟢
- [ ] **Dynamic HUD** - HUD elements fade out when out of combat or at full health for immersion 🟡
- [ ] **3D Item Inspection** - View and rotate 3D models of weapons and items in the inventory/shop menu 🟡
- [x] **Compass Bar** - Top-of-screen compass ribbon showing cardinal directions and waypoints 🟢

---

## Phase 7: Project: Z.E.R.O. (Classified) 🟣

- [ ] **The Transmission** 🟣
- [ ] **Subject 119** 🟣
- [ ] **Bunker Access** 🟣
- [ ] **The Redacted Protocol** 🟣
- [ ] **The "Party" Zombie** - Rare zombie wearing a party hat that drops confetti and cake 🟣
- [ ] **Konami Code Support** - Unlocks a secret "Big Head" mode when entered on the main menu 🟣
- [ ] **Retro CRT Filter** - Optional visual effect adding scanlines and chromatic aberration 🟣
- [ ] **Developer Room** - A hidden area on the map containing credits and insider jokes 🟣
- [ ] **Cow Level** - There is no cow level... or is there? 🟣
- [ ] **Mimic Chests** - Loot containers that grow teeth and attack when opened 🟣
- [ ] **Mental Sanity System** - Hallucinations and visual distortions when player stress is too high 🟣
- [ ] **The Glitch** - A rare visual anomaly that reveals the simulation... or is it? 🟣
- [ ] **Midnight Call** - A phone booth that rings at exactly 00:00 system time 🟣
- [ ] **Ghostly Apparitions** - Faint figures seen in the periphery that vanish when looked at directly 🟣
- [ ] **Ancient Runes** - Decipherable markings hidden on map textures that tell a backstory 🟣
- [ ] **The Pizza Delivery** - A zombie delivering a pizza box that heals you fully 🟣
- [ ] **Tiny Mode** - A power-up that shrinks the player and zombies to 10% size 🟣
- [ ] **Disco Fever** - Zombies dance when a specific song plays 🟣
- [ ] **The Rubber Duck** - A useless item that squeaks when squeezed 🟣
- [ ] **Zero Gravity Zone** - A specific room where gravity is turned off 🟣
- [ ] **The Narrator** - A voice that comments on your failures in a British accent 🟣
- [ ] **ASCII Mode** - Renders the game in ASCII characters 🟣
- [ ] **Friendly Zombie "Bob"** - A zombie named "Bob" who just waves and walks away 🟣
- [ ] **Developers' Graveyard** - Tombstones with dev names 🟣
- [ ] **Infinite Stairs** - A staircase that never ends if you walk backwards 🟣
- [ ] **The Red Button** - A big red button that does... absolutely nothing (or explodes) 🟣
- [ ] **Mirror World** - A pickup that flips the screen horizontally 🟣
- [ ] **Pixel Art Gun** - A weapon that shoots 8-bit sprites 🟣
- [ ] **The Cursed Toaster** - Spawns burnt toast enemies 🟣
- [ ] **Rainbow Blood** - Blood splatter is rainbow colored 🟣
- [ ] **Fish Slap** - Melee weapon that is a large trout 🟣
- [ ] **Invisible Bike** - Player rides an invisible bike (animation only) 🟣
- [ ] **Talking Gun** - Gun complains when you miss 🟣
- [ ] **Fake Crash** - Game simulates a BSOD then resumes 🟣
- [ ] **Potato Mode** - Low poly graphics setting that makes everything look like potatoes 🟣

---

Last Updated: 2025-01-XX
