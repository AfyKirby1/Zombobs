<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Version Update Checklist

When pushing a new version update, update these files to maintain consistency across the project:

## Required Updates

### 1. Version Control Hub (`js/core/constants.js`)

**Single source of truth** for all in-game version displays. On every version bump, update these exports together:

| Export | Purpose |
|--------|---------|
| `GAME_VERSION` | Badge text, About screen, patch-notes header (e.g. `V0.9.1 ALPHA`) |
| `ENGINE_NAME` / `ENGINE_VERSION` | Engine stamp in About + VersionModal footer |
| `VERSION_HISTORY` | Patch-notes modal content (newest entry **first**) |
| `NEWS_UPDATES` | Main-menu news ticker reel |

**Do not** hardcode version strings in `MainMenuScreen.js`, `AboutScreen.js`, or `VersionModal.js` — they import from constants.

#### `VERSION_HISTORY` entry format (required for VersionModal)

Prepend a new object when shipping. Keep **4–6** recent releases; trim oldest if the modal scroll panel overflows.

```javascript
{
    version: 'V0.X.Y.Z ALPHA',
    codename: 'Short Release Name',   // e.g. Skills & Survivability
    date: 'YYYY-MM-DD',
    tag: 'CURRENT',                  // only on the newest entry; omit on older
    highlights: [
        'Bullet one (player-facing)',
        'Bullet two',
        'Bullet three'
    ]
}
```

Current release gets **4** highlight bullets in the modal; older entries show **2** each.

### 2. In-Game Version Modalities

Three player-facing surfaces — update all on a version pass:

| Modality | File(s) | What to update |
|----------|---------|----------------|
| **Patch Notes modal** | `js/ui/VersionModal.js` (draw only), `constants.js` → `VERSION_HISTORY` | Prepend new release entry; move `tag: 'CURRENT'` to new entry; remove tag from previous |
| **Version badge** | `js/ui/MainMenuScreen.js` → `drawVersionBox()` | Reads `GAME_VERSION` automatically — **no string edit** unless badge layout changes |
| **News ticker** | `constants.js` → `NEWS_UPDATES` | Scrolling one-liner; format: `NEW: [Version] — [Codename]: [feat] \| [feat] \| …` |
| **About screen** | `js/ui/AboutScreen.js` | Reads `GAME_VERSION` + `ENGINE_VERSION` — **no string edit** |

**VersionModal wiring** (do not skip on deploy):
- `gameState.showVersionModal` in `js/core/gameState.js`
- Click/hover/ESC handlers in `js/main.js` and `js/ui/MainMenuScreen.js`
- UI interactivity gate in `js/utils/gameUtils.js` → `isUICanvasInteractive()`
- GitHub Pages artifact check: `.github/workflows/deploy-pages.yml` validates `_site/js/ui/VersionModal.js`

### 3. Version Display Files (legacy reference)

- **[js/core/constants.js](js/core/constants.js)** — see §1 above
- **[js/ui/VersionModal.js](js/ui/VersionModal.js)** — spooky arcade patch-notes UI; **content comes from `VERSION_HISTORY`**
- **[js/ui/MainMenuScreen.js](js/ui/MainMenuScreen.js)** — clickable `🎃` version badge opens modal
- **[js/ui/AboutScreen.js](js/ui/AboutScreen.js)** — static About page version lines

### 4. Landing Page (index.html)
- **Tagline badge** (line ~868): Update version in `<span class="tagline">`
- **Engine info badge** (line ~870): Update engine version in `<span class="engine-name">`
- **Technical Specs** (line ~1344): Update engine version in stats section
- **Version Info Bubbles** (starting ~1419): Add new section for current version with recent features

### 5. News Reel Content
- **[js/core/constants.js](js/core/constants.js)**
  - Update `NEWS_UPDATES` constant
  - Include highlights from most recent versions
  - Keep format: "NEW: [Version]: [Feature] | [Feature] | ..."
  - Clean up older entries to keep it concise

