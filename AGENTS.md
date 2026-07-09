# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Zombobs is a top-down zombie survival shooter built entirely with **vanilla JavaScript (ES6+)**, HTML5 Canvas 2D, and WebGPU. **Zero external runtime dependencies** on the client — no frameworks, no bundlers, no build step. The multiplayer server uses Node.js + Express + Socket.IO.

Version: **V0.9.3 ALPHA**. Proprietary/closed-source license. Codebase scale: **~44,609 functional LOC** across **144** maintained files (JS **~39,065** / **107** files) per `tools/count_functional_loc.py` (2026-07-09).

**Game modes:** Arcade (wave survival arena), Campaign Act 1 (**Zones 1–4** playable: Crash Site → Maintenance Tunnels → Switching Yard → Control Tower + **The Warden**), Co-op, Multiplayer.

## Commands

### Run Local Dev Server (Multiplayer + Static Files)
```powershell
# Option A: One-click launcher (Node >=18 gate, deps, health-gated browser open, foreground server)
.\launch.bat
# Or directly:
.\launch.ps1
.\launch.ps1 -Port 3001 -NoBrowser   # custom port, skip browser
.\launch.ps1 -KillPort               # free port if already in use (interactive confirm)

# Option B: Manual
cd LOCAL_SERVER
npm install          # first run only
npm start            # serves on http://localhost:3000
```
Launcher opens **`landing.html`** (scoreboard + links); game entry is **`index.html`**. Version read from `LOCAL_SERVER/package.json` (not hardcoded in launcher). Port override: `-Port`, `$env:PORT`, or `$env:ZOMBOBS_PORT`.

### Open Game Without Server (Single Player Only)
Open `index.html` directly in a browser. No build step needed. `landing.html` is the public marketing/scoreboard page (also served by the dev server).

### Itch.io Build
```powershell
# From repo root — produces Zombobs_Web.zip with forward-slash paths (required for itch CDN)
powershell -NoProfile -ExecutionPolicy Bypass -File ITCH/build-itch.ps1
```
**Critical:** Never use `Compress-Archive` or Explorer zip — they embed backslashes causing 403 errors on itch.io.

### Mobile (Android via Capacitor)
```powershell
cd mobile
npm run sync:web     # copies index.html, js/, css/, assets/ into mobile/www
npx cap open android # opens Android Studio
```
Requires JDK 17 or 19, Gradle 8.13.

### Syntax Check
```powershell
.\test-syntax.ps1
```

### No Test Suite
There is no automated test runner or linting configuration. Validation is manual browser testing.

## Architecture

### Rendering Pipeline — Three Canvases
The game uses three stacked `<canvas>` elements (defined in `index.html`):
1. **`gpuCanvas`** — WebGPU background shaders, bloom, ZombobsFX spore cloud (bottom layer)
2. **`gameCanvas`** (id=`gameCanvas`) — Main Canvas 2D gameplay: entities, particles, ground
3. **`uiCanvas`** — All UI: HUD, menus, settings, lobbies, game over (top layer, captures pointer events)

`uiCanvas` is separate from the game canvas and handles all interactive UI. Pointer events are toggled on/off based on active UI state.

### Game Loop (`js/core/GameEngine.js` + `js/systems/GameLoopSystem.js`)
Fixed-timestep loop at 60 FPS with `requestAnimationFrame`. `main.js` wires `gameEngine.update`/`draw` to `GameLoopSystem` methods (~948 lines) which own `updateGame()` and `drawGame()`. Systems hook in via:
```js
gameEngine.update = (dt) => { ... };  // fixed timestep (16.67ms)
gameEngine.draw = () => { ... };      // called every frame
gameEngine.start();
```
WebGPU render is called **after** `drawGame()` so particles synced during draw are included in the GPU frame. Bullet–zombie collision lives in `js/utils/bulletZombieCollisions.js` (~550 lines).

### Centralized State (`js/core/gameState.js`)
Single `gameState` object holds all mutable game state. Key patterns:
- `gameState.players[]` — array of player objects (supports co-op); `gameState.player` is a getter for `players[0]`
- Entity arrays: `bullets`, `zombies`, `particles`, `pickups` (multiple types), `grenades`, `props`, etc.
- UI flags: `showMainMenu`, `showLobby`, `showCoopLobby`, `gamePaused`, etc.
- `resetGameState(canvasWidth, canvasHeight)` — resets all state for a new game session
- Compatibility getters/setters map legacy single-player properties (e.g. `gameState.currentAmmo`) to `players[0]`

