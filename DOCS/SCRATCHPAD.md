<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## 2026-08-05 — Game Over Screen Layout Crush ✅ FIXED (v2 flow rewrite)
- **Report 1**: Copy/Menu buttons overlay Rank/BP/stats.
- **Report 2** (after v1): buttons clear, but BP tier-up + Rewards Claimed + NEW RECORD still pile on MAX STREAK card ("even worse / old shit").
- **Root cause**: leftover `cy + yOffset` soup — BP extras and quick-stats shared the same band; +20px bump not enough.
- **Fix v2**: full vertical cursor in `resolveLayout()` — title→cause→combat→score→mult→rank→BP(tier/rewards)→stats→banner→buttons. Each block owns its Y. Centered stack, clamped on-screen. Draw + hit-test share `L.*`.
- **Also**: `GameStateManager` wave plural (`1 wave` / `N waves`); drop `\n` in score line (`fillText` ignores it).
- **Files**: `js/ui/GameOverScreen.js`, `js/systems/GameStateManager.js` (+ mobile mirrors).
- **Verify**: die with BP tier-up + rewards + streak record → no overlapping green text; cards clean; buttons below.

## 2026-08-05 — Player Model Polish Pass (face / arms / legs / guns) ✅ COMPLETE
- **Ask**: more realistic face, better guns, better arms/legs, iterate hard.
- **Legs**: opposite-phase gait, thigh→knee→shin taper, kneepad plate, lace boot silhouette, planted-foot contact shadow.
- **Arms**: new `drawArm()` — upper sleeve, elbow plate, forearm taper, wrist skin cuff. Wired into all 4 facing directions.
- **Hands**: palm ellipse + knuckle ridge + curled finger ovals + thumb when gripping (`aimAngle` aware).
- **Face**: orbital socket, warm sclera, iris ring + pupil + dual catchlights, lid shadow, cheek warmth, jaw shade, tear trough, nose tip/nostrils, lip volume; profile nose on LEFT/RIGHT; helmet brim raised so eyes readable.
- **Guns**: per-weapon silhouette (`pistol`/`shotgun`/`rifle`/`smg`/`sniper`/`flamethrower`/`rocketLauncher`/`laser`) + length scale + shared grip + muzzle flash core.
- **Head**: oval jaw (not circle), temple indent.
- **Files**: `js/systems/PlayerRenderer.js` (+ mobile mirror). `node --check` green.
- **Verify**: hard-refresh → walk (leg gait), aim (face/gun), swap 1–8 (weapon shapes).

## 2026-08-05 - Player + Zombie Silhouette Repair (COMPLETE)
- **Reported evidence**: Live Arcade screenshot still reads as the legacy blue player capsule and round-head/oval-torso zombies despite the documented model-quality pass.
- **Root cause (inspected)**: The previous zombie pass only appended small anatomy/material accents after the legacy geometry, and Low quality skipped the pass entirely. The player still used an ellipse as its dominant torso, with most articulated leg work hidden underneath it.
- **Repair target**: Replace the dominant player torso with a readable tactical humanoid rig; add shared articulated zombie shoulder/waist/jaw/limb geometry across every quality tier while retaining type-specific overlays, hitboxes, and gameplay behavior.
- **Constraint**: Code + documentation only; no browser launch or test run per user request.
- **Implemented**: Replaced the player's dominant ellipse with a broad-shoulder/tapered-waist armored rig, segmented plate, belt, knee pads, and longer visible articulated legs. Added a shared zombie silhouette pass with tapered core, angular jaw, jointed arms/claws, legs/feet, per-type palettes, and a dedicated four-point Crawler posture. Boss/Warden keep their bespoke rebuilt rigs.
- **Quality correction**: Low now retains model identity instead of disabling the model pass; higher tiers remain responsible for wounds, ribs, materials, pores, and other secondary finish.
- **Docs**: Corrected the overstated prior claim in `SUMMARY`, added the repair to `CHANGELOG`, and amended the Low-tier contract in `ENEMY_TYPES`.
- **Validation**: Code inspected only. Browser and automated tests intentionally not run.

## 2026-08-05 — Mid-Run Reload Hang (stale frame, no menu) 🔶 FIX SHIPPED, AWAITING BROWSER VERIFY
- **Report**: reload while in a run → world visible but frozen, no input, **no console errors**. Reload from menu fine.
- **Root cause (inspected)**: no unload teardown existed anywhere — no `pagehide`/`beforeunload`, `device.destroy()` never called, `gameEngine.stop()` never called, multiplayer socket never closed. Mid-run reload leaves the old WebGPU device + `gpuCanvas` swapchain alive; the new document's `requestAdapter()`/`requestDevice()` can then **hang without rejecting**, so `requireWebGPUBootGate()` never satisfies, no menu frame draws, and browser paint-holding keeps showing the previous document's last frame (reads as "frozen game"). Only the 20s BootLoader failsafe recovered.
- **Fix 1 — teardown (`main.js`)**: idempotent `teardownRuntime()` on `pagehide` + `beforeunload` → `gameEngine.stop()`, `webgpuRenderer.destroy()`, `gameState.multiplayer.socket.disconnect()`. Each step try/caught so one failure can't block the rest.
- **Fix 2 — GPU boot gate timeout (`main.js`)**: boot gate races a **6s** timer; on timeout it warns and calls `notifyWebGPUBootReady()` so the menu always appears while GPU init keeps running and applies when it lands.
- **Fix 3 — `WebGPURenderer.destroy()`**: subsystem teardown (`zombobsFX`/`postFX`/`effects`, all optional), `context.unconfigure()`, `device.destroy()`, null `context`/`device`, `isInitialized = false`.
- **Verify (executed)**: `node --check` green on `main.js` + `WebGPURenderer.js`; lints clean. **Not browser-verified yet** — reload mid-run and confirm menu appears right away.
- **Mirror**: `mobile/www/js/main.js`, `mobile/www/js/core/WebGPURenderer.js`.
- **If still hangs**: watch `gameEngine.getPerformanceStats().totalFrames` after reload (rising = loop alive, overlay/state issue; flat = loop never started), and retest with Settings → video → `webgpuEnabled` off to isolate the GPU path.

