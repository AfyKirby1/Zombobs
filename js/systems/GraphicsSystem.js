import { ctx } from '../core/canvas.js';

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
