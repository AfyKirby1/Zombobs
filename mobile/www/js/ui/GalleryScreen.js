import { gameState } from '../core/gameState.js';

const GALLERY_TABS = [
    { id: 'zombies', label: 'ZOMBIES', accent: '#66bb6a' },
    { id: 'weapons', label: 'WEAPONS', accent: '#ff9800' },
    { id: 'pickups', label: 'PICKUPS', accent: '#42a5f5' }
];

const ZOMBIE_ENTRIES = [
    { type: 'normal', name: 'Normal Zombie', health: 'Base', speed: 'Base', desc: 'Standard zombie enemy', spawn: 'Always', threat: 'COMMON' },
    { type: 'fast', name: 'Fast Zombie', health: '60%', speed: '1.6x', desc: 'The Runner — faster but weaker', spawn: 'Wave 3+', threat: 'COMMON' },
    { type: 'exploding', name: 'Exploding Zombie', health: '80%', speed: '0.9x', desc: 'The Boomer — explodes on death', spawn: 'Wave 5+', threat: 'UNCOMMON' },
    { type: 'armored', name: 'Armored Zombie', health: '2x', speed: '0.8x', desc: 'The Tank — heavily armored', spawn: 'Wave 4+', threat: 'UNCOMMON' },
    { type: 'ghost', name: 'Ghost Zombie', health: '80%', speed: '1.3x', desc: 'Semi-transparent spectral enemy', spawn: 'Wave 4+', threat: 'UNCOMMON' },
    { type: 'spitter', name: 'Spitter Zombie', health: '80%', speed: '1.2x', desc: 'Ranged acid projectile attacks', spawn: 'Wave 6+', threat: 'RARE' },
    { type: 'siren', name: 'Siren Zombie', health: '90%', speed: '0.85x', desc: 'Screams to buff horde and disrupt aim', spawn: 'Wave 8+', threat: 'RARE' },
    { type: 'splitter', name: 'Splitter Zombie', health: '125%', speed: '0.85x', desc: 'Cracks into 2 fast shards on death', spawn: 'Wave 6+', threat: 'RARE' },
    { type: 'boss', name: 'Boss Zombie', health: 'Massive', speed: '1.2x', desc: 'Epic boss with devastating attacks', spawn: 'Every 5 waves', threat: 'BOSS' },
    { type: 'warden', name: 'The Warden', health: 'Colossal', speed: 'Phase-scaled', desc: 'Act 1 finale — slam, scream, adds, blackout', spawn: 'Control Tower', threat: 'BOSS' }
];

const WEAPON_ENTRIES = [
    { key: 'pistol', name: 'Pistol', damage: '1', fireRate: '400ms', ammo: '10', desc: 'Balanced starting weapon', tier: 'STARTER' },
    { key: 'shotgun', name: 'Shotgun', damage: '3', fireRate: '800ms', ammo: '5', desc: 'High damage, close range', tier: 'HEAVY' },
    { key: 'rifle', name: 'Rifle', damage: '2', fireRate: '200ms', ammo: '30', desc: 'Fast firing, high capacity', tier: 'ASSAULT' },
    { key: 'flamethrower', name: 'Flamethrower', damage: '0.5/tick', fireRate: '50ms', ammo: '100', desc: 'Short range DoT weapon', tier: 'SPECIAL' },
    { key: 'smg', name: 'SMG', damage: '0.8', fireRate: '80ms', ammo: '40', desc: 'Rapid fire submachine gun', tier: 'ASSAULT' },
    { key: 'sniper', name: 'Sniper', damage: '15', fireRate: '1500ms', ammo: '5', desc: 'High damage, piercing shots', tier: 'PRECISION' },
    { key: 'rocketLauncher', name: 'RPG', damage: '60 AOE', fireRate: '2000ms', ammo: '3', desc: 'Explosive area damage', tier: 'HEAVY' },
    { key: 'laser', name: 'Laser', damage: 'Beam', fireRate: 'Continuous', ammo: 'Energy', desc: 'High-tech continuous beam weapon', tier: 'SPECIAL' }
];

