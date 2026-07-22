<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
### Engine + VFX Modernization (2026-07-21) ✅ COMPLETE
- **Done (Phase 0)**: WGSL → `js/shaders/*`; snow overlay gated off; particle RGBA cache + bind-group reuse.
- **Done (Phase 1)**: Real bloom (`PostFXPass`); typed `PARTICLE_KIND`/`emit()`; staged explosions; AcidPool fire fidelity.
- **Done (Phase 2)**: GPU combat compute (`WebGPUEffects`); heat haze; fire-pool embers/lights.
- **Done (Phase 3)**: Camera-anchored blood; GPU blood discs; point lights; `DecalSystem`; procedural floor fallback.
- **Validate**: `test-syntax.ps1` green; `node tools/vfx_smoke_test.mjs` 21/21.
- **Doc drift (flagged)**: AGENTS/ARCHITECTURE still say GPU bottom layer / old bloom/100k FX — overlay z=2, bloom now real, FX=25k.
- **Next**: Optional V0.9.4 modality; browser playtest bloom slider + grenade/molotov; `npm run sync:web`.

### Improve Drops + Equipment Pass B (2026-07-21) ✅ COMPLETE
- **Done**: Boss/Warden loot parity (`isBossEntity`); Warden 100% legendary-biased gear + boss scrap; melee equipment drops; crate magnet + name label + full-inv leave crate; equip swap abort if inv full; EquipmentScreen scroll 24 + Shift+click scrap sink; merchant **Gear Crate** offer.
- **Files**: `EquipmentSystem.js`, `EquipmentPickup.js`, `EquipmentScreen.js`, `MeleeSystem.js`, `PickupSpawnSystem.js`, `GameLoopSystem.js`, `scrapOfferUtils.js`, `constants.js`, `GameHUD.js`, `main.js`.
- **Verify**: Melee drop; Warden always gear; full bag crate stays; E panel scroll + Shift scrap; merchant Gear Crate spawns equipment.
- **Syntax**: `test-syntax.ps1` / `node --check` on touched files.

### Update Modals — Scrap Economy Depth (2026-07-21) ✅ COMPLETE
- **Done**: In-game modalities only (no GAME_VERSION / landing / itch bump).
  - `VERSION_HISTORY` — prepended **UNRELEASED / Scrap Economy Depth** with `tag: 'CURRENT'`; removed CURRENT from V0.9.3; trimmed V0.8.3 to keep ~6 entries.
  - `NEWS_UPDATES` — ticker leads with Arcade Depot + Wandering Merchant.
- **Verify**: Main menu news reel shows Depot/Merchant; 🎃 badge → PATCH NOTES shows UNRELEASED CURRENT block first; badge text still `V0.9.3 ALPHA` until next modality bump.
- **Out of scope**: Full V0.9.4 checklist (landing/README/servers/`mobile/www`).

### Docs Sync — Arcade Depot + Wandering Merchant (2026-07-21) ✅ COMPLETE
- **Done**: Status docs aligned to Unreleased arcade shop depth (no public README/landing/itch bump — code-only feature until modality pass).
- **Touched**: `SUMMARY`, `ARCHITECTURE` (`WorldShopSystem` + shrine amend), `AGENTS.md` (entities/systems/utils), `My_Thoughts`, `roadmap` (economy/trading amend), `CHANGELOG` Unreleased (already present), this SCRATCHPAD.
- **Next**: Optional `npm run sync:web` if shipping mobile; modality pass when ready to advertise.

### Arcade Depot + Wandering Merchant (Extreme) (2026-07-21) ✅ COMPLETE
- **Done**: Arcade-only scrap economy depth on top of wave-break shrine.
  - Fixed **Scrap Depot** at run start (~800–1200px from spawn), multi-offer restock (ammo/medkit/grenade/molotov/shield), wave-scaled prices, stock refresh each wave break, always-on bronze HUD beacon (compass `D` + edge chevron).
  - Rare **Wandering Merchant** (wave 6+, 35% on break, 2-wave cooldown): 2–3 weighted black-market offers (turret/orbital/mystery/overclock syringe/scrap magnet/panic nuke/reroll token/XP burst), toast + purple beacon, wander + leave on break end / sold out / timer.
  - Shared `applyScrapOffer` in `js/utils/scrapOfferUtils.js`; shrine catalog untouched.
