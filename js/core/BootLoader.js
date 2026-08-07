import { GAME_VERSION } from './constants.js';

// [TRACE: CHANGELOG.md] Boot overlay gates WebGPU buffer/compile lag before menu flash
const BOOT_STAGES = {
    bootstrap: { percent: 8, label: 'Starting engine' },
    systems: { percent: 28, label: 'Loading systems' },
    webgpuModule: { percent: 38, label: 'Loading WebGPU module' },
    webgpuAdapter: { percent: 48, label: 'Requesting GPU adapter' },
    webgpuDevice: { percent: 56, label: 'Acquiring GPU device' },
    webgpuCompile: { percent: 70, label: 'Compiling WGSL shaders' },
    webgpuBuffers: { percent: 82, label: 'Allocating GPU buffers' },
    webgpuReady: { percent: 88, label: 'GPU ready' },
    firstFrame: { percent: 92, label: 'Warming first frame' },
    settle: { percent: 96, label: 'Settling display' }
};

const BOOT_TIPS = [
    'Press 1–8 to swap weapons mid-fight.',
    'Collect scrap from kills — spend it at wave-break shrines.',
    'Level up to pick skills — corrupted cards are wild but risky.',
    'Sprint with Shift. Reload before the horde closes in.',
    'Co-op and multiplayer — host with friends from the main menu.',
    'WebGPU warm-up can take a few seconds on first load.',
    'Campaign: extract between zones. Hold E on objectives.'
];

const FAILSAFE_MS = 20000;
const STALL_SOFT_MS = 5000;
const STALL_HARD_MS = 10000;
const TIP_ROTATE_MS = 2800;
const CREEP_INTERVAL_MS = 120;
const CREEP_RATE = 0.35;
const SETTLE_FRAMES = 3;
const MIN_DISPLAY_MS = 300;
const ELAPSED_TICK_MS = 250;

let dismissed = false;
let overlayEl = null;
let labelEl = null;
let subEl = null;
let badgeEl = null;
let versionEl = null;
let barEl = null;
let barFillEl = null;
let tipEl = null;
let percentEl = null;
let elapsedEl = null;
let firstFrameReady = false;
let webgpuReady = false;
let webgpuGateActive = false;
let targetProgress = 0;
let displayedProgress = 0;
let creepCeiling = 28;
let failsafeTimer = null;
let tipTimer = null;
let creepTimer = null;
let elapsedTimer = null;
let stallTimer = null;
let tipIndex = 0;
let bootStartedAt = 0;
let lastStageAt = 0;
let settleActive = false;
let settleFrame = 0;
let dismissScheduled = false;

function perfMark(name) {
    if (typeof performance === 'undefined' || !performance.mark) return;
    performance.mark(name);
}

function perfMeasure(name, start, end) {
    if (typeof performance === 'undefined' || !performance.measure) return;
    try {
        performance.measure(name, start, end);
    } catch (error) {
        // Missing mark; ignore perf-only failures.
    }
}

function nowMs() {
    return typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
}

function clearBootTimers() {
    if (failsafeTimer !== null) {
        window.clearTimeout(failsafeTimer);
        failsafeTimer = null;
    }
    if (tipTimer !== null) {
        window.clearInterval(tipTimer);
        tipTimer = null;
    }
    if (creepTimer !== null) {
        window.clearInterval(creepTimer);
        creepTimer = null;
    }
    if (elapsedTimer !== null) {
        window.clearInterval(elapsedTimer);
        elapsedTimer = null;
    }
    if (stallTimer !== null) {
        window.clearInterval(stallTimer);
        stallTimer = null;
    }
}

function updateBarVisual(percent) {
    if (barFillEl) {
        barFillEl.style.width = `${percent}%`;
    }
    if (barEl) {
        barEl.setAttribute('aria-valuenow', String(Math.round(percent)));
    }
    if (percentEl) {
        percentEl.textContent = `${Math.round(percent)}%`;
    }
}