## 2026-08-05 — Point Lights Buffer 528→544 (Real Fix) ✅ FIXED
- **Error**: `bound with size 528 where the shader expects 544` (lights bind group 0 / binding 1).
- **Root cause**: prior “fix” used `lightBytes = 16 + 16*32` which **is** 528. WGSL `LightBuffer` aligns `array<Light,16>` to offset **32** after `count`+`vec3` pad → need `32 + 16*32 = 544`. `syncLights` also wrote lights at float `@4` (byte 16); correct is `@8` (byte 32).
- **Files**: `js/systems/vfx/WebGPUEffects.js`, `mobile/www/js/systems/vfx/WebGPUEffects.js`.
- **Verify**: hard-refresh + fire weapon → no uncaptured lights draw error; muzzle lights visible.

## 2026-08-05 — Arcade Black Screen (Bloom Alpha) ✅ FIXED
- **Symptom**: Arcade load → black world + green spore noise + HUD OK; console empty (Errors filter).
- **Root cause**: cinematic bloom composite in `js/shaders/bloom.js` rebuilt FX as `vec4(r,g,b, 1.0)` — forced opaque alpha on transparent `gpuCanvas` overlay → painted solid black over Canvas2D world. Spores still visible (drawn into FX buffer).
- **Fix**: restore source `fxSample.a`; grain premultiplied by alpha; impulse lifts alpha so flash still shows.
- **Files**: `js/shaders/bloom.js`, `mobile/www/js/shaders/bloom.js`.
- **Verify**: hard-refresh → arcade ground/entities visible under WebGPU FX.

## 2026-08-05 — Hero + Survivor NPC Model Overhaul ✅ COMPLETE
- **Objective**: Make hireable heroes, recruited survivors, and campaign quest NPCs read as distinct humans instead of accent-tinted player clones.
- **New module `js/systems/HumanCompanionRenderer.js`**: `ROLE_KITS` (accent + glow + kit + cloth + metal + mark per role) is now the single source of role identity. Adds:
  - `drawCompanionGroundMark()` — perspective role ring, rotating dash, facing tick, footfall dust (behind body, quality-gated).
  - `drawCompanionGear()` — per-role torso kit: **riot** (chest slab, curved pauldrons with rim light, back-slung axe), **scout** (wind-flapping cloak, cross strap, 3-arrow quiver), **field** (open coat lapels + hip satchel), **junk** (overloaded pack + tools that swing on stride). Shared pouch belt, deterministic grime, field-dressing bandage + blood when HP < 50%.
  - `drawCompanionHeadgear()` — riot crest + visor glow, scout hood + rangefinder monocle, medic cap + cross patch + headlamp bleed, scavenger forehead goggles; all roles get a swaying comms antenna with blink diode.
- **New module `js/systems/SurvivorNpcRenderer.js`**: full quest-contact rebuild — long coat with wind hem, plated core with seams/straps, slung rifle, role prop (scrap sack / medic lamp / riot plate), stubble + brow/mouth micro-motion, staggered blinks, **breath fog** puff, scan arc retained.
- **`PlayerRenderer.js`**: dropped local `ROLE_VISUALS` + `drawRoleRig` (DRY — role data now imported); added `getViewDescriptor(direction)` so gear layers stay direction-agnostic; `drawSurvivorNPC()` is a thin delegate. File shrank ~150 lines.
- **`PlayerSystem.js`**: hero role label tints by role accent instead of hardcoded orange.
- **Verify (executed)**: `node --check` green on all four files; `ReadLints` clean. Not browser-QA'd yet.
- **Mirror**: 4 files copied into `mobile/www/js/systems/` (2 new + 2 modified).
- **Next**: visual pass in-game at gameplay zoom; consider role kits for co-op AI (`inputSource === 'ai'` non-hero) if they still read plain.

## 2026-08-05 - Zombie Model Quality Pass (IN PROGRESS)
- **Objective**: Upgrade every gameplay zombie model (base/normal variants, armored, fast, exploding, ghost, spitter, flying, blight, crawler, siren, shard, splitter, arcade Boss, and campaign Warden) with stronger procedural anatomy, silhouettes, material detail, and type readability.
- **Quality path**: Make High/Ultra presets apply high-quality Canvas smoothing and meaningfully higher gameplay render density; ensure preset changes notify the resize/smoothing pipeline.
- **Scope guard**: Visual/model code + appended docs only. Per request, do not run automated tests or launch browser QA after the edits.
- **[AMENDED 2026-08-05] Status: COMPLETE** - The header's in-progress marker is superseded. All 13 non-boss render classes plus arcade Boss and campaign Warden are covered.
- **Implemented**: Shared model tier API (`getModelDetailLevel`, `drawOrganicModelDetails`, `drawTypeModelDetails`, `drawClawedHand`); type-specific anatomy/material cues; segmented `FlyingZombie.drawWing`; rebuilt Boss/Warden silhouettes; High/Ultra density + smoothing preset upgrade; smoothing restore after resize.
- **Files**: `js/entities/Zombie.js`, `js/entities/BossZombie.js`, `js/entities/WardenBoss.js`, `js/systems/SettingsManager.js`, `js/core/canvas.js`, `DOCS/SUMMARY.md`, `DOCS/CHANGELOG.md`, `DOCS/ENEMY_TYPES.md`, `DOCS/ARCHITECTURE.md`, `DOCS/STYLE_GUIDE.md`, `DOCS/SCRATCHPAD.md`.
- **Verification boundary**: Code/diff inspection only. Automated tests, syntax scripts, smoke tests, and browser QA were intentionally not run per user request. `mobile/www` was not synced in this pass.

