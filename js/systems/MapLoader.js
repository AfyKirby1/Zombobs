import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Prop } from '../entities/Prop.js';
import { isInViewport } from '../utils/gameUtils.js';
import { RENDERING } from '../core/constants.js';
import {
    resolveCircleAgainstWalls,
    clampCircleInBounds
} from '../utils/mapCollisionUtils.js';
import { crashSiteMap } from '../maps/crashSite.js';
import { maintenanceTunnelsMap } from '../maps/maintenanceTunnels.js';
import { switchingYardMap } from '../maps/switchingYard.js';

const MAP_REGISTRY = {
    crash_site: crashSiteMap,
    maintenance_tunnels: maintenanceTunnelsMap,
    switching_yard: switchingYardMap
};

const WALL_COLORS = {
    concrete: { fill: '#3a3f46', stroke: '#1c2026', accent: '#5a626d' },
    debris: { fill: '#2e2a26', stroke: '#14110f', accent: '#4a433c' },
    wreckage: { fill: '#1f1c1a', stroke: '#0a0908', accent: '#ff6b35' }
};

/**
 * MapLoader — static campaign zone geometry, collision, and rendering.
 */
export class MapLoader {
    constructor() {
        this.activeMap = null;
        this.bounds = null;
        this.triggeredIds = new Set();
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
        gameState.campaignMapId = map.id;
        gameState.campaignObjective = map.objective || '';
        gameState.campaignZone = map.zone || 1;
        gameState.campaignObjectiveTarget = null;
        gameState.campaignZoneCleared = false;
        gameState.campaignZoneClearTime = 0;
        return true;
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
    }

    /**
     * Resolve entity position against map walls and outer bounds.
     */
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

    updateTriggers() {
        if (!this.activeMap?.triggers?.length) return;

        const player = gameState.players[0];
        if (!player || player.health <= 0) return;

        for (let i = 0; i < this.activeMap.triggers.length; i++) {
            const trigger = this.activeMap.triggers[i];
            if (this.triggeredIds.has(trigger.id)) continue;

            if (!this._pointInRect(player.x, player.y, trigger)) continue;

            if (trigger.requiresWave && gameState.wave < trigger.requiresWave) continue;
            if (trigger.requiresKills && gameState.zombiesKilled < trigger.requiresKills) continue;

            this.triggeredIds.add(trigger.id);

            if (trigger.message) {
                gameState.campaignObjective = trigger.message;
            }

            if (trigger.target) {
                gameState.campaignObjectiveTarget = trigger.target;
            }

            if (trigger.type === 'objective' && !gameState.waveNotification.active) {
                gameState.waveNotification = {
                    active: true,
                    text: trigger.message || this.activeMap.objective,
                    life: 0,
                    maxLife: 180
                };
            }

            if (trigger.type === 'extraction') {
                gameState.campaignZoneCleared = true;
                gameState.campaignZoneClearTime = Date.now();
                gameState.waveNotification = {
                    active: true,
                    text: `ZONE ${this.activeMap.zone} CLEAR — EXTRACTION SECURED`,
                    life: 0,
                    maxLife: 180
                };
            }
        }
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

        if (gameState.campaignObjectiveTarget) {
            this._drawObjectiveBeacon(gameState.campaignObjectiveTarget, viewport, margin);
        }
    }

    _rectInViewport(rect, viewport, margin) {
        return rect.x + rect.w >= viewport.left - margin &&
            rect.x <= viewport.right + margin &&
            rect.y + rect.h >= viewport.top - margin &&
            rect.y <= viewport.bottom + margin;
    }

    _drawWall(wall) {
        const palette = WALL_COLORS[wall.kind] || WALL_COLORS.debris;

        ctx.fillStyle = palette.fill;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 2;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.25;
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

    /**
     * Campaign spawn position near map perimeter.
     */
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
