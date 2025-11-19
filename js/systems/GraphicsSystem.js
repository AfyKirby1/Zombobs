// Grass ground pattern cache
import { ctx } from '../core/canvas.js';

let grassPattern = null;

// Function to create a tileable grass pattern
function createGrassPattern() {
    const tileSize = 64;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = tileSize;
    patternCanvas.height = tileSize;
    const patternCtx = patternCanvas.getContext('2d');
    
    // Base dark green grass color
    patternCtx.fillStyle = '#1a2e1a';
    patternCtx.fillRect(0, 0, tileSize, tileSize);
    
    // Add patches of slightly lighter grass
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * tileSize;
        const y = Math.random() * tileSize;
        const size = Math.random() * 8 + 3;
        const greenValue = 30 + Math.random() * 20;
        patternCtx.fillStyle = `rgba(30, ${greenValue}, 30, 0.4)`;
        patternCtx.beginPath();
        patternCtx.arc(x, y, size, 0, Math.PI * 2);
        patternCtx.fill();
    }
    
    // Add some darker spots for texture variation
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * tileSize;
        const y = Math.random() * tileSize;
        const size = Math.random() * 5 + 2;
        patternCtx.fillStyle = 'rgba(10, 20, 10, 0.6)';
        patternCtx.beginPath();
        patternCtx.arc(x, y, size, 0, Math.PI * 2);
        patternCtx.fill();
    }
    
    // Add subtle grass blades effect (small vertical lines)
    patternCtx.strokeStyle = 'rgba(20, 40, 20, 0.3)';
    patternCtx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * tileSize;
        const y = Math.random() * tileSize;
        const height = Math.random() * 4 + 2;
        patternCtx.beginPath();
        patternCtx.moveTo(x, y);
        patternCtx.lineTo(x + (Math.random() - 0.5) * 2, y - height);
        patternCtx.stroke();
    }
    
    // Use the main canvas context to create the pattern
    return ctx.createPattern(patternCanvas, 'repeat');
}

// Initialize grass pattern
export function initGrassPattern() {
    if (!grassPattern) {
        grassPattern = createGrassPattern();
    }
    return grassPattern;
}