## 2026-08-05 — Engine/VFX Docs Truth Pass ✅ COMPLETE
- **Done**: Synced status + agent docs to shipped hybrid render stack (no code changes in this pass beyond docs).
  - `AGENTS.md` — canvas order (game → GPU overlay → UI); `js/shaders/` + `js/systems/vfx/`; WebGPU truth (~25k FX, real bloom, `coneLight.js`); smoke test note.
  - `ARCHITECTURE.md` — amend WebGPURenderer / ZombobsFX / BloodSimulation / Rendering Pipeline; add PostFX/WebGPUEffects/Decal/shaders sections.
  - `SUMMARY.md` — ✅ Engine + VFX Modernization entry with hotfixes.
  - `CHANGELOG.md` — [v0.10.1] Docs note; [v0.10.0] Fixed: lights 544B, bloom usage conflict, coneLight rename, vfx import depth.
- **Next**: Optional `npm run sync:web` if mobile mirror still lags shaders/vfx.

## 2026-08-03 — Custom Cursor System Overhaul (V0.10.1 ALPHA) ✅ COMPLETE
- **Pointer Cursor Overhaul (`GameHUD.js`)**: Replaced flat vector arrow with high-fidelity animated pointer (`_drawPointerCursor`). Features ghost trails (`_cursorTrail`), motion spark embers with gravity (`_cursorEmbers`), velocity tilt, 2D retro drop shadow, sharp outline, specular highlight, glowing neon tip, smooth blood-red hover glow interpolation (`_cursorHoverGlow`), and animated pulsing target bracket corners `[ ]` on button hover.
- **Interactive Click Ripple (`GameHUD.js`, `main.js`)**: Added `cursorClickFlash()` method wired into `main.js` `mousedown` event listener to project an expanding blood-red energy ripple on click.
- **Grab Hand Cursor Upgrade (`GameHUD.js`)**: Enhanced `_drawGrabCursor` with radial background glow, squeezing scale animation on grab state, double drop shadow, and blood-red fingertip nail accents in open-hand state.
- **Gameplay Crosshairs & Hit Markers (`drawingUtils.js`)**: Added center-gap arm separation for all 4 crosshair styles, specular center pips, cardinal tick marks on circle style, and an animated scale-punch hit marker (`X`) with yellow glow bloom and tilt feedback.
- **Version Bump V0.10.1 ALPHA**: Centralized constants (`constants.js`), package metadata (`LOCAL_SERVER`, `huggingface-space-SERVER`), landing page (`landing.html`), itch description (`ITCH/page_description.md`), README badge (`README.md`), `CHANGELOG.md`, and `SUMMARY.md`.
- **Files**: `js/ui/GameHUD.js`, `js/utils/drawingUtils.js`, `js/main.js`, `js/core/constants.js`, `LOCAL_SERVER/package.json`, `huggingface-space-SERVER/package.json`, `landing.html`, `ITCH/page_description.md`, `README.md`, `DOCS/CHANGELOG.md`, `DOCS/SUMMARY.md`, `DOCS/SCRATCHPAD.md`.

## 2026-08-02 — WebGPU Lights Uniform Buffer Under-Allocation Fix ✅ COMPLETE
- **Error**: `Uncaptured WebGPU error: In a draw command, kind: Draw, ... bind group index 0, the buffer bound at binding index 1 is bound with size 528 where the shader expects 544.` (additive point-lights pass).
- **Root cause**: `WebGPUEffects._initLights()` sized the light uniform buffer `(4 + 16*8) * 4 = 528` bytes, but the WGSL `LightBuffer` struct is `count(4B) + vec3 pad(16B, 16-aligned) + 16 × Light(32B) = 544` bytes — the vec3 padding after `count` forces `data` to offset 32. Comment even said "pad to 144*4" but the code never padded.
- **Fix**: buffer + CPU array sized `16 + 16*32 = 544` bytes (`lightBytes`); `syncLights()` layout (count@0, light@`4 + i*8` floats) unchanged and now writes the full 544 bytes.
- **Audit (executed)**: all other uniform bindings verified in-range — Flashlight struct 16B in 32B buffer (larger OK), `bloodGridParams` vec4 16B = 16B, ZombobsFX `SimParams` 16B = 16B, combat `dtPad` vec4 16B = 16B, main `Uniforms` 32B in 48B buffer, bloodEdge 24B in 32B. No other under-allocations.
- **Files**: `js/systems/vfx/WebGPUEffects.js`, `DOCS/SCRATCHPAD.md`.
- **Verify**: `node --check` green; hard-refresh with WebGPU on → no uncaptured draw errors; muzzle/explosion/fire lights render.
- **Note**: `mobile/www` mirror stale — run `cd mobile && npm run sync:web` before next Android build.

## 2026-08-02 — Cursor, Game Over Screen & Transition Smoothness ✅ COMPLETE
- **Cursor boundaries (bug)**: custom cursor vanished at screen edges — `drawCursor()` early-returned when the pointer left `[0, canvas]` while the OS cursor was hidden (`cursor: none`), leaving no visible pointer near edges; position also froze at the last in-window spot when the mouse left the window.
  - Fix: `drawCursor()` now clamps the drawn position to a 5px margin inside the canvas; new `gameHUD.mouseInside` flag (true on `mousemove`, false on `mouseleave`/window `blur`) hides the cursor when the pointer leaves the window instead of freezing it.
