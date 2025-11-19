import { RENDER_SCALE } from './constants.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

// Function to resize canvas to fit window
export function resizeCanvas(player) {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Internal canvas resolution (scaled down for performance)
    canvas.width = Math.floor(displayWidth * RENDER_SCALE);
    canvas.height = Math.floor(displayHeight * RENDER_SCALE);

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

