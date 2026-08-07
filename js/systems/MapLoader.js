// [TRACE: CAMPAIGN_DESIGN.md] Campaign map loader — zones, hazards, power, hack/defend, Warden
import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Prop } from '../entities/Prop.js';
import { RENDERING } from '../core/constants.js';
import {
    resolveCircleAgainstWalls,
    clampCircleInBounds
} from '../utils/mapCollisionUtils.js';
import { applyPlayerDamage } from '../utils/combatUtils.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';
import {
    playRadioStaticSound,
    playCampaignStinger,
    playSteamHissSound
} from './AudioSystem.js';
import { crashSiteMap } from '../maps/crashSite.js';
import { maintenanceTunnelsMap } from '../maps/maintenanceTunnels.js';
import { switchingYardMap } from '../maps/switchingYard.js';
import { controlTowerMap } from '../maps/controlTower.js';
import { WardenBoss } from '../entities/WardenBoss.js';
import {
    NormalZombie,
    FastZombie,
    ArmoredZombie,
    CrawlerZombie
} from '../entities/Zombie.js';
import { getSurvivorById } from '../core/survivorDefinitions.js';
import { achievementSystem } from './AchievementSystem.js';
import { drawSurvivorNPC } from './PlayerRenderer.js';

const MAP_REGISTRY = {
    crash_site: crashSiteMap,
    maintenance_tunnels: maintenanceTunnelsMap,
    switching_yard: switchingYardMap,
    control_tower: controlTowerMap
};

const WALL_COLORS = {
    concrete: { fill: '#3a3f46', stroke: '#1c2026', accent: '#5a626d' },
    debris: { fill: '#2e2a26', stroke: '#14110f', accent: '#4a433c' },
    wreckage: { fill: '#1f1c1a', stroke: '#0a0908', accent: '#ff6b35' }
};

const NPC_RADIUS = 18;
const NPC_TALK_RANGE = 70;

const RADIO_BEATS = {
    crash_site: 'Echo Actual, do you copy? ...Damn it. We\'re on our own.',
    maintenance_tunnels: 'They\'re in the walls! Watch your six!',
    switching_yard: 'Radio: Gate needs power before we cross the yard.',
    control_tower: '...broadcasting on emergency frequency... is anyone out there?',
    lights_out: 'Lights are out — flashlights up!',
    debris_clear: 'Path north is open. Move!',
    gate_online: 'Gate power nominal. East exit is live.',
    power_surge: 'Surge on the line — they\'re coming!',
    defend_start: 'Signal boot in progress. Hold the tower!',
    warden_spawn: 'THE WARDEN — YOU ARE NOISE',
    act_clear: 'Signal Online. Echo Actual, we read you.'
};

function defaultCampaignScript() {
    return {
        powerRequired: 0,
        powerCompleted: 0,
        powerIds: [],
        powerSurgeFired: false,
        gateOnline: false,
        debrisCleared: false,
        lightsOutUntil: 0,
        lightsOutFired: false,
        hackProgress: 0,
        hackActiveId: null,
        hackComplete: false,
        defendActive: false,
        defendEndsAt: 0,
        defendDurationMs: 0,
        wardenSpawned: false,
        wardenDead: false,
        actClear: false,
        interactHoldId: null,
        interactHoldStart: 0,
        extractTaxFired: false,
        activeNpcs: [],
        nearbyNpcId: null,
        survivorBubble: null,
        survivorBubbleNpcId: null,
        _lastQuestKillCount: 0,
        _lastSteamSfx: 0
    };
}

function ensureSurvivorRunState() {
    if (!gameState.campaignSurvivorRun) {
        gameState.campaignSurvivorRun = {
            met: {},
            quest: null,
            questDone: {},
            recruited: {},
            killsAtQuestStart: 0
        };
    }
    return gameState.campaignSurvivorRun;
}

/**
 * MapLoader — static campaign zone geometry, collision, hazards, and scripted beats.
 */
export class MapLoader {
    constructor() {
        this.activeMap = null;
        this.bounds = null;
        this.triggeredIds = new Set();
        this._defendSpawnAcc = 0;
    }

    load(mapId) {
        const map = MAP_REGISTRY[mapId];
        if (!map) {
            console.warn(`[MapLoader] Unknown map: ${mapId}`);
            this.unload();
            return false;
        }

        this.activeMap = map;
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: map.width,
            maxY: map.height
        };
        this.triggeredIds.clear();
        this._defendSpawnAcc = 0;

        gameState.campaignMapId = map.id;
        gameState.campaignObjective = map.objective || '';
        gameState.campaignZone = map.zone || 1;
        gameState.campaignObjectiveTarget = null;
        gameState.campaignZoneCleared = false;
        gameState.campaignZoneClearTime = 0;
        gameState.campaignActClear = false;
        gameState.campaignScript = defaultCampaignScript();

        // Count power triggers for gate UI
        const powerTriggers = (map.triggers || []).filter(t => t.type === 'power');
        gameState.campaignScript.powerRequired = powerTriggers.length;
        gameState.campaignScript.powerIds = powerTriggers.map(t => t.id);

        // Pre-mark extract locked if power required
        if (powerTriggers.length > 0) {
            gameState.campaignObjective = `Power the gate — 0/${powerTriggers.length}`;
        }