- **Cursor redesign (retro)**: chunky miter arrow — crisp offset drop shadow (`#02040a`), hard dark outline, bone-white fill (`#f5f5f5`), hot-red tip pixel (`#ff1744`); hovering an interactive element turns the fill blood red (`#ff5252`) + red target square under the point. No blur — keeps the pixel/CRT feel. Grab/grabbing hand states untouched.
- **Game over screen redesign** (`GameOverScreen.js` rewritten): glass dossier card (rounded, style-guide `rgba(10,12,16,…)` + red bottom accent) sized to content, blood-red edge vignette, neon-pulsing Creepster title, `CAUSE OF TERMINATION` microlabel + quoted epitaph, dashed divider, bracketed retro readout `[ ACCURACY X% ] [ HEADSHOTS Y ] [ SCRAP Z ]`, restyled stat cards (flat terminal blocks + colored top notch + upper-case labels), staggered card fade-in. All original vertical positions preserved; button geometry/hit areas byte-identical to `checkButtonClick` (no click regressions).
- **Transitions**: entrance animation on game over (ease-out cubic 550ms, content rises + fades, cards stagger); pause menu fades in (220ms); new `gameHUD.startScreenFade()` full-screen black fade with callback — wired to game-over→Main Menu (320ms), game-over→Retry Zone (320ms), pause→Return to Menu (320ms); `handleMenuInteraction` ignores clicks while a fade is running. Menu→game already used the session-prep spinner fade.
- **Files**: `js/ui/GameHUD.js`, `js/ui/GameOverScreen.js`, `js/ui/PauseMenuScreen.js`, `js/main.js`, `DOCS/SCRATCHPAD.md`.
- **Verify**: `node --check` ×4 green + `test-syntax.ps1` green. Manual: move cursor to screen edges (stays visible, clamped), leave window (cursor hides, no freeze), die (dossier slides/fades in), pause (fade-in), pause→menu & game-over→menu (black fade, no click-through during fade).
- **Note**: `mobile/www` mirror stale — run `cd mobile && npm run sync:web` before next Android build.