const PICKUP_ENTRIES = [
    { type: 'health', name: 'Health Pickup', effect: '+25 HP', desc: 'Restores health', rarity: 'COMMON' },
    { type: 'ammo', name: 'Ammo Pickup', effect: '+15 Ammo', desc: 'Refills ammo and grenades', rarity: 'COMMON' },
    { type: 'damage', name: 'Damage Buff', effect: '2x Damage (10s)', desc: 'Double damage for 10 seconds', rarity: 'UNCOMMON' },
    { type: 'nuke', name: 'Tactical Nuke', effect: 'Instant Kill All', desc: 'Rare — clears all zombies', rarity: 'LEGENDARY' },
    { type: 'speed', name: 'Speed Boost', effect: '1.5x Speed (8s)', desc: 'Increased movement speed', rarity: 'UNCOMMON' },
    { type: 'rapidfire', name: 'Rapid Fire', effect: '2x Fire Rate (10s)', desc: 'Faster weapon firing', rarity: 'UNCOMMON' },
    { type: 'shield', name: 'Shield', effect: '+50 Shield', desc: 'Absorbs damage before health', rarity: 'RARE' },
    { type: 'adrenaline', name: 'Adrenaline', effect: 'Multiple Buffs', desc: 'Combined power-up effects', rarity: 'RARE' },
    { type: 'frost', name: 'Frost Nova', effect: 'Freeze All (6s)', desc: 'Rare — stops zombies cold, slows bosses', rarity: 'LEGENDARY' }
];

const THREAT_COLORS = {
    COMMON: '#9e9e9e',
    UNCOMMON: '#66bb6a',
    RARE: '#42a5f5',
    BOSS: '#ff1744',
    STARTER: '#9e9e9e',
    ASSAULT: '#ff9800',
    HEAVY: '#ff5252',
    PRECISION: '#ab47bc',
    SPECIAL: '#00e5ff',
    LEGENDARY: '#ffd700'
};

