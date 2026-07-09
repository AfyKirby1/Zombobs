<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
### Massive Expansion — Equipment Sets + Heroes + Zone 3 (2026-07-09) ✅ COMPLETE
- **Done**: Equipment depth — 10 names/slot, crit/DR bonuses, 3 named sets (Scavenger / Fireteam Echo / Last Survivor) with 2/4/6-piece bonuses; inventory 24; boss drop bias; set UI in Equipment screen.
- **Done**: Guild Wars-style heroes — `js/core/heroDefinitions.js` (6 hireable heroes); `CompanionSystem.hireHero()` spends scrap, spawns AI with role kits (warrior/ranger/medic/scavenger); medic heal + scavenger scrap aura; Equipment screen **HEROES** tab.
- **Done**: Campaign Zone 3 — `js/maps/switchingYard.js` (2800×1600 train lanes); tunnels → yard via `nextMapId`; extract at wave 3.
- **Done**: Combat hooks — equipment crit + damage reduction; hero scrap aura on scrap pickup.
- **Docs**: CHANGELOG + SUMMARY updated.
- **Verify**: `test-syntax.ps1` OK. Play → farm scrap → E → Heroes → hire Rex; Campaign clear Z1→Z2→Z3.

### Campaign/Arcade Parity + Slower Leveling + Equipment System (2026-07-09) ✅ COMPLETE
- **Done**: Campaign spawn parity — `ZombieSpawnSystem._computeSpawnPosition()` now uses arcade-style off-screen spawns for campaign, clamped/resolved against map walls and bounds instead of map edges only. Boss spawn also clamped in campaign.
- **Done**: Slower leveling — `XP_BASE_REQUIREMENT` 100 → 200, per-level increment 20 → 50 (`SkillSystem.js`).
- **Done**: Broad equipment system foundation:
  - `js/core/equipmentDefinitions.js` — 6 slots, 5 rarities, random stat bonuses (HP, speed, damage, fire rate, reload, XP, scrap).
  - `js/systems/EquipmentSystem.js` — inventory, equip/unequip, recalc bonuses, drop chance, auto-equip if slot empty.
  - `js/entities/EquipmentPickup.js` — glowing crate pickup with rarity color.
  - `js/ui/EquipmentScreen.js` — E-key panel showing equipped slots and inventory; click to equip/unequip, close button.
  - `js/ui/GameHUD.js` — wires equipment screen into draw/click/hover/cursor.
  - `js/main.js` — E key toggles equipment screen (preserves E shrine purchase when near a scrap shrine during wave break); blocks gameplay input while open.
  - `js/core/gameState.js` — `showEquipment`, `equipmentPickups`, and player equipment fields; reset logic.
  - `js/utils/bulletZombieCollisions.js` — 7% chance to drop equipment on zombie death.
  - `js/systems/GameLoopSystem.js` — updates and draws equipment pickups; auto-collect on player contact.
  - `js/utils/combatUtils.js`, `js/systems/PlayerSystem.js`, `js/systems/SkillSystem.js` — apply equipment multipliers to damage, fire rate, reload, scrap, XP, and movement speed.
- **Done**: `DOCS/CHANGELOG.md` updated.
- **Verify**: `test-syntax.ps1` passes; play a run, kill zombies, press E to manage gear.

### Mobile Touch — Coherent + Edge-Cased (2026-07-09) ✅ COMPLETE
- **Root cause**: Virtual pad UI existed but mouse-source mobile players never got aim/fire/button edges; HUD weapon/grenade paths were no-ops (`input.mouseWheel` / `input.keys` undefined).
- **Done**: `TouchControlSystem` — `justPressed` via `tick()`, interact + weapon cycle buttons, flashlight reset, HUD-zone skip, safe-area insets, visibility/orientation reset, removed duplicate pause pad.
- **Done**: `PlayerSystem` — virtual aim/move + reload/melee/grenade/weapon/interact/flashlight for mouse+mobile.
- **Done**: `GameLoopSystem` — right-stick auto-fire; tick before `updatePlayers`.
- **Done**: `main.js` — real `cycleWeapon` / `throwGrenade`; suppress raw `mouse.isDown` while virtual pad active.
- **Done**: Scrap prompt mobile copy; unify `isMobileDevice()` in MainMenu/Settings/GameHUD; Capacitor immersive on focus; `npm run sync:web`.
- **Verify**: DevTools phone UA — move/aim/fire, R/G/M/E/W±/🔦, HUD weapon tap, grenade throw mode, scrap E near shrine, pause (HUD only), rotate/background no stuck sticks. Then `cd mobile && npm run sync:web` before Android build.