### Entry Point (`js/main.js`, ~1,646 lines)
Orchestrates bootstrap: imports all systems, creates instances, wires callbacks, assigns `gameEngine.update`/`draw` to `GameLoopSystem`, handles DOM events, and exposes subsystems on `window` for cross-module access (e.g. `window.gameHUD`, `window.settingsPanel`, `window.webgpuRenderer`). Phase 4 refactor moved the hot loop out of `main.js`.

### Module Layout (ES6 Modules, No Bundler)
All JS uses native `import`/`export`. No webpack, no vite, no transpilation. Files are served as-is.

| Directory | Purpose |
|---|---|
| `js/core/` | Constants (`GAME_VERSION`, `VERSION_HISTORY`, `NEWS_UPDATES`), canvas init, gameState, GameEngine, BootLoader, WebGPURenderer, ZombobsFX; definitions: skills/trees/synergies, equipment, heroes, survivors, achievements, badges, battlepass, ranks |
| `js/entities/` | Entity classes: Zombie (11 variants + Shard minions + Boss + **WardenBoss**; see `DOCS/ENEMY_TYPES.md`), Bullet, Particle, Pickup, Grenade, Molotov, Shell, AcidProjectile, AcidPool, Prop, ScrapPickup, ScrapShrine, EquipmentPickup |
| `js/systems/` | Self-contained systems: **GameLoopSystem**, Audio, Particle, Camera, Input, Settings, Skill, Rank, Achievement, Battlepass, Badge, Multiplayer, ZombieSpawn, ZombieUpdate, PlayerSystem, PlayerRenderer, EntityRender, PropSpawn, PropRender, GroundTexture, BloodSimulation, Melee, PickupSpawn, GameStateManager, ArcadeMusic, TouchControl, ScrapShop, Equipment, WaveChaos, Graphics, RenderingCache, PlayerProfile, **MapLoader** (campaign) |
| `js/maps/` | Static campaign zones for `MapLoader`: `crashSite.js` (Z1), `maintenanceTunnels.js` (Z2), `switchingYard.js` (Z3), `controlTower.js` (Z4 finale) |
| `js/ui/` | Canvas-drawn UI: GameHUD, SettingsPanel, MainMenuScreen, LobbyScreen, CoopLobbyScreen, GameOverScreen, ProfileScreen, AchievementScreen, BattlepassScreen, BadgeScreen, EquipmentScreen, GalleryScreen, LevelUpScreen, VersionModal, CampaignIntroScreen, etc. Main-menu ambient FX: `MenuHordeAmbience.js`, `MenuHandHorrorEffect.js`, `MenuMetalGunshotEffect.js` |
| `js/utils/` | Pure functions: combatUtils, gameUtils, drawingUtils, arrayUtils, bulletZombieCollisions, mapCollisionUtils, Quadtree, ObjectPool, ChunkManager |
| `js/companions/` | `CompanionSystem.js` (hireable heroes + survivor recruits), `CompanionDialogue.js` (speech bubbles) |
| `js/vendor/` | Vendored `socket.io.min.js` (avoids itch.io CSP blocking) |

### Audio (`js/systems/AudioSystem.js`)
Web Audio API mixer with granular volume categories (master, music, SFX, footsteps, gunshots, etc.). **Menu:** `assets/Shadows of the Wasteland.mp3` (loop). **Gameplay:** 3-track MP3 playlist (`the_mountain-game-game-music-508018.mp3`, `viacheslavstarostin-game-gaming-video-game-music-471936.mp3`, `Enthusiast_Tours.mp3`) with intensity scaling via `WaveChaosSystem` / `GameLoopSystem._updateMusicIntensity()`. Default music volume `0.25` (settings v3 migration). `ArcadeMusicSystem.js` retained for non-gameplay procedural layers only. See `DOCS/AUDIO_AND_MUSIC.md` for asset expectations and shipping checklist.

### System Pattern
Systems are typically singleton instances exported from their module:
```js
// Creation
const meleeSystem = new MeleeSystem();
// Usage in main.js
meleeSystem.performMeleeAttack(player);
```
Some use class-based singletons (`cameraSystem`, `propSpawnSystem`), others export initialized objects (`bloodSimulationSystem`, `renderingCache`).

### Settings System (`js/systems/SettingsManager.js`)
All user settings persist to `localStorage`. Read via `settingsManager.getSetting(category, key)`. Changes propagate via `settingsManager.addChangeListener(callback)` — `main.js` wires this to update WebGPU renderer, engine, and cache invalidation.

