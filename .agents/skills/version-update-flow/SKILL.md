---
name: version-update-flow
description: Standard operating procedure for bumping versions and updating all in-game, marketing, server, and documentation modalities in Zombobs. Trigger when releasing a version update (e.g. V0.10.1 ALPHA), shipping a patch, or updating release notes.
---

# Zombobs Version Update & Modality Sync Workflow

When performing a version bump or release pass for Zombobs, follow this exact step-by-step pipeline to ensure 100% consistency across all 10 project modalities.

---

## 📋 Checklist & Required Sequence

### Step 1: Pre-Check & Syntax Validation
Before editing version strings, confirm the existing codebase has no syntax errors:
```powershell
.\test-syntax.ps1
```

---

### Step 2: In-Game Version Hub (`js/core/constants.js`)
`constants.js` is the **single source of truth** for all in-game version displays. `MainMenuScreen`, `AboutScreen`, and `VersionModal` automatically read from these constants.

1. `export const GAME_VERSION = 'V0.X.Y ALPHA';`
2. `export const ENGINE_VERSION = '${ENGINE_NAME} ${GAME_VERSION}';`
3. `export const VERSION_HISTORY = [...]`
   - **Prepend** new object to the top of the array:
     ```javascript
     {
         version: 'V0.X.Y ALPHA',
         codename: 'Short Release Codename',
         date: 'YYYY-MM-DD',
         tag: 'CURRENT', // ONLY on the newest entry
         highlights: [
             'Highlight bullet 1',
             'Highlight bullet 2',
             'Highlight bullet 3',
             'Highlight bullet 4'
         ]
     }
     ```
   - **Remove `tag: 'CURRENT'`** from the previous release entry.
4. `export const NEWS_UPDATES = "NEW: V0.X.Y — [Codename] | [Feature 1] | [Feature 2] | ...";`

---

### Step 3: Server Package Metadata
Update `version` field in both Node server package manifests (`launch.ps1` reads version from `LOCAL_SERVER/package.json` automatically):

1. **`LOCAL_SERVER/package.json`**:
   `"version": "0.X.Y-ALPHA"`
2. **`huggingface-space-SERVER/package.json`**:
   `"version": "0.X.Y-ALPHA"`

---

### Step 4: Public Landing Page (`landing.html`)
Update all 4 version locations in `landing.html`:

1. **Hero Badge**: Update `<span class="tagline">V0.X.Y ALPHA</span>`
2. **Engine Badge**: Update `<span class="engine-name">ZOMBS-XFX-NGIN V0.X.Y ALPHA</span>`
3. **Tech Specs Section**: Update `<strong>ZOMBS-XFX-NGIN V0.X.Y ALPHA</strong>`
4. **Version History Bubbles**:
   - Update `Latest on Main — V0.X.Y [Codename]` side heading and list.
   - Prepend new `V0.X.Y ALPHA — [Codename]` bubble block directly above the previous version bubble.

---

### Step 5: Marketing & Distribution Pages
1. **`ITCH/page_description.md`**:
   - Update `### 🆕 Latest on Main — V0.X.Y [Codename]` section.
   - Prepend new `### 🆕 V0.X.Y ALPHA — [Codename]` section.
2. **`README.md`**:
   - Update version shield badge: `https://img.shields.io/badge/Version-0.X.Y_ALPHA-00C853?style=for-the-badge`

---

### Step 6: Core Documentation Files
Update status and log the release details in all active documentation files:

1. **`DOCS/CHANGELOG.md`**:
   - Prepend a new `## [v0.X.Y] - YYYY-MM-DD` release section.
   - Include a summary quote and grouped `### Added`, `### Changed`, `### Fixed` bullet lists.
2. **`DOCS/SUMMARY.md`**:
   - Update `## Current Status` release line: `**Release: V0.X.Y ALPHA (YYYY-MM-DD)** — *Codename*. ...`
   - Prepend `✅ **V0.X.Y [Codename] (YYYY-MM-DD)** — ...` to recent highlights.
3. **`DOCS/SCRATCHPAD.md`**:
   - Prepend `## YYYY-MM-DD — [Codename] (V0.X.Y ALPHA) ✅ COMPLETE` entry.
   - Detail changes made, files touched, and test verification results.
4. **`DOCS/VERSION_UPDATE_CHECKLIST.md`**:
   - Append an `[AMENDED YYYY-MM-DD — V0.X.Y modality pass]` annotation line at the bottom.

---

### Step 7: Mobile Mirror & Final Verification
1. **Sync to Mobile Web Bundle** (if Android/Capacitor assets need updating):
   ```powershell
   cd mobile
   npm run sync:web
   ```
2. **Run Final Syntax Check**:
   ```powershell
   .\test-syntax.ps1
   ```