export class GalleryScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
        this.hoveredTab = null;
        this.hoveredCard = null;
        this.activeTab = 'zombies';
        this.galleryScrollY = 0;
        this.galleryTargetScrollY = 0;
        this._tabHitboxes = [];
        this._cardHitboxes = [];
        this._backHitbox = null;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    _getEntries() {
        if (this.activeTab === 'weapons') return { items: WEAPON_ENTRIES, itemType: 'weapon', accent: '#ff9800', title: 'ARSENAL' };
        if (this.activeTab === 'pickups') return { items: PICKUP_ENTRIES, itemType: 'pickup', accent: '#42a5f5', title: 'FIELD SUPPLIES' };
        return { items: ZOMBIE_ENTRIES, itemType: 'zombie', accent: '#66bb6a', title: 'THREAT BESTIARY' };
    }

    draw() {
        this.hud.drawCreepyBackground();

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const canvas = this.canvas;
        const ctx = this.ctx;
        const time = Date.now();

        if (!this.galleryScrollY) this.galleryScrollY = 0;
        if (!this.galleryTargetScrollY) this.galleryTargetScrollY = 0;

        // Soft top glow
        const topGlow = ctx.createRadialGradient(centerX, 0, 0, centerX, 0, canvas.height * 0.45);
        topGlow.addColorStop(0, 'rgba(255, 23, 68, 0.12)');
        topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);

        // Eyebrow
        const eyebrowSize = Math.max(9, 11 * scale);
        ctx.font = `bold ${eyebrowSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 82, 82, 0.85)';
        ctx.fillText('FIELD INTEL ARCHIVE', centerX, 28 * scale);

        // Title
        const galleryTitleFontSize = Math.max(36, 52 * scale);
        ctx.font = `bold ${galleryTitleFontSize}px "Creepster", cursive`;
        ctx.fillStyle = '#ff1744';
        ctx.shadowBlur = 28 * scale;
        ctx.shadowColor = 'rgba(255, 23, 68, 0.85)';
        ctx.fillText('GALLERY', centerX, 72 * scale);
        ctx.shadowBlur = 0;

        // Subtitle
        const subtitleFontSize = Math.max(11, 14 * scale);
        ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText('Know the horde. Master the arsenal. Claim every drop.', centerX, 96 * scale);

        // Tabs
        this._tabHitboxes = [];
        const tabY = 118 * scale;
        const tabH = 36 * scale;
        const tabGap = 10 * scale;
        const tabW = 140 * scale;
        const tabsTotalW = GALLERY_TABS.length * tabW + (GALLERY_TABS.length - 1) * tabGap;
        let tabX = centerX - tabsTotalW / 2;

        for (let i = 0; i < GALLERY_TABS.length; i++) {
            const tab = GALLERY_TABS[i];
            const active = this.activeTab === tab.id;
            const hovered = this.hoveredTab === tab.id;

            this._tabHitboxes.push({ id: tab.id, x: tabX, y: tabY, w: tabW, h: tabH });

            // Tab background
            const bg = ctx.createLinearGradient(tabX, tabY, tabX, tabY + tabH);
            if (active) {
                bg.addColorStop(0, 'rgba(255, 23, 68, 0.35)');
                bg.addColorStop(1, 'rgba(255, 23, 68, 0.12)');
            } else if (hovered) {
                bg.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                bg.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
            } else {
                bg.addColorStop(0, 'rgba(10, 12, 16, 0.75)');
                bg.addColorStop(1, 'rgba(10, 12, 16, 0.55)');
            }
            ctx.fillStyle = bg;
            this._roundRect(ctx, tabX, tabY, tabW, tabH, 8 * scale);
            ctx.fill();

            ctx.strokeStyle = active ? tab.accent : (hovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)');
            ctx.lineWidth = active ? 2 : 1;
            this._roundRect(ctx, tabX, tabY, tabW, tabH, 8 * scale);
            ctx.stroke();

            if (active) {
                ctx.shadowBlur = 12 * scale;
                ctx.shadowColor = tab.accent;
                ctx.strokeStyle = tab.accent;
                this._roundRect(ctx, tabX, tabY, tabW, tabH, 8 * scale);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Underline accent
                ctx.fillStyle = tab.accent;
                ctx.fillRect(tabX + 16 * scale, tabY + tabH - 3 * scale, tabW - 32 * scale, 2.5 * scale);
            }

            const tabFont = Math.max(11, 13 * scale);
            ctx.font = `bold ${tabFont}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = active ? '#ffffff' : (hovered ? '#eeeeee' : '#9e9e9e');
            ctx.fillText(tab.label, tabX + tabW / 2, tabY + tabH / 2);
            ctx.textBaseline = 'alphabetic';

            tabX += tabW + tabGap;
        }

        // Content area
        const contentStartY = tabY + tabH + 18 * scale;
        const contentHeight = canvas.height - contentStartY - (110 * scale);
        const padding = 24 * scale;

        this.galleryScrollY += (this.galleryTargetScrollY - this.galleryScrollY) * 0.2;

        const section = this._getEntries();
        const cardSpacing = 16 * scale;
        const cols = canvas.width > 1100 * scale ? 3 : 2;
        const cardWidth = (canvas.width - padding * 2 - cardSpacing * (cols - 1)) / cols;
        const cardHeight = 132 * scale;

        // Section header strip
        const headerH = 36 * scale;
        this.hud.drawGlassCard(padding, contentStartY, canvas.width - padding * 2, headerH, false);
        ctx.fillStyle = section.accent;
        ctx.fillRect(padding, contentStartY, 4 * scale, headerH);

        const headerFont = Math.max(12, 14 * scale);
        ctx.font = `bold ${headerFont}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(section.title, padding + 16 * scale, contentStartY + headerH * 0.62);

        ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillStyle = section.accent;
        ctx.fillText(`${section.items.length} ENTRIES`, canvas.width - padding - 14 * scale, contentStartY + headerH * 0.62);

        // Clip cards
        const gridStartY = contentStartY + headerH + 12 * scale;
        const gridHeight = contentHeight - headerH - 12 * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(padding - 4, gridStartY, canvas.width - padding * 2 + 8, gridHeight);
        ctx.clip();

        this._cardHitboxes = [];
        let currentY = gridStartY - this.galleryScrollY;

        for (let i = 0; i < section.items.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const cardX = padding + col * (cardWidth + cardSpacing);
            const cardY = currentY + row * (cardHeight + cardSpacing);
            const cardId = `${this.activeTab}_${i}`;
            const hovered = this.hoveredCard === cardId;

            this._cardHitboxes.push({ id: cardId, x: cardX, y: cardY, w: cardWidth, h: cardHeight });
            this._drawGalleryCard(cardX, cardY, cardWidth, cardHeight, scale, section.items[i], section.itemType, section.accent, hovered, time);
        }

        const rows = Math.ceil(section.items.length / cols);
        const totalContentHeight = rows * (cardHeight + cardSpacing);
        const maxScroll = Math.max(0, totalContentHeight - gridHeight);

        if (this.galleryTargetScrollY < 0) this.galleryTargetScrollY = 0;
        if (this.galleryTargetScrollY > maxScroll) this.galleryTargetScrollY = maxScroll;
        if (this.galleryScrollY < 0) this.galleryScrollY = 0;
        if (this.galleryScrollY > maxScroll) this.galleryScrollY = maxScroll;

        ctx.restore();

        // Scrollbar
        if (maxScroll > 0) {
            const scrollBarWidth = 5 * scale;
            const scrollBarX = canvas.width - padding + 6 * scale;
            const thumbHeight = Math.max(24 * scale, (gridHeight / totalContentHeight) * gridHeight);
            const thumbY = gridStartY + (this.galleryScrollY / maxScroll) * (gridHeight - thumbHeight);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            this._roundRect(ctx, scrollBarX, gridStartY, scrollBarWidth, gridHeight, 3 * scale);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 23, 68, 0.7)';
            this._roundRect(ctx, scrollBarX, thumbY, scrollBarWidth, thumbHeight, 3 * scale);
            ctx.fill();
        }

        // Fade edges on scroll
        if (this.galleryScrollY > 4) {
            const fade = ctx.createLinearGradient(0, gridStartY, 0, gridStartY + 28 * scale);
            fade.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
            fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = fade;
            ctx.fillRect(padding, gridStartY, canvas.width - padding * 2, 28 * scale);
        }
        if (this.galleryScrollY < maxScroll - 4) {
            const fade = ctx.createLinearGradient(0, gridStartY + gridHeight - 28 * scale, 0, gridStartY + gridHeight);
            fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
            fade.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
            ctx.fillStyle = fade;
            ctx.fillRect(padding, gridStartY + gridHeight - 28 * scale, canvas.width - padding * 2, 28 * scale);
        }

        // Back button
        const buttonWidth = 240 * scale;
        const buttonHeight = 50 * scale;
        const backY = canvas.height - (100 * scale);
        this._backHitbox = {
            x: centerX - buttonWidth / 2,
            y: backY - buttonHeight / 2,
            w: buttonWidth,
            h: buttonHeight
        };
        this.hud.drawMenuButton('Back', this._backHitbox.x, this._backHitbox.y, buttonWidth, buttonHeight, this.hoveredButton === 'gallery_back', false);
    }

    _drawGalleryCard(x, y, w, h, scale, item, itemType, accent, hovered, time) {
        const ctx = this.ctx;

        // Card body
        const bg = ctx.createLinearGradient(x, y, x, y + h);
        bg.addColorStop(0, hovered ? 'rgba(22, 26, 34, 0.95)' : 'rgba(12, 14, 20, 0.9)');
        bg.addColorStop(1, hovered ? 'rgba(14, 16, 22, 0.92)' : 'rgba(8, 10, 14, 0.85)');
        ctx.fillStyle = bg;
        this._roundRect(ctx, x, y, w, h, 12 * scale);
        ctx.fill();

        // Border
        ctx.strokeStyle = hovered ? accent : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = hovered ? 1.5 : 1;
        this._roundRect(ctx, x, y, w, h, 12 * scale);
        ctx.stroke();

        if (hovered) {
            ctx.shadowBlur = 18 * scale;
            ctx.shadowColor = accent;
            ctx.strokeStyle = accent;
            this._roundRect(ctx, x, y, w, h, 12 * scale);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Left accent bar
        ctx.fillStyle = accent;
        ctx.fillRect(x, y + 10 * scale, 3.5 * scale, h - 20 * scale);

        // Icon well
        const iconSize = 56 * scale;
        const iconX = x + 42 * scale;
        const iconY = y + h / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Soft icon glow
        const glow = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 0.85);
        glow.addColorStop(0, this._hexToRgba(accent, 0.22));
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize * 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (itemType === 'zombie') {
            this.drawZombieIcon(iconX, iconY, iconSize, item.type);
        } else if (itemType === 'weapon') {
            this.drawWeaponIcon(iconX, iconY, iconSize, item.key);
        } else {
            this.drawPickupIcon(iconX, iconY, iconSize, item.type);
        }

        // Text column
        const textX = x + 82 * scale;
        const textW = w - 96 * scale;
        let textY = y + 16 * scale;

        // Tag
        const tag = item.threat || item.tier || item.rarity || '';
        const tagColor = THREAT_COLORS[tag] || accent;
        if (tag) {
            const tagFont = Math.max(8, 9 * scale);
            ctx.font = `bold ${tagFont}px "Roboto Mono", monospace`;
            const tagW = ctx.measureText(tag).width + 12 * scale;
            const tagH = 16 * scale;
            ctx.fillStyle = this._hexToRgba(tagColor, 0.18);
            this._roundRect(ctx, textX, textY, tagW, tagH, 4 * scale);
            ctx.fill();
            ctx.strokeStyle = this._hexToRgba(tagColor, 0.55);
            ctx.lineWidth = 1;
            this._roundRect(ctx, textX, textY, tagW, tagH, 4 * scale);
            ctx.stroke();
            ctx.fillStyle = tagColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(tag, textX + 6 * scale, textY + tagH / 2);
            ctx.textBaseline = 'alphabetic';
            textY += tagH + 8 * scale;
        }

        // Name
        const nameSize = Math.max(13, 15 * scale);
        ctx.font = `bold ${nameSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, textX, textY + nameSize * 0.85, textW);
        textY += nameSize + 8 * scale;

        // Stats
        const statSize = Math.max(10, 11 * scale);
        ctx.font = `${statSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = accent;

        if (itemType === 'zombie') {
            ctx.fillText(`HP ${item.health}  ·  SPD ${item.speed}`, textX, textY, textW);
            textY += 16 * scale;
            ctx.fillStyle = '#9e9e9e';
            ctx.fillText(`Spawn: ${item.spawn}`, textX, textY, textW);
            textY += 16 * scale;
        } else if (itemType === 'weapon') {
            ctx.fillText(`DMG ${item.damage}  ·  RATE ${item.fireRate}`, textX, textY, textW);
            textY += 16 * scale;
            ctx.fillStyle = '#9e9e9e';
            ctx.fillText(`Ammo: ${item.ammo}`, textX, textY, textW);
            textY += 16 * scale;
        } else {
            ctx.fillText(item.effect, textX, textY, textW);
            textY += 16 * scale;
        }

        // Description
        const descSize = Math.max(9, 10.5 * scale);
        ctx.font = `${descSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#bdbdbd';
        this._drawWrappedText(item.desc, textX, textY, textW, descSize * 1.35, 2);
    }

    _drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines) {
        const ctx = this.ctx;
        const words = String(text || '').split(' ');
        let line = '';
        let lineCount = 0;
        let cy = y;

        for (let i = 0; i < words.length; i++) {
            const test = line ? `${line} ${words[i]}` : words[i];
            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, x, cy, maxWidth);
                line = words[i];
                cy += lineHeight;
                lineCount++;
                if (lineCount >= maxLines) return;
            } else {
                line = test;
            }
        }
        if (line && lineCount < maxLines) {
            ctx.fillText(line, x, cy, maxWidth);
        }
    }

    _roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    _hexToRgba(hex, alpha) {
        const h = String(hex || '#ffffff').replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n = parseInt(full, 16);
        if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    drawZombieIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.4;

        switch (type) {
            case 'normal': {
                const normalGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                normalGradient.addColorStop(0, '#9acd32');
                normalGradient.addColorStop(1, '#33691e');
                ctx.fillStyle = normalGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + Math.sin(time / 167) * 0.3})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'fast': {
                const fastGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                fastGradient.addColorStop(0, '#ff8c42');
                fastGradient.addColorStop(1, '#8b4513');
                ctx.fillStyle = fastGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(255, 0, 0, ${0.8 + Math.sin(time / 100) * 0.2})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'exploding': {
                const pulse = 0.8 + Math.sin(time / 150) * 0.2;
                const explodeGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                explodeGradient.addColorStop(0, `rgba(255, ${165 + pulse * 50}, 0, 1)`);
                explodeGradient.addColorStop(1, '#ff6600');
                ctx.fillStyle = explodeGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'armored': {
                const armorGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                armorGradient.addColorStop(0, '#616161');
                armorGradient.addColorStop(1, '#212121');
                ctx.fillStyle = armorGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#9e9e9e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -radius * 0.3, radius * 0.3, 0, Math.PI);
                ctx.stroke();
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'ghost': {
                ctx.globalAlpha = 0.5;
                const ghostGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                ghostGradient.addColorStop(0, '#b3e5fc');
                ghostGradient.addColorStop(1, '#0277bd');
                ctx.fillStyle = ghostGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#81d4fa';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'spitter': {
                const spitterGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                spitterGradient.addColorStop(0, '#66bb6a');
                spitterGradient.addColorStop(1, '#1b5e20');
                ctx.fillStyle = spitterGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'siren': {
                const sirenGradient = ctx.createRadialGradient(-3, -4, 0, 0, 0, radius);
                sirenGradient.addColorStop(0, '#4dd0e1');
                sirenGradient.addColorStop(1, '#004d57');
                ctx.fillStyle = sirenGradient;
                ctx.beginPath();
                ctx.ellipse(0, 2, radius * 0.85, radius * 1.1, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(0, 229, 255, ${0.6 + Math.sin(time / 120) * 0.3})`;
                ctx.beginPath();
                ctx.ellipse(0, radius * 0.35, radius * 0.35, radius * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(-radius * 0.35, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
                ctx.arc(radius * 0.35, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'splitter': {
                const splitGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius * 1.1);
                splitGradient.addColorStop(0, '#c5e1a5');
                splitGradient.addColorStop(1, '#33691e');
                ctx.fillStyle = splitGradient;
                ctx.beginPath();
                ctx.ellipse(0, 3, radius * 1.05, radius * 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 171, 64, ${0.7 + Math.sin(time / 150) * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-radius * 0.5, -radius * 0.2);
                ctx.lineTo(0, radius * 0.5);
                ctx.lineTo(radius * 0.4, radius * 0.8);
                ctx.stroke();
                break;
            }
            case 'boss': {
                const bossGradient = ctx.createRadialGradient(-4, -4, 0, 0, 0, radius * 1.3);
                bossGradient.addColorStop(0, '#d32f2f');
                bossGradient.addColorStop(1, '#b71c1c');
                ctx.fillStyle = bossGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff0000';
                ctx.fillStyle = '#ff5252';
                ctx.beginPath();
                ctx.arc(-radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.arc(radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
            }
            case 'warden': {
                const pulse = 0.85 + Math.sin(time / 180) * 0.15;
                const wardenGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.6 * pulse);
                wardenGlow.addColorStop(0, 'rgba(156, 39, 176, 0.45)');
                wardenGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = wardenGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.6 * pulse, 0, Math.PI * 2);
                ctx.fill();

                const wardenGrad = ctx.createRadialGradient(-4, -5, 0, 0, 0, radius * 1.35);
                wardenGrad.addColorStop(0, '#7e57c2');
                wardenGrad.addColorStop(0.5, '#4a148c');
                wardenGrad.addColorStop(1, '#1a0033');
                ctx.fillStyle = wardenGrad;
                ctx.beginPath();
                ctx.ellipse(0, 2, radius * 1.15, radius * 1.35, 0, 0, Math.PI * 2);
                ctx.fill();

                // Crown / crest
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-radius * 0.55, -radius * 0.7);
                ctx.lineTo(-radius * 0.25, -radius * 1.15);
                ctx.lineTo(0, -radius * 0.75);
                ctx.lineTo(radius * 0.25, -radius * 1.15);
                ctx.lineTo(radius * 0.55, -radius * 0.7);
                ctx.closePath();
                ctx.fill();

                ctx.shadowBlur = 10;
                ctx.shadowColor = '#e040fb';
                ctx.fillStyle = `rgba(224, 64, 251, ${0.75 + Math.sin(time / 120) * 0.25})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.15, radius * 0.22, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.15, radius * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
            }
        }
        ctx.restore();
    }

    drawWeaponIcon(x, y, size, weaponKey) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        const width = size * 0.6;
        const height = size * 0.3;

        switch (weaponKey) {
            case 'pistol':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width / 2 + width * 0.7, -height / 2, width * 0.3, height);
                break;
            case 'shotgun':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.2, height * 1.2);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width / 2 + width * 0.8, -height / 2, width * 0.4, height * 1.2);
                break;
            case 'rifle':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.5, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width / 2 + width * 1.2, -height / 2, width * 0.3, height);
                break;
            case 'flamethrower': {
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.2, height * 1.3);
                const flameGradient = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, width * 0.4);
                flameGradient.addColorStop(0, '#ffeb3b');
                flameGradient.addColorStop(0.5, '#ff9800');
                flameGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(width / 2, 0, width * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'smg':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.1, height * 0.9);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width / 2 + width * 0.9, -height / 2, width * 0.2, height * 0.9);
                break;
            case 'sniper':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.8, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width / 2 + width * 0.3, -height / 2 - height * 0.3, width * 0.4, height * 0.6);
                break;
            case 'rocketLauncher':
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width / 2, -height / 2, width * 1.3, height * 1.5);
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.moveTo(width / 2, -height / 2);
                ctx.lineTo(width / 2 + width * 0.3, 0);
                ctx.lineTo(width / 2, height / 2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'laser': {
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-width / 2, -height / 2, width * 1.2, height * 0.9);
                const beam = ctx.createLinearGradient(width / 2, 0, width / 2 + width * 0.7, 0);
                beam.addColorStop(0, '#ff0055');
                beam.addColorStop(0.5, '#ff80ab');
                beam.addColorStop(1, 'rgba(255, 0, 85, 0)');
                ctx.strokeStyle = beam;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2 + width * 0.7, 0);
                ctx.stroke();
                ctx.fillStyle = '#ff0055';
                ctx.beginPath();
                ctx.arc(width / 2, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }

    drawPickupIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.35;
        const pulse = 0.8 + Math.sin(time / 500) * 0.15;

        switch (type) {
            case 'health': {
                const healthGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                healthGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                healthGlow.addColorStop(1, 'rgba(255, 0, 80, 0)');
                ctx.fillStyle = healthGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const healthGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                healthGradient.addColorStop(0, '#ff8a80');
                healthGradient.addColorStop(1, '#d50000');
                ctx.fillStyle = healthGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-radius / 2, 0);
                ctx.lineTo(radius / 2, 0);
                ctx.moveTo(0, -radius / 2);
                ctx.lineTo(0, radius / 2);
                ctx.stroke();
                break;
            }
            case 'ammo': {
                const ammoGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                ammoGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                ammoGlow.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = ammoGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const ammoGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                ammoGradient.addColorStop(0, '#ffd54f');
                ammoGradient.addColorStop(1, '#ff9800');
                ctx.fillStyle = ammoGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-radius / 3, -radius / 2, radius * 0.4, radius);
                break;
            }
            case 'damage': {
                const damageGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                damageGlow.addColorStop(0, 'rgba(224, 64, 251, 0.9)');
                damageGlow.addColorStop(1, 'rgba(123, 31, 162, 0)');
                ctx.fillStyle = damageGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const damageGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                damageGradient.addColorStop(0, '#e1bee7');
                damageGradient.addColorStop(1, '#7b1fa2');
                ctx.fillStyle = damageGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2x', 0, 0);
                break;
            }
            case 'nuke': {
                const nukeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5 * pulse);
                nukeGlow.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
                nukeGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.fillStyle = nukeGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.5 * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 2;
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'speed': {
                const speedGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                speedGlow.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
                speedGlow.addColorStop(1, 'rgba(0, 172, 193, 0)');
                ctx.fillStyle = speedGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const speedGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                speedGradient.addColorStop(0, '#80deea');
                speedGradient.addColorStop(1, '#00acc1');
                ctx.fillStyle = speedGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('»', 0, 0);
                break;
            }
            case 'rapidfire': {
                const rapidGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                rapidGlow.addColorStop(0, 'rgba(255, 152, 0, 0.9)');
                rapidGlow.addColorStop(1, 'rgba(245, 124, 0, 0)');
                ctx.fillStyle = rapidGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const rapidGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                rapidGradient.addColorStop(0, '#ffcc80');
                rapidGradient.addColorStop(1, '#f57c00');
                ctx.fillStyle = rapidGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', 0, 0);
                break;
            }
            case 'shield': {
                const shieldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                shieldGlow.addColorStop(0, 'rgba(129, 212, 250, 0.9)');
                shieldGlow.addColorStop(1, 'rgba(2, 136, 209, 0)');
                ctx.fillStyle = shieldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const shieldGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                shieldGradient.addColorStop(0, '#b3e5fc');
                shieldGradient.addColorStop(1, '#0288d1');
                ctx.fillStyle = shieldGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2 / 6) - Math.PI / 2;
                    const px = Math.cos(angle) * radius * 0.7;
                    const py = Math.sin(angle) * radius * 0.7;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'adrenaline': {
                const adrenGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                adrenGlow.addColorStop(0, 'rgba(200, 230, 201, 0.9)');
                adrenGlow.addColorStop(1, 'rgba(76, 175, 80, 0)');
                ctx.fillStyle = adrenGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const adrenGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                adrenGradient.addColorStop(0, '#c8e6c9');
                adrenGradient.addColorStop(1, '#4caf50');
                ctx.fillStyle = adrenGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-radius / 2, 0);
                ctx.lineTo(radius / 2, 0);
                ctx.moveTo(0, -radius / 2);
                ctx.lineTo(0, radius / 2);
                ctx.stroke();
                break;
            }
            case 'frost': {
                const frostGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.4 * pulse);
                frostGlow.addColorStop(0, 'rgba(224, 247, 250, 1.0)');
                frostGlow.addColorStop(1, 'rgba(3, 169, 244, 0)');
                ctx.fillStyle = frostGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.4 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const frostGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                frostGradient.addColorStop(0, '#e0f7fa');
                frostGradient.addColorStop(1, '#0277bd');
                ctx.fillStyle = frostGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * radius * 0.2, Math.sin(angle) * radius * 0.2);
                    ctx.lineTo(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7);
                    ctx.stroke();
                }
                break;
            }
        }
        ctx.restore();
    }

    checkButtonClick(x, y) {
        // Tabs
        for (let i = 0; i < this._tabHitboxes.length; i++) {
            const t = this._tabHitboxes[i];
            if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
                return `gallery_tab_${t.id}`;
            }
        }

        // Back
        if (this._backHitbox) {
            const b = this._backHitbox;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                return 'gallery_back';
            }
        }

        // Legacy fallback
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const mainMenuButtonWidth = 240 * scale;
        const mainMenuButtonHeight = 50 * scale;
        const backY = this.canvas.height - 100;
        if (x >= centerX - mainMenuButtonWidth / 2 && x <= centerX + mainMenuButtonWidth / 2 &&
            y >= backY - mainMenuButtonHeight / 2 && y <= backY + mainMenuButtonHeight / 2) {
            return 'gallery_back';
        }
        return null;
    }

    handleTabClick(tabId) {
        if (this.activeTab === tabId) return;
        this.activeTab = tabId;
        this.galleryScrollY = 0;
        this.galleryTargetScrollY = 0;
        this.hoveredCard = null;
    }

    updateHover(x, y) {
        this.hoveredButton = null;
        this.hoveredTab = null;
        this.hoveredCard = null;

        for (let i = 0; i < this._tabHitboxes.length; i++) {
            const t = this._tabHitboxes[i];
            if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
                this.hoveredTab = t.id;
                return `gallery_tab_${t.id}`;
            }
        }

        for (let i = 0; i < this._cardHitboxes.length; i++) {
            const c = this._cardHitboxes[i];
            if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                this.hoveredCard = c.id;
                return c.id;
            }
        }

        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }

    handleScroll(deltaY) {
        this.galleryTargetScrollY += deltaY * 0.5;
    }
}
