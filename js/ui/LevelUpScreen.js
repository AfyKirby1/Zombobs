import { gameState } from '../core/gameState.js';
import { isMobileDevice } from '../utils/gameUtils.js';
import { SKILL_RARITY, SKILL_TREES, MAX_SKILL_SLOTS, LEVEL_UP_CHOICE_COUNT } from '../systems/SkillSystem.js';

export class LevelUpScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredSkillIndex = null;
        this.hoveredReroll = false;
        this.animationStart = 0;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    /**
     * Get rarity-based glow color
     * @param {string} rarity - Skill rarity key
     * @returns {string} Glow color
     */
    getRarityGlow(rarity) {
        const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;
        return rarityInfo.color;
    }

    /**
     * Get rarity-based border gradient
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} rarity - Skill rarity key
     * @returns {CanvasGradient} Gradient
     */
    getRarityGradient(ctx, x, y, width, height, rarity) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;

        switch (rarity) {
            case 'LEGENDARY':
                gradient.addColorStop(0, '#ffd700');
                gradient.addColorStop(0.5, '#ffaa00');
                gradient.addColorStop(1, '#ffd700');
                break;
            case 'EPIC':
                gradient.addColorStop(0, '#be4bdb');
                gradient.addColorStop(0.5, '#9c36b5');
                gradient.addColorStop(1, '#be4bdb');
                break;
            case 'RARE':
                gradient.addColorStop(0, '#4dabf7');
                gradient.addColorStop(0.5, '#339af0');
                gradient.addColorStop(1, '#4dabf7');
                break;
            default:
                gradient.addColorStop(0, '#a0a0a0');
                gradient.addColorStop(0.5, '#808080');
                gradient.addColorStop(1, '#a0a0a0');
        }

        return gradient;
    }

    /** True when 4 cards won't fit in one row (phones / narrow viewports) */
    useGridLayout() {
        const scale = this.getUIScale();
        const choiceCount = Math.max(1, gameState.levelUpChoices?.length || LEVEL_UP_CHOICE_COUNT);
        if (choiceCount < 3) return false;
        const minRowWidth = choiceCount * 170 * scale + (choiceCount - 1) * 20 * scale;
        return this.canvas.width < minRowWidth + 40 * scale;
    }

    getCardLayout() {
        const canvas = this.canvas;
        const scale = this.getUIScale();
        const choiceCount = Math.max(1, gameState.levelUpChoices?.length || LEVEL_UP_CHOICE_COUNT);

        if (this.useGridLayout()) {
            const cols = choiceCount >= 4 ? 2 : choiceCount;
            const rows = Math.ceil(choiceCount / cols);
            const cardSpacingX = 14 * scale;
            const cardSpacingY = 12 * scale;
            const cardWidth = Math.min(
                200 * scale,
                (canvas.width - 48 * scale - cardSpacingX * (cols - 1)) / cols
            );
            const reservedTop = 185 * scale;
            const reservedBottom = 130 * scale;
            const availableHeight = canvas.height - reservedTop - reservedBottom;
            const cardHeight = Math.min(
                260 * scale,
                Math.max(180 * scale, (availableHeight - cardSpacingY * (rows - 1)) / rows)
            );
            const totalWidth = cols * cardWidth + (cols - 1) * cardSpacingX;
            const totalHeight = rows * cardHeight + (rows - 1) * cardSpacingY;
            const startX = (canvas.width - totalWidth) / 2;
            const cardY = reservedTop + Math.max(0, (availableHeight - totalHeight) / 2);
            return {
                useGrid: true,
                cols,
                rows,
                cardWidth,
                cardHeight,
                cardSpacingX,
                cardSpacingY,
                startX,
                cardY,
                choiceCount
            };
        }

        const cardWidth = Math.min(240 * scale, (canvas.width - 80 * scale - 25 * scale * (choiceCount - 1)) / choiceCount);
        const cardHeight = 360 * scale;
        const cardSpacing = 25 * scale;
        const totalWidth = (cardWidth * choiceCount) + (cardSpacing * (choiceCount - 1));
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 30 * scale;
        return { useGrid: false, cardWidth, cardHeight, cardSpacing, startX, cardY, choiceCount };
    }

    getCardRect(index) {
        const layout = this.getCardLayout();
        if (layout.useGrid) {
            const col = index % layout.cols;
            const row = Math.floor(index / layout.cols);
            return {
                x: layout.startX + col * (layout.cardWidth + layout.cardSpacingX),
                y: layout.cardY + row * (layout.cardHeight + layout.cardSpacingY),
                width: layout.cardWidth,
                height: layout.cardHeight
            };
        }
        return {
            x: layout.startX + index * (layout.cardWidth + layout.cardSpacing),
            y: layout.cardY,
            width: layout.cardWidth,
            height: layout.cardHeight
        };
    }

    draw() {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Track animation time
        if (this.animationStart === 0) {
            this.animationStart = Date.now();
        }
        const animTime = (Date.now() - this.animationStart) / 1000;

        // Darken background with animated vignette
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle radial glow in center
        const centerGlow = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.6
        );
        centerGlow.addColorStop(0, 'rgba(255, 193, 7, 0.08)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title with animated glow
        ctx.save();
        const scale = this.getUIScale();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pulsing glow effect
        const glowIntensity = 15 + Math.sin(animTime * 3) * 5;
        ctx.shadowBlur = glowIntensity * scale;
        ctx.shadowColor = '#ffc107';
        ctx.fillStyle = '#ffc107';
        const titleFontSize = Math.max(32, 48 * scale);
        ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('LEVEL UP!', canvas.width / 2, 80 * scale);
        ctx.shadowBlur = 0;

        // Level display with XP info
        ctx.fillStyle = '#ffffff';
        const levelFontSize = Math.max(16, 24 * scale);
        ctx.font = `${levelFontSize}px "Roboto Mono", monospace`;
        ctx.fillText(`Level ${gameState.level}`, canvas.width / 2, 120 * scale);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const subFontSize = Math.max(12, 16 * scale);
        ctx.font = `${subFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('Choose a skill to enhance your abilities', canvas.width / 2, 150 * scale);

        // Active skill slots indicator
        const slotsUsed = gameState.activeSkills.length;
        ctx.fillStyle = slotsUsed >= MAX_SKILL_SLOTS ? '#ff7043' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = `${Math.max(11, 14 * scale)}px "Roboto Mono", monospace`;
        ctx.fillText(`Skills: ${slotsUsed}/${MAX_SKILL_SLOTS}`, canvas.width / 2, 172 * scale);
        ctx.restore();

        // Draw skill cards with rarity styling
        const isCompact = this.useGridLayout();

        gameState.levelUpChoices.forEach((skill, index) => {
            const { x: cardX, y: cardY, width: cardWidth, height: cardHeight } = this.getCardRect(index);
            const isHovered = this.hoveredSkillIndex === index;
            const rarity = skill.rarity || 'COMMON';
            const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;
            const isCorrupted = !!skill.corrupted;

            // Card entrance animation (stagger)
            const cardDelay = index * 0.1;
            const cardProgress = Math.min(1, (animTime - cardDelay) * 3);
            if (cardProgress <= 0) return;

            ctx.save();
            ctx.globalAlpha = cardProgress;

            // Card glow for legendary/epic or corrupted
            if (isCorrupted) {
                ctx.shadowBlur = isHovered ? 30 : 18;
                ctx.shadowColor = '#ab47bc';
            } else if (rarity === 'LEGENDARY' || rarity === 'EPIC') {
                ctx.shadowBlur = isHovered ? 25 : 15;
                ctx.shadowColor = rarityInfo.color;
            }

            // Card background with rarity tint
            const bgGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
            if (isHovered) {
                bgGradient.addColorStop(0, `${rarityInfo.color}40`);
                bgGradient.addColorStop(1, `${rarityInfo.color}20`);
            } else {
                bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
                bgGradient.addColorStop(0.5, 'rgba(32, 32, 32, 0.95)');
                bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.95)');
            }
            ctx.fillStyle = bgGradient;

            // Rounded rectangle
            this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12 * scale);
            ctx.fill();

            // Card border with rarity color
            const borderGradient = this.getRarityGradient(ctx, cardX, cardY, cardWidth, cardHeight, rarity);
            ctx.strokeStyle = isCorrupted ? '#ab47bc' : (isHovered ? borderGradient : (rarity === 'COMMON' ? '#555555' : borderGradient));
            ctx.lineWidth = isCorrupted ? 3 * scale : (isHovered ? 4 : (rarity === 'LEGENDARY' ? 3 : 2));
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (isCorrupted) {
                ctx.fillStyle = '#ab47bc';
                ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.fillText('☠ CORRUPTED', cardX + cardWidth / 2, cardY + cardHeight - 22 * scale);
            }

            // Tree path badge (tree-exclusive skills)
            let badgeYOffset = 0;
            if (skill.tree && SKILL_TREES[skill.tree]) {
                const treeInfo = SKILL_TREES[skill.tree];
                const treeBadgeY = cardY + 14 * scale;
                ctx.fillStyle = treeInfo.color;
                ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${treeInfo.icon} ${treeInfo.name.toUpperCase()} · T${skill.tier}/5`,
                    cardX + cardWidth / 2,
                    treeBadgeY
                );
                badgeYOffset = 14 * scale;
            }

            // Rarity badge at top
            const badgeY = cardY + 20 * scale + badgeYOffset;
            ctx.fillStyle = rarityInfo.color;
            ctx.font = `bold ${Math.max(10, 12 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(rarityInfo.name.toUpperCase(), cardX + cardWidth / 2, badgeY);

            // Divider line
            ctx.strokeStyle = `${rarityInfo.color}60`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + 20 * scale, badgeY + 15 * scale);
            ctx.lineTo(cardX + cardWidth - 20 * scale, badgeY + 15 * scale);
            ctx.stroke();

            // Icon with glow for rare+ skills
            if (rarity !== 'COMMON') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = rarityInfo.color;
            }
            const iconFontSize = (isCompact ? 42 : 56) * scale;
            ctx.font = `${iconFontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skill.icon, cardX + cardWidth / 2, cardY + (isCompact ? 72 : 100) * scale);
            ctx.shadowBlur = 0;

            // Skill name
            ctx.fillStyle = '#ffffff';
            const skillNameFontSize = Math.max(12, (isCompact ? 16 : 20) * scale);
            ctx.font = `bold ${skillNameFontSize}px "Roboto Mono", monospace`;
            ctx.fillText(skill.name, cardX + cardWidth / 2, cardY + (isCompact ? 118 : 165) * scale);

            // Tree tagline
            if (skill.tagline && !isCompact) {
                ctx.fillStyle = SKILL_TREES[skill.tree]?.color || '#888888';
                const tagFontSize = Math.max(9, 12 * scale);
                ctx.font = `italic ${tagFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`"${skill.tagline}"`, cardX + cardWidth / 2, cardY + 188 * scale);
            }

            // Description
            ctx.fillStyle = '#cccccc';
            const descFontSize = Math.max(9, (isCompact ? 11 : 14) * scale);
            ctx.font = `${descFontSize}px "Roboto Mono", monospace`;
            const descriptionLines = this.wrapText(ctx, skill.description, cardWidth - 36 * scale);
            let lineY = cardY + (isCompact ? 138 : 200) * scale;
            const maxDescLines = isCompact ? 3 : descriptionLines.length;
            descriptionLines.slice(0, maxDescLines).forEach(line => {
                ctx.fillText(line, cardX + cardWidth / 2, lineY);
                lineY += (isCompact ? 16 : 22) * scale;
            });

            // Rarity multiplier info
            if (rarityInfo.multiplier > 1.0 && !isCompact) {
                ctx.fillStyle = rarityInfo.color;
                const bonusFontSize = Math.max(10, 13 * scale);
                ctx.font = `${bonusFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`${Math.round((rarityInfo.multiplier - 1) * 100)}% stronger effect`, cardX + cardWidth / 2, cardY + cardHeight - 80 * scale);
            }

            // Check if already owned (upgrade indicator)
            const existingSkill = gameState.activeSkills.find(s => s.id === skill.id);
            if (existingSkill) {
                // Upgrade badge
                ctx.fillStyle = '#ffc107';
                const upgradeFontSize = Math.max(11, 16 * scale);
                ctx.font = `bold ${upgradeFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`⬆ UPGRADE TO LV.${existingSkill.level + 1}`, cardX + cardWidth / 2, cardY + cardHeight - 45 * scale);
            }

            ctx.restore();
        });

        // Instruction text with subtle animation
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(animTime * 2) * 0.2})`;
        const instructionFontSize = Math.max(12, 16 * scale);
        ctx.font = `${instructionFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        const isTouch = isMobileDevice() || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
        ctx.fillText(isTouch ? 'Tap a skill card to select' : 'Click a skill card to select', canvas.width / 2, canvas.height - 50 * scale);

        // Reroll button
        const rerollsLeft = gameState.levelUpRerollsLeft || 0;
        if (rerollsLeft > 0) {
            const btnW = 200 * scale;
            const btnH = 44 * scale;
            const btnX = canvas.width / 2 - btnW / 2;
            const btnY = canvas.height - 110 * scale;
            const isRerollHovered = this.hoveredReroll;

            ctx.fillStyle = isRerollHovered ? 'rgba(255, 193, 7, 0.35)' : 'rgba(255, 193, 7, 0.15)';
            this.roundRect(ctx, btnX, btnY, btnW, btnH, 8 * scale);
            ctx.fill();
            ctx.strokeStyle = '#ffc107';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            ctx.fillStyle = '#ffc107';
            ctx.font = `bold ${Math.max(12, 15 * scale)}px "Roboto Mono", monospace`;
            ctx.fillText(`🔄 Reroll (${rerollsLeft})`, canvas.width / 2, btnY + btnH / 2);
        }

        // Kill streak bonus info if applicable
        if (gameState.killStreak >= 5) {
            ctx.fillStyle = '#ffc107';
            const bonusText = `Kill Streak: ${gameState.killStreak}x - XP Bonus Active!`;
            ctx.fillText(bonusText, canvas.width / 2, canvas.height - 80 * scale);
        }
    }

    /**
     * Draw a rounded rectangle path
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    checkRerollClick(x, y) {
        if (!gameState.showLevelUp || (gameState.levelUpRerollsLeft || 0) <= 0) {
            return false;
        }
        const scale = this.getUIScale();
        const btnW = Math.max(200 * scale, 180);
        const btnH = Math.max(44 * scale, 44);
        const btnX = this.canvas.width / 2 - btnW / 2;
        const btnY = this.canvas.height - 110 * scale;
        const hitPad = isMobileDevice() ? 10 * scale : 0;
        return x >= btnX - hitPad && x <= btnX + btnW + hitPad
            && y >= btnY - hitPad && y <= btnY + btnH + hitPad;
    }

    checkClick(x, y) {
        if (!gameState.showLevelUp || !gameState.levelUpChoices || gameState.levelUpChoices.length === 0) {
            return null;
        }

        for (let i = 0; i < gameState.levelUpChoices.length; i++) {
            const { x: cardX, y: cardY, width: cardWidth, height: cardHeight } = this.getCardRect(i);
            const hitPad = isMobileDevice() ? 4 : 0;
            if (x >= cardX - hitPad && x <= cardX + cardWidth + hitPad
                && y >= cardY - hitPad && y <= cardY + cardHeight + hitPad) {
                return i;
            }
        }

        return null;
    }

    updateHover(x, y) {
        this.hoveredReroll = this.checkRerollClick(x, y);
        if (this.hoveredReroll) {
            this.hoveredSkillIndex = null;
            return null;
        }
        this.hoveredSkillIndex = this.checkClick(x, y);
        return this.hoveredSkillIndex;
    }

    /**
     * Reset animation state when level up screen closes
     */
    reset() {
        this.animationStart = 0;
        this.hoveredSkillIndex = null;
        this.hoveredReroll = false;
    }
}
