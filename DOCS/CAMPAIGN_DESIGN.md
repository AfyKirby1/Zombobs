<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Campaign Design: "Echoes of Silence"

## 1. Narrative Overview

### Premise
The world didn't end with a bang, but with a static hiss. "The Signal"—a global broadcast that kept the infected dormant—failed on **Day 0**. Chaos followed instantly. You are part of **Fireteam Echo**, a squad of survivors attempting to reach the last known broadcasting station to reboot the network.

### The Intro Sequence
> "DAY 0... THE SIGNAL WAS LOST. THEY CAME FROM THE SHADOWS. NOW, WE SURVIVE."

### Act 1: The Outskirts (Current Focus)
The team starts at a crash site on the edge of the city. Their transport chopper was downed by a massive biological projectile (Spitter/Boss). They must navigate through a ruined industrial sector to reach the city proper.

---

## 2. Custom Map Thesis: "The Industrial Gauntlet"

### Core Philosophy: "Constrained Chaos"
Unlike the Arcade mode's open arena, the Campaign map is a **linear progression** designed to force tactical decisions. It uses a "Pulse and Flow" pacing structure:
*   **Chokepoints:** Narrow corridors forcing melee/short-range engagement.
*   **Killzones:** Wide areas where players are swarmed from multiple angles.
*   **Safe Harbors:** Temporary defensive positions to regroup/reload.

### Map Layout: "The Railyard"

> **[AMENDED 2026-07-09]:** Full Act 1 design bible for Zones 1–4 lives in **§5–§17 below** (beats, VO, recipes, Warden, build order). Short stubs kept for quick scan.

**Zone 1: The Crash Site (Tutorial/Start)** — ✅ **PLAYABLE (2026-07-06)** · bible §8
*   **Visuals:** Burning helicopter wreckage, smoldering craters, night time.
*   **Layout:** Circular defensive area surrounded by debris.
*   **Gameplay:** Survive initial wave until "debris clears" (scripted event — **not yet implemented**; designed in §8.3/§8.6).
*   **Objective:** "Secure the Perimeter." Extract north after wave 2.
*   **Implementation:** `js/maps/crashSite.js` (2400×1800), `js/systems/MapLoader.js`, wall collision, static props, objective HUD, arcade-parity spawns. North ring gap → Zone 2.

**Zone 2: The Maintenance Tunnels (Transition)** — ✅ **PLAYABLE (2026-07-09)** · bible §9
*   **Visuals:** Claustrophobic concrete hallways, flickering emergency lights.
*   **Layout:** Narrow zig-zag paths. Line of sight is broken often.
*   **Gameplay:** High tension. Fast/Crawler from vents. Shotguns/Melee preferred.
*   **Hazard:** Leaking steam pipes + lights-out beat — designed §9.6, still pending code.
*   **Implementation:** `js/maps/maintenanceTunnels.js`; `nextMapId: 'switching_yard'`.

**Zone 3: The Switching Yard (Open Combat)** — ✅ **PLAYABLE (2026-07-09)** · bible §10
*   **Visuals:** Train cars, tracks, rusted shipping containers.
*   **Layout:** Three parallel lanes separated by long trains.
*   **Gameplay:** Long sightlines; hordes funnel between trains; **Hold E power couplers** (N/M/S) — extract gated until 3/3 (§10.4 shipped).
*   **Objective:** "Power the Gate" / extract east after wave 3 + gate online.
*   **Implementation:** `js/maps/switchingYard.js` (2800×1600); `nextMapId: 'control_tower'`. [AMENDED 2026-07-09]: Couplers + tower chain live.

**Zone 4: The Control Tower (Finale)** — ✅ **PLAYABLE (2026-07-09)** · bible §11
*   **Visuals:** Nested floodlit rings / stair chokes, relay decal, mast silhouette (Warden).
*   **Layout:** Outer apron → lobby → ops terminal (king-of-the-hill hack/defend).
*   **Gameplay:** Ascend → Hold E hack → 45s defend → **The Warden** → Signal Online / **ACT 1 CLEAR**.
*   **Implementation:** `js/maps/controlTower.js` (2000×2200); `js/entities/WardenBoss.js`; `MapLoader` hack/defend/warden flow. [AMENDED 2026-07-09]: Shipped.