## 2026-08-02 — Font Sanitizer Warnings Fixed (Roboto Mono + Creepster) ✅ COMPLETE
- **Warnings** (Chrome, benign but noisy): `glyf: empty gid 1 used as component in glyph 225` (Roboto Mono 400/700 woff2), `glyf: Glyph bbox was incorrect; adjusting (glyph N)` ×~160 (Creepster), `gasp: Changed the version number to 1` (Creepster).
- **Root causes** (executed via fontTools): Google's Roboto Mono TTFs define NBSP as a composite glyph of the empty `space` glyph; the old custom subsets kept that composite → sanitizer flagged "empty gid 1 component". Creepster ships with wrong glyf bboxes + a version-0 `gasp` table.
- **Fixes** (files rewritten in place, originals backed up to `%TEMP%\opencode\zombobs-fonts\`):
  - `roboto-mono-latin-400/700.woff2`: regenerated via fontTools subset from the original Google TTFs (`L0xuDF4xlVMF-*`) with identical coverage (228 chars, no hinting, `layout_features='*'`), then decomposed empty-component composites (NBSP→space) into plain 0-contour glyphs (advance width preserved, 1229 both).
  - `AlZy_zVUqJz4yMrniH4hdQ.ttf` (Creepster): `glyf.recalcBounds()` on every glyph + `gasp.version = 1`, saved as TTF (same format, no CSS change).
- **Files**: the 3 font binaries, `DOCS/SCRATCHPAD.md`. No code/CSS changes needed — filenames/format unchanged (`fonts.css`, `index.html` preload untouched).
- **Verify**: hard-refresh → no `downloadable font:` warnings in console; text renders identically (advance widths byte-identical).
- **Regression note**: the boot-overlay prefetch initially fired before `let WebGPURenderer` initialized (TDZ `ReferenceError` at main.js:220) — prefetch call moved to after `loadWebGPURendererModule()` definition; `node --check` green.
- **Note**: `mobile/www` mirror stale (fonts + BootLoader/style/main) — run `cd mobile && npm run sync:web` before next Android build.

## 2026-08-02 — Boot Overlay: Faster Dismiss + Click-Proof Fade ✅ COMPLETE
- **Bug 1 (accidental clicks)**: during the 350ms fade-out, `.boot-overlay--done` set `pointer-events: none` while still covering the screen (element removed only on `transitionend`/500ms timeout) → clicks passed through to `uiCanvas` and could trigger main-menu buttons while the loading screen was still visibly fading.
- **Fix 1 (three layers)**: removed `pointer-events: none` from `.boot-overlay--done` in `css/style.css` (overlay now swallows clicks during fade; after fade `visibility: hidden` blocks them anyway) + new `isBootOverlayActive()` export in `js/core/BootLoader.js` (true while overlay is in DOM, incl. fade) + `if (isBootOverlayActive()) return;` guard at the top of `handleMenuInteraction` in `js/main.js` — single funnel for every menu/lobby/pause/gameover click (mouse `mousedown` + touch both route there).
- **Speed**: `MIN_DISPLAY_MS` 500 → 300 (overlay was force-held for a minimum half-second even on fast boots; now ~200ms faster) + early module prefetch — `loadWebGPURendererModule()` now caches the in-flight `import()` promise (`webgpuModulePromise`) so a prefetch fired right after `initBootLoader()` (when WebGPU enabled + native) overlaps the WebGPU module fetch/parse with the rest of bootstrap; `scheduleWebGPUInit()` reuses the cached promise (no double import, no unhandled rejection — prefetch has `.catch(() => {})`).
- **Files**: `js/core/BootLoader.js`, `css/style.css`, `js/main.js`, `DOCS/SCRATCHPAD.md`.
- **Verify**: `node --check` green (main.js, BootLoader.js). Manual: hard-refresh → overlay dismisses promptly; mash-click during the fade → no menu button fires; `perf` tab — `zombobs:webgpu:module-load` starts before `zombobs:main:init:start` mark.
- **Note**: `mobile/www` mirror stale for `BootLoader.js`/`style.css`/`main.js` — run `cd mobile && npm run sync:web` before next Android build.

## 2026-08-02 — WebGPU Shader Parse Crash Fix ✅ COMPLETE
- **Bug**: `Uncaptured WebGPU error: Shader module creation failed: Parsing error` + pipeline `matchShaderStages(VERTEX)` invalid at boot (V0.10.0 cinematic composite).
- **Root cause**: `js/shaders/bloom.js` `fs_main` declared `let dv = uv - vec2(0.5)` then did `dv *= vec2(1.5, 1.0)` — WGSL `let` is immutable, so module parse failed and both the composite vertex+fragment pipeline went invalid.
- **Fix**: `let dv` → `var dv` in `js/shaders/bloom.js` (source + `mobile/www` mirror). Verified no other shaders mutate a `let` (`bloodEdge.js`, `coneLight.js` use `var`; composite `params` buffer stays 32 bytes matching `array<vec4<f32>, 2>`).
- **Files**: `js/shaders/bloom.js`, `mobile/www/js/shaders/bloom.js`, `DOCS/SCRATCHPAD.md`.
- **Verify**: hard-refresh `index.html` with WebGPU on — no shader/pipeline errors; bloom/CA/grain/vignette/impulse render.

## 2026-08-02 — Main Menu Pixel-Density (Crisp Text) ✅ COMPLETE
- **Problem**: `uiCanvas` (main menu + all UI) shared `RENDER_SCALE = 0.75`, so the whole menu was internally rendered at 75% and CSS-upscaled ~1.33× → muddy/blurry text.
- **Fix**: Decoupled UI density from gameplay — new `UI_RENDER_SCALE = 1.0` (`constants.js`); `resizeCanvas` sizes `uiCanvas` at full CSS pixel density (`gameCanvas`/`gpuCanvas` unchanged) via `UI_RENDER_SCALE * resolutionScale`.
- **Compensation**: new `getUiDensityScale()` in `js/core/canvas.js` = `(uiCanvas.width / innerWidth) / RENDER_SCALE`; multiplied into every UI scale getter (`GameHUD.getUIScale`, `LeaderboardDisplay`, `RankDisplay`, `BossHealthBar`, `SettingsPanel`) so on-screen text/geometry size is byte-for-byte identical while now sampled at native resolution (sharper). Mouse/touch coordinate mapping already resolution-ratio based — no changes needed there.
- **MainMenuScreen**: density-scaled the fixed-px chrome that would otherwise shrink (version badge fonts + box dims, PATCH NOTES hint, news ticker box, tech-branding measure).
- **Files**: `constants.js`, `js/core/canvas.js`, `js/ui/GameHUD.js`, `js/ui/MainMenuScreen.js`, `js/ui/LeaderboardDisplay.js`, `js/ui/RankDisplay.js`, `js/ui/BossHealthBar.js`, `js/ui/SettingsPanel.js`, `DOCS/SCRATCHPAD.md`.
- **Verify**: `node --check` green ×8; `test-syntax.ps1` green. Manual: hard-refresh `index.html` → main menu text (title, subtitle, buttons, version badge, leaderboards, settings, news) visibly sharper at same size; in-game HUD unaffected size-wise.
- **Note**: `mobile/www` mirror is now stale for these files — run `cd mobile && npm run sync:web` before next Android build. No version bump (visual polish only).

## 2026-08-02 — Homepage VFX Polish (landing) ✅ COMPLETE
- **Scroll progress bar**: fixed top accent-gradient bar (`#scroll-progress`, `scaleX` driven by scroll + resize, passive listener).
- **Title glitch**: `titleGlitch` keyframes — periodic (6s loop) spectral RGB-shift + skew flicker on the ZOMBOBS title.
- **Play Now ping ring**: `playPing` box-shadow pulse (expanding halo) on `.top-play-button:not(:hover)` — respects `${overflow:hidden}` shine, settles on hover.
- **Cursor ember trail**: canvas ember particles spawn at pointer (`pointermove`/`pointerleave`), drift outward with velocity decay, red/orange hues, capped 90.
- **Reduced motion**: `prefers-reduced-motion` disables title glitch, ping, progress bar, and ember trail.
- **Files**: `landing.html` (root + `mobile/www` synced via `cd mobile && npm run sync:web`). Verify: `node --check` on extracted inline scripts clean; `test-syntax.ps1` green; manual — scroll page → progress bar tracks; title flickers ~every 6s; hover Play → ping stops; move mouse → embers.

## 2026-08-02 — AAA Cinematic VFX + Muzzle Juice ✅ COMPLETE
- **Post-FX composite upgraded** (`js/shaders/bloom.js`, `PostFXPass.js`): uniform extended 16→32 bytes (`params` array `vec4<f32>×2`) adding radial **chromatic aberration** (aspect-corrected, subtle ~1–3px edges), animated **film grain**, **vignette**, and an **impulse white-flash** (center-weighted). All driven from `WebGPURenderer.render`; gated by `lightingQuality` (grain/aberration at quality 2+, vignette at 1+).
- **Impulse system**: `WebGPURenderer.addPostImpulse(0..1)` decays `×0.82/frame`. Wired to explosions (`ParticleSystem.createExplosion` +0.28×size), player damage (`combatUtils.applyPlayerDamage` scaled by damage). Delivers CA kick + center flash on big hits — AAA punch without gameplay changes.
- **Muzzle micro-FX**: `shootBullet` now emits `muzzle` puff particles (+1 kicked-back `ember`) at the barrel; shotguns/rifle get 3 puffs, SMG 1. `GameLoopSystem` re-adds a muzzle **world point light** each frame while `muzzleFlash` active (intensity-scaled) — gunfire now illuminates the world in WebGPU mode.
- **Files**: `js/shaders/bloom.js`, `js/systems/vfx/PostFXPass.js`, `js/core/WebGPURenderer.js`, `js/systems/ParticleSystem.js`, `js/utils/combatUtils.js`, `js/systems/GameLoopSystem.js`.
- **Verify**: `node --check` green ×6, `test-syntax.ps1` green, `tools/vfx_smoke_test.mjs` 21/21 pass. Manual: fire weapons in arcade (GPU quality high) → barrel smoke trail + dynamic light catches; nuke a horde / take a hit → CA kick + center flash; check menu + campaign unaffected.

## 2026-08-02 — V0.10.0 Modality Pass ✅ COMPLETE
- **Version bump to V0.10.0 ALPHA — *VFX & Scrap Update*** across every version surface. `constants.js` hub: `GAME_VERSION` → `V0.10.0 ALPHA`; `VERSION_HISTORY` UNRELEASED block → **V0.10.0 VFX & Scrap Update** with `CURRENT` tag; `NEWS_UPDATES` leads with V0.10.0 VFX modernization.
- **Landing (root + `mobile/www`)**: tagline + engine badges + Tech Specs → V0.10.0; "Latest on Main" relabeled to V0.10.0 VFX & Scrap with bullets; new **V0.10.0 version bubble** inserted before V0.9.3 (fixed a double-heading slip + corrupted zone names mid-edit).
- **README**: badge → `0.10.0_ALPHA`; new **What's New in V0.10.0** block (VFX & Scrap).
- **Itch**: `page_description.md` Latest on Main → V0.10.0 section; engine + disclaimer → V0.10.0; `ITCH_IO_GUIDE.md` disclaimer.
- **Servers**: `LOCAL_SERVER` + `huggingface-space-SERVER` package.json `version` → `0.10.0-ALPHA`.
- **Docs**: `CHANGELOG` — `[Unreleased]` → `[v0.10.0] - 2026-08-02` (VFX & Scrap summary), added VFX + cinematic + muzzle juice Added entries; `SUMMARY` Current Status + ✅ entry; `AGENTS.md` version line; `My_Thoughts` + checklist amend.
- **Files**: `constants.js`, `index.html`, `landing.html`, `README.md`, `ITCH/page_description.md`, `ITCH/DOCS/ITCH_IO_GUIDE.md`, `LOCAL_SERVER/package.json`, `huggingface-space-SERVER/package.json`, `AGENTS.md`, `DOCS/CHANGELOG.md`, `DOCS/SUMMARY.md`, `DOCS/SCRATCHPAD.md`, `DOCS/VERSION_UPDATE_CHECKLIST.md`, `DOCS/My_Thoughts.md`. `mobile/www` re-synced via `cd mobile && npm run sync:web`.
- **Verify**: `node --check` on `constants.js` clean; `test-syntax.ps1` green; main-menu badge + 🎃 patch notes show **V0.10.0 ALPHA** with CURRENT tag; news ticker leads V0.10.0.

## 2026-07-15 — Equipment Item Pool Doubled ✅ COMPLETE
- **Names**: 10 → **20 per slot** (120 total), lists reordered common→legendary; all old names kept (set pieces intact). `pickName` tier bias now scales with list length (`start = tierIndex/5 * len`, window `len/5 + 2`).
- **Sets**: 3 → **5** — added **Nightstalker** (crit/speed, purple #7e57c2) + **Juggernaut** (HP/DR, steel #90a4ae). All set consumers iterate `EQUIPMENT_SETS` dynamically — zero changes needed elsewhere (verified via grep: only `equipmentDefinitions.js` references it).
- **File**: `equipmentDefinitions.js`. `node --check` green.
- **Verify manual**: drops show new names; collect 2 Nightstalker pieces → crit set bonus in E panel.

## 2026-07-15 — Snow Screen-Anchor Fix (ROOT CAUSE) + More Equipment Drops ✅ COMPLETE
- **Snow rises — real root cause**: world-anchored flakes fall 1.8–5.0 px/frame but player base speed is **4** (sprint 7). Walking south, camera outruns snowfall → flakes climb the screen. Entire render chain (CPU sim, `syncGameParticles`, WGSL NDC flip, camera uniforms, dead GPU snow paths) verified correct — the math was right, the *feel* was wrong.
- **Fix**: snow now simulated in **screen space** (`p.screenX/screenY`), world pos re-derived each frame from viewport cached in `snowWeather` (`updateSnowSystem` sets `viewLeft/Top/Width/Height`; recycle loop re-pins world pos after camera moves). Both render paths untouched — they land flakes at fixed screen anchors. Recycle checks screen bounds.
- **More equipment drops** (`EquipmentSystem.tryDropFromZombie`): base 9%→14%, elites (armored/blight/siren/spitter/splitter) 22% w/ uncommon bias, golden 100% + bounty 60% w/ rare-floor table, boss 55%→65%, pity guarantee after 45 dry kills (`gameState.equipmentDropPity`, reset in `resetGameState`). Explosion kill path (`combatUtils.js` ~line 549) now rolls equipment — was bullet/melee only.
- **Files**: `ParticleSystem.js`, `EquipmentSystem.js`, `combatUtils.js`, `gameState.js`. `node --check` green ×4.
- **Verify manual**: sprint south in arcade snow → flakes still fall down-screen; grenade a horde → occasional gear crate; kill golden → guaranteed rare+ gear.

## 2026-07-15 — Arcade Additions Round 2 ✅ COMPLETE
- **Bounty Zombie**: wave 3+ arcade local, one marked zombie per wave (12% roll per spawn, `bountyAssignedThisWave` gate, reset in `spawnZombies`). Crimson target ring + 💀 tag (`Zombie.drawBountyMark` via EntityRenderSystem post-draw). Kill = 40 + 4/wave scrap (cap +60) to killer, red popup, all 3 kill sites.
- **Perfect Wave streak**: `perfectWaveStreak` scales bonus x1/x2/x3 cap, `PERFECT WAVE xN!` label; damage resets streak.
- **Scrap Sweep**: wave clear → `scrapSweepEndTime = now+5s` → +900 magnet range in `updateScrapPickups` (local only; no value mult side effect).
- **Last Zombie marker**: 1 zombie left (arcade local, non-boss) → `isLastOfWave` → amber ring + bouncing arrow (`drawLastOfWaveMark`).
- **Files**: `gameState.js`, `ZombieSpawnSystem.js`, `Zombie.js`, `EntityRenderSystem.js`, `GameLoopSystem.js`, `PickupSpawnSystem.js`, `bulletZombieCollisions.js`, `MeleeSystem.js`, `combatUtils.js`.
- **Verify**: `node --check` green ×9. Manual: wave 3+ → red-ringed zombie → kill → BOUNTY popup + scrap; chain 2 perfect waves → x2 popup; clear wave with scrap on floor → auto-vacuum; last zombie shows amber arrow.

## 2026-07-15 — Arcade Additions + Snow World-Anchor Fix ✅ COMPLETE
[AMENDED 2026-07-15]: World-anchor fix superseded — flakes slower than player speed still read as rising while moving south. See screen-anchor entry above.
- **Snow direction fix**: screen-space snow read as "falling upward" whenever the camera moved (flakes screen-fixed, ground scrolling). Reverted to **world-anchored** flakes: world-coord spawn above viewport, incremental fall (`y += vy` + wind/flutter), out-of-viewport recycle pass, Canvas2D draw under camera transform, WGSL camera exempt removed. Flag renamed `screenSpace` → `isSnowflake`. Files: `ParticleSystem.js`, `js/shaders/gameParticles.js`.
- **Perfect Wave bonus**: wave cleared with zero player damage (arcade/co-op local, not campaign/MP) → `PERFECT WAVE!` + `+scrap` popups, 25 + 5/wave (cap +50) scrap to living players. `gameState.waveDamageTaken` set at all damage sites (`combatUtils.js` ×2, `AcidPool.js`, `Zombie.js` spore); reset on wave spawn + campaign zone loads. Wires dead `perfect_wave` achievement: `perfectWaveCount` → gameOver sessionStats → `totalPerfectWaves`. Files: `gameState.js`, `GameLoopSystem.js`, `GameStateManager.js`.
- **Golden Zombie scrap burst**: golden kill → ring of 5–7 scrap pickups (`PickupSpawnSystem.spawnGoldenScrapBurst`) at all 3 kill sites.
- **Verify**: `node --check` green on all 11 touched files. Manual: move while snowing → flakes fall relative to ground; no-hit wave → PERFECT WAVE popup + scrap; kill golden zombie → scrap ring.

## 2026-07-15 — Golden Zombie + WIP QoL Pass ✅ COMPLETE
- **Golden Zombie**: rare ~1.5% spawn roll in `ZombieSpawnSystem._createAndPushZombie` (single-player only, skips boss/warden/shard). `zombie.isGolden` flag; gold aura/sparkles/ring drawn via `Zombie.drawGoldenAura()` from the `EntityRenderSystem` post-draw hook (covers all subclass draw overrides). Kill = **5x XP** + gold `GOLDEN KILL!` popup at all 3 kill sites (`bulletZombieCollisions.js`, `MeleeSystem.js`, `combatUtils.js` explosion path).
- **Speed Boost pickup**: 8s → 12s (`combatUtils.js`) — WIP-list gameplay tweak (list said 10s→12s; code baseline was actually 8s).
- **Crosshair drop shadow**: subtle shadow (blur 3, offset 1,1) inside `drawCrosshair()` save/restore — applies to all styles; WIP-list visual fix.
- **Verify**: `node --check` green on all 7 touched files. Manual: arcade run until gold-aura zombie appears → kill → GOLDEN KILL popup + 5x XP; grab speed boost → HUD timer shows 12s; crosshair readable over snow/bright ground.
- **Docs**: CHANGELOG Unreleased (Added + Changed), WIP-dev-list checkoffs.

## 2026-07-25 — Downward Layered Snow Pass

- Reworked Arcade snow into depth-linked flake layers with coordinated size, opacity, and fall speed.
- Added slow horizontal wind and gust interpolation; vertical velocity is clamped positive so every flake always travels downward.
- Added horizontal overscan, density recovery after combat-heavy particle bursts, and smoother pool-aware spawning.
- Added a dedicated WebGPU six-arm crystalline snow silhouette with an icy center instead of the generic soft combat-particle disc.
- Follow-up: moved live snow into true screen space, decoupled from the player-follow camera so camera travel cannot drag flakes or visually reverse their fall.
- Final direction lock: removed vertical flutter entirely and derive each frame from `spawnY + age * positiveFallSpeed`; fall speed increased for an unmistakably downward read.
- Preserved the existing single-player Arcade-only gating and disabled accumulation overlay.
- [AMENDED 2026-07-15]: Screen-space approach caused "snow goes upward" perception during camera travel — superseded by world-anchored rework (see *Arcade Additions + Snow World-Anchor Fix* above).

## Human Model + VFX Pass (2026-07-25) COMPLETE
- **Player model**: Added articulated tactical legs/boots with movement-driven stride, role rig accents for heroes/recruited survivors, sprint chevrons, shield scan arcs, and static-charge lightning. Cosmetic motion data is written by `PlayerSystem`; no collision, networking, or combat rules changed.
- **Campaign NPCs**: Replaced the generic glowing circles with low-cost procedural human survivor models (armor, helmet, boots, slung weapon, role insignia, ambient scan arc). Rook/Pip/June/Holt now visually match their warrior/ranger/scavenger/medic roles before recruitment.
- **Files**: `PlayerRenderer.js`, `PlayerSystem.js`, `MapLoader.js`.
- **Verify**: `test-syntax.ps1` green; local Arcade smoke test loaded and rendered without browser console errors. Manual campaign route still recommended to inspect all four survivor role silhouettes in their intended map lighting.

### Facial Animation Expansion (2026-07-25) COMPLETE
- **Done**: Procedural blinking and aim-gaze, combat/reload/low-health expressions, brow movement, breathing/head bob, firing recoil, role comms LEDs, and animated survivor eyes/mouths.
- **Files**: `PlayerRenderer.js`.

## Launcher StrictMode Empty-Port Fix (2026-07-25) COMPLETE
- **Problem**: An available port made `Get-ListenersOnPort` emit no pipeline objects, so PowerShell assigned `$null`; `Set-StrictMode -Version Latest` then rejected `$inUse.Count`.
- **Fix**: Port-listener call sites now explicitly collect output with `@(...)`, including the post-stop check. Empty ports safely report as available.

## Active Tasks
### Engine + VFX Modernization (2026-07-21) ✅ COMPLETE
- **Done (Phase 0)**: WGSL → `js/shaders/*`; snow overlay gated off; particle RGBA cache + bind-group reuse.
- **Done (Phase 1)**: Real bloom (`PostFXPass`); typed `PARTICLE_KIND`/`emit()`; staged explosions; AcidPool fire fidelity.
- **Done (Phase 2)**: GPU combat compute (`WebGPUEffects`); heat haze; fire-pool embers/lights.
- **Done (Phase 3)**: Camera-anchored blood; GPU blood discs; point lights; `DecalSystem`; procedural floor fallback.
- **Validate**: `test-syntax.ps1` green; `node tools/vfx_smoke_test.mjs` 21/21.
- **Doc drift**: ~~AGENTS/ARCHITECTURE still say GPU bottom layer / old bloom/100k FX~~ **[RESOLVED 2026-08-05]** — truth pass on `AGENTS` / `ARCHITECTURE` / `SUMMARY` / `CHANGELOG` (see top SCRATCHPAD entry).
- **Hotfix (2026-07-22)**: `js/systems/vfx/*` used one-level `../` imports → resolved to `js/systems/core|shaders|utils` (404 HTML MIME on GH Pages). Fixed to `../../core`, `../../shaders`, `../../utils`.
- **Hotfix (2026-07-22c)**: GH Pages module load fail on `js/shaders/flashlight.js` — ad blockers match `*flash*` in URL. Renamed → `coneLight.js`.
- **Next**: Push; hard refresh / disable blockers to verify; optional V0.9.4 modality.

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

## Settings, VFX, and Frame-Pacing Audit (2026-08-05) - COMPLETE

- **[Inspected] Root causes:** Saved settings accepted unknown/invalid data; migrations could lose the source version; presets were partial and mislabeled ordinary UI changes as Custom; several visible controls had no runtime consumer; settings pointer coordinates diverged from the high-density UI canvas; WebGPU post FX was incorrectly gated by bloom and dynamic lighting.
- **[Executed] Settings core:** Added a versioned schema with validation, clamping, unknown-key removal, reliable migrations, complete preset transactions/listener notifications, `zombobsFXEnabled`, and six live cinematic/combat VFX controls. Retired the non-functional spatial-audio switch.
- **[Executed] Settings UI:** Reorganized Graphics into functional sections, added live Profile/Renderer/Post FX status, responsive stacked controls, fluid mobile scaling, correct dropdown hit geometry, safer two-click reset, duplicate-safe rebinding, expanded FPS choices, and accurate labels for native frame pacing/canvas filtering.
- **[Executed] Runtime wiring:** Auto Reload now honors its setting; damage number scale/off/stacking modes work; UI pointers use UI-canvas coordinates; renderer settings reapply after WebGPU initialization; post-processing quality and all new shader parameters update live.
- **[Executed] VFX:** Decoupled post FX from bloom/lighting and added adjustable color separation, film grain, vignette, atmosphere color grade, scanlines, and impact-flash intensity while preserving the transparent overlay's premultiplied-alpha contract.
- **[Executed] Engine:** Added bounded fixed-step catch-up, hidden-tab clock resync, stable app-side frame limiting, interpolation delivery, and performance counters to prevent update spirals and preserve the selected cap across frame-pacing changes.
- **[Executed] Verification:** `test-syntax.ps1` passed for all root JS; settings and engine contract smoke tests passed; VFX smoke test passed 21/21; browser QA passed at desktop and 390x844 with zero console errors; canonical web files were synced into `mobile/www` and hash-verified for all settings/engine/VFX entry points.

## World Landmark Visual Scale Pass (2026-08-05) - COMPLETE

- **[Executed] Landmark pass 1:** Rebuilt the small procedural station markers as destination-scale world visuals: a staffed Scrap Depot field stall, a rolling Night Market kiosk, and a stepped Scrap Shrine with a floating relic. The prior icon-first rendering was replaced by structure-sized silhouettes, material detail, shadows, and distinct palette reads.
- **[Executed] Landmark pass 2:** Added independent tooltip and HUD beacon offsets so the larger awnings, mast, and relic do not overlap interaction text or on-screen direction markers. Gameplay interaction ranges remain unchanged.
- **[Executed] Landmark pass 3:** Added `renderRadius` support to viewport culling and assigned complete visual extents to all three landmarks, preventing late pop-in at the viewport edge.
- **[Executed] Verification:** Root syntax check passed; VFX smoke test passed 21/21; focused landmark render smoke test passed 9 assertions (renders/labels, enlarged extents, preserved interaction limits, and render-radius culling). Mobile `www` was intentionally not regenerated because it contains pre-existing uncommitted generated-file changes; run `npm run sync:web` from `mobile/` after those changes are reconciled.
