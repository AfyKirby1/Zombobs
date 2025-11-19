import { ctx } from '../core/canvas.js';
import { settingsManager } from './SettingsManager.js';

let groundPattern = null;
const groundImage = new Image();
groundImage.src = 'sample_assets/tiles/bloody_dark_floor.png';

// Function to create the ground pattern from image
function createGroundPattern() {
    if (groundImage.complete && groundImage.naturalWidth > 0) {
        return ctx.createPattern(groundImage, 'repeat');
    }
    return null;
}

// Initialize ground pattern
export function initGroundPattern() {
    if (!groundPattern) {
        groundPattern = createGroundPattern();
    }
    return groundPattern;
}

export const graphicsSettings = {
    get quality() { return settingsManager.getSetting('video', 'qualityPreset'); },
    get maxParticles() { return settingsManager.getSetting('video', 'particleCount'); },
    get vignette() { return settingsManager.getSetting('video', 'vignette'); },
    get shadows() { return settingsManager.getSetting('video', 'shadows'); },
    get lighting() { return settingsManager.getSetting('video', 'lighting'); }
};