### Technical Requirements
1.  **Map Loader:** ✅ **Implemented** — `crash_site`, `maintenance_tunnels`, `switching_yard`, `control_tower` in registry; `nextMapId` zone chain through Act 1.
2.  **Trigger System:** ✅ **Expanded** — objective, extraction, **power**, **hack**, **defend**; Hold E interact; steam hazards; lights-out + debris-clear scripts. Dialogue/radio still light.
3.  **NavMesh:** ❌ **Not started** — zombies use direct chase + wall resolve.
4.  **Equipment + Heroes (2026-07-09):** ✅ Equipment sets + E-key GEAR/HEROES panel; hireable scrap heroes via `CompanionSystem.hireHero()`.
5.  **Act 1 Finale (2026-07-09):** ✅ Warden boss + ACT 1 CLEAR victory path.
6.  **Survivor Quests (2026-07-09):** ✅ Rook/Pip/June/Holt — meet → quest → recruit (`survivorDefinitions.js`). Extract tax + zone ante.

---

## 3. Story Beats & Dialogue
[AMENDED 2026-07-09]: Expanded per-zone VO lives in bible §8.4 / §9.4 / §10.5 / §11.7. Stubs below preserved.

**Start:**
*   *Radio:* "Echo Actual, do you copy? ...Damn it. We're on our own."
*   *Objective:* "Survive the crash site."

**Mid-Point (Tunnels):**
*   *Character:* "They're in the walls! Watch your six!"
*   *Event:* Lights cut out. Flashlights mandatory.

**Finale:**
*   *Radio (Static):* "...broadcasting on emergency frequency... is anyone out there?"
*   *Action:* Hold F to Activate Signal.

## 4. Art Style Guide
*   **Palette:** High contrast. Deep blacks, harsh industrial oranges (sodium vapor lights), cold moonlight blues.
*   **Atmosphere:** Heavy fog/rain (WebGPU particles).
*   **Textures:** Rust, concrete, wet asphalt.

---

<!-- [AMENDED 2026-07-09]: Act 1 Zones 1–4 design bible — expand INWARD only (Railyard / Outskirts). No Act 2 city sprawl. -->

# ACT 1 DESIGN BIBLE — Zones 1–4 (GO DEEP, STAY INSIDE)

> **Hard scope lock:** Everything below is **Act 1: The Outskirts / The Railyard**. Zones 1–4 only. No downtown, no Signal Station Act 2, no open-world. We make *this* gauntlet feel like a whole campaign.

---

## 5. Act 1 Thesis (One Sentence → One Feeling)

**Thesis:** Fireteam Echo crawls from a burning crash ring through buried maintenance guts, across a kill-funnel train yard, and up into a floodlit Control Tower to punch a local Signal relay back online — while the Railyard itself tries to eat them.

**Feeling arc (player gut):**
| Zone | Feeling | One-word |
|------|---------|----------|
| Z1 Crash Site | Disoriented survival, "we're already fucked" | **RING** |
| Z2 Maintenance Tunnels | Claustrophobic dread, "they're in the walls" | **PIPE** |
| Z3 Switching Yard | Open-air slaughter, "run the lanes or die" | **LANE** |
| Z4 Control Tower | Hold-the-line climax, "reboot or be buried" | **SPIRE** |

**Pacing spine (Pulse & Flow):**
```
Z1: HOLD → CLEAR → EXTRACT (tutorial pressure cooker)
Z2: SQUEEZE → AMBUSH → SPRINT (tension corridor)
Z3: PUSH → CROSS → POWER → EXTRACT (horizontal war)
Z4: ASCEND → HACK → DEFEND → WARDEN → SIGNAL (vertical finale)
```

---

## 6. Fireteam Echo — Cast Hooks (Act 1 Only)

Use hireable heroes as **story texture**, not a second campaign. Radio callsigns bleed into zone VO.

| Callsign | Hero id | Role in Act 1 | Signature moment |
|----------|---------|---------------|------------------|
| **Bulwark** | `rex` | Door-kicker / shotgun front | Z1 sandbag hold; Z4 stair choke |
| **Longshot** | `mira` | Overwatch | Z3 mid-lane sniper perch; Z4 tower roof callouts |
| **Patch** | `doc` | Keep Echo breathing | Z2 steam burns; Z4 hack-phase heals |
| **Crowbar** | `nix` | Scavenger / scrap aura | Z1 wreck loot; Z3 container caches |
| **Ember** | `kira` | Pyro / molotov lanes | Z3 train-gap fire walls |
| **Ghost** | `voss` | Shadow flank | Z2 vent ambush counter; Z4 silent stair clear |

**Player = Echo Actual** (silent protagonist). Radio never names them; squad talks *to* them.

**Squad rule:** Max 2 hired heroes active in campaign (scrap economy). Act 1 should feel lonely even with help.

---

## 7. Shared Act 1 Systems (Cross-Zone Glue)

### 7.1 Objective Grammar (already partially shipped)
- `objective` toast volumes — teach / radio beat
- `extraction` — requiresWave / requiresKills + world beacon + HUD arrow
- **Add (design):** `hold` (stand in volume X seconds), `interact` (Hold E/F on prop), `power` (flip N switches), `defend` (survive timer while progress bar fills)