function formatElapsed(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function updateElapsedVisual() {
    if (!elapsedEl || dismissed) return;
    elapsedEl.textContent = formatElapsed(nowMs() - bootStartedAt);
}

function setStallState(level) {
    if (!overlayEl) return;
    overlayEl.classList.toggle('boot-overlay--stall', level !== 0);
    overlayEl.classList.toggle('boot-overlay--stall-hard', level >= 2);
}

function checkStall() {
    if (dismissed || settleActive) return;
    const idle = nowMs() - lastStageAt;
    if (idle >= STALL_HARD_MS) {
        setStallState(2);
        setBootSubstatus('Still compiling — GPU drivers can take a moment');
    } else if (idle >= STALL_SOFT_MS) {
        setStallState(1);
        if (webgpuGateActive && !webgpuReady) {
            setBootSubstatus('Buffering GPU pipelines… hang tight');
        }
    } else {
        setStallState(0);
    }
}

function tickCreep() {
    if (dismissed) return;
    // Creep fills dead air during long WGSL/buffer stalls so bar never looks frozen.
    if (displayedProgress >= creepCeiling - 0.05) return;
    const next = Math.min(creepCeiling, displayedProgress + CREEP_RATE);
    if (next <= displayedProgress) return;
    displayedProgress = next;
    updateBarVisual(displayedProgress);
}

function startCreep() {
    if (creepTimer !== null) return;
    creepTimer = window.setInterval(tickCreep, CREEP_INTERVAL_MS);
}

function startElapsedTicker() {
    if (elapsedTimer !== null) return;
    updateElapsedVisual();
    elapsedTimer = window.setInterval(updateElapsedVisual, ELAPSED_TICK_MS);
}

function startStallWatcher() {
    if (stallTimer !== null) return;
    stallTimer = window.setInterval(checkStall, 500);
}

export function setBootProgress(percent) {
    const next = Math.max(targetProgress, Math.min(100, percent));
    targetProgress = next;
    if (displayedProgress < targetProgress) {
        displayedProgress = targetProgress;
        updateBarVisual(displayedProgress);
    }
}

function nextStageCeiling(stagePercent) {
    const values = Object.values(BOOT_STAGES).map((s) => s.percent).sort((a, b) => a - b);
    for (let i = 0; i < values.length; i++) {
        if (values[i] > stagePercent) {
            return values[i] - 0.5;
        }
    }
    return 99.5;
}

export function advanceBootStage(stageId) {
    const stage = BOOT_STAGES[stageId];
    if (!stage) return;
    lastStageAt = nowMs();
    setStallState(0);
    setBootProgress(stage.percent);
    creepCeiling = nextStageCeiling(stage.percent);
    if (stage.label) setBootStatus(stage.label);
}

export function setBootTip(text) {
    if (!tipEl) return;
    tipEl.textContent = text || '';
    tipEl.hidden = !text;
}

function rotateBootTip() {
    if (!tipEl || dismissed) return;
    setBootTip(BOOT_TIPS[tipIndex % BOOT_TIPS.length]);
    tipIndex += 1;
}

function startTipRotation() {
    if (tipTimer !== null || !tipEl) return;
    rotateBootTip();
    tipTimer = window.setInterval(rotateBootTip, TIP_ROTATE_MS);
}

function startFailsafeTimer() {
    if (failsafeTimer !== null) return;
    failsafeTimer = window.setTimeout(() => {
        if (dismissed) return;
        firstFrameReady = true;
        webgpuReady = true;
        webgpuGateActive = false;
        settleActive = false;
        setBootStatus('Starting anyway…');
        setBootSubstatus('Boot timeout — continuing without full GPU warm-up');
        setBootProgress(100);
        finishDismiss();
    }, FAILSAFE_MS);
}

export function initBootLoader() {
    overlayEl = document.getElementById('boot-overlay');
    labelEl = overlayEl?.querySelector('.boot-overlay__label');
    subEl = overlayEl?.querySelector('.boot-overlay__sub');
    badgeEl = overlayEl?.querySelector('.boot-overlay__badge');
    versionEl = overlayEl?.querySelector('.boot-overlay__version');
    barEl = overlayEl?.querySelector('.boot-overlay__bar');
    barFillEl = overlayEl?.querySelector('.boot-overlay__bar-fill');
    tipEl = overlayEl?.querySelector('.boot-overlay__tip');
    percentEl = overlayEl?.querySelector('.boot-overlay__percent');
    elapsedEl = overlayEl?.querySelector('.boot-overlay__elapsed');

    bootStartedAt = nowMs();
    lastStageAt = bootStartedAt;

    if (versionEl) versionEl.textContent = GAME_VERSION;
    if (barEl) {
        barEl.setAttribute('role', 'progressbar');
        barEl.setAttribute('aria-valuemin', '0');
        barEl.setAttribute('aria-valuemax', '100');
        barEl.setAttribute('aria-valuenow', '0');
        barEl.setAttribute('aria-label', 'Loading progress');
    }

    advanceBootStage('bootstrap');
    startTipRotation();
    startFailsafeTimer();
    startCreep();
    startElapsedTicker();
    startStallWatcher();
}

export function setBootStatus(text) {
    if (labelEl) labelEl.textContent = text;
}

/** Show WebGPU branding on boot overlay (badge + accent styling). */
export function setBootWebGPUMode(active) {
    if (overlayEl) {
        overlayEl.classList.toggle('boot-overlay--webgpu', !!active);
    }
    if (badgeEl) {
        badgeEl.hidden = !active;
    }
    if (!active) {
        setBootSubstatus('');
    }
}

/** Secondary boot line — shader compile detail, etc. */
export function setBootSubstatus(text) {
    if (!subEl) return;
    subEl.textContent = text || '';
    subEl.hidden = !text;
}

export function requireWebGPUBootGate() {
    webgpuGateActive = true;
    webgpuReady = false;
}

export function notifyWebGPUBootReady() {
    advanceBootStage('webgpuReady');
    setBootSubstatus('First present pending');
    webgpuReady = true;
    tryDismissBootOverlay();
}

export function skipWebGPUBootGate() {
    webgpuGateActive = false;
    advanceBootStage('webgpuReady');
    webgpuReady = true;
    tryDismissBootOverlay();
}

export function notifyBootFirstFrame() {
    if (firstFrameReady) return;
    advanceBootStage('firstFrame');
    firstFrameReady = true;
    tryDismissBootOverlay();
}

function bootGatesSatisfied() {
    if (!firstFrameReady) return false;
    if (webgpuGateActive && !webgpuReady) return false;
    return true;
}

function beginSettle() {
    if (settleActive || dismissed) return;
    settleActive = true;
    settleFrame = 0;
    advanceBootStage('settle');
    setBootSubstatus('Flushing GPU command buffers');
    setStallState(0);
    creepCeiling = 100;

    const tick = () => {
        if (dismissed) return;
        settleFrame += 1;
        const settlePct = 96 + (settleFrame / SETTLE_FRAMES) * 4;
        setBootProgress(Math.min(100, settlePct));
        if (settleFrame >= SETTLE_FRAMES) {
            const elapsed = nowMs() - bootStartedAt;
            const waitMore = Math.max(0, MIN_DISPLAY_MS - elapsed);
            if (waitMore > 0) {
                window.setTimeout(finishDismiss, waitMore);
            } else {
                finishDismiss();
            }
            return;
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function finishDismiss() {
    if (dismissed || dismissScheduled) return;
    dismissScheduled = true;
    dismissed = true;
    clearBootTimers();
    setStallState(0);
    perfMark('zombobs:first-draw');
    perfMeasure('zombobs:init-to-first-draw', 'zombobs:main:init:start', 'zombobs:first-draw');

    if (!overlayEl) return;

    overlayEl.setAttribute('aria-busy', 'false');
    overlayEl.classList.add('boot-overlay--done');
    setBootProgress(100);
    setBootStatus('Ready');
    setBootSubstatus('');

    const removeEl = () => {
        if (overlayEl?.parentNode) overlayEl.remove();
    };
    overlayEl.addEventListener('transitionend', removeEl, { once: true });
    window.setTimeout(removeEl, 500);
}

export function tryDismissBootOverlay() {
    if (dismissed || dismissScheduled) return;
    if (!bootGatesSatisfied()) return;
    beginSettle();
}

export function isBootOverlayDismissed() {
    return dismissed;
}

/** True while the boot overlay still covers the screen (incl. fade-out). Use to gate UI input. */
export function isBootOverlayActive() {
    return !dismissed || (overlayEl !== null && overlayEl.isConnected);
}

/** Map WebGPURenderer.init phase callbacks → boot stages. */
export function reportWebGPUBootPhase(phase) {
    if (dismissed) return;
    switch (phase) {
        case 'adapter':
            advanceBootStage('webgpuAdapter');
            setBootSubstatus('navigator.gpu.requestAdapter()');
            break;
        case 'device':
            advanceBootStage('webgpuDevice');
            setBootSubstatus('adapter.requestDevice()');
            break;
        case 'shaders':
            advanceBootStage('webgpuCompile');
            setBootStatus('Compiling WGSL shaders');
            setBootSubstatus('Snow · particles · bloom modules');
            break;
        case 'pipelines':
            advanceBootStage('webgpuBuffers');
            setBootSubstatus('Create pipelines · uniform buffers');
            break;
        case 'done':
            setBootSubstatus('GPU init complete');
            break;
        default:
            break;
    }
}