- **Files**: `ScrapDepot.js`, `WanderingMerchant.js`, `WorldShopSystem.js`, `scrapOfferUtils.js`, `constants.js`, `gameState.js`, `ScrapShopSystem.js`, `GameLoopSystem.js`, `GameStateManager.js`, `GameHUD.js`, `main.js`, `PlayerSystem.js`, `PickupSpawnSystem.js`, `SkillSystem.js`, `combatUtils.js` (export `triggerNuke`).
- **Input**: E priority shrine → depot/merchant → equipment; Q/scroll/gamepad bumpers cycle offers near vendor.
- **Syntax**: `test-syntax.ps1` all green (includes new files).
- **Verify**: Arcade start → follow `D` to depot → buy mid-wave; wave break shrine still rolls; wave 6+ merchant toast + `M` beacon; MP/campaign no depot/merchant.
- **Out of scope**: Campaign map shops, between-run permanent shop, multiplayer sync.

### Fix missing `drawBossRushHeader` export (2026-07-21) ✅ COMPLETE
- **Problem**: GitHub Pages crash — `GameLoopSystem.js` imports `drawBossRushHeader` from `drawingUtils.js` but export was never added (Boss Rush commit `ca92d3e`).
- **Done**: Added `drawBossRushHeader()` in `js/utils/drawingUtils.js` — top banner when `gameMode === 'boss_rush'` (wave + boss/elites hint).
- **Syntax**: `node --check` green on `drawingUtils.js` + `GameLoopSystem.js`.
- **Verify**: Hard refresh GitHub Pages / local — main menu loads; Boss Rush shows banner during run.
- **Deploy**: Push so `otterdays.github.io/Zombobs` picks up the fix.

### V0.9.3 Modality Pass (2026-07-09) ✅ COMPLETE
- **Done**: Bump **V0.9.3 ALPHA** — *Act 1 Finale Update* per `VERSION_UPDATE_CHECKLIST.md`: `constants.js`, `index.html`, `landing.html`, `README.md`, `ITCH/page_description.md`, server packages, `AGENTS.md`, `CHANGELOG`, `SUMMARY`, `My_Thoughts`, checklist amend.
- **Highlights**: Z1–4 + Warden + ACT 1 CLEAR, survivor quests, campaign alive, menu horde ambience, boot hardening, achievements/gallery, 44,609 LOC.
- **Verify**: 🎃 badge + news ticker + patch notes modal show V0.9.3 with `CURRENT` tag.
- **Next**: `npm run sync:web` for mobile mirror.

### Docs Sync — Unreleased Features (2026-07-09) ✅ COMPLETE
- **Done**: Boot hardening + main-menu horde ambience + LOC **44,609** across status + public copy.
- **Touched**: `SUMMARY`, `CHANGELOG`, `ARCHITECTURE`, `AGENTS.md`, `My_Thoughts.md`, `README.md`, `landing.html`, `mobile/www/landing.html`, `ITCH/page_description.md`, `VERSION_UPDATE_CHECKLIST.md`, `SCRATCHPAD`.
- **Out-of-Scope**: `assets/Enthusiast_Tours.mp3` — untracked asset, not wired in `AudioSystem`; do not document as shipped until integrated.
- **Next**: `npm run sync:web` if shipping mobile (root `index.html` boot overlay + `MenuHordeAmbience.js` may drift).