### 7.2 Ambiance Ladder
| Zone | fogAlpha | Night | Extra mood |
|------|----------|-------|------------|
| Z1 | 0.28 | forced | Orange fire bloom on heli; ash particles |
| Z2 | 0.35–0.45 | forced | Emergency red strobes; steam jets; flashlight mandatory beat |
| Z3 | 0.18–0.22 | forced | Sodium orange pools; long moonlit sightlines; rain streaks |
| Z4 | 0.15 + floodlight cones | forced → **local day** on Signal success | Floodlights, radio static, boss silhouette |

### 7.3 Enemy Casting (Act 1 roster — no new Acts)
| Type | Z1 | Z2 | Z3 | Z4 |
|------|----|----|----|----|
| Normal | ●●● | ●● | ●●● | ●● |
| Fast | ● | ●●● | ●● | ●● |
| Armored | ○ | ● | ●● | ●●● |
| Exploding | ● | ○ | ●● | ● |
| Spitter | ● (crash lore) | ○ | ● | ●● |
| Crawler | ○ | ●●● | ● | ● |
| Ghost | ○ | ● | ○ | ●● |
| Blight | ○ | ○ | ● | ●● |
| Flying | ○ | ○ | ● | ●● |
| Siren | ○ | ○ | ● (wave 3+) | ●● |
| Splitter | ○ | ○ | ● | ●● |
| Boss / Warden | — | — | mini? | **THE WARDEN** |

●●● = primary · ●● = common · ● = spice · ○ = rare/scripted

### 7.4 Scrap / Equipment / Shrine Cadence
- **Z1:** Teach scrap drops + first equipment crate near ammo crate south; optional shrine after wave 2 if wave-break fires.
- **Z2:** Tight scrap — reward side-passage loot rooms; Doc hire becomes attractive after steam damage.
- **Z3:** Fat scrap from yard kills; Fireteam Echo set pieces themed as "rail crew salvage."
- **Z4:** Boss-biased legendary drop; shrine disabled during Warden phase (no shopping mid-finale).

### 7.5 Failure / Retry Fantasy
- Death = **ZONE FAIL** (not full Act wipe) — restart current zone with preserved *meta* (profile) but run scrap/gear as designed by `GameStateManager` (document current behavior; prefer keep equipped gear, reset wave).
- **Iron Echo** optional later: one life Act 1 — out of scope for now, note only.

---

## 8. ZONE 1 — THE CRASH SITE ("RING")

### 8.1 Identity
**Map:** `crash_site` · 2400×1800 · spawn south of heli · extract north ring gap · `nextMapId: maintenance_tunnels`  
**Objective (shipped):** Secure the Perimeter → extract after wave 2  
**Fantasy:** You wake up in a crater of your own failure. The chopper is a funeral pyre. The debris ring is both shield and prison.

### 8.2 Spatial Read (what the player should *see*)
```
            [NORTH EXTRACT GAP]  ← green beacon after W2
                 ╲ debris ╱
            ╭───── RING ─────╮
            │  sandbags N    │
            │   ╭─HELI─╮     │
            │   │ FIRE │     │
            │   ╰──────╯     │
            │  spawn south   │
            ╰─── outer ring ─╯
         burnt cars / crates / ash
```
- **Inner wreckage ring** = cover + LOS break around fuselage.
- **Outer debris ring** = soft arena boundary; gap at north = narrative "debris clears" path (scripted clear still pending — *design it as a beat*, not just a hole).
- **South ammo crate + trash** = safe-ish loot pocket after first clear.

### 8.3 Beat Script (minute-by-minute fantasy)

| Beat | Wave / Time | What happens | Player verb |
|------|-------------|--------------|-------------|
| **0 Cold Open** | t=0 | Intro VO already played. Spawn. Heli fire crackles. Radio dead air. | Orient, loot sandbags |
| **1 First Contact** | Wave 1 | Normals + 1 Fast from ring exterior. Toast: *Hold the crash site.* | Circle-strafe wreck |
| **2 Spitter Signature** | Mid W1 | One Spitter (lore: bio-projectile that downed the bird) — teach acid pools | Kite, don't stand in green |
| **3 Breath** | Wave break | Optional scrap shrine roll; hire Rex if scrap ≥40 | Shop / hire / reload |
| **4 Pressure Cooker** | Wave 2 | Mixed pack + Exploding near fuel smell (fire decals). Radio: *Debris shifting north.* | Hold sandbags |
| **5 Debris Clear** | End W2 | **Scripted (TODO):** outer north segments shake/despawn VFX OR beacon unlocks. Message: *Path north is open.* | Sprint to extract |
| **6 Extract** | requiresWave 2 | Green beacon at north gap → zone transition | Touch volume |

