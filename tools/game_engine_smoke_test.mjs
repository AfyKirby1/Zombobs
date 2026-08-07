import assert from 'node:assert/strict';
import { GameEngine } from '../js/core/GameEngine.js';

const scheduledFrames = [];
globalThis.requestAnimationFrame = (callback) => {
    scheduledFrames.push(callback);
    return scheduledFrames.length;
};

function createRunningEngine() {
    const engine = new GameEngine();
    engine.isRunning = true;
    engine.lastTime = 0;
    engine.lastFrameTime = 0;
    return engine;
}

{
    const engine = createRunningEngine();
    let updates = 0;
    let draws = 0;
    let interpolationAlpha = -1;
    engine.update = () => { updates++; };
    engine.draw = (alpha) => {
        draws++;
        interpolationAlpha = alpha;
    };

    engine._loop(200);

    assert.equal(updates, engine.maxUpdateSteps, 'long frames must respect the update-step ceiling');
    assert.equal(draws, 1, 'a long frame should still render once');
    assert.ok(engine.droppedSimulationTime > 0, 'excess fixed-step backlog should be recorded as dropped');
    assert.ok(interpolationAlpha >= 0 && interpolationAlpha < 1, 'render interpolation must remain normalized');
}

{
    const engine = createRunningEngine();
    let draws = 0;
    engine.draw = () => { draws++; };
    engine.setFPSLimit(30);
    engine.setVSync(false);
    engine.lastFrameTime = 0;

    engine._loop(10);
    assert.equal(draws, 0, 'the app-side frame cap should skip an early frame');

    engine._loop(34);
    assert.equal(draws, 1, 'the frame cap should render once the target interval elapses');
    assert.equal(engine.getPerformanceStats().targetFPS, 30, 'changing frame pacing must preserve the selected cap');
}

{
    const engine = createRunningEngine();
    engine.lastTime = 100;
    engine.lastFrameTime = 100;
    engine.accumulatedTime = 99;
    engine._resyncClock(250);

    assert.equal(engine.lastTime, 250);
    assert.equal(engine.lastFrameTime, 250);
    assert.equal(engine.accumulatedTime, 0, 'clock resync must discard hidden-tab backlog');
}

console.log('game engine smoke test passed');