### Functional LOC Re-Audit (2026-07-09) ✅ COMPLETE
- **Done**: Re-ran `python tools/count_functional_loc.py` + `tools/count-loc.ps1` (PS counter slow on full tree; Python is canonical per prior audits).
- **Result**: **44,609** functional LOC across **144** maintained files (**39,065** JS LOC / **107** JS files). Prior 2026-07-09 audit was 40,910 / 140 (JS 36,106 / 103).
- **Growth drivers**: Act 1 finale (Z4 + Warden), survivor quests, campaign alive pass, achievements/gallery redesign, main-menu horde ambience + flavor pass.
- **Docs updated**: `SUMMARY`, `CHANGELOG` Unreleased, `SBOM`, `README`, `landing.html`, `mobile/www/landing.html`, `ITCH/page_description.md`.
- **Next**: Optional `npm run sync:web` if mobile mirror drifts beyond landing copy.

### Main Menu Flavor Pass (2026-07-09) ✅ COMPLETE
- **Done**: `MenuHordeAmbience.js` — silhouette horde (depth-sorted), ash fall, ember sparks, ground fog band; mobile caps lower.
- **Done**: `MainMenuScreen.js` — button emoji icons (wider buttons), title pulse + RGB glitch, rotating flavor subtitles, floating 🧟💀🩸🎃 glyphs, username blood drip; horde drawn under tear/hand FX.
- **Done**: `GameHUD.showMainMenu` resets `hordeAmbience`.
- **Syntax**: `node --check` green on both files.
- **Verify**: Hard refresh → main menu — silhouettes walk bottom third, ash/embers, icons on buttons, title glitch occasionally.
- **Next**: Optional `npm run sync:web` for mobile mirror.

### Boot Loader — WebGPU Buffer/Lag Hardening (2026-07-09) ✅ COMPLETE
- **Problem**: Overlay bar froze during WGSL compile / buffer alloc; dismiss could flash before GPU present settled.
- **Done**: `BootLoader.js` — progress creep to next-stage ceiling, stall soft/hard (5s/10s), elapsed + %, 3-frame settle + min 500ms display, failsafe 20s, `reportWebGPUBootPhase()`.
- **Done**: `WebGPURenderer.init({ onPhase })` reports adapter/device/shaders/pipelines/done; `main.js` wires phases into boot UI.
- **Done**: `index.html` + `style.css` — spinner, bar sheen, percent, elapsed, stall accent; reduced-motion safe.
- **Verify**: Hard refresh `index.html` with WebGPU on — bar creeps during compile, stall copy if slow, fade only after settle; Canvas2D path still dismisses after first frame.
- **Next**: Optional `npm run sync:web` for mobile mirror.

### Campaign Alive Coverage Pass (2026-07-09) ✅ COMPLETE
- **P0 Feedback**: All MapLoader toasts → `triggerWaveNotification()` (life fixed); campaign kind skips arcade "Get ready…" subtitle; radio line as subtitle.
- **P0 Quests**: Party-full keeps NPC (no `recruited` burn); block new quest while active; kill progress via `run.quest.progress`; zone-leave auto-abandon incomplete quest.
- **P1 Presence**: Gamepad `interact.pressed` hold for couplers/terminal; `CompanionDialogue.draw()` wired; NPC-anchored speech bubbles; survivor `lines.complete` on recruit.
- **P1 Transition**: 1.2s zone interstitial overlay (`drawCampaignTransition`) before `_loadNextCampaignZone`.
- **P2 Atmosphere**: `RADIO_BEATS` table + static SFX; `fogAlpha` veil; lights-out flicker; steam hiss; coupler/gate/defend/warden/act stingers; 2/3 coupler rush; hold interrupt on damage.
- **P2 Casting**: No arcade boss waves in campaign; zone spawn bias (Z2 crawler/fast, Z3 spitter/siren, Z4 armored).
- **P3 Fantasy**: `ZONE FAIL` + **Retry Zone**; `campaignVictory()` separate from death; achievements **Echo Actual**, **Warden Slayer**, **Fireteam**.
- **Docs**: SUMMARY, ARCHITECTURE (§ Campaign Alive Coverage), CAMPAIGN_DESIGN §17/§19, My_Thoughts, SCRATCHPAD last-5; CHANGELOG Unreleased already had entry.
- **Syntax**: `test-syntax.ps1` all green.
- **Manual playtest checklist**: Z1→Z4 full clear; 2+ recruits; party-full consolation then recruit when slot opens; mid-quest extract abandon toast; death→retry same zone; act clear achievements; gamepad hold-E on Z3 couplers + Z4 terminal.

