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

**Zone 1: The Crash Site (Tutorial/Start)** — ✅ **PLAYABLE (2026-07-06)**
*   **Visuals:** Burning helicopter wreckage, smoldering craters, night time.
*   **Layout:** Circular defensive area surrounded by debris.
*   **Gameplay:** Survive initial wave until "debris clears" (scripted event — **not yet implemented**).
*   **Objective:** "Secure the Perimeter."
*   **Implementation:** `js/maps/crashSite.js` (2400×1800), `js/systems/MapLoader.js`, wall collision, static props, objective HUD, edge spawns. North ring gap reserved for Zone 2 transition.

**Zone 2: The Maintenance Tunnels (Transition)**
*   **Visuals:** Claustrophobic concrete hallways, flickering emergency lights.
*   **Layout:** Narrow zig-zag paths. Line of sight is broken often.
*   **Gameplay:** High tension. Fast Zombies spawn from vents. Shotguns/Melee preferred.
*   **Hazard:** Leaking steam pipes (environmental damage).

**Zone 3: The Switching Yard (Open Combat)**
*   **Visuals:** Train cars, tracks, rusted shipping containers.
*   **Layout:** Three parallel lanes separated by long trains. Players can climb on top of trains (2.5D height illusion or just impassable walls with ramps).
*   **Gameplay:** Long sightlines for Snipers/Rifles. Massive hordes funneling between trains.
*   **Objective:** "Power the Gate." Players must find fuel cells to open the exit gate.

**Zone 4: The Control Tower (Finale)**
*   **Visuals:** Multi-story brick building, floodlights.
*   **Layout:** King-of-the-hill style platform.
*   **Gameplay:** Defend the point while hacking the terminal. Boss fight (The Warden).

### Technical Requirements
1.  **Map Loader:** ✅ **Implemented (2026-07-06)** — `MapLoader` + `js/maps/crashSite.js` (ES module map defs; circle-vs-AABB collision). JSON fetch deferred — no bundler.
2.  **Trigger System:** ⏳ **Stub** — `updateTriggers()` fires objective text / wave notification on volume enter; dialogue and scripted waves pending.
3.  **NavMesh:** ❌ **Not started** — zombies use direct chase + wall resolve; no pathfinding around complex geometry yet.

---

## 3. Story Beats & Dialogue

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