### 6. Documentation Files (Optional but Recommended)
- **[DOCS/CHANGELOG.md](DOCS/CHANGELOG.md)**: Add entry for new version
- **[DOCS/SCRATCHPAD.md](DOCS/SCRATCHPAD.md)**: Update with completed tasks
- **[DOCS/SUMMARY.md](DOCS/SUMMARY.md)**: Update "Recent Updates" section if major changes

### 7. Server Files (if applicable)
- **[LOCAL_SERVER/package.json](LOCAL_SERVER/package.json)**: Update version field (`launch.ps1` reads this automatically — no hardcode)
- **[huggingface-space-SERVER/package.json](huggingface-space-SERVER/package.json)**: Update version field
[AMENDED 2026-07-09]: `launch.ps1` no longer has a hardcoded `$SERVER_VERSION`; bump package.json only.

### 8. Itch.io HTML build (when publishing the browser build)
- **Always** run from repo root: `powershell -NoProfile -ExecutionPolicy Bypass -File ITCH/build-itch.ps1`
- Upload the generated **`Zombobs_Web.zip`** only. The script validates **no backslashes** in zip entry names (Windows default zips break itch CDN → **403** on all `css/` / `js/`).
- **Never** ship an Explorer/`Compress-Archive`/`CreateFromDirectory` zip for itch without replacing the script’s validation logic.
- Full checklist: [ITCH/DOCS/ITCH_IO_GUIDE.md](../ITCH/DOCS/ITCH_IO_GUIDE.md)

### 9. Mobile web mirror (when shipping Android / Capacitor)

After updating `js/` sources, sync into the Capacitor bundle:

```powershell
cd mobile
npm run sync:web
```

This copies `index.html`, `js/` (including `VersionModal.js` and updated `constants.js`), `css/`, and `assets/` into `mobile/www/`.

## Version Format

Use consistent format: `V0.X.Y.Z ALPHA` (with space before ALPHA)

Example: `V0.8.4 ALPHA`

[AMENDED 2026-06-26]: Current release example: `V0.9.3 ALPHA`

[AMENDED 2026-07-09 — V0.9.3 modality pass]: Updated `NEWS_UPDATES`, landing bubbles (new V0.9.3 section), mobile web mirror, itch `page_description.md`, server package metadata, `AGENTS.md`, `CHANGELOG`, `SUMMARY`. V0.9.3 public copy leads with *Act 1 Finale Update* (Z1–4 + Warden + ACT 1 CLEAR, survivor quests, campaign alive, menu horde ambience, boot hardening, 44,609 LOC).

[AMENDED 2026-07-09 — V0.9.2 modality pass]: Updated `NEWS_UPDATES`, landing bubbles (new V0.9.2 section), mobile web mirror, itch `page_description.md`, launcher, server package metadata, `AGENTS.md`, `CHANGELOG`, `SUMMARY`. V0.9.2 public copy leads with *Campaign & Mobile Update* (Act 1 Zones 1–3, equipment/heroes, mobile touch wired, boot progress, 40K LOC).

[AMENDED 2026-07-09 — Boot hardening docs]: `BootLoader.js` / `WebGPURenderer.init({ onPhase })` / settle gate documented in `ARCHITECTURE.md`, `AGENTS.md`, `My_Thoughts.md`, `README.md` boot bullet, `SUMMARY` status + file tree. No version bump required — Unreleased `CHANGELOG` entry only.

[AMENDED 2026-07-09 — Unreleased docs sync]: Boot hardening + `MenuHordeAmbience` + LOC **44,609** reflected across `SUMMARY`, `ARCHITECTURE`, `SCRATCHPAD`, `README`, `landing.html`, `mobile/www/landing.html`, `ITCH/page_description.md`. Run `npm run sync:web` before Android if `mobile/www` drifts (boot overlay HTML/CSS, `MenuHordeAmbience.js`, `MainMenuScreen.js`).

[AMENDED 2026-07-06 — V0.9.1 modality pass]: Updated `NEWS_UPDATES`, main-menu/About version boxes, landing bubbles (new V0.9.1 section), mobile web mirror, itch `page_description.md`, launcher, server package metadata, `AGENTS.md`, `CHANGELOG`, `SUMMARY`. V0.9.1 public copy leads with *Skills & Survivability Update* (93 skills, 15 synergies, corrupted wildcards, mobile 2×2 level-up, Splitter/Siren).

