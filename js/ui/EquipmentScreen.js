// [TRACE: CAMPAIGN_DESIGN.md] Equipment + Hero hire screen (E key).

import { gameState } from '../core/gameState.js';
import {
    EQUIPMENT_SLOTS,
    formatBonus,
    getRarityColor,
    getActiveSetBonuses
} from '../core/equipmentDefinitions.js';
import { equipmentSystem } from '../systems/EquipmentSystem.js';
import { HERO_DEFINITIONS, HERO_ROLES } from '../core/heroDefinitions.js';

export class EquipmentScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.tab = 'gear';
        this.hoveredSlot = null;
        this.hoveredItemIndex = -1; // absolute inventory index
        this.hoveredClose = false;
        this.hoveredTab = null;
        this.hoveredHeroId = null;
        this.slotRects = [];
        this.inventoryRects = [];
        this.heroRects = [];
        this.tabRects = [];
        this.closeRect = null;
        this.inventoryScroll = 0;
        this.visibleInventoryRows = 10;
    }

    getUIScale() {
        return this.hud ? this.hud.getUIScale() : 1.0;
    }

    draw() {
        if (!gameState.showEquipment) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const scale = this.getUIScale();

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, 0, w, h);

        const panelW = 820 * scale;
        const panelH = 560 * scale;
        const panelX = (w - panelW) / 2;
        const panelY = 60 * scale;

        ctx.fillStyle = 'rgba(16, 18, 22, 0.94)';
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 12 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff6b35';
        ctx.font = `bold ${Math.max(18, 26 * scale)}px "Creepster", cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.tab === 'heroes' ? 'HEROES' : 'EQUIPMENT', w / 2, panelY + 12 * scale);

        this._drawTabs(panelX, panelY, panelW, scale);

        const player = gameState.players[0];
        if (!player) {
            ctx.restore();
            return;
        }

        if (this.tab === 'gear') {
            this._drawSlots(player, panelX + 24 * scale, panelY + 78 * scale, scale);
            this._drawInventory(player, panelX + 300 * scale, panelY + 78 * scale, scale);
            this._drawSetBonuses(player, panelX + 24 * scale, panelY + panelH - 120 * scale, scale);
        } else {
            this._drawHeroes(player, panelX + 24 * scale, panelY + 78 * scale, panelW - 48 * scale, scale);
        }

        this._drawCloseButton(
            panelX + panelW / 2 - 60 * scale,
            panelY + panelH - 48 * scale,
            120 * scale,
            34 * scale,
            scale
        );

        ctx.restore();
    }

    _drawTabs(panelX, panelY, panelW, scale) {
        const ctx = this.ctx;
        const tabs = [
            { id: 'gear', label: 'GEAR' },
            { id: 'heroes', label: 'HEROES' }
        ];
        this.tabRects = [];
        const tw = 110 * scale;
        const th = 28 * scale;
        const startX = panelX + panelW / 2 - (tw * 2 + 12 * scale) / 2;
        const ty = panelY + 42 * scale;

        for (let i = 0; i < tabs.length; i++) {
            const t = tabs[i];
            const tx = startX + i * (tw + 12 * scale);
            const active = this.tab === t.id;
            const hovered = this.hoveredTab === t.id;
            ctx.fillStyle = active
                ? 'rgba(255, 107, 53, 0.35)'
                : hovered
                    ? 'rgba(60, 60, 68, 0.9)'
                    : 'rgba(38, 40, 46, 0.85)';
            ctx.strokeStyle = active ? '#ff6b35' : 'rgba(120,120,120,0.4)';
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            ctx.roundRect(tx, ty, tw, th, 6 * scale);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, 12 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.label, tx + tw / 2, ty + th / 2);
            this.tabRects.push({ id: t.id, x: tx, y: ty, w: tw, h: th });
        }
    }

    _drawSlots(player, x, y, scale) {
        const ctx = this.ctx;
        const boxW = 250 * scale;
        const boxH = 48 * scale;
        const gap = 6 * scale;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `bold ${Math.max(11, 13 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('EQUIPPED', x, y - 18 * scale);

        this.slotRects = [];
        for (let i = 0; i < EQUIPMENT_SLOTS.length; i++) {
            const slot = EQUIPMENT_SLOTS[i];
            const by = y + i * (boxH + gap);
            const item = player.equippedItems ? player.equippedItems[slot] : null;
            const hovered = this.hoveredSlot === slot;

            ctx.fillStyle = hovered ? 'rgba(60, 60, 68, 0.9)' : 'rgba(38, 40, 46, 0.85)';
            ctx.strokeStyle = item ? getRarityColor(item.rarity) : 'rgba(120, 120, 120, 0.4)';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.roundRect(x, by, boxW, boxH, 6 * scale);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(slot.toUpperCase(), x + 8 * scale, by + 4 * scale);

            if (item) {
                ctx.fillStyle = getRarityColor(item.rarity);
                ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.fillText(`${item.icon} ${item.name}`, x + 8 * scale, by + 18 * scale);
                ctx.fillStyle = 'rgba(180, 180, 180, 0.85)';
                ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                const bonusText = Object.entries(item.bonuses)
                    .map(([type, value]) => formatBonus(type, value)).join(', ');
                ctx.fillText(bonusText, x + 8 * scale, by + 32 * scale);
            } else {
                ctx.fillStyle = 'rgba(120, 120, 120, 0.7)';
                ctx.font = `${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.fillText('Empty', x + 8 * scale, by + 22 * scale);
            }

            this.slotRects.push({ slot, x, y: by, w: boxW, h: boxH });
        }
    }

    _drawInventory(player, x, y, scale) {
        const ctx = this.ctx;
        const boxW = 470 * scale;
        const boxH = 36 * scale;
        const gap = 5 * scale;
        const rows = this.visibleInventoryRows;
        const maxSlots = equipmentSystem.maxInventorySize;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `bold ${Math.max(11, 13 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const inventory = player.inventory || [];
        const invCount = inventory.length;
        const maxScroll = Math.max(0, maxSlots - rows);
        this.inventoryScroll = Math.max(0, Math.min(this.inventoryScroll, maxScroll));
        const start = this.inventoryScroll;
        const end = Math.min(maxSlots, start + rows);

        ctx.fillText(`INVENTORY (${invCount}/${maxSlots})  ${start + 1}–${end}`, x, y - 18 * scale);

        this.inventoryRects = [];
        for (let row = 0; row < rows; row++) {
            const absIndex = start + row;
            const by = y + row * (boxH + gap);
            const item = inventory[absIndex];
            const hovered = this.hoveredItemIndex === absIndex;

            ctx.fillStyle = hovered ? 'rgba(60, 60, 68, 0.9)' : 'rgba(38, 40, 46, 0.85)';
            ctx.strokeStyle = item ? getRarityColor(item.rarity) : 'rgba(120, 120, 120, 0.3)';
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            ctx.roundRect(x, by, boxW, boxH, 5 * scale);
            ctx.fill();
            ctx.stroke();

            if (item) {
                ctx.fillStyle = getRarityColor(item.rarity);
                ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${item.icon} ${item.name}`, x + 8 * scale, by + boxH / 2);
                ctx.fillStyle = 'rgba(180, 180, 180, 0.85)';
                ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                ctx.textAlign = 'right';
                const scrapVal = equipmentSystem.getScrapValue(item);
                const bonusText = Object.entries(item.bonuses)
                    .map(([type, value]) => formatBonus(type, value)).join(', ');
                const rightLabel = hovered
                    ? `${bonusText}  ·  scrap ${scrapVal}`
                    : bonusText;
                ctx.fillText(rightLabel, x + boxW - 8 * scale, by + boxH / 2);
            } else {
                ctx.fillStyle = 'rgba(120, 120, 120, 0.45)';
                ctx.font = `${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('—', x + boxW / 2, by + boxH / 2);
            }

            this.inventoryRects.push({ index: absIndex, x, y: by, w: boxW, h: boxH });
        }

        // Hint + scroll indicator
        const hintY = y + rows * (boxH + gap) + 4 * scale;
        ctx.fillStyle = 'rgba(180, 180, 180, 0.7)';
        ctx.font = `${Math.max(8, 10 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Shift+click scrap · scroll for more', x, hintY);

        if (maxScroll > 0) {
            const trackH = rows * (boxH + gap) - gap;
            const trackX = x + boxW + 6 * scale;
            const thumbH = Math.max(20 * scale, trackH * (rows / maxSlots));
            const thumbY = y + (trackH - thumbH) * (this.inventoryScroll / maxScroll);
            ctx.fillStyle = 'rgba(80, 80, 90, 0.6)';
            ctx.fillRect(trackX, y, 4 * scale, trackH);
            ctx.fillStyle = 'rgba(255, 107, 53, 0.75)';
            ctx.fillRect(trackX, thumbY, 4 * scale, thumbH);
        }
    }

    handleWheel(deltaY) {
        if (!gameState.showEquipment || this.tab !== 'gear') return false;
        const maxSlots = equipmentSystem.maxInventorySize;
        const maxScroll = Math.max(0, maxSlots - this.visibleInventoryRows);
        if (maxScroll <= 0) return false;
        const dir = Math.sign(deltaY) || 1;
        this.inventoryScroll = Math.max(0, Math.min(maxScroll, this.inventoryScroll + dir));
        return true;
    }

    _drawSetBonuses(player, x, y, scale) {
        const ctx = this.ctx;
        const sets = player.activeEquipmentSets || getActiveSetBonuses(player.equippedItems || {});
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = `bold ${Math.max(10, 12 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('SET BONUSES', x, y);
        if (!sets.length) {
            ctx.fillStyle = 'rgba(140,140,140,0.7)';
            ctx.font = `${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
            ctx.fillText('Equip 2+ matching set pieces', x, y + 18 * scale);
            return;
        }
        for (let i = 0; i < sets.length; i++) {
            const s = sets[i];
            ctx.fillStyle = s.color;
            ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
            const bonusText = Object.entries(s.bonuses)
                .map(([type, value]) => formatBonus(type, value)).join(', ');
            ctx.fillText(`${s.name} (${s.pieces}) — ${bonusText}`, x, y + 18 * scale + i * 16 * scale);
        }
    }

    _drawHeroes(player, x, y, width, scale) {
        const ctx = this.ctx;
        const companionSystem = window.companionSystem;
        if (!companionSystem) return;

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = `bold ${Math.max(11, 13 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`SCRAP: ${player.scrap || 0}  ·  Party ${gameState.players.length}/4`, x, y - 18 * scale);

        const hired = [...companionSystem.getHiredHeroIds()];
        this.heroRects = [];

        const cardH = 72 * scale;
        const gap = 8 * scale;
        let row = 0;

        for (let i = 0; i < HERO_DEFINITIONS.length; i++) {
            const def = HERO_DEFINITIONS[i];
            const by = y + row * (cardH + gap);
            if (by > y + 380 * scale) break;
            row++;

            const isHired = hired.includes(def.id);
            const locked = (gameState.wave || 1) < def.unlockWave;
            const canAfford = (player.scrap || 0) >= def.cost;
            const hovered = this.hoveredHeroId === def.id;
            const role = HERO_ROLES[def.role] || { label: def.role, color: '#aaa', icon: '?' };

            ctx.fillStyle = hovered && !isHired && !locked
                ? 'rgba(60, 60, 68, 0.95)'
                : 'rgba(38, 40, 46, 0.88)';
            ctx.strokeStyle = isHired ? '#4caf50' : locked ? 'rgba(80,80,80,0.5)' : role.color;
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.roundRect(x, by, width, cardH, 8 * scale);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = role.color;
            ctx.font = `bold ${Math.max(11, 14 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${role.icon} ${def.name}`, x + 12 * scale, by + 8 * scale);

            ctx.fillStyle = 'rgba(200,200,200,0.85)';
            ctx.font = `${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
            ctx.fillText(def.blurb, x + 12 * scale, by + 28 * scale);

            let status;
            if (isHired) status = 'IN PARTY';
            else if (locked) status = `WAVE ${def.unlockWave}+`;
            else if (!canAfford) status = `${def.cost} SCRAP`;
            else status = `HIRE [${def.cost}]`;

            ctx.fillStyle = isHired ? '#4caf50' : locked ? '#888' : canAfford ? '#ffd54f' : '#ff5252';
            ctx.font = `bold ${Math.max(10, 12 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(status, x + width - 14 * scale, by + 28 * scale);

            this.heroRects.push({
                id: def.id,
                x, y: by, w: width, h: cardH,
                disabled: isHired || locked
            });
        }
    }

    _drawCloseButton(x, y, w, h, scale) {
        const ctx = this.ctx;
        this.closeRect = { x, y, w, h };
        ctx.fillStyle = this.hoveredClose ? 'rgba(255, 107, 53, 0.25)' : 'rgba(60, 60, 68, 0.85)';
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.6)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6 * scale);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(11, 13 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CLOSE (E)', x + w / 2, y + h / 2);
    }

    updateHover(mouseX, mouseY) {
        this.hoveredSlot = null;
        this.hoveredItemIndex = -1;
        this.hoveredClose = false;
        this.hoveredTab = null;
        this.hoveredHeroId = null;
        if (!gameState.showEquipment) return;

        for (const t of this.tabRects || []) {
            if (mouseX >= t.x && mouseX <= t.x + t.w && mouseY >= t.y && mouseY <= t.y + t.h) {
                this.hoveredTab = t.id;
                return;
            }
        }

        if (this.closeRect) {
            const r = this.closeRect;
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                this.hoveredClose = true;
                return;
            }
        }

        if (this.tab === 'gear') {
            for (const r of this.slotRects || []) {
                if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                    this.hoveredSlot = r.slot;
                    return;
                }
            }
            for (const r of this.inventoryRects || []) {
                if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                    this.hoveredItemIndex = r.index;
                    return;
                }
            }
        } else {
            for (const r of this.heroRects || []) {
                if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                    this.hoveredHeroId = r.id;
                    return;
                }
            }
        }
    }

    checkClick(mouseX, mouseY, opts = {}) {
        if (!gameState.showEquipment) return false;
        this.updateHover(mouseX, mouseY);
        const player = gameState.players[0];
        if (!player) return false;
        const shiftKey = !!opts.shiftKey;

        if (this.hoveredTab) {
            this.tab = this.hoveredTab;
            return true;
        }
        if (this.hoveredClose) {
            gameState.showEquipment = false;
            return true;
        }

        if (this.tab === 'gear') {
            if (this.hoveredSlot) {
                equipmentSystem.unequipItem(player, this.hoveredSlot);
                return true;
            }
            if (this.hoveredItemIndex >= 0) {
                const item = player.inventory ? player.inventory[this.hoveredItemIndex] : null;
                if (item) {
                    if (shiftKey) {
                        equipmentSystem.scrapItem(player, this.hoveredItemIndex);
                    } else {
                        const ok = equipmentSystem.equipItem(player, item);
                        if (!ok && gameState.damageNumbers) {
                            // feedback via toast on player world pos — screen-only panel, use waveNotification lite
                            gameState.waveNotification = {
                                active: true,
                                text: 'INVENTORY FULL — SCRAP OR UNEQUIP',
                                life: 90,
                                maxLife: 90
                            };
                        }
                    }
                }
                return true;
            }
        } else if (this.hoveredHeroId && window.companionSystem) {
            const rect = (this.heroRects || []).find(r => r.id === this.hoveredHeroId);
            if (rect && !rect.disabled) {
                const result = window.companionSystem.hireHero(this.hoveredHeroId);
                if (!result.ok && result.reason) {
                    gameState.waveNotification = {
                        active: true,
                        text: result.reason.toUpperCase(),
                        life: 0,
                        maxLife: 120
                    };
                }
            }
            return true;
        }
        return false;
    }
}