### 8.4 Radio / Dialogue (Z1)

**Cold:**
- *Echo Actual (internal / subtitle):* "Day 0. Bird's dead. Signal's dead. We're not."
- *Radio (static):* "Echo Actual, do you copy? …Damn it. We're on our own."

**Wave 1 clear:**
- *Bulwark (if hired):* "Ring's holding. For now."
- *Crowbar:* "Wreck's got scrap. Don't leave it for them."

**Wave 2 start:**
- *Unknown (clipped):* "—any Fireteam still breathing on the Outskirts frequency—"

**Extract:**
- *Patch:* "North gap. Move before the ring closes again."
- *Objective flip:* `Descend into Maintenance Access`

### 8.5 Encounter Recipes (Z1)

**Recipe A — Ring Sweep (W1):** 8 Normal, 2 Fast, spawn outside outer ring, funnel through gaps.  
**Recipe B — Acid Lesson (W1 mid):** +1 Spitter south-east crater.  
**Recipe C — Boom Fuel (W2):** 6 Normal, 2 Armored, 2 Exploding near fire decals; teach not to cluster.  
**Recipe D — Extract Panic (optional):** On beacon unlock, 4 Fast from south to punish camping extract.

### 8.6 Hazards & Props (Z1 depth)
| Element | Status | Design |
|---------|--------|--------|
| Heli fire decals | ✅ | Cosmetic heat; future: DoT if stand in fire >1.5s |
| Craters | ✅ | Slow zones (TODO 10% speed) |
| Sandbag N | ✅ | Best hold point — teach cover |
| Burnt car W/E | ✅ | Soft cover |
| **Debris Clear event** | ❌ | Camera shake + wall segment fade + audio rumble |
| **Black box interact** | ❌ | Hold E on fuselage → lore toast + small scrap |

### 8.7 Teaching Checklist (Z1 must teach)
1. Campaign walls block movement (not arcade infinite).
2. Objective banner + extract arrow.
3. Wave clear → extract gate.
4. Scrap → E equipment / heroes.
5. Acid = bad.
6. Night + fog = flashlight optional but cool.

### 8.8 Art / Audio Targets (Z1)
- **SFX:** Rotor death-whine loop under fire crackle; metal tick as wreck cools.
- **Music:** Low pulse; intensity bump on W2.
- **GPU:** Embers rising from heli; ash drift; blood-edge if player already hurt from intro fantasy.

### 8.9 Implementation Hooks (Z1)
- Map: `js/maps/crashSite.js`
- Extract: `crash_site_extract` requiresWave 2
- TODO triggers: `debris_clear` scripted; `black_box` interact
- Spawn: arcade-parity off-screen + wall resolve (shipped)

---

## 9. ZONE 2 — THE MAINTENANCE TUNNELS ("PIPE")

### 9.1 Identity
**Map:** `maintenance_tunnels` · 1800×1200 · west spawn → east ladder · `nextMapId: switching_yard`  
**Fantasy:** The Railyard's arteries. Concrete throat. Steam. Vents that scream. You are in the *digestive tract* of the industrial gauntlet.

### 9.2 Spatial Read
```
WEST SPAWN ═══ MAIN CORRIDOR ═══════════════ EAST LADDER
     │              │              │
   N alcove      N alcove      (vents)
     │              │
   S alcove      S alcove + sandbags
         pillars mid (LOS break)
```
- Main corridor ~y 480–720 band — **kill funnel**.
- Four side passages = **loot / ambush / breath rooms**.
- Pillars at 800/1000 = break Spitter LOS and create melee pockets.
- East ladder = extract fantasy (climb to yard night air).

### 9.3 Beat Script

| Beat | Wave | What happens | Verb |
|------|------|--------------|------|
| **0 Throat** | Enter | Fog thicker. Red emergency lights flicker. Toast: *Push through the tunnels.* | Advance west→east |
| **1 Vent Kiss** | W1 | Fast + Crawler from side passages (vent fantasy). | Check corners |
| **2 Lights Out** | Mid W1 / break | **Scripted (TODO):** 4s blackout; flashlight forced useful; radio: *They're in the walls!* | Panic light cone |
| **3 Steam Gauntlet** | W2 | Steam jet hazards in corridor chokepoints (pending). Fast packs punish standing still. | Dash between jets |
| **4 Side Loot** | Any | Ammo crates in N passages; sandbags S = hold if overwhelmed | Optional detour |
| **5 Ladder** | requiresWave 2 | East extract → Switching Yard | Climb / touch |

### 9.4 Radio / Dialogue (Z2)

**Enter:**
- *Crowbar:* "Maintenance access. Smells like copper and regret."
- *Longshot:* "No sightlines. I hate this."

