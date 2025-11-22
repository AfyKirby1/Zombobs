import { gameState } from '../core/gameState.js';
import { RENDERING } from '../core/constants.js';
import { canvas } from '../core/canvas.js';

export function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const radiusSum = obj1.radius + obj2.radius;
    const distSquared = dx * dx + dy * dy;
    return distSquared < radiusSum * radiusSum;
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

/**
 * Check if an entity should be updated (larger margin than rendering)
 * Entities far off-screen still need updates for AI/pathfinding if they might come into view soon
 * @param {Object} entity - Entity with x, y, radius properties
 * @param {number} viewportLeft - Left edge of viewport
 * @param {number} viewportTop - Top edge of viewport
 * @param {number} viewportRight - Right edge of viewport
 * @param {number} viewportBottom - Bottom edge of viewport
 * @returns {boolean} True if entity should be updated
 */
export function shouldUpdateEntity(entity, viewportLeft, viewportTop, viewportRight, viewportBottom) {
    const margin = RENDERING.UPDATE_MARGIN;
    const radius = entity.radius || 0;
    
    return entity.x + radius >= viewportLeft - margin &&
           entity.x - radius <= viewportRight + margin &&
           entity.y + radius >= viewportTop - margin &&
           entity.y - radius <= viewportBottom + margin;
}

/**
 * Check if an entity is large enough to be visible on screen
 * Skips rendering entities smaller than 1px on screen (tiny shells, distant bullets)
 * @param {Object} entity - Entity with radius property
 * @param {number} entityRadius - Entity radius in world space (optional, uses entity.radius if not provided)
 * @returns {boolean} True if entity is large enough to render
 */
export function isVisibleOnScreen(entity, entityRadius = null) {
    const radius = entityRadius !== null ? entityRadius : (entity.radius || 0);
    
    // Simple check: skip entities with very small radius
    // This catches tiny shells, very distant bullets, etc.
    // For now, we use 0.5 world pixels as threshold - entities smaller than this are too tiny to see
    // More sophisticated implementation could calculate actual screen-space size based on camera zoom
    if (radius < 0.5) {
        return false;
    }
    
    return true;
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
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
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

// Scoreboard System

/**
 * Load scoreboard from localStorage
 * @returns {Array} Array of scoreboard entries (max 10), sorted by score descending
 */
export function loadScoreboard() {
    try {
        const saved = localStorage.getItem('zombobs_scoreboard');
        if (saved) {
            const scoreboard = JSON.parse(saved);
            // Ensure it's an array and sort by score descending
            if (Array.isArray(scoreboard)) {
                return scoreboard.sort((a, b) => b.score - a.score).slice(0, 10);
            }
        }
    } catch (error) {
        console.log('Failed to load scoreboard:', error);
    }
    return [];
}

/**
 * Save a new scoreboard entry if it qualifies for top 10
 * @param {Object} entry - Scoreboard entry object
 * @param {number} entry.score - Final score
 * @param {number} entry.wave - Wave reached
 * @param {number} entry.kills - Zombies killed
 * @param {number} entry.timeSurvived - Time survived in seconds
 * @param {number} entry.maxMultiplier - Maximum multiplier achieved
 * @param {string} entry.username - Player username
 * @returns {boolean} True if entry was saved (qualified for top 10)
 */
export function saveScoreboardEntry(entry) {
    try {
        const scoreboard = loadScoreboard();
        
        // Add new entry
        scoreboard.push({
            score: entry.score || 0,
            wave: entry.wave || 0,
            kills: entry.kills || 0,
            timeSurvived: entry.timeSurvived || 0,
            maxMultiplier: entry.maxMultiplier || 1.0,
            dateTime: entry.dateTime || new Date().toISOString(),
            username: entry.username || 'Survivor'
        });
        
        // Sort by score descending
        scoreboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        const top10 = scoreboard.slice(0, 10);
        
        // Check if new entry made it into top 10
        const entryQualified = top10.some(e => 
            e.score === entry.score && 
            e.dateTime === entry.dateTime
        );
        
        // Save to localStorage
        localStorage.setItem('zombobs_scoreboard', JSON.stringify(top10));
        
        return entryQualified;
    } catch (error) {
        console.log('Failed to save scoreboard entry:', error);
        return false;
    }
}

/**
 * Get last N runs from scoreboard sorted by dateTime (most recent first)
 * @param {number} count - Number of runs to retrieve
 * @returns {Array} Array of scoreboard entries sorted by dateTime descending
 */
export function getLastRuns(count) {
    try {
        const saved = localStorage.getItem('zombobs_scoreboard');
        if (saved) {
            const scoreboard = JSON.parse(saved);
            if (Array.isArray(scoreboard)) {
                // Sort by dateTime descending (most recent first)
                const sorted = scoreboard.sort((a, b) => {
                    const dateA = new Date(a.dateTime || 0);
                    const dateB = new Date(b.dateTime || 0);
                    return dateB - dateA; // Descending (newest first)
                });
                return sorted.slice(0, count);
            }
        }
    } catch (error) {
        console.log('Failed to load last runs:', error);
    }
    return [];
}

/**
 * Format seconds into readable time string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "1h 5m 23s", "5m 23s", "23s")
 */
export function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        return '0s';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
        parts.push(`${secs}s`);
    }
    
    return parts.join(' ');
}