### Boot Loader Visual + System Upgrade (2026-07-09) ✅ COMPLETE
- **Done**: Extended `js/core/BootLoader.js` — staged progress bar (bootstrap → systems → WebGPU → first frame), rotating tips, `GAME_VERSION` chip, 12s failsafe timeout.
- **Done**: Upgraded `#boot-overlay` in `index.html` — Creepster title glow, progress bar, version/WebGPU chips, tip line, vignette + grain (critical inline CSS).
- **Done**: Mirrored polish in `css/style.css` — abyssal gradient, WebGPU accent bar, `prefers-reduced-motion`.
- **Done**: Wired `advanceBootStage()` from `js/main.js` at bootstrap + WebGPU init sites.
- **Verify**: `test-syntax.ps1` passes; cold reload `index.html` — bar advances, overlay fades when menu + GPU ready.

### Campaign Zone 2 — Maintenance Tunnels + Zone Transition (2026-07-09) ✅ COMPLETE
- **Done**: New map `js/maps/maintenanceTunnels.js` (1800×1200, corridors, side passages, support pillars, steam decals, props, extraction trigger).
- **Done**: `MapLoader` registry now loads `crash_site` → `maintenance_tunnels` via `nextMapId`.
- **Done**: `crashSite.js` sets `nextMapId: 'maintenance_tunnels'`; `maintenanceTunnels.js` sets `nextMapId: null` for final victory.
- **Done**: `MapLoader.applyAmbiance()` now fixes `dayNightCycle.startTime` so forced night persists across the whole map.
- **Done**: `GameStateManager.zoneComplete()` transitions to next zone if present; `_loadNextCampaignZone()` preserves player health/ammo/score, resets wave/zombies/pickups/shrine, clears props, respawns map props, repositions player, and spawns wave 1.
- **Done**: `GameStateManager._loadNextCampaignZone()` shows a `ZONE N — MAP NAME` wave notification on entry.
- **Done**: `DOCS/CHANGELOG.md` updated.
- **Verify**: Campaign → clear Zone 1 → reach north extraction → Zone 2 loads → clear Zone 2 → `ZONE CLEAR` victory.

### Menu Zombie Hand Visual Polish (2026-07-08) ✅ COMPLETE
- **Done**: Enhanced `MenuHandHorrorEffect.drawHand()` with cast shadow, torn wrist, knuckle bumps, palm creases, segmented fingers with torn nails and bloodied tips, thumb nail, rotting patch, and glass sheen highlight.
- **Done**: Added `_drawImpactRing()` shockwave on the tear edge during the slam impact.
- **Done**: `test-syntax.ps1` passes.