**Lights Out:**
- *Anyone:* "They're in the walls! Watch your six!"
- *Ghost:* "Quiet. Listen for the scrape."

**Steam:**
- *Patch:* "Burns'll kill you slower than teeth. Still dead."

**Extract:**
- *Bulwark:* "Ladder. Yard air. Move!"

### 9.5 Encounter Recipes (Z2)

**Recipe A — Corridor Push:** Normals ahead, Fast from behind (pincer).  
**Recipe B — Alcove Ambush:** Enter N1 → 3 Crawler drop (spawn in alcove).  
**Recipe C — Siren Tease (optional late):** Distant Siren scream *audio only* — foreshadow Z3/Z4 (no spawn yet if wave gate).  
**Recipe D — Ghost Flicker:** 1 Ghost during lights-out — teach silhouette fear.  
**Recipe E — Extract Tax:** On ladder approach, 2 Fast from west corridor (don't AFK extract).

### 9.6 Hazards (Z2 — design hard)

| Hazard | Behavior | Feedback |
|--------|----------|----------|
| **Steam jet** | Volume pulses every 3s, 1s active; 8–12 dmg/tick | White spray decal + hiss SFX + slight aim jitter |
| **Flicker lights** | Global alpha pulse; 4s blackout event once | Flashlight cone becomes god |
| **Wet floor** | Optional 5% slide on dodge | Subtle |
| **Vent spawn portals** | Decal + spawn point tags on alcove mouths | Dust puff when Fast exits |

### 9.7 Loot / Hero Beats
- Doc hire shines after steam burns.
- Ghost hire fantasy for lights-out.
- Equipment: gloves/boots with speed/reload feel great in corridors.

### 9.8 Art / Audio
- Dripping water, pipe knocks (randomized), distant train thunder (foreshadow Z3).
- Palette: sick green emergency + concrete grey; blood on walls as decals.
- Music: tight percussion, almost silent between pulses.

### 9.9 Implementation Hooks
- Map: `js/maps/maintenanceTunnels.js`
- Need: hazard volumes in MapLoader; blackout flag on `gameState`; vent spawn tags
- Extract east ladder (shipped pattern)

---

## 10. ZONE 3 — THE SWITCHING YARD ("LANE")

### 10.1 Identity
**Map:** `switching_yard` · 2800×1600 · west spawn → east gate · extract requiresWave **3** · `nextMapId: 'control_tower'` ✅  
**Fantasy:** Horizontal war. Three train-car walls = three kill lanes. Cross-gaps are sacred. Longshot heaven. Swarm hell. You are ants between steel whales.

### 10.2 Spatial Read
```
WEST ────────────────────────────────────────────── EAST GATE
  N LANE  [train][gap][train][gap][train]     flood? 
  M LANE  [train][gap][train][gap][train]  ← primary push
  S LANE  [train][gap][train][gap][train]
         containers = cover islands
                    FIRE mid
```
- **Lane discipline:** Players who hug one lane get flanked through gaps.
- **Mid fire decal** = don't camp the cross.
- **Gate pillars** 2550x = extract cathedral.

### 10.3 Beat Script (longest zone — earn the tower)

| Beat | Wave | What happens | Verb |
|------|------|--------------|------|
| **0 Night Air** | Enter | Fog thins. Sodium glow. Toast: *Push east through the train lanes.* | Choose a lane |
| **1 Lane War** | W1 | Normals + Fast funnel mid; Armored in N lane | Push to first gap |
| **2 Mid Radio** | requiresWave 2 objective | *Gate needs power. Hold the yard.* | Reach mid volume |
| **3 Power Ritual** | W2–W3 | **Design:** 2–3 power boxes (N/M/S) — Hold E each while contested | Split attention / hero help |
| **4 Horde Weather** | W3 | Siren possible; Splitter; Flying over trains; Encircle mutator fantasy | Survive + finish power |
| **5 Gate Up** | Power done | Gate VFX unlock; extract beacon hard east | Sprint / cover hop |
| **6 Extract** | requiresWave 3 | Touch east gate → **Control Tower** | Leave the yard |

### 10.4 Power-the-Gate Fantasy (expand the shipped objective)

Shipped text says "Power the east gate" but extract is wave-gated only. **Deepen without leaving Act 1:**

1. **Phase A — Clear to Mid** (W1–W2): reach `yard_mid` toast.
2. **Phase B — Couplers:** Three interactables (`power_north`, `power_mid`, `power_south`) near lane gaps. Each takes 2.5s Hold E; interrupted by damage.
3. **Phase C — Surge:** Completing 2/3 boxes triggers a **RUSH** wave (WaveChaos mutator flavor) for 20s.
4. **Phase D — Gate Live:** 3/3 → extract enabled (still require wave 3 OR kills threshold as backup).

HUD: `GATE POWER 1/3` → `2/3` → `ONLINE`.

### 10.5 Radio / Dialogue (Z3)

**Enter:**
- *Longshot:* "Finally. Distance. Don't waste it."
- *Ember:* "Lanes are chimneys. I can cook a corridor."

**Mid:**
- *Radio:* "Gate needs power. Hold the yard."
- *Crowbar:* "Couplers on each lane. I'll take south if you take mid."

**Siren:**
- *Patch:* "Cover your ears—no, cover your *aim*!"

**Gate online:**
- *Bulwark:* "Gate's live! East! EAST!"

**Extract:**
- *Ghost:* "Tower's lit. That's not a welcome. That's a dare."

### 10.6 Encounter Recipes (Z3)

**Recipe A — Triple Funnel:** Equal pressure all lanes; punish lane camping with gap crossers.  
**Recipe B — Sniper Duel:** Flying + Spitter on N lane roofs (train tops as spawn Y).  
**Recipe C — Splitter Freight:** Splitter in mid gap → Shards run opposite lanes.  
**Recipe D — Siren Conductor:** Siren at east approach; horde speed buff during power phase.  
**Recipe E — Gate Tax:** Exploding + Armored at pillars when extract opens.

### 10.7 Set-Piece Moments (Z3 apeshit list)
1. **Train horn** audio stinger when W3 starts (no moving train needed — sound = threat).
2. **Container tip** cosmetic: one debris wall "falls" opening a new cross (scripted wall disable).
3. **Molotov lane paint:** if Ember hired, VO suggests sealing a gap with fire.
4. **Scrap avalanche:** kill 25 in yard → bonus equipment drop near mid fire.
5. **Hero nameplates** gold in sodium light (shipped `isHero` / `heroRole`).

### 10.8 Art / Audio
- Wet asphalt reflections (2D fake: long specular streaks).
- Sodium orange vs cold moon blue (palette split N/S).
- Music: biggest Act 1 track — industrial percussion, then gate choir sting.

### 10.9 Implementation Hooks
- Map: `js/maps/switchingYard.js`
- [AMENDED 2026-07-09]: `nextMapId: 'control_tower'` ✅; power interact triggers ✅; extract requiresWave 3 + gate online ✅

---

## 11. ZONE 4 — THE CONTROL TOWER ("SPIRE") — FINALE

### 11.1 Identity
**Map:** `control_tower` · **2000×2200** nested rings · `nextMapId: null` · Act 1 end · ✅ **PLAYABLE (2026-07-09)**
**Fantasy:** The last upright thing in the Railyard. Floodlights like interrogation. The Warden was human once — a signal tech who stayed too long. You don't escape Act 1. You *reboot a piece of the night.*

### 11.2 Vertical Metaphor in Top-Down
Don't fake 3D floors. Use **concentric / ascending yards**:

```
[OUTER PARKING / FENCE]  ← spawn after yard gate
        ↓ breached gate
[LOADING APRON]          ← wave hold
        ↓ stair ramp (choke)
[LOBBY RING]             ← scrap / ammo / last shrine
        ↓ inner stair
[OPS FLOOR / TERMINAL]   ← HACK ZONE (king of the hill)
        ↑ floodlight cones
[ROOF RELAY]             ← optional Mira perch; Warden spawn silhouette
```

Walls form **nested rectangles** with stair-gap chokepoints at north of each ring. Player "ascends" by moving inward/north.

### 11.3 Suggested Geometry Spec
| Ring | Size (approx) | Role |
|------|---------------|------|
| Outer fence | 2000×2200 border | Spawn south; Armored welcome |
| Apron | inner 1600×1600 | Open fight, floodlight props |
| Lobby | 1100×1100 | Cover pillars, last shop |
| Ops | 600×600 | Terminal interact + defend radius |
| Roof marker | center decal | Warden entrance VFX |

**Spawn:** south outer. **Terminal:** map center. **Extract:** none — victory is Signal Online.

### 11.4 Beat Script (Finale — no mercy)

| Phase | Name | Win condition | Fail feel |
|-------|------|---------------|-----------|
| **P0** | Breach | Enter apron, clear Wave 1 | Soft |
| **P1** | Ascend | Reach lobby ring (objective volume) | Soft |
| **P2** | Last Rites | Optional shrine + hero hire capstone | Breath |
| **P3** | Hack | Hold E 5s on terminal → starts **Defend 45s** | Interrupted hack |
| **P4** | Defend Signal | Survive 45s; progress bar; escalating spawns | Wipe = retry P3 |
| **P5** | The Warden | Boss HP to 0 (or 50% + enrage add clear) | Wipe |
| **P6** | Signal Online | Hold F / auto on Warden death → **ACT 1 CLEAR** | — |

### 11.5 THE WARDEN — Boss Design (Act 1 only)

**Who:** Former Railyard signal warden. Headset fused to skull. Floodlight eyes. Drags a broadcast mast like a spear.

**Stats fantasy (tune in balance pass):**
- HP: ~8–12× Armored elite
- Phases at 100% / 60% / 25%

| Phase | Behavior | Arena tell |
|-------|----------|------------|
| **I Broadcast** | Slow chase; slam AOE; summons 4 Normal | Mast glow cyan |
| **II Static** | Siren-like aim jitter aura; telegraphs charge through gaps | Lights flicker |
| **III Blackout** | Arena lights die 6s; Ghost adds; mast slam leaves Blight pools | Only muzzle + floodlight cones |

**Attacks:**
1. **Mast Slam** — circle telegraph, 35 dmg, knockdown feel (brief stun 0.3s)
2. **Relay Scream** — Siren copy, shorter, buffs adds
3. **Floodlight Sweep** — rotating damaging cone (readable)
4. **Call the Yard** — spawn Armored + Splitter once per phase

**Weakness:** Exploding barrels on apron (if placed); Mira DPS; Ember fire pools; Bulwark body-block on stairs.

**Death:** Mast falls; radio clears; *"...is anyone out there?"* becomes *"...we hear you. Hold the line."*

### 11.6 Defend Phase Spawn Graph
```
0–15s:  Normal trickle (corridor from outer)
15–30s: + Fast + Crawler stair rush
30–45s: + Armored + Spitter; Siren once
45s:    HACK COMPLETE → Warden lands center (roof decal crash)
```

### 11.7 Radio / Dialogue (Z4) — full scene

**Approach:**
- *Radio (static):* "...broadcasting on emergency frequency... is anyone out there?"
- *Longshot:* "Tower's occupied. Something's wearing the headset."
- *Bulwark:* "Stairs are a meat grinder. I'm first."

**Hack start:**
- *Crowbar:* "Terminal's live. Keep them off me—off *you*."
- *Patch:* "Anyone bleeds, you stack on me."

**Defend 50%:**
- *Ghost:* "They're climbing the outside. I can hear nails."
- *Ember:* "If I burn the stairs, we burn our exit. Your call, Actual."

**Warden intro:**
- *Warden (distorted):* "THE SIGNAL WAS MERCY. YOU ARE NOISE."
- *Anyone:* "That's not a man."

**Warden 25%:**
- *Warden:* "DAY ZERO NEVER ENDED."

**Victory:**
- *Radio (clear):* "Outskirts relay online. Fireteam Echo — you just bought the city a sunrise."
- *Objective:* **ACT 1 CLEAR — ECHOES OF SILENCE**
- *UI:* ZONE CLEAR → special **ACT CLEAR** banner (green → white Signal flash)

### 11.8 Loot / Progression Capstone
- Guaranteed equipment drop on Warden (legendary bias).
- Achievement hooks: *Echo Actual*, *Warden Slayer*, *Signal Ghost* (no flashlight during P5 blackout — spicy).
- Gallery unlock: Warden card.
- Score: Act 1 completion bonus + remaining scrap convert to score/XP.

### 11.9 Art / Audio / GPU
- Floodlight cones as decals + optional WebGPU light shafts.
- Boss health bar (reuse `BossHealthBar.js`).
- Music: silence → heartbeat → full choir on Signal Online.
- Blood-edge max during Warden slam near-deaths.

### 11.10 Implementation Checklist (Z4)
- [x] `js/maps/controlTower.js` — nested rings, stairs gaps, terminal prop, floodlight decals
- [x] Registry in `MapLoader` + `switchingYard.nextMapId = 'control_tower'`
- [x] Trigger types: `interact`/`power`/`hack`, `defend` (timer), boss spawn
- [x] `GameStateManager` Act Clear victory (`campaignActClear` / ACT 1 CLEAR title)
- [x] Warden class in `WardenBoss.js`
- [ ] VO toast strings table (partial — wave notifications only)
- [ ] Gallery + achievements
- [ ] Full playtest balance pass: Z1→Z4 one sitting

[AMENDED 2026-07-09]: Core finale playable; polish/gallery/achievements still open.

---

## 12. Cross-Zone Objective String (Player-Facing)

| Zone | HUD objective line |
|------|--------------------|
| Z1 | SECURE THE PERIMETER → REACH NORTH GAP |
| Z2 | PUSH THE TUNNELS → CLIMB EAST LADDER |
| Z3 | POWER THE GATE → BREACH EAST EXIT |
| Z4 | ASCEND THE SPIRE → REBOOT THE RELAY |

**Act title card (between zones):** `ZONE N — NAME` (already partially shipped on transition).

---

## 13. Difficulty / Mutator Overlay (Act 1 aware)

WaveChaos still runs, but **bias tables per zone**:
- Z1: no Siren/Splitter until extract panic optional
- Z2: SWARM + Fast bias; disable ENCICLE if corridors break it — prefer RUSH
- Z3: ENCIRCLE / VOLATILE shine
- Z4 defend: forced RUSH-like script; mutators paused during Warden

---

## 14. Accessibility & Readability (still metal, still fair)
- Extract beacon + edge arrow (shipped) — keep high contrast.
- Steam/hazard telegraphs ≥0.4s.
- Warden slam telegraph ≥0.55s.
- Colorblind: gate power UI use shape + number not only green.
- Flashlight during Z2 blackout: never soft-lock without light if setting disabled — bump ambient instead.

---

## 15. Act 1 Success Metrics (design QA)
1. New player clears Z1 understanding extract.
2. Z2 creates ≥1 "holy shit" flashlight moment.
3. Z3 power fantasy readable without wiki.
4. Z4 Warden death feels like a *boss*, not a fat Armored.
5. Total Act 1 aspirational length: **25–40 min** first clear, **15–20** once learned.
6. Hero hire feels optional but spicy — never required.

---

## 16. Out-of-Scope (explicit — do not expand outward)
- ❌ Act 2 city / Signal Station proper
- ❌ Multiplayer campaign sync
- ❌ Full branching story
- ❌ Movable trains as physics objects
- ❌ True multi-floor camera

**In-scope forever for this doc:** deepen Z1–Z4 density, VO, hazards, boss, power puzzle, teachable moments.

---

## 17. Priority Build Order (after this bible)
1. Z3 power couplers — ✅ shipped
2. Z2 steam + lights-out — ✅ shipped
3. Z1 debris-clear VFX — ✅ shipped
4. Z4 map + hack/defend — ✅ shipped
5. Warden boss — ✅ shipped
6. Act Clear modality + achievements — ✅ Act Clear UI; ✅ campaign achievements (Echo Actual, Warden Slayer, Fireteam)

[AMENDED 2026-07-09]: Items 1–5 + Act Clear victory live in Unreleased. Remaining: gallery card, achievements, balance pass.
[AMENDED 2026-07-09]: Campaign achievements shipped in **Campaign Alive Coverage** pass (§19). Remaining: balance pass, optional gallery polish.

---

*End Act 1 Zones 1–4 design bible. Stay in the Railyard. Make it legendary.*

---

## 18. Survivor Quests — Meet / Quest / Recruit (SHIPPED 2026-07-09)

World-space friendly NPCs (not shop heroes). One per zone. **E** to talk.

| Zone | Survivor | Quest | Reward |
|------|----------|-------|--------|
| Z1 Crash | **Rook** (warrior/shotgun) | Kill 8 infected | Recruit teammate |
| Z2 Tunnels | **Pip** (ranger/SMG) | Reach wave 2 | Recruit |
| Z3 Yard | **June** (scavenger) | Bring 30 scrap (paid on recruit) | Recruit + scrap aura |
| Z4 Tower | **Holt** (medic/rifle) | Kill 12 on apron | Recruit + heal pulse |

**Rules:** Max party 4 (P1 + 3). Party full → scrap consolation + refuse VO. `campaignSurvivorRun` persists across zone loads. Quest-ready toast when objective met away from NPC. Extract **tax**: first extract touch spawns panic pack; zone clear only when ≤2 zombies remain.

**Ante:** Zone N starts with `zombiesPerWave = 5 + (N-1)*2`. Z4 defend 50s.

---

## 19. Campaign Alive Coverage (SHIPPED 2026-07-09)

Minimum presentation layer so Act 1 *feels* alive without full bible set-pieces.

| Layer | Shipped |
|-------|---------|
| **Toasts** | `triggerWaveNotification()` with `kind: 'campaign'` + radio subtitle |
| **Radio** | `RADIO_BEATS` per zone/beat; procedural static blip |
| **Ambiance** | `fogAlpha` world veil; lights-out flicker overlay |
| **SFX** | Steam hiss, coupler/gate stinger, defend/warden/act-clear tones |
| **Quest QoL** | Party-full keeps NPC; quest abandon on zone leave; HUD progress |
| **Input** | Gamepad Hold-E for power/hack; damage interrupts hold |
| **Casting** | No arcade boss in campaign; zone spawn bias |
| **Flow** | 1.2s zone transition interstitial; ZONE FAIL retry; `campaignVictory()` |
| **Achievements** | Echo Actual, Warden Slayer, Fireteam |

**Still open (not this pass):** NavMesh, vent portals, train horn, Warden floodlight sweep, full VO table, Act 2.