## Quick Reference

**Minimum version-bump touchpoints (in order):**
1. `js/core/constants.js` — `GAME_VERSION`, `ENGINE_VERSION`, `VERSION_HISTORY` (prepend), `NEWS_UPDATES`
2. `index.html` — landing page (4 locations + new version bubble)
3. `LOCAL_SERVER/package.json` + `huggingface-space-SERVER/package.json` (`launch.ps1` reads local version)
4. `ITCH/page_description.md` — itch marketing copy
5. `DOCS/CHANGELOG.md` + `DOCS/SUMMARY.md`
6. `mobile/` — `npm run sync:web` if Android build is shipping

**Files that auto-read constants (no manual string edit):**
- `js/ui/VersionModal.js` — patch-notes modal (`VERSION_HISTORY`, `GAME_VERSION`, `ENGINE_VERSION`)
- `js/ui/MainMenuScreen.js` — version badge (`GAME_VERSION`)
- `js/ui/AboutScreen.js` — About screen (`GAME_VERSION`, `ENGINE_VERSION`)

**In-game announcement modalities:**
- **News ticker** (`NEWS_UPDATES`) — passive scrolling bar at menu bottom
- **Patch Notes modal** (`VERSION_HISTORY`) — click version badge top-left; arcade cabinet UI
- **About screen** — full About menu button

**Landing/marketing modality:** version info bubbles in `index.html` / `landing.html`

**Version info bubble format (index.html):**
```html
<div>
    <div class="side-heading">V0.X.Y.Z ALPHA</div>
    <ul class="mini-list">
        <li><span>🎵</span> <strong>Feature Name</strong>: Description text</li>
        <!-- More features... -->
    </ul>
</div>
```

[AMENDED 2026-06-25 — V0.8.4 ALPHA shipped]: Updated `NEWS_UPDATES`, landing bubbles, UI version boxes, server packages, itch copy. In-game news reel is the live update modality; landing bubbles are the web marketing modality.

[AMENDED 2026-06-25 — V0.8.4 modality pass]: News reel now includes subtitle *The Chaos & Horde Update*, scrap kill drops, touch fix, Phase 4 engine. Landing bubbles expanded to nine items (scrap economy loop, shrine **E**/45%, music intensity, `GameLoopSystem`, controls in Settings). Itch `page_description.md` gained V0.8.4 section; audio copy fixed (MP3 not procedural).

[AMENDED 2026-06-25 — controls hub]: In-game HUD instructions removed; Settings → Controls is single source of truth. `NEWS_UPDATES` adds *Controls in Settings ⚙️*.

[AMENDED 2026-06-26 — V0.9.0 modality pass]: Updated `NEWS_UPDATES`, main-menu/About version boxes, landing bubbles, mobile web mirror, itch `page_description.md`, launcher, and server package metadata. V0.9.0 public copy leads with *Performance & Systems Update* (main-menu smoothness, lazy WebGPU, lazy Socket.IO, startup metrics, class tree skills).

[AMENDED 2026-06-26 — smooth game entry]: Documented idle GPU/ground warm-up, async `startGame()`, session prep overlay, and `gpuCanvas` fade-in in `CHANGELOG`, `SUMMARY`, `ARCHITECTURE`, `REFACTOR_PLAN`, `My_Thoughts`. No version bump — ships under existing V0.9.0 ALPHA performance release.

[AMENDED 2026-07-06 — VersionModal + constants hub]: Clickable main-menu version badge opens `js/ui/VersionModal.js` (spooky arcade **PATCH NOTES**). Centralized `GAME_VERSION`, `ENGINE_VERSION`, `VERSION_HISTORY` in `js/core/constants.js`. Version bumps now **prepend** to `VERSION_HISTORY` and update constants — MainMenu/About/VersionModal read automatically. Added §1 hub table, §2 modality matrix, §9 mobile sync, and GitHub Pages `VersionModal.js` artifact check. See `DOCS/SCRATCHPAD.md` § Clickable Version Modal.
