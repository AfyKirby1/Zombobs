<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Enemy Types Reference

Quick-reference for all zombie variants in Zombobs — stats, spawn rules, abilities, and counterplay.

**Implementation**: `js/entities/Zombie.js` (variants), `js/systems/WaveChaosSystem.js` (`selectZombieClass`), `js/systems/ZombieSpawnSystem.js` (class map), `js/entities/BossZombie.js` (boss).

---

## Overview

| Type | Role | First wave | Rarity |
|------|------|------------|--------|
| Normal | Baseline horde | 1 | Common |
| Fast | Rush / flanking | 3 | Uncommon |
| Crawler | Low profile, hard to hit | 4 | Uncommon |
| Ghost | Evasion, spectral | 4 | Uncommon |
| Flying | Elevated, fast | 5 | Uncommon |
| Armored | Tank | 3+ (scaled chance) | Uncommon → common late |
| Exploding | AOE on death | 5 | Uncommon |
| Spitter | Ranged acid + kiting | 6 | Uncommon |
| Blight | Slime trail + death burst | 1* | Uncommon |
| **Siren** | **Horde buff + aim disrupt** | **8** | **Rare** |
| Boss | Wave climax | Every 5 waves | Guaranteed |

\*Blight has a wide spawn band early; treat as a persistent rare support type rather than a late-game exclusive.

**Gallery** (`js/ui/GalleryScreen.js`): Shows a curated subset (Normal, Fast, Exploding, Armored, Ghost, Spitter, Siren, Boss). Flying, Blight, and Crawler are playable but not yet in the gallery cards.

---

## Score & XP (current)

| Type | Base score | XP |
|------|------------|-----|
| Normal | 10 | 6 |
| Fast | 15 | 12 |
| Exploding | 20 | 18 |
| Armored | 25 | 14 |
| Ghost | 18 | 20 |
| Spitter | 22 | 18 |
| Flying | — | 15 |
| Crawler | — | 14 |
| Blight | — | (falls through to normal XP) |
| **Siren** | **24** | **19** |
| Boss | 100 | 287 |

Sources: `js/core/constants.js` (`ZOMBIE_BASE_SCORES`), `js/systems/SkillSystem.js` (`xpValues`).

---

## Siren Zombie (new)

**Design intent**: Panic amplifier — a priority support target that makes the horde more dangerous without adding another fast chaser or ranged spitter.

### Stats
- **Speed**: 0.85× base (slow–medium)
- **Health**: 90% of wave-scaled base
- **Hitbox**: 1.05× radius (slightly taller silhouette)
- **Direct damage**: Low (standard melee contact)

### Visual identity
- Cyan/teal body (`#4dd0e1` → `#004d57`)
- Glowing throat sac (pulses harder during scream windup)
- Split jaw, long dangling arms
- Radio-static halo with arc ticks during windup
- Name tag: **Siren** (`#00e5ff`)

### AI loop
1. **Chase** until within **260px** of nearest living player.
2. **Windup** (600ms) — stands still; throat glow and halo intensify.
3. **Scream** — cooldown **5s** between screams.

### Scream effects (220px radius)
| Target | Effect | Duration |
|--------|--------|----------|
| Nearby zombies | +35% speed (`sirenBoostUntil` on entity) | 2.5s |
| Players in range | Aim jitter (`sirenJitterUntil`) | 0.75s |
| Everyone | Expanding cyan shock ring VFX | 0.5s |
| Audio | Procedural screech (`playSirenScreamSound`) | ~0.45s |

### Counterplay
- **Interrupt windup** — any damage during the 600ms windup cancels the scream (`takeDamage` clears `screamWindupStart`).
- **Focus fire** — medium HP; delete before scream when possible.
- **Kite after scream** — boosted zombies decay after 2.5s; reposition during jitter window.

### Spawn weights (`selectZombieClass`, wave 8+)
- **Default**: ~3.5% independent roll before other type bands
- **ENCIRCLE** mutator: ~7%
- **ELITES** mutator (wave 8+): 5th elite slot (~20% of elite waves)

### Systems touched
| System | Responsibility |
|--------|----------------|
| `SirenZombie` (`Zombie.js`) | AI, scream logic, draw |
| `ZombieUpdateSystem` | Applies `sirenBoostUntil` speed multiplier |
| `PlayerSystem` | Aim angle jitter on affected players |
| `drawingUtils.drawCrosshair` | Crosshair position jitter |
| `EntityRenderSystem` | `drawSirenScreamEffects` — ring cleanup/render |
| `gameState.sirenScreamEffects[]` | Active scream VFX instances |
| `AudioSystem` | `playSirenScreamSound`, kill pitch `siren: 1.4` |

### Multiplayer note
Zombie AI (including screams) runs on the **lobby leader** only, consistent with Spitter acid and Blight slime. Non-leader clients interpolate zombie positions; scream debuffs on local aim apply when the leader's simulation sets `sirenJitterUntil` on the local player object. Full scream VFX sync across clients is leader-local today.

---

## Support mob comparison

| | Spitter | Blight | Siren |
|---|---------|--------|-------|
| **Threat** | Ranged acid pools | Ground slime + death cloud | Buffs horde + disrupts aim |
| **Movement** | Kites 300–500px | Slow lumber | Stops to scream |
| **Player skill test** | Positioning / dodge pools | Area denial | Target priority + interrupt timing |
| **Color** | Toxic green | Purple/magenta | Cyan |

---

## Other variants (summary)

### NormalZombie
8 procedural visual variants (Classic, Decayed, Fresh, Office, Punk, Nurse, Construction, Soldier). Torso overlay VFX on ~70% spawns. Base stats.

### FastZombie
1.6× speed, 60% HP. Aggressive lean motion profile.

### CrawlerZombie
1.3× speed, 60% HP, 0.7× radius. Low-profile draw offset (+8px). Harder to hit.

### GhostZombie
50% opacity, 1.3× speed, 80% HP. Wobble animation.

### FlyingZombie
1.2× speed, 70% HP, 0.9× radius. Elevated draw + bat wings.

### ArmoredZombie
2× HP, 0.8× speed. Armor absorbs damage before health.

### ExplodingZombie
80% HP, 0.9× speed. AOE explosion on death. Tremor below 50% HP.

### SpitterZombie
1.2× speed, 80% HP. Kiting AI; acid projectiles → `acidPools`. Wave 6+.

### BlightZombie
0.75× speed, 1.3× HP, 1.1× radius. Drops slime pools while moving; death spore burst + lingering pool.

### BossZombie
Spawns every 5 waves. Spawns minions via `getBossMinionCount`. See `BossZombie.js`.

---

## Wave mutators & spawn

`WaveChaosSystem.selectZombieClass(wave, mutator, rand)` picks type per spawn. Mutators (wave 5+):

| Mutator | Spawn impact |
|---------|----------------|
| SWARM | +40% count, −20% HP |
| ELITES | Biased elite types (includes Siren at wave 8+) |
| VOLATILE | +12% exploding/crawler/blight bands |
| ENCIRCLE | Alternate spawn sides; +Siren chance |
| RUSH | Faster stagger, shorter breaks |

Boss waves (`wave % 5 === 0`) skip mutators and call `spawnBoss()`.

---

## Related docs
- `DOCS/ARCHITECTURE.md` — `Zombie.js` module detail, systems map
- `DOCS/STYLE_GUIDE.md` — Canvas zombie palette / aura conventions
- `DOCS/DIFFICULTY_PROGRESSION.md` — Wave count scaling