### Campaign Extraction Objective + Zone Clear (2026-07-08) ✅ COMPLETE
- **Done**: Added `extraction` trigger to `js/maps/crashSite.js` at the north ring gap; requires wave 2.
- **Done**: `MapLoader` supports `requiresWave`, `requiresKills`, `target`, and `extraction` trigger types; sets `campaignObjectiveTarget` and `campaignZoneCleared`.
- **Done**: World-space pulsing green beacon marker at the extraction target; HUD distance readout + off-screen arrow in `drawingUtils.drawCampaignObjective`.
- **Done**: `GameStateManager.zoneComplete()` and `GameLoopSystem.onZoneComplete` callback end the run with a victory overlay; `GameOverScreen` draws "ZONE CLEAR" in green.
- **Done**: Reset fields in `gameState.js` and `GameStateManager.restartGame()`.
- **Docs**: `CHANGELOG.md` updated.
- **Verify**: Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1`.

### Clickable Version Modal (2026-07-06) ✅ COMPLETE
- **Done**: Main-menu version badge opens spooky arcade **PATCH NOTES** modal (`js/ui/VersionModal.js`).
- **Done**: Centralized `GAME_VERSION`, `ENGINE_VERSION`, `VERSION_HISTORY` in `js/core/constants.js`; About screen + version badge read from constants.
- **Docs**: `VERSION_UPDATE_CHECKLIST.md` §1–§2 (hub + modalities), `SUMMARY`, `CHANGELOG`, `ARCHITECTURE`, `AGENTS.md`, `My_Thoughts`.
- **Verify**: Click 🎃 version plaque top-left on main menu; ESC / CLOSE / backdrop dismiss. On next version bump: prepend `VERSION_HISTORY` per checklist.

### Boot Loader — Gated Startup Overlay (2026-07-06) ✅ COMPLETE
- **Done**: New `js/core/BootLoader.js` — gates `#boot-overlay` dismiss on **first menu frame** + **WebGPU init** (skipped when WebGPU off/unsupported).
- **Done**: WebGPU init starts at bootstrap (parallel with game loop) instead of idle-only warm-up; status text `Loading game` → `Initializing GPU`.
- **Done**: Inline critical boot CSS in `index.html` (ZOMBOBS title + spinner before `style.css` loads); overlay fades out only when menu + GPU ready.
- **Docs**: `CHANGELOG`, `SUMMARY`, `ARCHITECTURE`, `My_Thoughts`.
- **Verify**: Cold reload `index.html` with WebGPU on — branded loader until main menu fully ready, no blank flash.

### V0.9.1 Modality (2026-07-06) ✅ COMPLETE
- **Done**: Version bump to **V0.9.1 ALPHA** — *Skills & Survivability Update* across all public modalities; **backfilled** v0.9.1 CHANGELOG with zombie face QoL, startup hardening, full skill-wave mechanics, Splitter/Siren detail, and v0.9.0 smooth-entry/class-tree items previously only in amended notes.

### Mobile UX & Performance (2026-07-05) ✅ COMPLETE
- **Done**: Level-up **2×2 grid** on narrow viewports; touch hover/reroll fixes; `isMobileDevice()` detects coarse pointer + narrow width; mobile **low preset** defaults on first run; `touch-action: none`; synergy toast width clamp; **`mobile/www` synced**.
- **Verify**: DevTools ~390px width level-up; Capacitor `npm run sync:web` before Android builds.

### Skill System Wave 3 (2026-07-05) ✅ COMPLETE
- **Done**: +16 flat skills, **Shadow** tree (6th), **4 cards**/level-up, **10 slots**, +5 synergies (**15 total**).
- **Highlights**: Wave Rider, Vengeance, Guardian Angel, Nova Core, Gold Rush, Bullet Storm, Ammo Echo, Ricochet, Cold Snap.
- **Docs**: `XP_AND_SKILLS_SYSTEM.md` § Skills Expansion, `CHANGELOG`, `SUMMARY`.
- **Verify**: `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1`.

### Skill System Expansion (2026-07-05) — Wave 2 ✅ COMPLETE
- **Wave 2**: 14 unique skills, **10 skill synergies**, corrupted wildcards (~14%), **Pyromancer** tree (5 tiers).
- **Highlights**: Headhunter, Corpse Bloom, Static Charge, Kill Switch, Phantom Decoy, Riposte, Combo King, Toxic Rounds, etc.
- **Synergies**: e.g. Glass Cannon + Berserker → Death Wish; Toxic + Corpse Bloom → Plague Doctor.
- **Verify**: `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1`.

### Skill System Expansion (2026-07-05) — Wave 1 ✅ COMPLETE
- **Done**: +13 flat skills (Magnetism, Grenadier, Vampiric Rounds, Glass Cannon, Last Stand, Chain Lightning, etc.) — **29 total** in `SKILLS_POOL`.
- **Done**: 4th class tree **Brawler** (5 tier skills) in `skillTreeDefinitions.js` — **20 tree skills** across 4 trees.
- **Done**: Max active skill slots **6 → 8**; 1 free **reroll** per level-up on `LevelUpScreen`.
- **Done**: Combat hooks — lifesteal, chain lightning, kill momentum fire rate, melee multipliers, explosion radius/damage, Last Stand damage reduction, `applyPlayerDamage()` centralization.
- **Verify**: `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1`.

