export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60; // 60 FPS

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
}