        this._spawnMapSurvivors();
        this._fireRadioBeat('zone_load');
        return true;
    }

    _fireRadioBeat(beatKey, toastText = null, toastLife = 180) {
        const line = RADIO_BEATS[beatKey] || beatKey;
        if (toastText) {
            triggerWaveNotification(toastText, toastLife, line, 'campaign');
        } else if (this.activeMap) {
            const mapLine = RADIO_BEATS[this.activeMap.id] || line;
            triggerWaveNotification(
                `ZONE ${this.activeMap.zone} — ${(this.activeMap.name || '').toUpperCase()}`,
                toastLife,
                mapLine,
                'campaign'
            );
        }
        playRadioStaticSound();
    }

    _abandonIncompleteQuests() {
        const run = ensureSurvivorRunState();
        if (!run.quest) return;
        if (run.questDone[run.quest.survivorId]) return;
        const def = getSurvivorById(run.quest.survivorId);
        if (def) {
            triggerWaveNotification(
                `LEFT BEHIND — ${def.name.toUpperCase()}'S QUEST FAILED`,
                140,
                null,
                'campaign'
            );
        }
        run.quest = null;
    }

    _beginZoneTransition() {
        const map = this.activeMap;
        if (!map) return;
        const nextMap = MAP_REGISTRY[map.nextMapId];
        const title = nextMap
            ? `ZONE ${nextMap.zone} — ${(nextMap.name || '').toUpperCase()}`
            : `ZONE ${map.zone} CLEAR`;
        const subtitle = nextMap
            ? (RADIO_BEATS[nextMap.id] || 'Moving out...')
            : 'Extraction secured.';
        gameState.campaignTransition = {
            active: true,
            until: Date.now() + 1200,
            title,
            subtitle
        };
        playRadioStaticSound();
    }

    _spawnMapSurvivors() {
        const script = gameState.campaignScript;
        script.activeNpcs = [];
        const run = ensureSurvivorRunState();
        const entries = this.activeMap.survivors || [];
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const def = getSurvivorById(entry.survivorId);
            if (!def) continue;
            if (run.recruited[def.id]) continue;
            script.activeNpcs.push({
                survivorId: def.id,
                x: entry.x,
                y: entry.y,
                def
            });
        }
    }

    unload() {
        this.activeMap = null;
        this.bounds = null;
        this.triggeredIds.clear();
        gameState.campaignMapId = null;
        gameState.campaignObjective = '';
        gameState.campaignZone = 0;
        gameState.campaignObjectiveTarget = null;
        gameState.campaignZoneCleared = false;
        gameState.campaignZoneClearTime = 0;
        gameState.campaignActClear = false;
        gameState.campaignScript = defaultCampaignScript();
    }

    isLoaded() {
        return !!this.activeMap;
    }

    getMap() {
        return this.activeMap;
    }

    getNextMapId() {
        return this.activeMap?.nextMapId || null;
    }

    getSpawn() {
        if (!this.activeMap) return { x: 0, y: 0 };
        return { ...this.activeMap.spawn };
    }

    getObjective() {
        return this.activeMap?.objective || '';
    }

    getBounds() {
        return this.bounds;
    }

    getWalls() {
        return this.activeMap?.walls || [];
    }

    spawnMapProps(targetState = gameState) {
        if (!this.activeMap?.props?.length) return;

        for (let i = 0; i < this.activeMap.props.length; i++) {
            const entry = this.activeMap.props[i];
            const prop = new Prop(entry.x, entry.y, entry.type);
            if (entry.rotation !== undefined) {
                prop.rotation = entry.rotation;
            }
            targetState.props.push(prop);
        }
    }

    applyAmbiance() {
        if (!this.activeMap?.ambiance) return;

        if (this.activeMap.ambiance.forceNight) {
            gameState.isNight = true;
            gameState.gameTime = 0.75;
            const cycle = gameState.dayNightCycle?.cycleDuration || 120000;
            gameState.dayNightCycle.startTime = Date.now() - 0.75 * cycle;
        }
        gameState.campaignFogAlpha = this.activeMap.ambiance.fogAlpha ?? 0;
    }

    resolvePosition(x, y, radius) {
        if (!this.activeMap) return { x, y };

        let resolved = clampCircleInBounds(x, y, radius, this.bounds);
        const wallResult = resolveCircleAgainstWalls(
            resolved.x,
            resolved.y,
            radius,
            this.activeMap.walls
        );
        resolved = clampCircleInBounds(wallResult.x, wallResult.y, radius, this.bounds);
        return resolved;
    }

    /**
     * Per-frame campaign simulation: hazards, scripted events, interact holds, defend, warden.
     */
    update(dt = 16.67) {
        if (!this.activeMap) return;

        const player = gameState.players[0];
        if (!player || player.health <= 0) return;

        const script = gameState.campaignScript;
        const now = Date.now();

        this._updateHazards(player, now);
        this._updateScriptedEvents(now);
        this._updateDebrisClear(now);
        this._updateSurvivorQuests(player, now);
        this._updateInteractables(player, now);
        this._updateDefend(player, now, dt);
        this._updateWardenDeath();
        this.updateTriggers();
    }

    _updateHazards(player, now) {
        const hazards = this.activeMap.hazards || [];
        for (let i = 0; i < hazards.length; i++) {
            const h = hazards[i];
            if (h.kind !== 'steam') continue;

            const period = h.periodMs || 3000;
            const activeMs = h.activeMs || 1000;
            const phase = (now + (h.phaseOffset || 0)) % period;
            h._active = phase < activeMs;

            if (!h._active) continue;
            if (!this._pointInRect(player.x, player.y, h)) continue;

            const last = h._lastHit || 0;
            if (now - last < 400) continue;
            h._lastHit = now;
            applyPlayerDamage(player, h.damage || 10);
            player.sirenAimJitterUntil = now + 200;
            if (now - (gameState.campaignScript._lastSteamSfx || 0) > 900) {
                gameState.campaignScript._lastSteamSfx = now;
                playSteamHissSound();
            }
        }
    }

    _updateScriptedEvents(now) {
        const events = this.activeMap.scriptedEvents || [];
        const script = gameState.campaignScript;

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            if (this.triggeredIds.has(ev.id)) continue;

            if (ev.type === 'lights_out') {
                if (ev.requiresWave && gameState.wave < ev.requiresWave) continue;
                // Fire once when wave reaches threshold and player is in map
                this.triggeredIds.add(ev.id);
                script.lightsOutFired = true;
                script.lightsOutUntil = now + (ev.durationMs || 4000);
                if (!gameState.players[0].flashlight) {
                    gameState.players[0].flashlight = { active: true };
                } else {
                    gameState.players[0].flashlight.active = true;
                }
                triggerWaveNotification(
                    ev.message || "THEY'RE IN THE WALLS!",
                    150,
                    RADIO_BEATS.lights_out,
                    'campaign'
                );
            }
        }
    }

    _updateDebrisClear(now) {
        if (!this.activeMap || this.activeMap.id !== 'crash_site') return;
        const script = gameState.campaignScript;
        if (script.debrisCleared) return;
        if (gameState.wave < 2) return;

        // Unlock when wave 2 is active (or cleared into break)
        script.debrisCleared = true;
        gameState.campaignObjective = 'Debris cleared — reach the north gap!';
        gameState.campaignObjectiveTarget = { x: 1200, y: 440 };
        triggerWaveNotification(
            'DEBRIS CLEAR — PATH NORTH OPEN',
            180,
            RADIO_BEATS.debris_clear,
            'campaign'
        );

        // Soften north ring walls visually (mark for render shake)
        const walls = this.activeMap.walls;
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            if (w.kind === 'debris' && w.y < 500) {
                w._cleared = true;
                w.kind = 'wreckage';
            }
        }
    }

    /**
     * Hold-E interactables: power couplers + hack terminal + survivor talk.
     * Call tryInteract() from input when E pressed near volume.
     */
    tryInteract(player) {
        if (!this.activeMap || !player) return false;
        const script = gameState.campaignScript;
        const now = Date.now();

        // Survivors: tap E (no hold) — talk / accept / complete
        const npc = this._getNearbyNpc(player);
        if (npc) {
            this._talkToSurvivor(npc, player);
            return true;
        }

        const triggers = this.activeMap.triggers || [];
        for (let i = 0; i < triggers.length; i++) {
            const t = triggers[i];
            if (t.type !== 'power' && t.type !== 'hack') continue;
            if (this.triggeredIds.has(t.id)) continue;
            if (t.requiresWave && gameState.wave < t.requiresWave) continue;
            if (!this._pointInRect(player.x, player.y, t)) continue;

            if (script.interactHoldId !== t.id) {
                script.interactHoldId = t.id;
                script.interactHoldStart = now;
            }
            return true;
        }
        script.interactHoldId = null;
        script.interactHoldStart = 0;
        return false;
    }

    _getNearbyNpc(player) {
        const npcs = gameState.campaignScript?.activeNpcs || [];
        let best = null;
        let bestD = NPC_TALK_RANGE * NPC_TALK_RANGE;
        for (let i = 0; i < npcs.length; i++) {
            const n = npcs[i];
            const dx = n.x - player.x;
            const dy = n.y - player.y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= bestD) {
                bestD = d2;
                best = n;
            }
        }
        return best;
    }

    _pickLine(lines, key) {
        const arr = lines?.[key];
        if (!arr || !arr.length) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    }

    _showSurvivorBubble(text, ms = 3500, npcId = null) {
        gameState.campaignScript.survivorBubble = {
            text,
            until: Date.now() + ms
        };
        gameState.campaignScript.survivorBubbleNpcId = npcId;
    }

    _talkToSurvivor(npc, player) {
        const run = ensureSurvivorRunState();
        const def = npc.def;
        const id = def.id;

        if (run.recruited[id]) return;

        // Block new quest while another is active
        if (!run.met[id] && run.quest && run.quest.survivorId !== id) {
            this._showSurvivorBubble('Finish your current job first.', 2500, id);
            return;
        }

        // First meet
        if (!run.met[id]) {
            run.met[id] = true;
            run.quest = {
                survivorId: id,
                type: def.quest.type,
                amount: def.quest.amount,
                label: def.quest.label,
                startedAt: Date.now(),
                progress: 0
            };
            gameState.campaignScript._lastQuestKillCount = gameState.zombiesKilled || 0;
            this._showSurvivorBubble(this._pickLine(def.lines, 'greet'), 3500, id);
            triggerWaveNotification(
                `QUEST — ${def.name.toUpperCase()}: ${def.quest.label}`,
                200,
                null,
                'campaign'
            );
            return;
        }

        // Quest in progress
        if (!run.questDone[id]) {
            if (this._isSurvivorQuestComplete(def, run, player)) {
                run.questDone[id] = true;
                this._showSurvivorBubble(this._pickLine(def.lines, 'complete'), 3500, id);
                this._recruitOrConsole(def, player);
            } else {
                this._showSurvivorBubble(
                    this._pickLine(def.lines, 'progress') || def.quest.label,
                    3500,
                    id
                );
                gameState.campaignObjective = `${def.name}: ${def.quest.label} (${this._questProgressText(def, run, player)})`;
            }
            return;
        }

        // Quest done but not recruited (edge: party was full earlier)
        if (!run.recruited[id]) {
            this._recruitOrConsole(def, player);
        }
    }

    _questProgressText(def, run, player) {
        const q = def.quest;
        if (q.type === 'kill_count') {
            const got = run.quest?.survivorId === def.id ? (run.quest.progress || 0) : 0;
            return `${Math.min(got, q.amount)}/${q.amount}`;
        }
        if (q.type === 'scrap_have') {
            return `${player.scrap || 0}/${q.amount}`;
        }
        if (q.type === 'reach_wave') {
            return `W${gameState.wave || 1}/${q.amount}`;
        }
        if (q.type === 'survive_seconds') {
            const elapsed = (Date.now() - (run.quest?.startedAt || Date.now())) / 1000;
            return `${Math.floor(Math.min(elapsed, q.amount))}/${q.amount}s`;
        }
        return '';
    }

    getQuestProgressText() {
        const run = ensureSurvivorRunState();
        if (!run.quest || run.questDone[run.quest.survivorId]) return null;
        const def = getSurvivorById(run.quest.survivorId);
        if (!def) return null;
        const player = gameState.players[0] || { scrap: 0 };
        return { name: def.name, progress: this._questProgressText(def, run, player) };
    }

    _isSurvivorQuestComplete(def, run, player) {
        const q = def.quest;
        if (!q) return true;
        if (q.type === 'kill_count') {
            return run.quest?.survivorId === def.id && (run.quest.progress || 0) >= q.amount;
        }
        if (q.type === 'scrap_have') {
            return (player.scrap || 0) >= q.amount;
        }
        if (q.type === 'reach_wave') {
            return (gameState.wave || 1) >= q.amount;
        }
        if (q.type === 'survive_seconds') {
            return (Date.now() - (run.quest?.startedAt || 0)) >= q.amount * 1000;
        }
        return false;
    }

    _recruitOrConsole(def, player) {
        const run = ensureSurvivorRunState();
        const cs = window.companionSystem;
        if (!cs || !cs.recruitSurvivor) {
            run.recruited[def.id] = true;
            return;
        }
        const result = cs.recruitSurvivor(def.id);
        if (result.ok) {
            run.recruited[def.id] = true;
            if (run.quest?.survivorId === def.id) run.quest = null;
            // Remove world NPC
            const script = gameState.campaignScript;
            script.activeNpcs = (script.activeNpcs || []).filter(n => n.survivorId !== def.id);
            triggerWaveNotification(
                `SURVIVOR JOINED — ${def.name.toUpperCase()}`,
                160,
                null,
                'campaign'
            );
            this._checkFireteamAchievement();
        } else if (result.reason === 'party_full') {
            run.questDone[def.id] = true;
            this._showSurvivorBubble(this._pickLine(def.lines, 'refuse_full'), 3500, def.id);
            triggerWaveNotification(
                `PARTY FULL — +${result.consolation || 0} SCRAP`,
                140,
                'Come back when you have a slot.',
                'campaign'
            );
        } else {
            this._showSurvivorBubble(result.reason || 'Not yet', 2500, def.id);
        }
    }

    _checkFireteamAchievement() {
        const run = ensureSurvivorRunState();
        const recruited = Object.keys(run.recruited || {}).filter(k => run.recruited[k]).length;
        if (recruited >= 3) {
            const ach = achievementSystem.getAchievement('campaign_fireteam');
            if (ach && !ach.unlocked) {
                achievementSystem.unlockAchievement(ach);
                gameState.achievementNotifications.push({ achievement: ach, life: 300, maxLife: 300 });
            }
        }
    }

    _updateSurvivorQuests(player, now) {
        const script = gameState.campaignScript;
        script.nearbyNpcId = null;
        const npc = this._getNearbyNpc(player);
        if (npc) script.nearbyNpcId = npc.survivorId;

        // Expire bubble
        if (script.survivorBubble && now > script.survivorBubble.until) {
            script.survivorBubble = null;
        }

        // Track kill-quest progress independently of zone resets
        if (run.quest && run.quest.type === 'kill_count' && !run.questDone[run.quest.survivorId]) {
            const kills = gameState.zombiesKilled || 0;
            const last = script._lastQuestKillCount || 0;
            if (kills > last) {
                run.quest.progress = (run.quest.progress || 0) + (kills - last);
                script._lastQuestKillCount = kills;
            }
        }

        // Auto-toast when quest completes while away
        const run = ensureSurvivorRunState();
        if (run.quest && !run.questDone[run.quest.survivorId]) {
            const def = getSurvivorById(run.quest.survivorId);
            if (def && this._isSurvivorQuestComplete(def, run, player)) {
                // Soft ping once
                if (!script._questReadyPing) {
                    script._questReadyPing = true;
                    triggerWaveNotification(
                        `QUEST READY — TALK TO ${def.name.toUpperCase()}`,
                        150,
                        null,
                        'campaign'
                    );
                }
            }
        } else {
            script._questReadyPing = false;
        }
    }

    clearInteractHold() {
        if (!gameState.campaignScript) return;
        gameState.campaignScript.interactHoldId = null;
        gameState.campaignScript.interactHoldStart = 0;
    }

    _updateInteractables(player, now) {
        const script = gameState.campaignScript;
        if (!script.interactHoldId) return;

        const t = (this.activeMap.triggers || []).find(tr => tr.id === script.interactHoldId);
        if (!t || !this._pointInRect(player.x, player.y, t)) {
            script.interactHoldId = null;
            script.interactHoldStart = 0;
            return;
        }

        // Require E held — checked via keys on window or continuous tryInteract from loop
        const keys = window._zombobsKeys;
        const eHeld = keys && (keys.e || keys.E);
        if (!eHeld) {
            script.interactHoldStart = now;
            return;
        }

        // Damage interrupts hold ritual
        if (player.lastDamageTime && now - player.lastDamageTime < 500) {
            script.interactHoldStart = now;
            script.hackProgress = 0;
            return;
        }

        const holdMs = t.holdMs || 2500;
        const elapsed = now - script.interactHoldStart;
        script.hackProgress = Math.min(1, elapsed / holdMs);

        if (elapsed < holdMs) return;

        // Complete
        this.triggeredIds.add(t.id);
        script.interactHoldId = null;
        script.interactHoldStart = 0;
        script.hackProgress = 0;

        if (t.type === 'power') {
            script.powerCompleted++;
            gameState.campaignObjective =
                `Power the gate — ${script.powerCompleted}/${script.powerRequired}`;
            triggerWaveNotification(
                `COUPLER ONLINE ${script.powerCompleted}/${script.powerRequired}`,
                120,
                null,
                'campaign'
            );
            playCampaignStinger('default');
            if (script.powerCompleted === 2 && script.powerRequired >= 3 && !script.powerSurgeFired) {
                script.powerSurgeFired = true;
                this._spawnCouplerRush();
                triggerWaveNotification(
                    'POWER SURGE — RUSH INCOMING',
                    140,
                    RADIO_BEATS.power_surge,
                    'campaign'
                );
            }
            if (script.powerCompleted >= script.powerRequired) {
                script.gateOnline = true;
                gameState.campaignObjective = 'Gate ONLINE — reach the east exit!';
                const extract = (this.activeMap.triggers || []).find(tr => tr.type === 'extraction');
                if (extract?.target) {
                    gameState.campaignObjectiveTarget = extract.target;
                }
                triggerWaveNotification(
                    'GATE ONLINE — EAST!',
                    180,
                    RADIO_BEATS.gate_online,
                    'campaign'
                );
                playCampaignStinger('default');
            }
        } else if (t.type === 'hack') {
            script.hackComplete = true;
            gameState.campaignObjective = 'HOLD THE SIGNAL';
            this._startDefend(t, now);
        }
    }

    _startDefend(hackTrigger, now) {
        const script = gameState.campaignScript;
        const defend = (this.activeMap.triggers || []).find(t => t.type === 'defend');
        const duration = defend?.durationMs || 50000;
        script.defendActive = true;
        script.defendDurationMs = duration;
        script.defendEndsAt = now + duration;
        this._defendSpawnAcc = 0;

        triggerWaveNotification(
            'SIGNAL BOOT — HOLD 50s',
            150,
            RADIO_BEATS.defend_start,
            'campaign'
        );
        playCampaignStinger('warden');
        gameState.campaignObjectiveTarget = hackTrigger.target || {
            x: this.activeMap.spawn.x,
            y: this.activeMap.spawn.y
        };
    }

    _updateDefend(player, now, dt) {
        const script = gameState.campaignScript;
        if (!script.defendActive || script.wardenSpawned) return;

        const remaining = Math.max(0, script.defendEndsAt - now);
        const elapsed = script.defendDurationMs - remaining;
        const pct = Math.floor((elapsed / script.defendDurationMs) * 100);
        gameState.campaignObjective = `HOLD THE SIGNAL — ${pct}%`;

        if (pct >= 50 && !script._defendMidFired) {
            script._defendMidFired = true;
            triggerWaveNotification(
                'SIGNAL AT 50% — STAY ON TERMINAL',
                120,
                'Almost there — do not break contact.',
                'campaign'
            );
        }

        // Spawn pressure
        this._defendSpawnAcc += dt;
        const interval = elapsed < 15000 ? 2800 : elapsed < 30000 ? 2000 : 1400;
        if (this._defendSpawnAcc >= interval) {
            this._defendSpawnAcc = 0;
            this._spawnDefendPack(elapsed);
        }

        if (remaining <= 0) {
            script.defendActive = false;
            this._spawnWarden();
        }
    }

    _spawnCouplerRush() {
        const player = gameState.players[0];
        if (!player) return;
        const packs = [{ Cls: FastZombie, n: 4 }, { Cls: NormalZombie, n: 2 }];
        for (let p = 0; p < packs.length; p++) {
            const { Cls, n } = packs[p];
            for (let i = 0; i < n; i++) {
                try {
                    const z = new Cls(1, 1);
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 220 + Math.random() * 140;
                    const resolved = this.resolvePosition(
                        player.x + Math.cos(angle) * dist,
                        player.y + Math.sin(angle) * dist,
                        15
                    );
                    z.x = resolved.x;
                    z.y = resolved.y;
                    gameState.zombies.push(z);
                } catch (_) { /* ignore */ }
            }
        }
    }

    _spawnDefendPack(elapsed) {
        const player = gameState.players[0];
        if (!player) return;
        const packs = elapsed < 15000
            ? [{ Cls: NormalZombie, n: 2 }]
            : elapsed < 30000
                ? [{ Cls: FastZombie, n: 2 }, { Cls: CrawlerZombie, n: 1 }]
                : [{ Cls: ArmoredZombie, n: 1 }, { Cls: FastZombie, n: 2 }];

        for (let p = 0; p < packs.length; p++) {
            const { Cls, n } = packs[p];
            for (let i = 0; i < n; i++) {
                try {
                    const z = new Cls(1, 1);
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 350 + Math.random() * 200;
                    let zx = player.x + Math.cos(angle) * dist;
                    let zy = player.y + Math.sin(angle) * dist;
                    const resolved = this.resolvePosition(zx, zy, 15);
                    z.x = resolved.x;
                    z.y = resolved.y;
                    gameState.zombies.push(z);
                } catch (_) { /* ignore */ }
            }
        }
    }

    _spawnWarden() {
        const script = gameState.campaignScript;
        if (script.wardenSpawned) return;
        script.wardenSpawned = true;

        const cx = this.activeMap.width * 0.5;
        const cy = this.activeMap.height * 0.5 - 120;
        const resolved = this.resolvePosition(cx, cy, 42);
        const warden = new WardenBoss(resolved.x, resolved.y);
        gameState.boss = warden;
        gameState.bossActive = true;
        gameState.zombies.push(warden);

        gameState.campaignObjective = 'DESTROY THE WARDEN';
        triggerWaveNotification(
            'THE WARDEN — YOU ARE NOISE',
            200,
            RADIO_BEATS.warden_spawn,
            'campaign'
        );
        playCampaignStinger('warden');
    }

    _updateWardenDeath() {
        const script = gameState.campaignScript;
        if (!script.wardenSpawned || script.wardenDead || script.actClear) return;

        const alive = gameState.zombies.some(z => z.type === 'warden' || z === gameState.boss);
        if (alive) return;
        if (!gameState.bossActive && script.wardenSpawned) {
            // Boss cleared via collision system
            script.wardenDead = true;
            script.actClear = true;
            gameState.campaignActClear = true;
            gameState.campaignZoneCleared = true;
            gameState.campaignZoneClearTime = Date.now();
            gameState.campaignObjective = 'SIGNAL ONLINE — ACT 1 CLEAR';
            triggerWaveNotification(
                'ACT 1 CLEAR — ECHOES OF SILENCE',
                240,
                RADIO_BEATS.act_clear,
                'campaign'
            );
            playCampaignStinger('victory');
            const wardenAch = achievementSystem.getAchievement('campaign_warden_slayer');
            if (wardenAch && !wardenAch.unlocked) {
                achievementSystem.unlockAchievement(wardenAch);
                gameState.achievementNotifications.push({ achievement: wardenAch, life: 300, maxLife: 300 });
            }
            // Signal sunrise flash
            gameState.isNight = false;
            gameState.gameTime = 0.2;
        }
    }

    updateTriggers() {
        if (!this.activeMap?.triggers?.length) return;

        const player = gameState.players[0];
        if (!player || player.health <= 0) return;
        const script = gameState.campaignScript;

        for (let i = 0; i < this.activeMap.triggers.length; i++) {
            const trigger = this.activeMap.triggers[i];
            if (this.triggeredIds.has(trigger.id)) continue;

            // Power / hack handled via hold interact — skip auto-fire
            if (trigger.type === 'power' || trigger.type === 'hack' || trigger.type === 'defend') {
                continue;
            }

            if (!this._pointInRect(player.x, player.y, trigger)) continue;

            if (trigger.requiresWave && gameState.wave < trigger.requiresWave) continue;
            if (trigger.requiresKills && gameState.zombiesKilled < trigger.requiresKills) continue;

            // Extraction gated by power when required
            if (trigger.type === 'extraction') {
                if (script.powerRequired > 0 && !script.gateOnline) continue;
                if (this.activeMap.id === 'crash_site' && !script.debrisCleared) continue;

                // Ante: first touch spawns extract tax — must thin the pack before clear
                if (!script.extractTaxFired) {
                    script.extractTaxFired = true;
                    this._spawnExtractTax();
                    triggerWaveNotification(
                        'EXTRACT TAX — CLEAR THEM THEN EXIT!',
                        140,
                        null,
                        'campaign'
                    );
                    continue;
                }
                if (gameState.zombies.length > 2) continue;
            }

            this.triggeredIds.add(trigger.id);

            if (trigger.message) {
                gameState.campaignObjective = trigger.message;
            }

            if (trigger.target) {
                gameState.campaignObjectiveTarget = trigger.target;
            }

            if (trigger.type === 'objective' && !gameState.waveNotification.active) {
                triggerWaveNotification(
                    trigger.message || this.activeMap.objective,
                    180,
                    null,
                    'campaign'
                );
            }

            if (trigger.type === 'extraction') {
                gameState.campaignZoneCleared = true;
                gameState.campaignZoneClearTime = Date.now();
                this._beginZoneTransition();
                triggerWaveNotification(
                    `ZONE ${this.activeMap.zone} CLEAR — EXTRACTION SECURED`,
                    180,
                    null,
                    'campaign'
                );
            }
        }
    }

    /** Panic pack when first touching extract — raises ante. */
    _spawnExtractTax() {
        const player = gameState.players[0];
        if (!player) return;
        const packs = [
            { Cls: FastZombie, n: 3 },
            { Cls: NormalZombie, n: 2 }
        ];
        if ((gameState.campaignZone || 1) >= 3) {
            packs.push({ Cls: ArmoredZombie, n: 1 });
        }
        for (let p = 0; p < packs.length; p++) {
            const { Cls, n } = packs[p];
            for (let i = 0; i < n; i++) {
                try {
                    const z = new Cls(1, 1);
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 180 + Math.random() * 120;
                    const resolved = this.resolvePosition(
                        player.x + Math.cos(angle) * dist,
                        player.y + Math.sin(angle) * dist,
                        15
                    );
                    z.x = resolved.x;
                    z.y = resolved.y;
                    gameState.zombies.push(z);
                } catch (_) { /* ignore */ }
            }
        }
    }

    /** Ambient darkening during lights-out (0–1 extra darkness). */
    getLightsOutAlpha() {
        const until = gameState.campaignScript?.lightsOutUntil || 0;
        if (Date.now() >= until) return 0;
        return 0.72;
    }

    getInteractPrompt(player) {
        if (!this.activeMap || !player) return null;

        const npc = this._getNearbyNpc(player);
        if (npc) {
            const run = ensureSurvivorRunState();
            const def = npc.def;
            if (run.recruited[def.id]) return null;
            if (!run.met[def.id]) return { label: `E — Talk to ${def.name}`, trigger: null };
            if (!run.questDone[def.id]) {
                if (this._isSurvivorQuestComplete(def, run, player)) {
                    return { label: `E — Recruit ${def.name}`, trigger: null };
                }
                return {
                    label: `E — ${def.name} (${this._questProgressText(def, run, player)})`,
                    trigger: null
                };
            }
            return { label: `E — Recruit ${def.name}`, trigger: null };
        }

        const triggers = this.activeMap.triggers || [];
        for (let i = 0; i < triggers.length; i++) {
            const t = triggers[i];
            if (t.type !== 'power' && t.type !== 'hack') continue;
            if (this.triggeredIds.has(t.id)) continue;
            if (t.requiresWave && gameState.wave < t.requiresWave) continue;
            if (!this._pointInRect(player.x, player.y, t)) continue;
            const label = t.type === 'hack' ? 'Hold E — Reboot Relay' : 'Hold E — Power Coupler';
            return { label, trigger: t };
        }
        return null;
    }

    _pointInRect(px, py, rect) {
        return px >= rect.x &&
            px <= rect.x + rect.w &&
            py >= rect.y &&
            py <= rect.y + rect.h;
    }

    render(viewport) {
        if (!this.activeMap) return;

        const margin = RENDERING.CULL_MARGIN;
        const walls = this.activeMap.walls;
        for (let i = 0; i < walls.length; i++) {
            const wall = walls[i];
            if (!this._rectInViewport(wall, viewport, margin)) continue;
            this._drawWall(wall);
        }

        const decals = this.activeMap.decals || [];
        for (let i = 0; i < decals.length; i++) {
            const decal = decals[i];
            if (!this._rectInViewport(decal, viewport, margin)) continue;
            this._drawDecal(decal);
        }

        this._drawHazards(viewport, margin);
        this._drawInteractables(viewport, margin);
        this._drawSurvivors(viewport, margin);
        this._drawFogOverlay();
        this._drawPowerUI();
        this._drawHackProgress();
        this._drawDefendBar();
        this._drawLightsOutOverlay();

        if (gameState.campaignObjectiveTarget) {
            this._drawObjectiveBeacon(gameState.campaignObjectiveTarget, viewport, margin);
        }
    }

    _drawSurvivors(viewport, margin) {
        const npcs = gameState.campaignScript?.activeNpcs || [];
        const bubble = gameState.campaignScript?.survivorBubble;
        const run = ensureSurvivorRunState();

        for (let i = 0; i < npcs.length; i++) {
            const n = npcs[i];
            if (n.x < viewport.left - margin || n.x > viewport.right + margin ||
                n.y < viewport.top - margin || n.y > viewport.bottom + margin) {
                continue;
            }

            const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
            const questReady = run.met[n.survivorId] && !run.questDone[n.survivorId] &&
                this._isSurvivorQuestComplete(n.def, run, gameState.players[0] || { scrap: 0 });

            drawSurvivorNPC(n, { questReady, pulse });

            ctx.save();
            // Name + quest marker
            ctx.fillStyle = '#ffd54f';
            ctx.font = 'bold 10px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(n.def.name, n.x, n.y - NPC_RADIUS - 14);
            ctx.fillStyle = questReady ? '#00ff7f' : '#ffffff';
            ctx.font = 'bold 12px "Roboto Mono", monospace';
            ctx.fillText(questReady ? '!' : '?', n.x, n.y - NPC_RADIUS - 26);
            ctx.restore();
        }

        if (bubble && bubble.text) {
            const npcId = gameState.campaignScript?.survivorBubbleNpcId;
            let bx = 0;
            let by = 0;
            let anchorX = 0;
            if (npcId) {
                const anchor = npcs.find(n => n.survivorId === npcId);
                if (anchor) {
                    anchorX = anchor.x;
                    bx = anchor.x;
                    by = anchor.y - NPC_RADIUS - 44;
                }
            }
            if (!anchorX) {
                const player = gameState.players[0];
                if (!player) return;
                anchorX = player.x;
                bx = player.x;
                by = player.y - 70;
            }
            ctx.save();
            ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
            ctx.strokeStyle = 'rgba(255, 181, 0, 0.5)';
            ctx.lineWidth = 1;
            const tw = Math.min(280, bubble.text.length * 7 + 24);
            const rectX = bx - tw / 2;
            ctx.fillRect(rectX, by, tw, 28);
            ctx.strokeRect(rectX, by, tw, 28);
            ctx.fillStyle = '#ffe082';
            ctx.font = '11px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(bubble.text, bx, by + 18);
            ctx.restore();
        }
    }

    _drawFogOverlay() {
        const fog = gameState.campaignFogAlpha ?? this.activeMap?.ambiance?.fogAlpha ?? 0;
        if (fog <= 0 || !this.bounds) return;
        ctx.fillStyle = `rgba(12, 16, 22, ${fog})`;
        ctx.fillRect(0, 0, this.activeMap.width, this.activeMap.height);
    }

    _drawHazards(viewport, margin) {
        const hazards = this.activeMap.hazards || [];
        const now = Date.now();
        for (let i = 0; i < hazards.length; i++) {
            const h = hazards[i];
            if (!this._rectInViewport(h, viewport, margin)) continue;
            if (h.kind !== 'steam') continue;

            const period = h.periodMs || 3000;
            const activeMs = h.activeMs || 1000;
            const phase = (now + (h.phaseOffset || 0)) % period;
            const active = phase < activeMs;
            const cx = h.x + h.w * 0.5;
            const cy = h.y + h.h * 0.5;

            ctx.save();
            if (active) {
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(h.w, h.h) * 0.6);
                g.addColorStop(0, 'rgba(230, 240, 255, 0.55)');
                g.addColorStop(0.5, 'rgba(180, 200, 220, 0.25)');
                g.addColorStop(1, 'rgba(150, 170, 190, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(cx, cy, h.w * 0.55, h.h * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Telegraph
                ctx.strokeStyle = 'rgba(200, 220, 255, 0.35)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(h.x, h.y, h.w, h.h);
                ctx.setLineDash([]);
            }
            ctx.restore();
        }
    }

    _drawInteractables(viewport, margin) {
        const triggers = this.activeMap.triggers || [];
        for (let i = 0; i < triggers.length; i++) {
            const t = triggers[i];
            if (t.type !== 'power' && t.type !== 'hack') continue;
            if (!this._rectInViewport(t, viewport, margin)) continue;
            const done = this.triggeredIds.has(t.id);
            const cx = t.x + t.w * 0.5;
            const cy = t.y + t.h * 0.5;
            const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 250);

            ctx.save();
            ctx.globalAlpha = done ? 0.35 : 0.5 + 0.3 * pulse;
            ctx.strokeStyle = t.type === 'hack' ? '#00e5ff' : (done ? '#4caf50' : '#ffb300');
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x + 4, t.y + 4, t.w - 8, t.h - 8);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = 'bold 10px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(done ? 'ONLINE' : (t.type === 'hack' ? 'TERMINAL' : 'COUPLER'), cx, cy);
            ctx.restore();
        }
    }

    _drawPowerUI() {
        const script = gameState.campaignScript;
        if (!script || script.powerRequired <= 0) return;
        if (typeof window === 'undefined') return;
        // Drawn in world? Skip — objective banner handles it. Optional world pips near gate.
    }

    _drawHackProgress() {
        const script = gameState.campaignScript;
        if (!script?.interactHoldId || script.hackProgress <= 0) return;
        const player = gameState.players[0];
        if (!player) return;

        const w = 60;
        const h = 6;
        const x = player.x - w / 2;
        const y = player.y - player.radius - 28;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(x, y, w * script.hackProgress, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.strokeRect(x, y, w, h);
    }

    _drawDefendBar() {
        const script = gameState.campaignScript;
        if (!script?.defendActive) return;
        const remaining = Math.max(0, script.defendEndsAt - Date.now());
        const pct = 1 - remaining / script.defendDurationMs;
        const player = gameState.players[0];
        if (!player) return;

        const w = 80;
        const h = 8;
        const x = player.x - w / 2;
        const y = player.y - player.radius - 38;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#00ff7f';
        ctx.fillRect(x, y, w * pct, h);
        ctx.fillStyle = '#00ff7f';
        ctx.font = 'bold 9px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL', player.x, y - 4);
    }

    _drawLightsOutOverlay() {
        let alpha = this.getLightsOutAlpha();
        if (alpha <= 0 || !this.bounds) return;
        // Flicker pulse during lights-out
        if (gameState.campaignScript?.lightsOutUntil > Date.now()) {
            const flicker = 0.85 + 0.15 * Math.sin(Date.now() / 80);
            alpha *= flicker;
        }
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, this.activeMap.width, this.activeMap.height);
    }

    _rectInViewport(rect, viewport, margin) {
        return rect.x + rect.w >= viewport.left - margin &&
            rect.x <= viewport.right + margin &&
            rect.y + rect.h >= viewport.top - margin &&
            rect.y <= viewport.bottom + margin;
    }

    _drawWall(wall) {
        const palette = WALL_COLORS[wall.kind] || WALL_COLORS.debris;
        const shake = wall._cleared ? Math.sin(Date.now() / 40) * 2 : 0;

        ctx.fillStyle = palette.fill;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 2;
        ctx.globalAlpha = wall._cleared ? 0.35 : 1;
        ctx.fillRect(wall.x + shake, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x + shake, wall.y, wall.w, wall.h);

        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = wall._cleared ? 0.1 : 0.25;
        ctx.fillRect(wall.x + 4, wall.y + 4, Math.max(0, wall.w - 8), Math.min(3, wall.h - 4));
        ctx.globalAlpha = 1;
    }

    _drawDecal(decal) {
        const cx = decal.x + decal.w * 0.5;
        const cy = decal.y + decal.h * 0.5;

        ctx.save();

        if (decal.kind === 'fire') {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(decal.w, decal.h));
            gradient.addColorStop(0, 'rgba(255, 120, 40, 0.9)');
            gradient.addColorStop(0.4, 'rgba(255, 60, 20, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 30, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(cx, cy, decal.w * 0.5, decal.h * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (decal.kind === 'smoke') {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(decal.w, decal.h));
            gradient.addColorStop(0, 'rgba(80, 80, 90, 0.35)');
            gradient.addColorStop(0.5, 'rgba(40, 40, 48, 0.2)');
            gradient.addColorStop(1, 'rgba(20, 20, 24, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(decal.x, decal.y, decal.w, decal.h);
        } else if (decal.kind === 'crater') {
            ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, decal.w * 0.5, decal.h * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 107, 53, 0.15)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (decal.kind === 'floodlight') {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(decal.w, decal.h));
            g.addColorStop(0, 'rgba(255, 250, 200, 0.45)');
            g.addColorStop(0.5, 'rgba(255, 240, 150, 0.15)');
            g.addColorStop(1, 'rgba(255, 220, 100, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(cx, cy, decal.w * 0.7, decal.h * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (decal.kind === 'relay') {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(decal.x, decal.y, decal.w, decal.h);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
            ctx.fillRect(decal.x, decal.y, decal.w, decal.h);
            ctx.fillStyle = '#00e5ff';
            ctx.font = 'bold 9px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('RELAY', cx, cy);
        }

        ctx.restore();
    }

    _drawObjectiveBeacon(target, viewport, margin) {
        const x = target.x;
        const y = target.y;
        if (x < viewport.left - margin || x > viewport.right + margin ||
            y < viewport.top - margin || y > viewport.bottom + margin) {
            return;
        }

        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 200);
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.3 * pulse;
        ctx.strokeStyle = '#00ff7f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 18 + 6 * pulse, 12 + 4 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 127, 0.25)';
        ctx.fill();

        ctx.fillStyle = '#00ff7f';
        ctx.font = 'bold 10px "Roboto Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EXIT', x, y);
        ctx.restore();
    }

    getEdgeSpawnPosition(localPlayer) {
        if (!this.activeMap || !localPlayer) return null;

        const margin = 80;
        const side = Math.floor(Math.random() * 4);
        const inset = margin + 20;

        switch (side) {
            case 0:
                return {
                    x: inset + Math.random() * (this.activeMap.width - inset * 2),
                    y: inset
                };
            case 1:
                return {
                    x: this.activeMap.width - inset,
                    y: inset + Math.random() * (this.activeMap.height - inset * 2)
                };
            case 2:
                return {
                    x: inset + Math.random() * (this.activeMap.width - inset * 2),
                    y: this.activeMap.height - inset
                };
            default:
                return {
                    x: inset,
                    y: inset + Math.random() * (this.activeMap.height - inset * 2)
                };
        }
    }
}

export const mapLoader = new MapLoader();