### Zombie Face QoL — Expanded Features (2026-07-05) ✅ COMPLETE
- **Done**: Shared `getFaceProfile()` + `drawFaceFeatures()` on base `Zombie` — layered sockets, brows, nose, mouth styles, missing/chipped teeth, ears, wounds, drool, jaw line.
- **Done**: Enhanced `drawEyes()` — pupil styles (round/slit/pin), lazy-eye offset, gaze-tracking cores, specular highlights.
- **Done**: Wired into base, Normal, Fast, Exploding, Spitter, Siren, Splitter, and Shard variants.
- **Verify**: `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1`.

### Splitter Zombie — Shard Carrier (2026-07-05) ✅ COMPLETE
- **Done**: `SplitterZombie` + `ShardZombie`; `spawnSplitterShards()` on death with crack SFX/particles.
- **Done**: Kill hooks in `bulletZombieCollisions.js`, `MeleeSystem.js`; MP shard sync via `zombie:spawn` from leader.
- **Done**: Spawn wave 6+ (~3%, VOLATILE ~5.5%); score/XP/gallery/audio.
- **Docs**: `CHANGELOG`, `ENEMY_TYPES.md`, `SCRATCHPAD`.

### Functional LOC Audit Tool (2026-07-05) ✅ COMPLETE
- **Done**: Added `tools/count_functional_loc.py` to count maintained functional source lines while excluding docs, assets, generated mobile `www`, dependencies, IDE folders, vendored/minified bundles, and duplicate `Zombobs/` snapshots.
- **Result**: `34,773` functional LOC across `125` files (`30,237` JS LOC across `88` JS files).
- **Docs/Website**: Updated `landing.html`, `README.md`, `SUMMARY.md`, and `CHANGELOG.md` to mention the audited large vanilla codebase.
- **Verify**: `python tools/count_functional_loc.py`.

### Startup Audit Repairs (2026-07-05) ✅ COMPLETE
- **Done**: Hardened startup `localStorage` reads in `gameUtils.js` (`loadHighScore`, `loadUsername`, `loadMenuMusicMuted`) so blocked/corrupt storage cannot strand the boot overlay.
- **Done**: `loadUsername()` now returns the effective username, fixing first-profile creation fallback in `PlayerProfileSystem`.
- **Done**: Repaired `test-syntax.ps1` to use `node --check` across `js/**/*.js` without executing browser modules.
- **Verified**: `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-syntax.ps1` passes; no IDE diagnostics on edited files.

### Siren Zombie — Support Screamer (2026-07-05) ✅ COMPLETE
- **Done**: `SirenZombie` in `Zombie.js` — windup/scream AI, cyan visuals, horde speed buff, aim jitter, shock ring VFX, interrupt on hit.
- **Done**: Spawn weights in `WaveChaosSystem` (wave 8+, ELITES/ENCIRCLE bias); `ZombieSpawnSystem` class map.
- **Done**: `ZombieUpdateSystem` siren boost; `PlayerSystem` + `drawingUtils` aim/crosshair jitter; `EntityRenderSystem.drawSirenScreamEffects`.
- **Done**: `playSirenScreamSound`, score (24), XP (19), Gallery card + icon.
- **Docs**: `CHANGELOG`, `SUMMARY`, `ARCHITECTURE`, `ENEMY_TYPES.md` (new), `STYLE_GUIDE`, `My_Thoughts`.
- **Next**: Browser QA wave 8+ — verify windup interrupt, horde speed spike, crosshair jitter, ENCIRCLE/ELITES spawn bias.

