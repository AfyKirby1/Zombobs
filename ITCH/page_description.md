**!DISCLAIMER! WE ARE IN SUPER EARLY PRODUCTION! Please be patient but please hit me with constructive criticism and things you'd want to see! In all honesty, I'm a 'vibe coder', but like to imagine I'm modestly skilled at making stuff, with some imagination, lol. **

=========================

**Top-down zombie survival stripped to its bloody essentials. 100% vanilla code, 0% mercy, endless waves of undead.**

**ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS** is a fast-paced arena shooter built entirely with raw HTML5 Canvas and JavaScript. No engines, no frameworks, just pure adrenaline. You are alone (or with friends) against an endless tide of the undead. How long can you last?

---

### **🆕 Latest on Main — Act 1 Finale**

*   **Act 1 Complete** — Zones 1–4 playable: Crash Site → Maintenance Tunnels → Switching Yard → Control Tower; hack/defend → **The Warden** → **ACT 1 CLEAR**
*   **Survivor Quests** — Rook, Pip, June, Holt: talk **E** → quest → recruit AI teammate; extract tax + hotter zone starts
*   **Campaign Alive** — Radio/static SFX, companion dialogue bubbles, zone retry, campaign victory path, 3 campaign achievements
*   **Equipment + Heroes** — 6-slot gear sets, scrap-hire Rex/Mira/Doc/Nix/Kira/Voss; press **E**
*   **Main Menu Ambience** — Silhouette horde, ash/embers, title glitch, emoji button icons (`MenuHordeAmbience.js`)
*   **Codebase Audit** — 44,609 functional LOC across 144 maintained files (`tools/count_functional_loc.py`, 2026-07-09)

---

### **🆕 V0.9.3 ALPHA — Act 1 Finale Update**

*   **Act 1 Complete** — Full Z1–Z4 chain with steam hazards, power couplers, hack terminal, 45s defend, **The Warden** 3-phase boss, **ACT 1 CLEAR** victory
*   **Survivor Quests** — World NPCs per zone: meet → quest → recruit via `CompanionSystem.recruitSurvivor()`; state persists across zones
*   **Campaign Alive Pass** — Visible campaign toasts + radio subtitles; gamepad Hold-E; zone transition interstitial; ZONE FAIL **Retry Zone**; Echo Actual / Warden Slayer / Fireteam achievements
*   **Achievements + Gallery Redesign** — Trophy-cabinet achievements overlay; tabbed Zombies/Weapons/Pickups bestiary with Warden + Laser
*   **Main Menu Ambience** — `MenuHordeAmbience.js` silhouette horde, ash/embers, title pulse + RGB glitch, emoji menu icons
*   **Boot Hardening** — Progress creep, stall messaging (5s/10s), WebGPU phase callbacks, 3-frame settle, 20s failsafe
*   **V0.9.2 Systems Still Live** — Equipment sets, hireable heroes, mobile touch, blood-edge overlay, boot progress bar
*   **V0.9.1 / V0.9.0 Still Live** — 93 skills, 15 synergies, lazy WebGPU/Socket.IO, smooth game entry

---

### **🆕 V0.9.2 ALPHA — Campaign & Mobile Update**

*   **Campaign Act 1 Zones 1–3** — Crash Site → Maintenance Tunnels → Switching Yard; extraction objectives, zone transitions, arcade-parity spawns
*   **Equipment System** — 6 slots, 5 rarities, crit/DR rolls, inventory 24; three named sets with 2/4/6-piece bonuses (press **E**)
*   **Hireable Heroes** — Rex, Mira, Doc, Nix, Kira, Voss hired with scrap; role-tuned AI companions + gold nameplates
*   **Mobile Touch Wired** — Virtual pad aim/fire/reload/melee/grenade/weapon/E/flashlight; safe-area, HUD taps, Capacitor immersive focus
*   **Main Menu Ambience** — Silhouette horde walkers, ash/embers, rotating subtitles, title pulse + RGB glitch, emoji menu icons
*   **Boot Loader Upgrade** — Progress creep, stall messaging, % + elapsed, WebGPU phase callbacks, 3-frame settle, 20s failsafe; blood-edge injury overlay; menu metal gunshots
*   **Codebase Audit** — 44,609 functional LOC across 144 maintained files (`tools/count_functional_loc.py`, 2026-07-09)
*   **V0.9.1 Systems Still Live** — 93 skills, 15 synergies, 6 class trees, corrupted wildcards, Splitter/Siren, mobile 2×2 level-up
*   **V0.9.0 / V0.8.4 Still Live** — Lazy WebGPU/Socket.IO, smooth game entry, wave chaos, scrap shrine