### Local Server Launcher Polish (2026-07-09) ✅ COMPLETE
- **Done**: Rewrote `launch.ps1` — version from `LOCAL_SERVER/package.json`, Node >=18 gate, port override (`-Port` / `$env:PORT` / `$env:ZOMBOBS_PORT`), interactive `-KillPort`, health-gated browser open (`-NoBrowser`), LAN/dashboard URLs, cwd pinned to repo root, npm stderr no longer fatal under `$ErrorActionPreference Stop`.
- **Done**: `launch.bat` forwards args + clearer failure exit codes.
- **Docs**: `SERVER_SETUP.md` paths fixed (`LOCAL_SERVER` / `huggingface-space-SERVER`); HF README path fix; `AGENTS.md` + `VERSION_UPDATE_CHECKLIST` no longer require hardcoding launcher version.
- **Verify**: `.\launch.ps1 -NoBrowser -Port 3999` → server READY on 3999.

### Achievements + Gallery Visual Redesign (2026-07-09) ✅ COMPLETE
- **Done**: Achievements overlay — completion ring + stat pills, category rail with icons/counts, status chips (All/Unlocked/In Progress), horizontal cards with desc/reward/date, ambience vignette/scanlines, blood-red Creepster title.
- **Done**: Gallery — tabbed Zombies/Weapons/Pickups, threat/tier/rarity tags, rounded hover cards, 2–3 col grid, Laser + Warden entries, scroll fade + fixed scroll wiring on `galleryScreen`.
- **Wiring**: `main.js` tab clicks + wheel scroll to `galleryScreen`; open gallery resets tab/scroll.
- **Syntax**: `node --check` on AchievementScreen / GalleryScreen / main.js green.
- **Mobile**: `npm run sync:web` after polish.
- **Verify**: Main Menu → Achievements (filter categories/chips) → Gallery (tabs, scroll, hover, Back).

### Act 1 Survivor Quests + Ante/QoL (2026-07-09) ✅ COMPLETE
- **Done**: World survivors per zone — meet (E) → quest → recruit teammate via `CompanionSystem.recruitSurvivor()`.
  - Z1 **Rook** (kill 8), Z2 **Pip** (reach wave 2), Z3 **June** (bring 30 scrap), Z4 **Holt** (kill 12).
- **Done**: `js/core/survivorDefinitions.js`; map `survivors[]`; MapLoader NPC draw/talk/quest/recruit; party-full → scrap consolation.
- **Done**: Ante — extract tax (panic pack, must thin to ≤2 before clear); hotter zone starts (`zombiesPerWave` scales by zone); Z4 defend 50s.
- **Done**: QoL — companions park at next-zone spawn; `campaignSurvivorRun` persists across zones; HUD E prompts for talk/recruit; quest-ready toast.
- **Edge cases**: party full, scrap quest pay-on-recruit, already-recruited skip spawn, extract tax before zone clear, survivor bubble expiry.
- **Syntax**: `test-syntax.ps1` green.
- **Verify**: Campaign — talk Rook → kill 8 → recruit; clear extract tax; Pip/June/Holt; party of 4 → consolation scrap.

### Act 1 Finale Implementation — Z1–Z4 Playable (2026-07-09) ✅ COMPLETE
- **Done (code)**: Bible §17 build order shipped:
  1. **Z3 power couplers** — Hold E on N/M/S `power` triggers; gate extract gated until 3/3; `switchingYard.nextMapId = 'control_tower'`.
  2. **Z2 steam + lights-out** — `hazards[]` steam jets (DoT + telegraph); `scriptedEvents` lights_out at wave 2 (flashlight force + dark veil).
  3. **Z1 debris-clear** — wave 2 unlocks north path VFX (`_cleared` walls) + extract beacon.
  4. **Z4 Control Tower** — `js/maps/controlTower.js` (2000×2200 nested rings); registry in `MapLoader`.
  5. **Warden** — `js/entities/WardenBoss.js` (3 phases, slam/scream/adds/blackout); spawn after 45s defend.
  6. **Act Clear** — hack Hold E → defend bar → Warden kill → `campaignActClear` + **ACT 1 CLEAR** game-over title.