### Audio Balance — Music vs Gunshots (2026-06-26) ✅ COMPLETE
- **Done**: Halved default `audio.musicVolume` (`0.5` → `0.25`) so MP3 menu/gameplay tracks sit under gunfire without boosting SFX.
- **Done**: Settings schema v3 migration — existing saves still on legacy default `0.5` auto-migrate to `0.25`; custom music levels untouched.
- **Done**: Updated fallbacks in `AudioSystem.js` and `ArcadeMusicSystem.js`.
- **Docs**: `CHANGELOG`, `SUMMARY`, `settings.roadmap`, `ARCHITECTURE`.

### Main Menu Startup Performance (2026-06-26) ✅ COMPLETE
- **Done**: Cached menu scoreboard/recent-run reads to avoid per-frame `localStorage` parse/sort.
- **Done**: Prerendered creepy background scanlines/vignette and throttled noise draw.
- **Done**: Deferred WebGPU renderer module load/init until first gameplay or WebGPU setting re-enable.
- **Done**: Deferred vendored Socket.IO client load until multiplayer/network init.
- **Done**: Added `zombobs:*` performance marks/measures; enable console logs with `?perf=1` or `localStorage.zombobs_perf='1'`.
- **Done**: V0.9.0 modality sweep — menu version/news ticker, About screen, landing + mobile mirror, itch copy, launcher, server package metadata, `SUMMARY`, `CHANGELOG`.
- **Done**: Smooth game entry — idle WebGPU + ground texture warm-up on menu; async `startGame()` with canvas prep overlay when GPU not ready; `gpuCanvas` opacity fade-in.
- **Docs**: `CHANGELOG`, `SUMMARY`, `ARCHITECTURE`, `REFACTOR_PLAN`, `My_Thoughts`.
- **Next**: Browser QA cold boot, first Play click with WebGPU enabled, multiplayer lobby connect.

### Class Tree System (3×5 hybrid) [2026-06-25] ✅ COMPLETE
- **Done**: `skillTreeDefinitions.js` — Gunner/Survivor/Scavenger × 5 skills, prereq chains, hybrid pool with flat 16.
- **Done**: `SkillSystem` merge pools, tree weight 0.35, `getSkillById`, profile unlock tracking.
- **Done**: Combat — fire rate, pierce, damage mult, Executioner, Second Wind, magnet, bloodlust/adrenaline tuning.
- **Done**: LevelUpScreen tree badge + tagline; GameHUD tree accent bar.
- **Done**: Tree Master achievement + `treeSkillsUnlocked` profile stat.
- **Done**: Docs — SUMMARY, CHANGELOG, XP_AND_SKILLS_SYSTEM, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN.
- **Next**: Browser QA — pick tree T1→T5 path, verify prereqs block early tiers, co-op level-up sync.

### Controls Panel → Settings (2026-06-25) ✅ COMPLETE
- Removed `GameHUD.drawInstructions()` in-game overlay; bottom HUD layout via `getBottomHudRowY()`.
- Settings → Controls: mouse fixed section, cycle throwable, dodge, throw throwable labels, gamepad sticks.
- Docs + V0.8.4 modality: `NEWS_UPDATES`, landing bubbles, itch, `CHANGELOG`, `ARCHITECTURE`.

### Wave Chaos Escalation [2026-06-25]
- **Done**: Dynamic wave breaks, scaled spawn stagger/bursts, 5 wave mutators (SWARM/ELITES/VOLATILE/ENCIRCLE/RUSH), boss minions, music intensity scaling, brief-break UI.
- **Next**: Browser QA waves 5–15; tune mutator rates if too punishing.

### Campaign Zone: The Railyard [Active]
- **Objective**: Build the first campaign map based on `CAMPAIGN_DESIGN.md`.
- **Tasks**:
  - [x] Create `MapLoader` system for static zone geometry (`js/systems/MapLoader.js` + `js/maps/crashSite.js`).
  - [x] Define "The Crash Site" zone geometry (2400×1800, debris rings, heli wreck, props).
  - [x] Implement collision for static map walls (player + zombie resolve via `mapCollisionUtils.js`).
  - [ ] Trigger system for zone events / dialogue (stub: start trigger + objective banner).
  - [ ] Zone 2 — Maintenance Tunnels.