---

### **V0.9.1 ALPHA — Skills & Survivability Update**

*   **Mega Skill Expansion** — 93 total skills: 63 flat picks + 30 tree skills across 6 class paths (Gunner, Survivor, Scavenger, Brawler, Pyromancer, Shadow)
*   **15 Skill Synergies** — Combo unlock popups when skill pairs meet (e.g. Frozen Fury, Midnight Reaper)
*   **Corrupted Wildcards** — ~14% chance for purple level-up cards (+35% effect, −12% max HP)
*   **Build Depth** — 4 cards per level-up, 10 active skill slots, 1 free reroll per level
*   **Mobile UX** — 2×2 level-up grid on phones, touch hover, scroll lock, performance-friendly first-run defaults
*   **New Enemies** — Splitter carrier (2 fast Shard minions on death, wave 6+) and Siren support zombie (wave 8+ horde scream + aim jitter)
*   **Zombie Face QoL** — Procedural face profiles, pupil styles, gaze-tracking eyes, wounds/drool across major zombie variants
*   **Boot Hardening** — Safe `localStorage` reads on startup; repaired `test-syntax.ps1` for all JS modules
*   **V0.9.0 Systems Still Live** — Main-menu smoothness, lazy WebGPU/Socket.IO, startup metrics, smooth game entry, original 3 class trees, music balance (default 25%)
*   **V0.8.4 Systems Still Live** — Wave Chaos mutators, Scrap Shop Shrine, MP3 soundtrack, Phase 4 `GameLoopSystem`, controls-in-settings

---

### **V0.9.0 ALPHA — Performance & Systems Update**

*   **Main Menu Smoothness** — Cached score reads, prebaked horror-background layers, and throttled static noise reduce menu lag spikes
*   **Lazy WebGPU Init** — GPU renderer module loads on first gameplay or WebGPU re-enable instead of menu boot
*   **Lazy Socket.IO Load** — Multiplayer client script loads only when online lobby/networking starts
*   **Startup Metrics** — `zombobs:*` performance marks measure bootstrap, first draw, loop start, WebGPU module load, and GPU init
*   **Class Tree Skills** — Gunner, Survivor, and Scavenger build paths augment the flat skill pool
*   **V0.8.4 Systems Still Live** — Wave Chaos, Scrap Shop Shrine, MP3 soundtrack, controls-in-settings, and Phase 4 engine split remain active

---

### **✨ Features**

#### **🔫 Arsenal of Destruction**

**8 Weapons:** Pistol, Shotgun, Rifle, Flamethrower, SMG, Sniper, RPG, Laser Gun

*   Grenades (3 per game, 2s cooldown)
*   Melee combat
*   Background reloading
*   Weapon persistence (each weapon maintains its own ammo count)
*   Weapon switching (1-8 keys or scroll wheel)

#### **🧟 Enemy Variety**

**11+ Zombie Types:** Normal, Fast Runners, Exploding Boomers, Armored Tanks, Ghost, Spitter, Flying, Crawler, Blight, Splitter (+ Shard minions), Siren

*   Boss waves (every 5 waves)
*   Day/Night cycle (zombies 20% faster at night)
*   Environmental hazards (acid pools)
*   Crowd control (bullets slow zombies)
*   Progressive difficulty scaling
*   Procedural face QoL + torso overlays on major variants

#### **💪 Power-Ups & Systems**

**Power-Ups:** Double Damage, Nuke, Speed Boost, Rapid Fire, Shield, Health Pickup, Ammo Pickup

*   Real-time HUD timers for active power-ups
*   Kill streak combos with visual feedback
*   Sprint system with stamina management
*   Scrap currency from kills + wave-break Scrap Shop shrines (V0.8.4+)
*   Wave Chaos mutators and escalating spawn pacing (V0.8.4+)
*   **93 skills** across 6 class trees + 15 synergies; corrupted wildcards; 4-card level-ups / 10 slots / reroll
*   Equipment crates (6 slots, set bonuses) + hireable heroes with scrap
*   XP gain from zombie kills with kill streak multipliers

