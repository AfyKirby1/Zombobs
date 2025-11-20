import { RENDER_SCALE } from './constants.js';
import { settingsManager } from '../systems/SettingsManager.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d', { willReadFrequently: true });
export const gpuCanvas = document.getElementById('gpuCanvas');

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

    // Visual size still fills the window
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Update player position to center if player exists
    if (player) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        
        // Keep player within bounds
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    }
}