- **Current Status**: ⏳ Zone 1 playable — browser QA Campaign → intro → crash site walls/objective HUD.
- **Verify**: Main menu Campaign; walk into debris ring; zombies spawn on map edge; objective banner top-center.

### Android WebView Wrapper (Capacitor) [Active]
- **Objective**: Ship Android APK using Capacitor WebView wrapper.
- **Tasks**:
  - [x] Create `mobile/` Capacitor app with Android platform.
  - [x] Add web sync script to populate `mobile/www`.
  - [x] Set app icon/splash from `assets/icons/favicon.png`.
  - [x] Bundle Google Fonts locally for offline play.
  - [x] Upgrade Android Gradle wrapper to 8.13 (JDK 17/19).
  - [ ] QA touch-first UX.
- **Current Status**: ⏳ In progress

## Compacted History
- **Class Tree System — hybrid 3×5 (2026-06-25) ✅ COMPLETE**
  - `skillTreeDefinitions.js` (Gunner/Survivor/Scavenger × 5), hybrid with flat 16, prereqs, 35% tree weight, combat hooks, tree UI, Tree Master achievement. Docs: SUMMARY, CHANGELOG, XP_AND_SKILLS, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN.
- **v0.8.4 ALPHA — The Chaos & Horde Update (2026-06-25) ✅ RELEASED**
  - Version bump: `MainMenuScreen`, `AboutScreen`, `landing.html`, `NEWS_UPDATES`, `launch.ps1`, server `package.json`, itch copy, `mobile/www` sync.
  - Ship list: Wave Chaos, Scrap Shop shrine, zombie visual AI + torso overlays, MP3 soundtrack, controls in Settings (overlay removed), GameLoopSystem refactor, touch gate fix.
- **Scrap Shop / Wave-Break Shrine (2026-06-25) ✅ COMPLETE**
  - `ScrapShrine` + `ScrapShopSystem`; 45% spawn wave 4+ on break; E buy (Ammo 20 / Shield 30 / Overclock 40); tooltip; reset on wave start. Multiplayer gated.