#### **👥 Multiplayer & Co-op**

*   Local co-op (4-player shared-screen)
*   Online multiplayer lobby (cloud-hosted server)
*   AI Squad Mode (up to 3 AI companions) + scrap-hire heroes
*   Controller support (Xbox/gamepad with analog sticks)
*   Lobby chat system
*   Rank progression system
*   Global leaderboards

#### **🎨 Visual & Audio**

**Graphics:**
*   WebGPU rendering with Canvas 2D fallback
*   GPU-accelerated shaders, bloom, blood-edge injury overlay
*   Screen shake, particle effects, blood splatter
*   Muzzle flashes, bullet trails, shell ejection
*   Floating damage numbers, critical hit indicators
*   Hit markers, spawn indicators, off-screen indicators
*   Reload progress bars, modern "Glass Tech" HUD
*   Horror atmosphere with animated backgrounds + menu metal gunshots

**Audio:**
*   Licensed MP3 gameplay playlist (two-track rotation) + menu theme
*   Dynamic music intensity during combat (wave + horde pressure)
*   Procedurally generated sound effects
*   Granular audio mixer (Master, Music, SFX, Footsteps, Gunshots, Hit Markers, Multiplier)
*   UI interaction sounds (hover tick, click pip)
*   Multi-layered impact sounds and kill feedback

#### **⚙️ Gameplay Systems**

*   Campaign Act 1 Zones 1–3 (Crash Site → Tunnels → Switching Yard) + cinematic intro
*   Flashlight system (F key toggle)
*   Equipment panel (**E**) + Heroes tab
*   Comprehensive settings panel (Video, Audio, Gameplay, Controls)
*   UI scaling system (50-150% accessibility)
*   Fully customizable controls (keyboard and controller rebinding)
*   Gallery screen (showcase zombies, weapons, pickups)
*   Profile system (achievements, badges, battlepass, ranks)

---

### **🕹️ Controls**

**Keyboard & Mouse**

*   **WASD** / **Arrow Keys**: Move
*   **Mouse**: Aim
*   **Left Click**: Shoot (hold for continuous)
*   **R**: Reload
*   **G**: Grenade
*   **V**: Melee
*   **1-8**: Switch Weapon
*   **Scroll Wheel**: Cycle Weapons (toggleable)
*   **Shift**: Sprint
*   **E**: Equipment / Heroes panel (also scrap shrine buy when near pedestal)
*   **F**: Flashlight
*   **ESC**: Pause

**Gamepad (Xbox/Controller)**

*   **Left Stick**: Move (analog)
*   **Right Stick**: Aim (analog)
*   **RT**: Shoot (hold for continuous)
*   **RB**: Grenade
*   **X**: Reload
*   **Y**: Next Weapon
*   **LB**: Previous Weapon
*   **R3**: Melee
*   **L3**: Sprint
*   **Start**: Pause

*All controls are fully customizable in the Settings menu*

---

### **🛠️ Under the Hood**

Built with love, sweat, and zero dependencies.

*   **Engine:** ZOMBS-XFX-NGIN V0.9.3 ALPHA (Vanilla JS + HTML5 Canvas)
*   **Graphics:** WebGPU with Canvas 2D fallback, GPU-accelerated shaders, bloom post-processing
*   **Audio:** Web Audio API (Procedurally generated sounds) + HTMLAudioElement for music
*   **Assets:** High-res ground tiles, minimalist pixel art & code-drawn graphics
*   **Performance:** Quadtree spatial partitioning, object pooling, viewport culling, delta compression
*   **Networking:** Socket.io for multiplayer (cloud-hosted on Hugging Face Spaces)
*   **Architecture:** ES6 Modules, zero runtime dependencies

---

**⚠️ Early Production Disclaimer:** This game is currently in active development (V0.9.3 ALPHA). Features may change, bugs may exist, and content is still being added. Your feedback is welcome!

*Playable directly in your browser. Best experienced on Chrome or Edge. Requires modern browser with WebGPU support (optional, falls back to Canvas 2D).*
