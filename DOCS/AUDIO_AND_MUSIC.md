# Audio & Music Integration Guide

Use this doc when adding or replacing in-game music and sound effects.
This project keeps audio wiring centralized, so there are only a few files you should need.

## Current Audio Architecture

| System | File | Role |
|---|---|---|
| Menu + gameplay music + SFX | `js/systems/AudioSystem.js` | Master audio system. Owns menu/game `HTMLAudioElement` playback, Web Audio routing/gain, and synthesized gunshot/damage/footstep SFX. |
| Procedural music | `js/systems/ArcadeMusicSystem.js` | Web Audio oscillator layers (bass/pads/arpeggio/percussion). Still present in code but gameplay no longer uses it; do not remove until `ArcadeMusicSystem` references are fully purged. |
| Game lifecycle | `js/systems/GameStateManager.js` | Calls `playGameMusic()` / `stopGameMusic()` / `playMenuMusic()` on start/restart/gameover. |
| Settings | `js/systems/SettingsManager.js` | Persists `audio.masterVolume`, `audio.musicVolume`, `audio.sfxVolume`, `audio.muted`, `audio.gunshotVolume`. |

### Playback Lifecycle

- Main menu: `menuMusic` (`HTMLAudioElement`) loops via `playMenuMusic()`.
- Start game: `stopMenuMusic()` → `GameStateManager.startGame()` → `playGameMusic()`.
- Game over: `GameStateManager.gameOver()` → `stopGameMusic()`.
- Campaign victory: `GameStateManager.campaignVictory()` → `stopGameMusic()`.
- Pause/resume: `pauseGameMusic()` / `resumeGameMusic()`.
- Restart to menu: `GameStateManager.restartGame()` → `stopGameMusic()` + `playMenuMusic()`.

## Adding a New Music Track

1. Place the finished master into `assets/`, e.g. `assets/My_New_Track.mp3`.
2. Add the path to the `GAME_MUSIC_TRACKS` array in `js/systems/AudioSystem.js`:

```js
const GAME_MUSIC_TRACKS = [
    'assets/the_mountain-game-game-music-508018.mp3',
    'assets/viacheslavstarostin-game-gaming-video-game-music-471936.mp3',
    'assets/Enthusiast_Tours.mp3',
    'assets/My_New_Track.mp3'
];
```

3. Wire a one-line changelog bullet under `## [Unreleased]` in `DOCS/CHANGELOG.md`.
4. Update any stale copy in `DOCS/SUMMARY.md` if it still says “two-track”.

The playlist auto-creates `Audio` objects, preloads them, advances on `ended`, and routes all playback through `gameMusicGain` → `masterGainNode` → destination.

## Replacing / Removing a Track

- To replace: overwrite the file and keep the same filename.
- To remove: delete the entry from `GAME_MUSIC_TRACKS` and update changelog/summary copy.
- Do **not** edit `gameMusicTracks` runtime caches directly; they rebuild from `GAME_MUSIC_TRACKS`.

## Adding New Sound Effects

Most SFX are synthesized in `AudioSystem.js` using the Web Audio API, so there are no external SFX files to drop in today.

For new sampled SFX, follow the same pattern as the gunshot cache:
1. Schedule buffer creation on idle in `createGunshotBuffer()` style.
2. Expose a tiny play helper, e.g. `playMySfxSound()`.
3. Call it from gameplay code.
4. Mute/master routing should flow through `sfxGainNode` / `masterGainNode` so `SettingsManager` stays authoritative.

## Asset Requirements

- **Format**: MP3 is preferred for music; otherwise browser-compatible formats supported by `HTMLAudioElement`.
- **Bitrate**: 192–320 kbps. Current shipped tracks are 320 kbps.
- **Length**: no hard limit, but under ~7 MB is comfortable for web delivery. Longer tracks auto-advance via `ended` handler; they do **not** loop unless explicitly set.
- **Naming**: underscored or hyphenated, lowercase preferred. Avoid spaces if possible; existing code uses paths with spaces so it is technically fine.
- **Placement**: `assets/` only.
- **Licensing**: must be royalty-free or properly licensed for commercial use; keep attribution notes here or in the file’s surrounding docs if required.
- **Normalization**: peak around **-1.0 dBFS** so music sits under gunfire/SFX without clipping. Current default `audio.musicVolume` is `0.25` and `MUSIC_OUTPUT_SCALE = 0.5`.

## Volume / Settings Mapping

- `settingsManager.getSetting('audio', 'musicVolume')` → user slider default `0.25`.
- `settingsManager.getSetting('audio', 'masterVolume')` → default `1.0`.
- `settingsManager.getSetting('audio', 'sfxVolume')` → default `1.0`.
- `settingsManager.getSetting('audio', 'muted')` → master mute.
- Live changes propagate through `updateAudioSettings()` and, for gameplay tracks, `setGameMusicIntensity()`.

## Build / Shipping Checklist

- `Zombobs_Web.zip` must be regenerated via `ITCH/build-itch.ps1` for itch. Do not use Windows `Compress-Archive` directly.
- For mobile: `cd mobile && npm run sync:web` copies current `assets/` into `mobile/www/`.
- Do not hotlink external audio; bundle inside repository so offline / itch / Capacitor builds work.
- Verify audio paths in `GAME_MUSIC_TRACKS` and `MENU_MUSIC_SRC` before shipment; broken audio is silent failure.

## Troubleshooting

- **No music in game**: `playGameMusic()` is called from `GameStateManager.startGame()`; check console for 404s on the MP3 path.
- **Music stops after one song**: expected unless `ended` auto-advance fires; make sure `audio.loop = false` stays as-is so playlist can advance.
- **Music too loud compared to SFX**: default music is attenuated by `MUSIC_OUTPUT_SCALE = 0.5`; lower track gain at render time or bump this constant.
- **Blocker on old browser no Web Audio**: `AudioSystem` falls back to `Audio.volume`; still supported, just no per-track gain node.

## Future Ideas / Opportunities

- Swap menu/game music by mode or campaign zone.
- Add one-shot SFX pool for zombies/environment if external assets are approved.
- Centralize all music metadata (title / artist / license / loop flag) here if the playlist grows beyond a few tracks.