- **MapLoader**: `update()` loop — hazards, interact holds, defend spawns, warden death; trigger types `power` / `hack` / `defend`; Hold-E prompt in objective banner.
- **Wiring**: `gameState.campaignScript` / `campaignActClear`; E-key interact vs equipment; finale wave lock; warden in boss kill hooks.
- **Syntax**: `test-syntax.ps1` all green.
- **Docs**: This entry + CHANGELOG Unreleased + SUMMARY + CAMPAIGN_DESIGN stubs + ARCHITECTURE + AGENTS + My_Thoughts.
- **Verify**: Campaign → Z1 extract → Z2 steam/lights → Z3 power 3/3 → Z4 hack/defend/Warden → ACT 1 CLEAR.
- **Next**: Playtest balance (Warden HP / defend duration).
[AMENDED 2026-07-09]: Gallery now includes The Warden + Laser; Achievements/Gallery UI redesigned — see task above.

### V0.9.2 Modality Pass (2026-07-09) ✅ COMPLETE
- **Done**: Bump **V0.9.2 ALPHA** — *Campaign & Mobile Update* per `VERSION_UPDATE_CHECKLIST.md`: `constants.js`, `index.html`, `landing.html`, `README.md`, `ITCH/page_description.md`, `launch.ps1`, server packages, `AGENTS.md`, `CHANGELOG`, `SUMMARY`, `My_Thoughts`, checklist amend.
- **Done**: `npm run sync:web` → `mobile/www`.
- **Verify**: 🎃 badge + news ticker + patch notes modal show V0.9.2 with `CURRENT` tag.

### Website + Docs Public Copy Refresh (2026-07-09) ✅ COMPLETE
- **Done**: Brought README / `landing.html` / `ITCH/page_description.md` / `mobile/www/landing.html` in line with v0.9.2 systems (Campaign Z1–3, equipment sets, hireable heroes, immersion polish) + **40,910** LOC / **140** files.
- **README**: Badge → **0.9.2 ALPHA**; V0.9.2/0.9.1/0.9.0/0.8.4 What's New blocks.
- **Landing/itch**: Hero copy, feature cards, changelog side panel, core features, enemy/skill counts corrected (8 weapons, 11+ zombies, 93 skills).
- **Status docs**: This entry + SUMMARY/CHANGELOG annotate; prior audit/AGENTS/ARCHITECTURE/CAMPAIGN_DESIGN work retained.
- **Next**: Paste itch description to store page when publishing build.

### Act 1 Zones 1–4 Design Bible (2026-07-09) ✅ COMPLETE (docs)
- **Done**: Expanded `DOCS/CAMPAIGN_DESIGN.md` §5–§17 — full inward expansion of Crash Site / Tunnels / Switching Yard / Control Tower (no Act 2). Includes feeling arc, Fireteam Echo hooks, enemy casting matrix, per-zone beat scripts, VO, encounter recipes, Z3 power-coupler fantasy, Z4 Warden boss + hack/defend, build order.
- **Scope lock**: Stay in Railyard / Outskirts only.
- **Next (code)**: Priority from bible §17 — (1) Z3 power couplers (2) Z2 steam + lights-out (3) Z1 debris-clear VFX (4) Z4 map (5) Warden (6) Act Clear UI.
- [AMENDED 2026-07-09]: §17 code shipped — see **Act 1 Finale Implementation** active task above.