### Canvas UI Convention
All menus and HUD are drawn on `uiCanvas` using Canvas 2D API (no DOM elements for gameplay UI). Shared drawing helpers live in `js/ui/GameHUD.js` (`drawMenuButton`, `drawGlassCard`, `getUIScale`) and `js/utils/drawingUtils.js`. Canvas UI uses a standard color palette defined in `DOCS/STYLE_GUIDE.md`.

### WebGPU (`js/core/WebGPURenderer.js` + `js/core/ZombobsFX.js`)
Optional GPU-accelerated layer. Gracefully falls back to Canvas 2D. Renders: procedural background shader, bloom post-processing, ZombobsFX (100k particle spore cloud), and synced game particles. Controlled by settings; dirty-flag system for uniform buffer efficiency.

### Boot Loader (`js/core/BootLoader.js`)
Gated `#boot-overlay` on `index.html` masks startup + WebGPU compile/buffer lag. Dismiss requires **first menu frame** + **WebGPU init** (gate skipped when GPU off/unavailable), then **3-frame settle** + min 500ms before fade. Progress creep between stages; stall UI at 5s/10s; 20s failsafe. `WebGPURenderer.init({ onPhase })` reports `adapter` → `device` → `shaders` → `pipelines` → `done` to `reportWebGPUBootPhase()`. Inline critical CSS in `index.html` renders before `style.css`. Key files: `BootLoader.js`, `WebGPURenderer.js`, `main.js`, `index.html`, `css/style.css`.

### Main Menu Ambience (`js/ui/MenuHordeAmbience.js`)
Canvas2D ambient layer for main menu: depth-sorted silhouette horde, ash/embers, ground fog. Owned by `MainMenuScreen.js`; resets on `GameHUD.showMainMenu()`. Stacks under hand-horror + metal gunshot FX. Mobile uses lower walker caps. Flavor pass also adds title pulse/RGB glitch, rotating subtitles, button emoji icons, floating glyphs.

### Campaign Mode (`js/systems/MapLoader.js`)
Act 1 **Echoes of Silence** — linear zone chain with static maps, wall collision (`mapCollisionUtils.js`), scripted events, and Hold-E interact triggers. Design bible: `DOCS/CAMPAIGN_DESIGN.md`.

| Zone | Map file | Key beats |
|---|---|---|
| Z1 Crash Site | `crashSite.js` | Debris-clear north path, extraction |
| Z2 Maintenance Tunnels | `maintenanceTunnels.js` | Steam hazards, lights-out (flashlight) |
| Z3 Switching Yard | `switchingYard.js` | Power couplers (N/M/S Hold E), gated extract |
| Z4 Control Tower | `controlTower.js` | Hack → 45s defend → **WardenBoss** → ACT 1 CLEAR |

**Survivor quests** (`survivorDefinitions.js`): world NPCs Rook/Pip/June/Holt — talk (E) → quest → recruit via `CompanionSystem.recruitSurvivor()`. Campaign uses `gameState.gameMode = 'campaign'`; separate victory path (`campaignVictory()`), zone retry, campaign achievements, radio/static SFX, zone transition interstitial. No arcade boss waves in campaign.

### Equipment & Hireable Heroes
6 equipment slots, 5 rarities, 3 named sets (`equipmentDefinitions.js`, `EquipmentSystem.js`, `EquipmentScreen.js`). Scrap-hire heroes Rex/Mira/Doc/Nix/Kira/Voss via `CompanionSystem.hireHero()` (`heroDefinitions.js`). E-key opens GEAR + HEROES panel in-game.

### Multiplayer Server
Two server variants share the same Socket.IO protocol:
- **`LOCAL_SERVER/server.js`** — Dev server, port 3000, no MongoDB
- **`huggingface-space-SERVER/server.js`** — Production, port 7860, MongoDB persistence for highscores, chat system with rate limiting

Both serve static files from the project root and handle lobby management, player/zombie sync, and leaderboard via Socket.IO events + REST endpoints (`GET/POST /api/highscores`).

### Mobile (Capacitor WebView)
`mobile/` wraps the same web game in an Android WebView. `npm run sync:web` copies web assets into `mobile/www`. The game detects touch and activates `TouchControlSystem` (aim/fire/reload/melee/grenade/weapon/interact/flashlight). Offline play works for local assets; multiplayer/leaderboard need a reachable server. Run `sync:web` after web changes before Android builds.

