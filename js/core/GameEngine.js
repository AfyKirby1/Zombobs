export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60; // 60 FPS
        this.targetFPS = 0; // 0 = unlimited
        this.lastFrameTime = 0;
        this.vsyncEnabled = true; // Default to VSync enabled

        this.update = () => {};
        this.draw = () => {};
        
        this._loop = this._loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        // FPS limiting (only if VSync is disabled)
        if (!this.vsyncEnabled && this.targetFPS > 0) {
            const targetFrameTime = 1000 / this.targetFPS;
            const elapsed = timestamp - this.lastFrameTime;
            
            if (elapsed < targetFrameTime) {
                // Too early, schedule next frame
                requestAnimationFrame(this._loop);
                return;
            }
            
            this.lastFrameTime = timestamp - (elapsed % targetFrameTime);
        } else {
            this.lastFrameTime = timestamp;
        }

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.accumulatedTime += deltaTime;

        // Prevent spiral of death if lag is too high
        if (this.accumulatedTime > 1000) {
            this.accumulatedTime = 1000;
        }

        while (this.accumulatedTime >= this.timeStep) {
            this.update(this.timeStep); // Fixed time step update
            this.accumulatedTime -= this.timeStep;
        }

        // Interpolation alpha could be calculated here: this.accumulatedTime / this.timeStep
        this.draw();

        requestAnimationFrame(this._loop);
    }
    
    setFPSLimit(fps) {
        // Only apply FPS limit if VSync is disabled
        if (!this.vsyncEnabled) {
            this.targetFPS = fps;
            this.lastFrameTime = performance.now();
        } else {
            // VSync enabled, ignore FPS limit
            this.targetFPS = 0;
        }
    }
    
    setVSync(enabled) {
        this.vsyncEnabled = enabled;
        // If VSync is enabled, disable FPS limiting
        if (enabled) {
            this.targetFPS = 0;
        }
    }
}

