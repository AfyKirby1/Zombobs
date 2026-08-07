export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60; // 60 FPS
        this.targetFPS = 0; // 0 = unlimited
        this.lastFrameTime = 0;
        // Browsers always present through requestAnimationFrame. This flag controls
        // whether we trust native frame pacing or apply our own FPS cap on top.
        this.vsyncEnabled = true;
        this.maxDeltaTime = 250;
        this.maxUpdateSteps = 5;
        this.droppedSimulationTime = 0;
        this.totalFrames = 0;
        this.totalUpdates = 0;

        this.update = () => {};
        this.draw = () => {};

        this._loop = this._loop.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._resyncClock(performance.now());
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this._handleVisibilityChange);
        }
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        }
    }

    _resyncClock(now = performance.now()) {
        this.lastTime = now;
        this.lastFrameTime = now;
        this.accumulatedTime = 0;
    }

    _handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Do not replay seconds of hidden-tab time as simulation updates.
            this._resyncClock(performance.now());
        }
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        // Optional app-side frame cap. Native pacing remains requestAnimationFrame.
        if (!this.vsyncEnabled && this.targetFPS > 0) {
            const targetFrameTime = 1000 / this.targetFPS;
            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed + 0.25 < targetFrameTime) {
                requestAnimationFrame(this._loop);
                return;
            }

            this.lastFrameTime = timestamp - (elapsed % targetFrameTime);
        } else {
            this.lastFrameTime = timestamp;
        }

        const deltaTime = Math.max(0, Math.min(this.maxDeltaTime, timestamp - this.lastTime));
        this.lastTime = timestamp;
        this.accumulatedTime += deltaTime;

        let updateSteps = 0;
        while (this.accumulatedTime >= this.timeStep && updateSteps < this.maxUpdateSteps) {
            this.update(this.timeStep); // Fixed time step update
            this.accumulatedTime -= this.timeStep;
            updateSteps++;
            this.totalUpdates++;
        }

        // Drop excess backlog rather than creating a multi-frame update spiral.
        if (this.accumulatedTime >= this.timeStep) {
            const retained = this.accumulatedTime % this.timeStep;
            this.droppedSimulationTime += this.accumulatedTime - retained;
            this.accumulatedTime = retained;
        }

        this.draw(this.getInterpolationAlpha());
        this.totalFrames++;

        requestAnimationFrame(this._loop);
    }

    setFPSLimit(fps) {
        const normalized = Number.isFinite(Number(fps)) ? Math.max(0, Number(fps)) : 0;
        this.targetFPS = normalized;
        this.lastFrameTime = performance.now();
    }

    setVSync(enabled) {
        this.vsyncEnabled = enabled !== false;
        this.lastFrameTime = performance.now();
    }
    
    /**
     * Get interpolation alpha for smooth rendering between fixed timestep updates
     * Returns a value between 0 and 1 indicating how far between updates we are
     * @returns {number} Interpolation alpha (0 = at last update, 1 = at next update)
     */
    getInterpolationAlpha() {
        if (this.timeStep <= 0) return 0;
        return Math.min(1, this.accumulatedTime / this.timeStep);
    }

    getPerformanceStats() {
        return {
            targetFPS: this.targetFPS,
            nativeFramePacing: this.vsyncEnabled,
            interpolationAlpha: this.getInterpolationAlpha(),
            droppedSimulationTime: this.droppedSimulationTime,
            totalFrames: this.totalFrames,
            totalUpdates: this.totalUpdates
        };
    }
}

