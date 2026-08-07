import { RENDER_SCALE, UI_RENDER_SCALE } from './constants.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { gameState } from './gameState.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d', { willReadFrequently: true });
export const gpuCanvas = document.getElementById('gpuCanvas');
export const uiCanvas = document.getElementById('uiCanvas');
export const uiCtx = uiCanvas ? uiCanvas.getContext('2d', { alpha: true, willReadFrequently: true }) : null;

/**
 * Apply Canvas anti-aliasing/image sampling quality to a context.
 * The legacy function name is retained because UI callers already import it.
 * @param {CanvasRenderingContext2D} context - The canvas context to apply settings to
 * @param {string} quality - 'low', 'medium', or 'high'
 */
export function applyTextRenderingQuality(context, quality) {
    if (!context) return;

    const normalizedQuality = quality === 'low'
        ? 'low'
        : (quality === 'medium' ? 'medium' : 'high');

    if (normalizedQuality === 'low') {
        context.imageSmoothingEnabled = false;
    } else {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = normalizedQuality;
    }
}

/**
 * Density compensation factor for UI drawing scales.
 *
 * All UI code was authored against the legacy grid where the internal canvas
 * was RENDER_SCALE (0.75) of CSS pixels and the browser upscaled the rest.
 * uiCanvas now renders denser (UI_RENDER_SCALE), so multiply UI scale factors
 * by this so rendered on-screen size stays identical while text gets sharper.
 *
 * @returns {number} Density compensation multiplier (>= 1 when UI is denser).
 */
export function getUiDensityScale() {
    if (!uiCanvas || !uiCanvas.width || !window.innerWidth) return 1;
    const density = uiCanvas.width / window.innerWidth; // UI canvas px per CSS px
    const comp = density / RENDER_SCALE;
    if (!Number.isFinite(comp)) return 1;
    return Math.min(4, Math.max(0.5, comp));
}

/**
 * Apply anti-aliasing/image sampling quality to all Canvas2D contexts.
 * This should be called when the setting changes
 */
export function applyTextRenderingQualityToAll() {
    const quality = settingsManager.getSetting('video', 'textRenderingQuality') || 'high';
    applyTextRenderingQuality(ctx, quality);
    if (uiCtx) applyTextRenderingQuality(uiCtx, quality);

    // Apply to other contexts if they exist
    if (window.gameHUD) {
        if (window.gameHUD.ctx) {
            applyTextRenderingQuality(window.gameHUD.ctx, quality);
        }
        if (window.gameHUD.rankDisplay && window.gameHUD.rankDisplay.ctx) {
            applyTextRenderingQuality(window.gameHUD.rankDisplay.ctx, quality);
        }
        if (window.gameHUD.bossHealthBar && window.gameHUD.bossHealthBar.ctx) {
            // BossHealthBar uses main ctx, but check if it has its own
            const bossCtx = window.gameHUD.bossHealthBar.ctx;
            if (bossCtx) applyTextRenderingQuality(bossCtx, quality);
        }
    }
    if (window.settingsPanel && window.settingsPanel.ctx) {
        applyTextRenderingQuality(window.settingsPanel.ctx, quality);
    }
    if (window.profileScreen && window.profileScreen.ctx) {
        applyTextRenderingQuality(window.profileScreen.ctx, quality);
    }
    if (window.achievementScreen && window.achievementScreen.ctx) {
        applyTextRenderingQuality(window.achievementScreen.ctx, quality);
    }
    if (window.battlepassScreen && window.battlepassScreen.ctx) {
        applyTextRenderingQuality(window.battlepassScreen.ctx, quality);
    }
}

// Function to resize canvas to fit window
export function resizeCanvas(player) {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Get resolution scale from settings (default 1.0 = 100%)
    const resolutionScale = settingsManager.getSetting('video', 'resolutionScale') ?? 1.0;

    // Internal canvas resolution (scaled down for performance, multiplied by resolution scale)
    const effectiveScale = RENDER_SCALE * resolutionScale;
    const canvasWidth = Math.floor(displayWidth * effectiveScale);
    const canvasHeight = Math.floor(displayHeight * effectiveScale);

    // Resize both canvases synchronously
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    if (gpuCanvas) {
        gpuCanvas.width = canvasWidth;
        gpuCanvas.height = canvasHeight;
        // Visual size still fills the window
        gpuCanvas.style.width = displayWidth + 'px';
        gpuCanvas.style.height = displayHeight + 'px';
    }

    // UI canvas renders at higher pixel density than gameplay for crisp text.
    // Scaled to the same CSS size below; UI sizing must be density-compensated
    // via getUiDensityScale() so on-screen geometry stays unchanged.
    const uiEffectiveScale = UI_RENDER_SCALE * resolutionScale;
    const uiWidth = Math.floor(displayWidth * uiEffectiveScale);
    const uiHeight = Math.floor(displayHeight * uiEffectiveScale);

    if (uiCanvas) {
        uiCanvas.width = uiWidth;
        uiCanvas.height = uiHeight;
        uiCanvas.style.width = displayWidth + 'px';
        uiCanvas.style.height = displayHeight + 'px';
    }

    // Visual size still fills the window
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Update player position to center if player exists
    if (player) {
        // v0.8.1.2: In single player arcade mode, preserve world position (camera handles centering)
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        if (!isSinglePlayerArcade) {
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;

            // Keep player within bounds (only for non-arcade modes)
            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
        }
        // In arcade mode, player position is in world space - don't constrain to canvas
    }

    // Assigning canvas.width/height resets the complete 2D context state,
    // including smoothing. Re-apply after every density or viewport resize.
    applyTextRenderingQualityToAll();
}

