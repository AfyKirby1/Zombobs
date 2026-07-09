import { GamepadState } from './InputSystem.js';

/** Read CSS env(safe-area-inset-*) via measured custom props on :root */
function getSafeInsets() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    const root = document.documentElement;
    const read = (prop) => {
        const raw = getComputedStyle(root).getPropertyValue(prop).trim();
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : 0;
    };
    return {
        top: read('--sat') || read('--safe-top'),
        right: read('--sar') || read('--safe-right'),
        bottom: read('--sab') || read('--safe-bottom'),
        left: read('--sal') || read('--safe-left')
    };
}

export class TouchControlSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.active = false;

        // Virtual Gamepad State (mimics a physical controller)
        this.virtualState = new GamepadState();

        // Configuration
        this.joystickRadius = 45;
        this.joystickInnerRadius = 20;
        this.buttonRadius = 30;
        this.padding = 60;

        // Touch tracking
        this.touches = new Map();

        // Controls definition
        this.controls = {
            leftStick: {
                id: 'leftStick',
                x: 100, y: 0,
                active: false,
                touchId: null,
                value: { x: 0, y: 0 }
            },
            rightStick: {
                id: 'rightStick',
                x: 0, y: 0,
                active: false,
                touchId: null,
                value: { x: 0, y: 0 }
            },
            reload: { id: 'reload', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'R' },
            grenade: { id: 'grenade', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'G' },
            melee: { id: 'melee', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'M' },
            interact: { id: 'interact', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'E' },
            nextWeapon: { id: 'nextWeapon', x: 0, y: 0, radius: 22, active: false, touchId: null, label: 'W+' },
            prevWeapon: { id: 'prevWeapon', x: 0, y: 0, radius: 22, active: false, touchId: null, label: 'W-' },
            flashlight: { id: 'flashlight', x: 0, y: 0, radius: 25, active: false, touchId: null, label: '🔦' }
        };

        this.initEvents();
        this.resize();
    }

    initEvents() {
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 100);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.active) {
                this._resetAllControls();
            }
        });
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const insets = getSafeInsets();

        const rect = this.canvas.getBoundingClientRect();
        const dpr = rect.width > 0 ? this.canvas.width / rect.width : 1;

        const shiftX = Math.max(0, this.padding - 40);
        const shiftY = Math.max(0, this.padding - 40);
        const leftPad = 80 + shiftX + insets.left;
        const rightPad = shiftX + insets.right;
        const bottomPad = 120 + shiftY + insets.bottom;
        const topPad = 40 + insets.top;

        this.controls.leftStick.x = leftPad;
        this.controls.leftStick.y = h - bottomPad;

        this.controls.rightStick.x = w - 220 - rightPad;
        this.controls.rightStick.y = h - bottomPad;

        this.controls.reload.x = w - 280 - rightPad;
        this.controls.reload.y = h - 180 - shiftY - insets.bottom;

        this.controls.grenade.x = w - 220 - rightPad;
        this.controls.grenade.y = h - 200 - shiftY - insets.bottom;

        this.controls.melee.x = w - 340 - rightPad;
        this.controls.melee.y = h - bottomPad;

        // Interact near left stick (scrap shrine / E)
        this.controls.interact.x = leftPad + 90;
        this.controls.interact.y = h - bottomPad - 70;

        // Weapon cycle above right cluster
        this.controls.prevWeapon.x = w - 340 - rightPad;
        this.controls.prevWeapon.y = h - 200 - shiftY - insets.bottom;
        this.controls.nextWeapon.x = w - 280 - rightPad;
        this.controls.nextWeapon.y = h - 240 - shiftY - insets.bottom;

        // Flashlight top-right (pause lives on GameHUD to avoid double hitboxes)
        this.controls.flashlight.x = w - 40 - insets.right;
        this.controls.flashlight.y = topPad + 60;

        this.scale = dpr;
    }

    handleTouchStart(e) {
        if (!this.active) return;
        if (e.cancelable) e.preventDefault();
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'start');
        }
    }

    handleTouchMove(e) {
        if (!this.active) return;
        if (e.cancelable) e.preventDefault();
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'move');
        }
    }

    handleTouchEnd(e) {
        if (!this.active) return;
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'end');
        }
    }

    setActive(active) {
        this.active = active;
        if (!active) {
            this._resetAllControls();
        } else {
            this.resize();
        }
    }

    _resetAllControls() {
        this.virtualState.resetJustPressed();
        const names = ['fire', 'reload', 'grenade', 'melee', 'pause', 'flashlight',
            'interact', 'prevWeapon', 'nextWeapon'];
        for (let i = 0; i < names.length; i++) {
            const btn = this.virtualState.buttons[names[i]];
            if (btn) {
                btn.pressed = false;
                btn.justPressed = false;
            }
        }
        this.virtualState.axes.move.x = 0;
        this.virtualState.axes.move.y = 0;
        this.virtualState.axes.aim.x = 0;
        this.virtualState.axes.aim.y = 0;

        const keys = Object.keys(this.controls);
        for (let i = 0; i < keys.length; i++) {
            const c = this.controls[keys[i]];
            c.active = false;
            c.touchId = null;
            if (c.value) {
                c.value.x = 0;
                c.value.y = 0;
            }
        }
    }

    /**
     * Per-frame edge sync — call once at start of game update before reading buttons.
     * Sets justPressed from active edges (gamepad-compatible).
     */
    tick() {
        if (!this.active) return;
        this.updateVirtualState();
    }

    processTouch(touch, phase) {
        const x = touch.clientX;
        const y = touch.clientY;
        const id = touch.identifier;

        if (phase === 'start') {
            // Skip HUD-reserved taps (pause / weapon / grenade sidebars) — handled by main.js
            if (this._isHudReservedTouch(x, y)) return;

            if (this.checkButtonHit(this.controls.reload, x, y, id)) return;
            if (this.checkButtonHit(this.controls.grenade, x, y, id)) return;
            if (this.checkButtonHit(this.controls.melee, x, y, id)) return;
            if (this.checkButtonHit(this.controls.interact, x, y, id)) return;
            if (this.checkButtonHit(this.controls.nextWeapon, x, y, id)) return;
            if (this.checkButtonHit(this.controls.prevWeapon, x, y, id)) return;
            if (this.checkButtonHit(this.controls.flashlight, x, y, id)) return;

            if (this.checkStickHit(this.controls.leftStick, x, y, id)) return;
            if (this.checkStickHit(this.controls.rightStick, x, y, id)) return;

            const midX = window.innerWidth / 2;

            if (x < midX) {
                if (!this.controls.leftStick.active) {
                    this.controls.leftStick.active = true;
                    this.controls.leftStick.touchId = id;
                    this.updateStickValue(this.controls.leftStick, x, y);
                }
            } else if (!this.controls.rightStick.active) {
                this.controls.rightStick.active = true;
                this.controls.rightStick.touchId = id;
                this.updateStickValue(this.controls.rightStick, x, y);
            }
        } else if (phase === 'move') {
            if (this.controls.leftStick.active && this.controls.leftStick.touchId === id) {
                this.updateStickValue(this.controls.leftStick, x, y);
            }
            if (this.controls.rightStick.active && this.controls.rightStick.touchId === id) {
                this.updateStickValue(this.controls.rightStick, x, y);
            }
        } else if (phase === 'end') {
            this.resetControl(this.controls.leftStick, id);
            this.resetControl(this.controls.rightStick, id);
            this.resetControl(this.controls.reload, id);
            this.resetControl(this.controls.grenade, id);
            this.resetControl(this.controls.melee, id);
            this.resetControl(this.controls.interact, id);
            this.resetControl(this.controls.nextWeapon, id);
            this.resetControl(this.controls.prevWeapon, id);
            this.resetControl(this.controls.flashlight, id);
        }
        // Virtual state synced once per frame in tick() — avoids eating justPressed
    }

    _isHudReservedTouch(x, y) {
        const hud = typeof window !== 'undefined' ? window.gameHUD : null;
        if (!hud || !hud.isMobile || !hud.isMobile()) return false;

        const rect = this.canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const cx = (x - rect.left) * (this.canvas.width / rect.width);
        const cy = (y - rect.top) * (this.canvas.height / rect.height);
        const pad = 20;

        if (hud.pauseButtonBounds) {
            const b = hud.pauseButtonBounds;
            if (cx >= b.x - pad && cx <= b.x + b.width + pad &&
                cy >= b.y - pad && cy <= b.y + b.height + pad) {
                return true;
            }
        }

        if (hud.mobileBounds) {
            const zones = [hud.mobileBounds.weapon, hud.mobileBounds.grenade];
            for (let i = 0; i < zones.length; i++) {
                const z = zones[i];
                if (!z) continue;
                if (cx >= z.x - pad && cx <= z.x + z.w + pad &&
                    cy >= z.y - pad && cy <= z.y + z.h + pad) {
                    return true;
                }
            }
        }
        return false;
    }

    checkButtonHit(btn, x, y, touchId) {
        const hitR = btn.radius + 20;
        const dx = x - btn.x;
        const dy = y - btn.y;
        if (dx * dx + dy * dy < hitR * hitR) {
            btn.active = true;
            btn.touchId = touchId;
            return true;
        }
        return false;
    }

    checkStickHit(stick, x, y, touchId) {
        const dx = x - stick.x;
        const dy = y - stick.y;
        const hitR = this.joystickRadius * 2;
        if (dx * dx + dy * dy < hitR * hitR) {
            stick.active = true;
            stick.touchId = touchId;
            this.updateStickValue(stick, x, y);
            return true;
        }
        return false;
    }

    updateStickValue(stick, x, y) {
        let dx = x - stick.x;
        let dy = y - stick.y;

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > this.joystickRadius) {
            const scale = this.joystickRadius / len;
            dx *= scale;
            dy *= scale;
        }

        stick.value.x = dx / this.joystickRadius;
        stick.value.y = dy / this.joystickRadius;
    }

    resetControl(control, touchId) {
        if (control.touchId === touchId) {
            control.active = false;
            control.touchId = null;
            if (control.value) {
                control.value.x = 0;
                control.value.y = 0;
            }
        }
    }

    _syncButton(name, active) {
        const btn = this.virtualState.buttons[name];
        if (!btn) return;
        btn.justPressed = active && !btn.pressed;
        btn.pressed = active;
    }

    updateVirtualState() {
        const state = this.virtualState;

        state.axes.move.x = this.controls.leftStick.value.x;
        state.axes.move.y = this.controls.leftStick.value.y;

        state.axes.aim.x = this.controls.rightStick.value.x;
        state.axes.aim.y = this.controls.rightStick.value.y;

        const aimMag = Math.sqrt(state.axes.aim.x ** 2 + state.axes.aim.y ** 2);
        this._syncButton('fire', aimMag > 0.3);

        this._syncButton('reload', this.controls.reload.active);
        this._syncButton('grenade', this.controls.grenade.active);
        this._syncButton('melee', this.controls.melee.active);
        this._syncButton('interact', this.controls.interact.active);
        this._syncButton('prevWeapon', this.controls.prevWeapon.active);
        this._syncButton('nextWeapon', this.controls.nextWeapon.active);
        this._syncButton('flashlight', this.controls.flashlight.active);
    }

    getVirtualState() {
        return this.virtualState;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const dpr = this.scale || 1;

        this.drawStick(ctx, this.controls.leftStick, dpr);
        this.drawStick(ctx, this.controls.rightStick, dpr);

        this.drawButton(ctx, this.controls.reload, dpr);
        this.drawButton(ctx, this.controls.grenade, dpr);
        this.drawButton(ctx, this.controls.melee, dpr);
        this.drawButton(ctx, this.controls.interact, dpr);
        this.drawButton(ctx, this.controls.prevWeapon, dpr);
        this.drawButton(ctx, this.controls.nextWeapon, dpr);
        this.drawButton(ctx, this.controls.flashlight, dpr);

        ctx.restore();
    }

    drawStick(ctx, stick, dpr = 1) {
        const x = stick.x * dpr;
        const y = stick.y * dpr;
        const outerRadius = this.joystickRadius * dpr;
        const innerRadius = this.joystickInnerRadius * dpr;

        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        const knobX = x + stick.value.x * outerRadius;
        const knobY = y + stick.value.y * outerRadius;
        ctx.arc(knobX, knobY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = stick.active ? 'rgba(255, 23, 68, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    drawButton(ctx, btn, dpr = 1) {
        const x = btn.x * dpr;
        const y = btn.y * dpr;
        const radius = btn.radius * dpr;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = btn.active ? 'rgba(255, 23, 68, 0.6)' : 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        ctx.fillStyle = 'white';
        const fontSize = btn.label.length > 1 ? 12 : 16;
        ctx.font = `bold ${fontSize * dpr}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, x, y);
    }
}
