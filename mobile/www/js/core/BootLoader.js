import { GAME_VERSION } from './constants.js';

const BOOT_STAGES = {
    bootstrap: { percent: 15, label: 'Starting engine' },
    systems: { percent: 50, label: 'Loading systems' },
    webgpuModule: { percent: 60, label: 'Loading WebGPU module' },
    webgpuCompile: { percent: 70, label: 'Initializing WebGPU' },
    webgpuReady: { percent: 85, label: 'GPU ready' },
    firstFrame: { percent: 100, label: 'Ready' }
};

const BOOT_TIPS = [
    'Press 1–8 to swap weapons mid-fight.',
    'Collect scrap from kills — spend it at wave-break shrines.',
    'Level up to pick skills — corrupted cards are wild but risky.',
    'Sprint with Shift. Reload before the horde closes in.',
    'Co-op and multiplayer — host with friends from the main menu.'
];

const FAILSAFE_MS = 12000;
const TIP_ROTATE_MS = 2500;

let dismissed = false;
let overlayEl = null;
let labelEl = null;
let subEl = null;
let badgeEl = null;
let versionEl = null;
let barEl = null;
let barFillEl = null;
let tipEl = null;
let firstFrameReady = false;
let webgpuReady = false;
let webgpuGateActive = false;
let currentProgress = 0;
let failsafeTimer = null;
let tipTimer = null;
let tipIndex = 0;

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

function clearBootTimers() {
    if (failsafeTimer !== null) {
        window.clearTimeout(failsafeTimer);
        failsafeTimer = null;
    }
    if (tipTimer !== null) {
        window.clearInterval(tipTimer);
        tipTimer = null;
    }
}

function updateBarVisual(percent) {
    if (barFillEl) {
        barFillEl.style.width = `${percent}%`;
    }
    if (barEl) {
        barEl.setAttribute('aria-valuenow', String(Math.round(percent)));
    }
}

export function setBootProgress(percent) {
    const next = Math.max(currentProgress, Math.min(100, percent));
    if (next === currentProgress) return;
    currentProgress = next;
    updateBarVisual(currentProgress);
}

export function advanceBootStage(stageId) {
    const stage = BOOT_STAGES[stageId];
    if (!stage) return;
    setBootProgress(stage.percent);
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
        setBootStatus('Starting anyway…');
        setBootSubstatus('');
        setBootProgress(100);
        tryDismissBootOverlay();
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

export function tryDismissBootOverlay() {
    if (dismissed || !bootGatesSatisfied()) return;

    dismissed = true;
    clearBootTimers();
    perfMark('zombobs:first-draw');
    perfMeasure('zombobs:init-to-first-draw', 'zombobs:main:init:start', 'zombobs:first-draw');

    if (!overlayEl) return;

    overlayEl.setAttribute('aria-busy', 'false');
    overlayEl.classList.add('boot-overlay--done');

    const removeEl = () => {
        if (overlayEl?.parentNode) overlayEl.remove();
    };
    overlayEl.addEventListener('transitionend', removeEl, { once: true });
    window.setTimeout(removeEl, 450);
}

export function isBootOverlayDismissed() {
    return dismissed;
}