- **Zombie Visual Polish — Torso Overlays + Organic Motion (2026-06-25) ✅ COMPLETE**
  - Additive torso overlays (5 types, ~70% spawn, id-deterministic) on upright zombies.
  - Gaze-tracking eyes, velocity lean/bob, cosmetic micro-behaviors, hit recoil flash.
  - Per-type `getMotionProfile()` for fast/armored/exploding/spitter; spitter throat pulse.
  - Docs: `SUMMARY.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `My_Thoughts.md`.
- **Scavenger Update — Scrap System (2026-06-25) ✅ COMPLETE**
  - Zombie death drops (`tryDropScrapFromZombie`), magnetic `ScrapPickup` update/render, `handlePickupCollisions` collection, HUD scrap stat, `gameState` reset. Removed random timer spawn stub.
- **Runtime bugfixes — combatUtils / GameHUD / index.html (2026-06-14) ✅ COMPLETE**
  - **combatUtils.js**: Removed stray `}` in quadtree init inside `handleBulletZombieCollisions()` — fixed module parse error (`Unexpected token '}'`).
  - **GameHUD.js**: Added missing `xpBarWidth = 280 * scale` in `drawCoopHUD()` — fixed co-op HUD `ReferenceError`.
  - **index.html**: Added `mobile-web-app-capable` meta alongside Apple PWA tag.
- **v0.9.2.0 - Throwable Upgrade (Molotov Cocktail) & Dodge Game Feel (2026-06-15) ✅ COMPLETE**
  - **Molotov Cocktail**: Implemented Molotov throwable class that explodes instantly on impact or zombie hit, spawning a visual fire pool using radial gradients.
  - **Fiery Area Damage**: Fire pool ticks damage on both players and zombies, applying a 3-second burn DoT timer and handling deaths, score rewards, and multipliers.
  - **Throwable Cycling**: Mapped keybind Q (keyboard) and D-pad Down (gamepad) to toggle active throwables (Grenade vs Molotov).
  - **HUD Improvements**: Dynamic UI rendering of current throwable icon/count, with a satisfying scale bounce animation on cycling.
  - **Dodge Game Feel**: Added screen shake on roll start and "DODGED!" floating combat text when i-framing through damage.
- **v0.9.1.0 - Retro Arcade Features & Optimizations (2026-06-15) ✅ COMPLETE**
  - **Dodge Roll**: Added Space / B-button dodge mechanic with stamina cost, i-frames, whoosh sound, and ghost trails.
  - **Explosive Barrels**: Added procedurally spawned red metal barrels that flash, explode on fuse, chain detonate, damage nearby players, and wreckage.
  - **Headshots**: Implemented standard and piercing bullet headshot decapitation, skull props drops, bone particles, and golden popups.
  - **Performance**: Cached mobile checks and UI scale calculations in GameHUD; optimized zombie aura drawing to use squared distance check.
- **Itch.io zip validation + docs (2026-04-06) ✅ COMPLETE**
  - **Build gate**: `ITCH/build-itch.ps1` fails if zip entries contain `\` or required paths missing (prevents repeat of CDN 403).
  - **Docs**: `ITCH_IO_GUIDE.md` mandatory script rule; `VERSION_UPDATE_CHECKLIST.md` §6; `SUMMARY.md` status + file tree amendment for `index.html`/`landing.html`.
- **v0.8.3.9 - Itch.io Path Fix (2026-01-01) ✅ COMPLETE**
  - **Asset Paths**: Reverted `index.html` references to clean relative paths (e.g. `css/style.css` instead of `./css/style.css`) as specifically requested by internal documentation for Itch.io compatibility.
- **v0.8.3.8 - Local Server Fix (2026-01-01) ✅ COMPLETE**
  - **Routing Bug Fix**: Corrected `server.js` root route (`/`) to serve `landing.html`. It was accidentally pointing to `index.html` (the Game) after the file restructure.
- **v0.8.3.7 - File Restructure (2026-01-01) ✅ COMPLETE**
  - **Renaming**: Renamed `index.html` → `landing.html` and `zombie-game.html` → `index.html`.
  - **Linking**: Updated "Play Now" button in `landing.html` to point to `index.html`.
  - **Build Script**: Updated `build-itch.ps1` to simply copy the now correctly-named `index.html`.
- **v0.8.3.6 - Itch.io Deployment Fix (2026-01-01) ✅ COMPLETE**
  - **Deployment Config**: Updated `zombie-game.html` to use explicit relative paths (`./`) and removed `crossorigin="anonymous"` from CSS/JS links.
  - **Verification**: Validated `build-itch.ps1` output structure for proper Itch.io hosting (Index at root, relative assets).
- **v0.8.3.5 - Battlepass Fix & Headshot Detection (2025-12-31) ✅ COMPLETE**
  - **Headshot System**: Enhanced `checkZombieCollision` (in `gameUtils.js`) to distinguish between upper-body (Head/Torso) and lower-body hits. Killing a zombie with an upper-body hit now grants a "Headshot".
  - **Pickup Tracking**: Implemented session-level tracking for all collected powerups (Health, Ammo, Nuke, etc.) to satisfy "Collect X Pickups" quests.
  - **Data Pipeline**: Integrated session-based `headshots` and `pickupsCollected` into the `GameStateManager` and `PlayerProfileSystem` pipeline.
  - **Challenge Logic**: Verified that cumulative challenge progress (e.g., "Total Kills") persists across multiple game sessions.
- **v0.8.3.4 - UI Layering & Overlay Fixes (2025-12-31) ✅ COMPLETE**
  - **Stacking Fix**: Moved `uiCanvas` to `position: fixed` with Z-index 2000.
  - **Input Logic**: Re-mapped `Escape` to close overlays; blocked gameplay input (WASD) while they're visible.
- **v0.8.3.3 - Responsive HUD & UI Audio (2025-12-31) ✅ COMPLETE**
  - **HUD Redesign**: Created "Glass Tech" stacked layout for 50px unified bottom-UI.
  - **UI Audio**: Integrated procedural hover "Tick" and click "Pip" sounds across all menus.
  - **Legibility**: Increased weapon box dimensions and added vertical color accent bars.
- **v0.8.3.2 - Armory & Audio Expansion (2025-12-31) ✅ COMPLETE**
  - **New Weapon**: Laser Gun (Slot 8) with instant raycast logic.
  - **Weapon Logic**: Implemented "Logic Bullet" for instant-hit weapon reward reuse.
  - **Menu Audio**: Added procedural "Pip" sounds for all settings interactions.
  - **UI/UX**: Updated keybind labels and default controls for expanded weapon set.
- **v0.8.3.1 - Refinement Sprint (2025-12-31) ✅ COMPLETE**
  - **Audio Overhaul**: Replaced tonal SFX with visceral synthesized textures.
    - ✅ **Impacts**: Multi-layered synthesized "meaty" thuds.
    - ✅ **Hit Markers**: Noise-based mechanical "ticks".
    - ✅ **Kill Sounds**: Wet noise squelch/splat.
    - ✅ **Multiplier**: Dual-oscillator "Crystal Shimmer" (short/quiet).
    - ✅ **Mixer**: Independent volume settings for all SFX layers.
  - **Visual Diversity**: Refined the 8 Normal Zombie variants.
    - ✅ **Animations**: Sinusoidal walking feet and dual swaying arms.
    - ✅ **Cohesion**: Added long sleeves (clothing colored) and visible hands. 🧟‍♂️✨
  - **Arcade Music**: Procedural dynamic soundtrack scaling with intensity.
  - **UX/UI**: Dark Mode landing page, Cursor visibility fixes, Campaign Intro.
- **Campaign Intro [2025-12-31]**: Added cinematic intro with noise effects and story text.
- **Cursor Fix [2025-12-31]**: Fixed invisible cursor in settings menu.
- **Settings System Big Features [2025-12-22]**: Added tooltips and color picker to Settings panel.
- **Performance Improvements Phase 2 [2025-12-22]**: In-Place Array Compaction, Double-Buffered Blood.
- **WebGPU Screen Shake Sync [2025-12-23]**: Synced shake offset between Canvas 2D and WebGPU renderers.

## Backlog
- [ ] Implement "Boss Rush" mode
- [ ] Add rest of weapon placeholders (Flamethrower is done, Laser is done)
- [ ] Campaign Zone 2 — Maintenance Tunnels (narrow layout + steam hazards)
- [ ] Campaign trigger/dialogue system (debris-clear scripted event)

## Blocked Items
- [ ] Survival Mode (Disabled in code)

## Recent Context (last 5 actions)
1. **Campaign Zone 1 — Crash Site (2026-07-06)**: `MapLoader`, `crashSite.js`, wall collision, objective HUD, campaign `gameMode` wiring; docs in `CAMPAIGN_DESIGN.md`, `ARCHITECTURE.md`, `CHANGELOG`, `SUMMARY`.
2. **Siren Zombie shipped (2026-07-05)**: Support screamer mob — horde buff, aim jitter, cyan VFX/audio; docs in `ENEMY_TYPES.md`.
3. **Class Tree docs (2026-06-25)**: SUMMARY, XP_AND_SKILLS_SYSTEM, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN updated for hybrid 3×5 trees.
4. **Class Tree System shipped (2026-06-25)**: `skillTreeDefinitions.js`, SkillSystem hybrid pool, combat hooks, LevelUp/HUD tree UI, Tree Master achievement.
5. **Docs refresh (2026-06-25)**: Updated SUMMARY, CHANGELOG, REFACTOR_PLAN, ARCHITECTURE, My_Thoughts for Phase 4 / collision split / touch-control fix.

## Active Tasks
- [x] Verify mobile settings panel fix
- [x] Mobilify HUD (Auto-scaling for small screens)
- [x] Fix Main Menu Touch Interaction
- [x] Hide Keybinds & Add Pause Button on Mobile
- [x] Fix Menu UI Size on Mobile
- [x] Revamp Mobile HUD (Move Stick, Optimize Bottom bar)
- [ ] Expand Car Builder Parts
- [ ] Debug Main Menu Buttons
