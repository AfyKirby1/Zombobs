import { achievementSystem } from '../systems/AchievementSystem.js';
import { getAchievementCategories } from '../core/achievementDefinitions.js';
import { gameState } from '../core/gameState.js';

/** Category display meta — icons + accent for filter rail */
const CATEGORY_META = {
    all: { label: 'All', icon: '🏆', accent: '#ff1744' },
    combat: { label: 'Combat', icon: '💀', accent: '#ff5252' },
    survival: { label: 'Survival', icon: '🛡️', accent: '#66bb6a' },
    collection: { label: 'Collection', icon: '📦', accent: '#ff9800' },
    skill: { label: 'Skills', icon: '⚡', accent: '#ab47bc' },
    social: { label: 'Social', icon: '👥', accent: '#42a5f5' }
};

/**
 * AchievementScreen - Trophy cabinet overlay
 * HTML overlay with glass-horror polish (stats ring, category rail, rich cards)
 */
export class AchievementScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.isMounted = false;
        this.selectedCategory = 'all';
        this.statusFilter = 'all'; // all | unlocked | locked
        this.gridContainer = null;
        this.achievementsGrid = null;
        this.statsEl = null;
        this.sidebar = null;
        this.statusBar = null;
    }

    mount() {
        if (this.isMounted) {
            this.update();
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'overlay-container achievements-overlay';
        this.container.id = 'achievements-overlay';

        // Ambient vignette + scanline layers (CSS-driven)
        const ambience = document.createElement('div');
        ambience.className = 'achievements-ambience';
        ambience.setAttribute('aria-hidden', 'true');
        this.container.appendChild(ambience);

        // Header
        const header = document.createElement('div');
        header.className = 'overlay-header achievements-header';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'achievements-header-left';

        const eyebrow = document.createElement('div');
        eyebrow.className = 'achievements-eyebrow';
        eyebrow.textContent = 'SURVIVOR RECORD';

        const title = document.createElement('div');
        title.className = 'overlay-title achievements-title';
        title.textContent = 'ACHIEVEMENTS';

        const subtitle = document.createElement('div');
        subtitle.className = 'overlay-subtitle';
        subtitle.textContent = 'Prove your worth. Unlock glory. Dominate the horde.';

        headerLeft.appendChild(eyebrow);
        headerLeft.appendChild(title);
        headerLeft.appendChild(subtitle);
        header.appendChild(headerLeft);

        // Completion ring in header
        const statsWrap = document.createElement('div');
        statsWrap.className = 'achievements-stats-wrap';
        this.statsEl = statsWrap;
        header.appendChild(statsWrap);

        const backButton = document.createElement('button');
        backButton.className = 'btn-back';
        backButton.innerHTML = '<span>BACK</span>';
        backButton.addEventListener('click', () => {
            gameState.showAchievements = false;
            gameState.showMainMenu = true;
            this.unmount();
        });
        header.appendChild(backButton);

        // Main layout
        const main = document.createElement('div');
        main.className = 'achievements-main';

        const sidebar = document.createElement('div');
        sidebar.className = 'achievements-sidebar';
        this.sidebar = sidebar;

        const contentCol = document.createElement('div');
        contentCol.className = 'achievements-content';

        // Status filter chips
        const statusBar = document.createElement('div');
        statusBar.className = 'achievements-status-bar';
        this.statusBar = statusBar;
        contentCol.appendChild(statusBar);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'achievements-grid-container';
        this.gridContainer = gridContainer;

        const achievementsGrid = document.createElement('div');
        achievementsGrid.className = 'achievements-grid';
        this.achievementsGrid = achievementsGrid;

        gridContainer.appendChild(achievementsGrid);
        contentCol.appendChild(gridContainer);

        main.appendChild(sidebar);
        main.appendChild(contentCol);

        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        this.renderStats();
        this.renderCategories();
        this.renderStatusBar();
        this.renderList();

        this.isMounted = true;

        gridContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            gridContainer.scrollTop += e.deltaY;
        }, { passive: false });
    }

    unmount() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.isMounted = false;
        this.sidebar = null;
        this.gridContainer = null;
        this.achievementsGrid = null;
        this.statsEl = null;
        this.statusBar = null;
    }

    update() {
        if (!this.isMounted) return;
        this.renderStats();
        this.renderCategories();
        this.renderStatusBar();
        this.renderList();
    }

    renderStats() {
        if (!this.statsEl) return;
        const stats = achievementSystem.getStatistics();
        const pct = Math.floor(stats.completionPercent || 0);
        const radius = 34;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;

        this.statsEl.innerHTML = `
            <div class="achievements-ring" style="--pct:${pct}">
                <svg viewBox="0 0 80 80" aria-hidden="true">
                    <circle class="ring-track" cx="40" cy="40" r="${radius}"></circle>
                    <circle class="ring-fill" cx="40" cy="40" r="${radius}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}"></circle>
                </svg>
                <div class="ring-label">
                    <span class="ring-pct">${pct}%</span>
                    <span class="ring-sub">CLEAR</span>
                </div>
            </div>
            <div class="achievements-stat-pills">
                <div class="stat-pill unlocked">
                    <span class="stat-pill-val">${stats.unlocked}</span>
                    <span class="stat-pill-lbl">UNLOCKED</span>
                </div>
                <div class="stat-pill locked">
                    <span class="stat-pill-val">${stats.locked}</span>
                    <span class="stat-pill-lbl">LOCKED</span>
                </div>
                <div class="stat-pill total">
                    <span class="stat-pill-val">${stats.total}</span>
                    <span class="stat-pill-lbl">TOTAL</span>
                </div>
            </div>
        `;
    }

    renderCategories() {
        if (!this.sidebar) return;
        this.sidebar.innerHTML = '';

        const railTitle = document.createElement('div');
        railTitle.className = 'achievements-rail-title';
        railTitle.textContent = 'CATEGORIES';
        this.sidebar.appendChild(railTitle);

        const categories = ['all', ...getAchievementCategories()];
        const allAchievements = achievementSystem.getAllAchievements();

        categories.forEach(category => {
            const meta = CATEGORY_META[category] || {
                label: category.charAt(0).toUpperCase() + category.slice(1),
                icon: '★',
                accent: '#ff1744'
            };

            const count = category === 'all'
                ? allAchievements.length
                : allAchievements.filter(a => a.category === category).length;
            const unlockedCount = category === 'all'
                ? allAchievements.filter(a => a.unlocked).length
                : allAchievements.filter(a => a.category === category && a.unlocked).length;

            const button = document.createElement('button');
            button.className = 'category-button';
            button.style.setProperty('--cat-accent', meta.accent);
            if (category === this.selectedCategory) {
                button.classList.add('active');
            }

            button.innerHTML = `
                <span class="cat-icon">${meta.icon}</span>
                <span class="cat-body">
                    <span class="cat-label">${meta.label}</span>
                    <span class="cat-count">${unlockedCount}/${count}</span>
                </span>
            `;

            button.addEventListener('click', () => {
                this.selectedCategory = category;
                this.renderCategories();
                this.renderList();
            });

            this.sidebar.appendChild(button);
        });
    }

    renderStatusBar() {
        if (!this.statusBar) return;
        this.statusBar.innerHTML = '';

        const filters = [
            { id: 'all', label: 'ALL' },
            { id: 'unlocked', label: 'UNLOCKED' },
            { id: 'locked', label: 'IN PROGRESS' }
        ];

        filters.forEach(f => {
            const chip = document.createElement('button');
            chip.className = 'status-chip';
            if (f.id === this.statusFilter) chip.classList.add('active');
            chip.textContent = f.label;
            chip.addEventListener('click', () => {
                this.statusFilter = f.id;
                this.renderStatusBar();
                this.renderList();
            });
            this.statusBar.appendChild(chip);
        });
    }

    renderList() {
        if (!this.achievementsGrid) return;

        let achievements = this.selectedCategory === 'all'
            ? achievementSystem.getAllAchievements()
            : achievementSystem.getAchievementsByCategory(this.selectedCategory);

        if (this.statusFilter === 'unlocked') {
            achievements = achievements.filter(a => a.unlocked);
        } else if (this.statusFilter === 'locked') {
            achievements = achievements.filter(a => !a.unlocked);
        }

        achievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlocked && b.unlocked) return 0;
            return (b.progress || 0) - (a.progress || 0);
        });

        this.achievementsGrid.innerHTML = '';

        if (achievements.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'achievements-empty';
            empty.innerHTML = `
                <div class="empty-icon">🌑</div>
                <div class="empty-title">NO MATCHES</div>
                <div class="empty-sub">Try another filter or category.</div>
            `;
            this.achievementsGrid.appendChild(empty);
            return;
        }

        achievements.forEach((achievement, index) => {
            const meta = CATEGORY_META[achievement.category] || CATEGORY_META.all;
            const card = document.createElement('div');
            card.className = 'achievement-card';
            card.style.setProperty('--cat-accent', meta.accent);
            card.style.animationDelay = `${Math.min(index * 0.03, 0.45)}s`;
            card.classList.add(achievement.unlocked ? 'unlocked' : 'locked');

            // Accent bar
            const accent = document.createElement('div');
            accent.className = 'achievement-accent';
            card.appendChild(accent);

            // Icon plate
            const iconPlate = document.createElement('div');
            iconPlate.className = 'achievement-icon-plate';
            const icon = document.createElement('div');
            icon.className = 'achievement-icon';
            icon.textContent = achievement.unlocked ? achievement.icon : '🔒';
            iconPlate.appendChild(icon);
            card.appendChild(iconPlate);

            // Body
            const body = document.createElement('div');
            body.className = 'achievement-body';

            const catTag = document.createElement('div');
            catTag.className = 'achievement-cat-tag';
            catTag.textContent = (meta.label || achievement.category || '').toUpperCase();
            body.appendChild(catTag);

            const name = document.createElement('div');
            name.className = 'achievement-name';
            name.textContent = achievement.name;
            body.appendChild(name);

            const desc = document.createElement('div');
            desc.className = 'achievement-desc';
            desc.textContent = achievement.description || '';
            body.appendChild(desc);

            if (!achievement.unlocked && achievement.requirement) {
                const progress = document.createElement('div');
                progress.className = 'achievement-progress';

                const current = achievement.progress || 0;
                const target = achievement.requirement.value || 1;
                const progressPercent = Math.min(100, (current / target) * 100);

                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar-mini';
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-bar-mini-fill';
                progressFill.style.width = `${progressPercent}%`;
                progressBar.appendChild(progressFill);

                const progressText = document.createElement('div');
                progressText.className = 'progress-text';
                progressText.textContent = `${Math.floor(progressPercent)}% · ${this._formatNum(current)} / ${this._formatNum(target)}`;

                progress.appendChild(progressBar);
                progress.appendChild(progressText);
                body.appendChild(progress);
            } else if (achievement.unlocked) {
                const unlockedRow = document.createElement('div');
                unlockedRow.className = 'achievement-unlocked-row';
                const unlockedText = document.createElement('div');
                unlockedText.className = 'achievement-unlocked-text';
                unlockedText.textContent = '✓ UNLOCKED';
                unlockedRow.appendChild(unlockedText);
                if (achievement.unlockedDate) {
                    const date = document.createElement('div');
                    date.className = 'achievement-date';
                    date.textContent = this._formatDate(achievement.unlockedDate);
                    unlockedRow.appendChild(date);
                }
                body.appendChild(unlockedRow);
            }

            // Reward footer
            if (achievement.reward) {
                const reward = document.createElement('div');
                reward.className = 'achievement-reward';
                const bits = [];
                if (achievement.reward.rankXP) bits.push(`+${this._formatNum(achievement.reward.rankXP)} XP`);
                if (achievement.reward.title) bits.push(`Title: ${achievement.reward.title}`);
                reward.textContent = bits.join(' · ');
                body.appendChild(reward);
            }

            card.appendChild(body);
            card.title = achievement.description || achievement.name;
            this.achievementsGrid.appendChild(card);
        });
    }

    _formatNum(n) {
        return Number(n || 0).toLocaleString();
    }

    _formatDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '';
        }
    }

    draw() {
        if (gameState.showAchievements) {
            if (!this.isMounted) {
                this.mount();
            }
        } else if (this.isMounted) {
            this.unmount();
        }
    }

    handleClick() {
        gameState.showAchievements = false;
        this.unmount();
        return { action: 'back' };
    }

    handleScroll() {
        // DOM wheel events handle scrolling
    }
}
