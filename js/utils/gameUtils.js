import { gameState } from '../core/gameState.js';
import { RENDERING } from '../core/constants.js';

export function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
}

/**
 * Check if an entity is within the viewport (with margin for culling)
 * @param {Object} entity - Entity with x, y, radius properties
 * @param {number} viewportLeft - Left edge of viewport
 * @param {number} viewportTop - Top edge of viewport
 * @param {number} viewportRight - Right edge of viewport
 * @param {number} viewportBottom - Bottom edge of viewport
 * @returns {boolean} True if entity should be rendered
 */
export function isInViewport(entity, viewportLeft, viewportTop, viewportRight, viewportBottom) {
    const margin = RENDERING.CULL_MARGIN;
    const radius = entity.radius || 0;
    
    return entity.x + radius >= viewportLeft - margin &&
           entity.x - radius <= viewportRight + margin &&
           entity.y + radius >= viewportTop - margin &&
           entity.y - radius <= viewportBottom + margin;
}

/**
 * Get viewport bounds for current canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} Viewport bounds {left, top, right, bottom}
 */
export function getViewportBounds(canvas) {
    return {
        left: 0,
        top: 0,
        right: canvas.width,
        bottom: canvas.height
    };
}

export function triggerDamageIndicator() {
    gameState.damageIndicator.active = true;
    gameState.damageIndicator.intensity = 1.0;
}

export function triggerWaveNotification() {
    gameState.waveNotification.active = true;
    gameState.waveNotification.text = `Wave ${gameState.wave} Starting!`;
    gameState.waveNotification.life = gameState.waveNotification.maxLife;
}

export function triggerMuzzleFlash(x, y, angle) {
    gameState.muzzleFlash.active = true;
    gameState.muzzleFlash.intensity = 1.0;
    gameState.muzzleFlash.x = x;
    gameState.muzzleFlash.y = y;
    gameState.muzzleFlash.angle = angle;
    gameState.muzzleFlash.life = gameState.muzzleFlash.maxLife;
}

export function loadHighScore() {
    const savedHighScore = localStorage.getItem('zombieSurvivalHighScore');
    if (savedHighScore !== null) {
        gameState.highScore = parseInt(savedHighScore);
    }
}

export function saveHighScore() {
    if (gameState.zombiesKilled > gameState.highScore) {
        gameState.highScore = gameState.zombiesKilled;
        localStorage.setItem('zombieSurvivalHighScore', gameState.highScore.toString());
    }
}

export function loadUsername() {
    const savedUsername = localStorage.getItem('zombobs_username');
    if (savedUsername !== null && savedUsername.trim() !== '') {
        gameState.username = savedUsername.trim();
    }
}

export function saveUsername() {
    if (gameState.username && gameState.username.trim() !== '') {
        localStorage.setItem('zombobs_username', gameState.username.trim());
    }
}

export function loadMenuMusicMuted() {
    const savedMuted = localStorage.getItem('zombobs_menuMusicMuted');
    if (savedMuted !== null) {
        gameState.menuMusicMuted = savedMuted === 'true';
    }
}

export function saveMenuMusicMuted() {
    localStorage.setItem('zombobs_menuMusicMuted', gameState.menuMusicMuted.toString());
}

// Score Multiplier Statistics

/**
 * Save multiplier statistics to localStorage
 */
export function saveMultiplierStats() {
    try {
        const stats = {
            allTimeMaxMultiplier: gameState.allTimeMaxMultiplier
        };
        localStorage.setItem('zombobs_multiplier_stats', JSON.stringify(stats));
    } catch (error) {
        console.log('Failed to save multiplier stats:', error);
    }
}

/**
 * Load multiplier statistics from localStorage
 */
export function loadMultiplierStats() {
    try {
        const saved = localStorage.getItem('zombobs_multiplier_stats');
        if (saved) {
            const stats = JSON.parse(saved);
            gameState.allTimeMaxMultiplier = stats.allTimeMaxMultiplier || 1.0;
        }
    } catch (error) {
        console.log('Failed to load multiplier stats:', error);
    }
}

