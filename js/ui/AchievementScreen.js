import { ctx } from '../core/canvas.js';
import { achievementSystem } from '../systems/AchievementSystem.js';
import { getAchievementCategories } from '../core/achievementDefinitions.js';
import { settingsManager } from '../systems/SettingsManager.js';

/**
 * AchievementScreen - UI component for achievement gallery
 */
export class AchievementScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectedCategory = 'all';
        this.scrollY = 0;
        this.maxScrollY = 0;
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        return Number.isFinite(scale) && scale > 0 ? scale : 1.0;
    }

    /**
     * Draw achievement screen
     */
    draw() {
        const scale = this.getUIScale();
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Background overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, width, height);

        // Title
        const titleFontSize = Math.max(24, 32 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${titleFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('ACHIEVEMENTS', width / 2, 30 * scale);

        // Category filter buttons
        const categories = ['all', ...getAchievementCategories()];
        const buttonWidth = 120 * scale;
        const buttonHeight = 35 * scale;
        const buttonSpacing = 10 * scale;
        const startX = (width - (categories.length * (buttonWidth + buttonSpacing) - buttonSpacing)) / 2;
        const startY = 80 * scale;

        categories.forEach((category, index) => {
            const buttonX = startX + index * (buttonWidth + buttonSpacing);
            const isSelected = this.selectedCategory === category;
            
            // Button background
            this.ctx.fillStyle = isSelected ? '#ff6b00' : 'rgba(42, 42, 42, 0.9)';
            this.ctx.fillRect(buttonX, startY, buttonWidth, buttonHeight);

            // Button border
            this.ctx.strokeStyle = isSelected ? '#ff8c00' : '#666666';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.strokeRect(buttonX, startY, buttonWidth, buttonHeight);

            // Button text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `bold ${Math.max(10, 12 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const categoryName = category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1);
            this.ctx.fillText(categoryName, buttonX + buttonWidth / 2, startY + buttonHeight / 2);
        });

        // Achievement grid
        const gridStartY = startY + buttonHeight + 30 * scale;
        const gridHeight = height - gridStartY - 50 * scale;
        const cardWidth = 200 * scale;
        const cardHeight = 120 * scale;
        const cardSpacing = 15 * scale;
        const cardsPerRow = Math.floor((width - 40 * scale) / (cardWidth + cardSpacing));
        const visibleRows = Math.floor(gridHeight / (cardHeight + cardSpacing));

        // Get filtered achievements
        let achievements = this.selectedCategory === 'all' 
            ? achievementSystem.getAllAchievements()
            : achievementSystem.getAchievementsByCategory(this.selectedCategory);

        // Calculate scroll
        const totalRows = Math.ceil(achievements.length / cardsPerRow);
        this.maxScrollY = Math.max(0, (totalRows - visibleRows) * (cardHeight + cardSpacing));

        const startRow = Math.floor(this.scrollY / (cardHeight + cardSpacing));
        const endRow = Math.min(startRow + visibleRows + 1, totalRows);

        // Draw visible achievements
        for (let row = startRow; row < endRow; row++) {
            for (let col = 0; col < cardsPerRow; col++) {
                const index = row * cardsPerRow + col;
                if (index >= achievements.length) break;

                const achievement = achievements[index];
                const cardX = 20 * scale + col * (cardWidth + cardSpacing);
                const cardY = gridStartY + row * (cardHeight + cardSpacing) - this.scrollY;

                this.drawAchievementCard(achievement, cardX, cardY, cardWidth, cardHeight);
            }
        }

        // Scrollbar
        if (this.maxScrollY > 0) {
            const scrollbarWidth = 8 * scale;
            const scrollbarX = width - scrollbarWidth - 10 * scale;
            const scrollbarHeight = gridHeight;
            const scrollbarY = gridStartY;
            const thumbHeight = (gridHeight / (totalRows * (cardHeight + cardSpacing))) * scrollbarHeight;
            const thumbY = scrollbarY + (this.scrollY / this.maxScrollY) * (scrollbarHeight - thumbHeight);

            // Scrollbar track
            this.ctx.fillStyle = 'rgba(42, 42, 42, 0.5)';
            this.ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);

            // Scrollbar thumb
            this.ctx.fillStyle = '#ff6b00';
            this.ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
        }

        // Back button
        this.drawBackButton(width - 120 * scale, 30 * scale, 100 * scale, 35 * scale);
    }

    /**
     * Draw achievement card
     */
    drawAchievementCard(achievement, x, y, width, height) {
        const scale = this.getUIScale();

        // Card background
        const isUnlocked = achievement.unlocked;
        this.ctx.fillStyle = isUnlocked ? 'rgba(42, 42, 42, 0.9)' : 'rgba(20, 20, 20, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Card border
        this.ctx.strokeStyle = isUnlocked ? '#ff6b00' : '#444444';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Icon
        const iconSize = 32 * scale;
        this.ctx.font = `${iconSize}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(achievement.icon, x + width / 2, y + 25 * scale);

        // Name
        const nameFontSize = Math.max(9, 11 * scale);
        this.ctx.fillStyle = isUnlocked ? '#ffffff' : '#888888';
        this.ctx.font = `bold ${nameFontSize}px 'Roboto Mono', monospace`;
        this.ctx.fillText(achievement.name, x + width / 2, y + 55 * scale);

        // Progress bar (if locked)
        if (!isUnlocked && achievement.requirement) {
            const progress = Math.min(100, (achievement.progress / achievement.requirement.value) * 100);
            const barWidth = width - 20 * scale;
            const barHeight = 6 * scale;
            const barX = x + 10 * scale;
            const barY = y + height - 25 * scale;

            // Progress bar background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Progress bar fill
            this.ctx.fillStyle = '#ff6b00';
            this.ctx.fillRect(barX, barY, (barWidth * progress) / 100, barHeight);

            // Progress text
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.font = `${Math.max(7, 9 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${Math.floor(progress)}%`, x + width / 2, barY - 12 * scale);
        } else if (isUnlocked) {
            // Unlocked indicator
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = `${Math.max(8, 10 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('✓ UNLOCKED', x + width / 2, y + height - 20 * scale);
        }
    }

    /**
     * Draw back button
     */
    drawBackButton(x, y, width, height) {
        const scale = this.getUIScale();

        // Button background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Button border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Button text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(10, 12 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('BACK', x + width / 2, y + height / 2);
    }

    /**
     * Handle click
     */
    handleClick(x, y) {
        const scale = this.getUIScale();
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Back button
        const backX = width - 120 * scale;
        const backY = 30 * scale;
        const backWidth = 100 * scale;
        const backHeight = 35 * scale;

        if (x >= backX && x <= backX + backWidth && y >= backY && y <= backY + backHeight) {
            return { action: 'back' };
        }

        // Category buttons
        const categories = ['all', ...getAchievementCategories()];
        const buttonWidth = 120 * scale;
        const buttonHeight = 35 * scale;
        const buttonSpacing = 10 * scale;
        const startX = (width - (categories.length * (buttonWidth + buttonSpacing) - buttonSpacing)) / 2;
        const startY = 80 * scale;

        categories.forEach((category, index) => {
            const buttonX = startX + index * (buttonWidth + buttonSpacing);
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= startY && y <= startY + buttonHeight) {
                this.selectedCategory = category;
                this.scrollY = 0; // Reset scroll when changing category
                return { action: 'category', category };
            }
        });

        return null;
    }

    /**
     * Handle scroll
     */
    handleScroll(deltaY) {
        this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY));
    }
}

