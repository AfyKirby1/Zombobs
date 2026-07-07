let dismissed = false;
let overlayEl = null;
let labelEl = null;
let subEl = null;
let badgeEl = null;
let firstFrameReady = false;
let webgpuReady = false;
let webgpuGateActive = false;

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

export function initBootLoader() {
    overlayEl = document.getElementById('boot-overlay');
    labelEl = overlayEl?.querySelector('.boot-overlay__label');
    subEl = overlayEl?.querySelector('.boot-overlay__sub');
    badgeEl = overlayEl?.querySelector('.boot-overlay__badge');
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
    webgpuReady = true;
    tryDismissBootOverlay();
}

export function skipWebGPUBootGate() {
    webgpuGateActive = false;
    webgpuReady = true;
    tryDismissBootOverlay();
}

export function notifyBootFirstFrame() {
    if (firstFrameReady) return;
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