### Codebase Audit + Docs Refresh (2026-07-09) ✅ COMPLETE
- **Done**: Re-ran `python tools/count_functional_loc.py` + `test-syntax.ps1`.
- **Result**: **40,910** functional LOC across **140** maintained files (**36,106** JS LOC / **103** JS files). Prior 2026-07-05 audit was 34,773 / 125 (JS 30,237 / 88).
- **Syntax**: All `js/**/*.js` pass `node --check`.
- **Docs updated**: `SUMMARY`, `CHANGELOG` Unreleased, `ARCHITECTURE` (MapLoader multi-zone), `AGENTS.md` maps/systems, `SBOM` last-audited stamp, landing/README/itch LOC copy.
- **Gap closed in CHANGELOG**: Blood-edge WebGPU injury overlay; `MenuMetalGunshotEffect`; hero role nameplate (`isHero` / `heroRole`).
- **Out-of-Scope Observations**: `SUMMARY` file-structure tree still lists pre-expansion modules (annotate later); `mobile/www` LOC excluded by audit tool (generated) — re-sync before Android if source drifted. [AMENDED 2026-07-09]: Zone 4 + Warden now playable (see Act 1 Finale task). [AMENDED 2026-07-09]: `assets/Enthusiast_Tours.mp3` present but not referenced in code. [AMENDED 2026-07-09]: `mobile/www` may lack root boot-overlay hardening + `MenuHordeAmbience.js` until `npm run sync:web`.
- **Next**: Optional v0.9.2 modality bump when shipping Unreleased block; playtest Z1→Z3 + hire hero + equipment sets.

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
- **Done**: Extended `js/core/BootLoader.js` — staged progress bar (bootstrap → systems → WebGPU → first frame), rotating tips, `GAME_VERSION` chip, 12s failsafe timeout. [AMENDED 2026-07-09]: Superseded by **WebGPU Buffer/Lag Hardening** — creep, stall UI, phase callbacks, 3-frame settle, 20s failsafe.
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
- [AMENDED 2026-07-09]: Re-audit → **40,910** / **140** files (**36,106** JS / **103**). See Active Tasks audit entry.
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
- [ ] Implement "Boss Rush" mode — [AMENDED 2026-07-21]: Mode + spawn path + menu button shipped (`ca92d3e`); header export fixed. Polish/balance still open.
- [ ] Add rest of weapon placeholders (Flamethrower is done, Laser is done)
- [ ] Campaign Zone 2 — Maintenance Tunnels (narrow layout + steam hazards)
- [ ] Campaign trigger/dialogue system (debris-clear scripted event)

## Blocked Items
- [ ] Survival Mode (Disabled in code)

## Recent Context (last 5 actions)
1. **Fix `drawBossRushHeader` export (2026-07-21)**: Added missing export in `drawingUtils.js` — unblocked module load after Boss Rush commit.
2. **Docs sync — Unreleased (2026-07-09)**: Boot hardening + `MenuHordeAmbience` + LOC 44,609 across SUMMARY/ARCHITECTURE/AGENTS/README/landing/itch/SCRATCHPAD/VERSION_UPDATE_CHECKLIST.
3. **Boot Loader WebGPU hardening (2026-07-09)**: creep, stall, settle, `onPhase` callbacks; `BootLoader.js`, `WebGPURenderer.js`, `index.html`, `style.css`.
4. **Functional LOC re-audit (2026-07-09)**: 44,609 / 144 files (JS 39,065 / 107); public copy updated.
5. **Main Menu Flavor Pass (2026-07-09)**: `MenuHordeAmbience` silhouettes + ash/embers; button emojis; title glitch; blood drip.

[AMENDED 2026-07-21]: Prior #5 Campaign Alive Coverage retained in history above Active Tasks section; dropped from last-5 for space.

## Active Tasks
- [x] Verify mobile settings panel fix
- [x] Mobilify HUD (Auto-scaling for small screens)
- [x] Fix Main Menu Touch Interaction
- [x] Hide Keybinds & Add Pause Button on Mobile
- [x] Fix Menu UI Size on Mobile
- [x] Revamp Mobile HUD (Move Stick, Optimize Bottom bar)
- [ ] Expand Car Builder Parts
- [ ] Debug Main Menu Buttons