## Documentation

Status docs live in `DOCS/` (all files carry `<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->`).

| Doc | Purpose |
|---|---|
| `SUMMARY.md` | Project status, shipped features, quick links — read first |
| `SCRATCHPAD.md` | Active tasks, blockers, last actions |
| `ARCHITECTURE.md` | System structure, boot loader, campaign coverage, Mermaid diagrams |
| `CAMPAIGN_DESIGN.md` | Act 1 design bible (zones, Warden, survivor quests, build order) |
| `CHANGELOG.md` | Version history (Keep a Changelog format) |
| `VERSION_UPDATE_CHECKLIST.md` | Version bump workflow across constants, servers, itch, landing |
| `STYLE_GUIDE.md` | UI palette, trace tags, comment conventions |
| `XP_AND_SKILLS_SYSTEM.md` | 63 flat + 30 tree skills, synergies, level-up UX |
| `ENEMY_TYPES.md` | Zombie variants reference |
| `SERVER_SETUP.md` | Local + Hugging Face server setup |

**Agent workflow:** Read `SUMMARY → SCRATCHPAD → STYLE_GUIDE` before coding. Update `SCRATCHPAD` during work. On version bumps, also update `README.md`, `landing.html`, `ITCH/page_description.md`, and `mobile/www/landing.html` per checklist.

## Key Conventions

- **No build step**: Code runs directly in the browser via ES6 modules. Don't add a bundler.
- **Performance-critical hot paths**: Use `for` loops (not `forEach`), squared distances (not `Math.sqrt`), cached object references. See `DOCS/ARCHITECTURE.md` engine micro-optimizations section.
- **Array compaction**: Use `compactArray()` / `compactArrayWithUpdate()` from `js/utils/arrayUtils.js` instead of `filter()` for in-place zero-allocation compaction.
- **Object pooling**: `ObjectPool` in `js/utils/ObjectPool.js` for particles and other frequently created/destroyed entities.
- **Viewport culling**: All entity rendering checks against viewport bounds (`getViewportBounds()`, `isInViewport()`). Update culling uses a larger 300px margin.
- **World-space camera** (single player arcade + campaign): `cameraSystem` follows the player; ground texture, props, and entity rendering offset by camera position. Co-op and multiplayer use screen-space.
- **Campaign vs arcade**: Check `gameState.gameMode` and helpers in `gameUtils.js` (`isSinglePlayerArcadeMode()`, `isGameplayBlocked()`). Campaign spawns, bosses, and victory flow differ from arcade.
- **Version strings**: Update `GAME_VERSION`, `ENGINE_VERSION`, `VERSION_HISTORY` (prepend), and `NEWS_UPDATES` in `js/core/constants.js` together with `LOCAL_SERVER/package.json` and `huggingface-space-SERVER/package.json`. `launch.ps1` reads version from `LOCAL_SERVER/package.json` (no hardcode). Main-menu badge, About screen, and `VersionModal` read from constants — do not hardcode. Full checklist: `DOCS/VERSION_UPDATE_CHECKLIST.md` (includes `landing.html`, itch copy, `mobile/www`).
- **Global exposure**: Systems needing cross-module access are assigned to `window.*` in `main.js`. This is intentional — don't refactor to remove these without a replacement pattern.

## Agent Behavior Charter (META v2.0)

### Bias — Earned Conservatism
Default to first-principles rigor. Quality dominates token count. Move boldly on local, reversible, test-covered changes. Exercise explicit named caution only on high blast-radius or low-reversibility moves.

### META-0 — Situated Judgment Overrides Rules
When first-principles analysis conflicts with a rule, follow the analysis. Name the override, justify from first principles, and act.

### R1–R11 Summary
- **R1** Decompose to causal layer before writing code.
- **R2** Default to decisive action on non-load-bearing ambiguity.
- **R3** Match solution complexity to problem complexity.
- **R4** Refactor adjacent code only when it serves the root cause (≤2× cost or one architectural boundary).
- **R5** Execution is ground truth; inspection is hypothesis. Reproduce failures before repair.
- **R6** Tests must name and protect a contract; fail precisely when violated.
- **R7** Contradictory patterns require choosing one. Correctness > tradition.
- **R8** Tag every claim: executed / inspected / assumed.
- **R9** Push back on wrong premises with evidence; defer if user insists.
- **R10** Boldness scales inversely with irreversibility.
- **R11** Conform to conventions by default; override only for correctness.
