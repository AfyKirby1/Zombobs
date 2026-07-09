/**
 * Ambient main-menu horror: zombie hand slams the background and drags it down.
 */

const PHASES = [
    { id: 'anticipation', duration: 280 },
    { id: 'slam', duration: 140 },
    { id: 'drag', duration: 1050 },
    { id: 'strain', duration: 380 },
    { id: 'release', duration: 480 },
    { id: 'retreat', duration: 650 }
];

const FIRST_SPAWN_DELAY = 11000;
const SPAWN_COOLDOWN_MIN = 26000;
const SPAWN_COOLDOWN_MAX = 52000;

function easeInCubic(t) {
    return t * t * t;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

export class MenuHandHorrorEffect {
    constructor(getCanvas) {
        this.getCanvas = getCanvas;
        this.event = null;
        this.drips = [];
        this.splatters = [];
        this.scratchMarks = [];
        this.menuEnteredAt = Date.now();
        this.nextSpawnAt = this.menuEnteredAt + FIRST_SPAWN_DELAY;
    }

    reset() {
        this.event = null;
        this.drips = [];
        this.splatters = [];
        this.scratchMarks = [];
        this.menuEnteredAt = Date.now();
        this.nextSpawnAt = this.menuEnteredAt + FIRST_SPAWN_DELAY;
    }

    update(isMobile) {
        if (isMobile) return;

        const canvas = this.getCanvas();
        const width = canvas.width;
        const height = canvas.height;
        const now = Date.now();

        if (!this.event && now >= this.nextSpawnAt) {
            this._spawnEvent(width, height);
        }

        if (this.event) {
            this._advanceEvent(now, width, height);
        }

        this._updateDrips(height);
        this._updateSplatters();
    }

    _spawnEvent(width, height) {
        const margin = width * 0.18;
        this.event = {
            startTime: Date.now(),
            x: margin + Math.random() * (width - margin * 2),
            maxDrag: 55 + Math.random() * 45,
            handScale: 0.85 + Math.random() * 0.35,
            side: Math.random() > 0.5 ? 1 : -1
        };
        this.scratchMarks = [];
        this.nextSpawnAt = Date.now() + SPAWN_COOLDOWN_MIN +
            Math.random() * (SPAWN_COOLDOWN_MAX - SPAWN_COOLDOWN_MIN);
    }

    _getPhase(elapsed) {
        let t = elapsed;
        for (const phase of PHASES) {
            if (t < phase.duration) {
                return { ...phase, localT: t / phase.duration };
            }
            t -= phase.duration;
        }
        return null;
    }

    _advanceEvent(now, width, height) {
        const elapsed = now - this.event.startTime;
        const phase = this._getPhase(elapsed);

        if (!phase) {
            this.event = null;
            return;
        }

        const e = this.event;
        const lt = phase.localT;

        if (phase.id === 'slam' && lt < 0.15 && !e.impactFired) {
            e.impactFired = true;
            this._burstBlood(e.x, 20, 18, 0.75, 5);
            this._addScratches(e.x, 0, 8 + Math.floor(Math.random() * 5));
        }

        if (phase.id === 'drag') {
            if (Math.random() < 0.35) {
                this._spawnDrip(e.x + (Math.random() - 0.5) * 50, e.bgDragY || 0);
            }
            if (lt > 0.1 && Math.random() < 0.08) {
                this._addScratches(e.x + (Math.random() - 0.5) * 70, e.bgDragY || 0, 2);
            }
        }

        if (phase.id === 'strain' && Math.random() < 0.25) {
            this._spawnDrip(e.x + (Math.random() - 0.5) * 40, e.bgDragY || 0);
        }

        if (phase.id === 'release' && lt < 0.12 && !e.releaseFired) {
            e.releaseFired = true;
            this._burstBlood(e.x, e.bgDragY || 0, 12, 0.5, 3);
        }
    }

    _burstBlood(x, y, count, speed, sizeBase) {
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
            const speedMag = speed * (0.4 + Math.random() * 0.8);
            this.splatters.push({
                x,
                y,
                vx: Math.cos(angle) * speedMag,
                vy: Math.sin(angle) * speedMag,
                life: 25 + Math.random() * 20,
                maxLife: 45,
                size: sizeBase + Math.random() * sizeBase
            });
        }
    }

    _spawnDrip(x, tearY) {
        this.drips.push({
            x,
            y: tearY + Math.random() * 6,
            vy: 0.6 + Math.random() * 1.4,
            length: 8 + Math.random() * 18,
            width: 1 + Math.random() * 2,
            life: 80 + Math.random() * 60,
            maxLife: 140
        });
    }

    _addScratches(centerX, tearY, count) {
        for (let i = 0; i < count; i++) {
            this.scratchMarks.push({
                x: centerX + (Math.random() - 0.5) * 90,
                y: tearY + (Math.random() - 0.5) * 8,
                len: 20 + Math.random() * 50,
                angle: Math.PI / 2 + (Math.random() - 0.5) * 0.5,
                alpha: 0.25 + Math.random() * 0.35,
                life: 120 + Math.random() * 80,
                maxLife: 200
            });
        }
    }

    _updateDrips(height) {
        for (let i = this.drips.length - 1; i >= 0; i--) {
            const d = this.drips[i];
            d.y += d.vy;
            d.vy += 0.04;
            d.life--;
            if (d.life <= 0 || d.y > height + 20) {
                this.drips.splice(i, 1);
            }
        }
    }

    _updateSplatters() {
        for (let i = this.splatters.length - 1; i >= 0; i--) {
            const s = this.splatters[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.35;
            s.vx *= 0.92;
            s.life--;
            if (s.life <= 0) {
                this.splatters.splice(i, 1);
            }
        }

        for (let i = this.scratchMarks.length - 1; i >= 0; i--) {
            this.scratchMarks[i].life--;
            if (this.scratchMarks[i].life <= 0) {
                this.scratchMarks.splice(i, 1);
            }
        }
    }

    getRenderState() {
        const defaults = {
            bgDragY: 0,
            shakeX: 0,
            shakeY: 0,
            handVisible: false,
            handX: 0,
            handY: 0,
            handScale: 1,
            handSide: 1,
            handCurl: 0,
            handAlpha: 1,
            tearX: 0,
            tearIntensity: 0,
            impactFlash: 0
        };

        if (!this.event) return defaults;

        const now = Date.now();
        const elapsed = now - this.event.startTime;
        const phase = this._getPhase(elapsed);
        if (!phase) return defaults;

        const e = this.event;
        const lt = phase.localT;
        const state = { ...defaults, tearX: e.x };

        if (phase.id === 'anticipation') {
            state.tearIntensity = easeOutCubic(lt) * 0.45;
            state.shakeX = Math.sin(now * 0.04) * 1.5 * lt;
            state.shakeY = Math.sin(now * 0.05) * 1 * lt;
        } else if (phase.id === 'slam') {
            const slamT = easeInCubic(lt);
            state.handVisible = true;
            state.handY = lerp(-130, 28, slamT);
            state.handX = e.x;
            state.handSide = e.side;
            state.handScale = e.handScale * (0.9 + slamT * 0.15);
            state.handCurl = slamT * 0.55;
            state.handAlpha = Math.min(1, lt * 4);
            state.bgDragY = slamT > 0.85 ? (slamT - 0.85) / 0.15 * 8 : 0;
            state.tearIntensity = 0.5 + slamT * 0.5;
            state.impactFlash = lt > 0.7 ? (1 - (lt - 0.7) / 0.3) * 0.35 : 0;
            const impact = lt > 0.75 ? (lt - 0.75) / 0.25 : 0;
            state.shakeX = Math.sin(now * 0.35) * 10 * (1 - impact);
            state.shakeY = Math.sin(now * 0.28) * 8 * (1 - impact);
            e.bgDragY = state.bgDragY;
        } else if (phase.id === 'drag') {
            const dragT = easeOutCubic(lt);
            state.handVisible = true;
            state.bgDragY = lerp(8, e.maxDrag, dragT);
            state.handY = state.bgDragY - 8;
            state.handX = e.x;
            state.handSide = e.side;
            state.handScale = e.handScale;
            state.handCurl = 0.75 + dragT * 0.2;
            state.handAlpha = 1;
            state.tearIntensity = 1;
            state.shakeX = Math.sin(now * 0.06) * 2;
            state.shakeY = Math.sin(now * 0.07) * 1.5;
            e.bgDragY = state.bgDragY;
        } else if (phase.id === 'strain') {
            const wobble = Math.sin(now * 0.018) * 4;
            state.handVisible = true;
            state.bgDragY = e.maxDrag + wobble;
            state.handY = state.bgDragY - 10 + Math.sin(now * 0.02) * 2;
            state.handX = e.x + Math.sin(now * 0.015) * 3;
            state.handSide = e.side;
            state.handScale = e.handScale;
            state.handCurl = 0.95;
            state.handAlpha = 1;
            state.tearIntensity = 1;
            state.shakeX = Math.sin(now * 0.08) * 3.5;
            state.shakeY = Math.sin(now * 0.09) * 2.5;
            e.bgDragY = state.bgDragY;
        } else if (phase.id === 'release') {
            const relT = easeOutBack(lt);
            state.handVisible = true;
            state.bgDragY = lerp(e.maxDrag, 0, relT);
            state.handY = state.bgDragY - 12;
            state.handX = e.x;
            state.handSide = e.side;
            state.handScale = e.handScale;
            state.handCurl = lerp(0.95, 0.35, lt);
            state.handAlpha = 1;
            state.tearIntensity = 1 - lt * 0.6;
            state.shakeX = Math.sin(now * 0.12) * 4 * (1 - lt);
            e.bgDragY = state.bgDragY;
        } else if (phase.id === 'retreat') {
            state.handVisible = true;
            state.handY = lerp(e.maxDrag - 20, -150, easeInCubic(lt));
            state.handX = e.x;
            state.handSide = e.side;
            state.handScale = e.handScale * (1 - lt * 0.15);
            state.handCurl = 0.2;
            state.handAlpha = 1 - easeOutCubic(lt);
            state.bgDragY = 0;
            state.tearIntensity = (1 - lt) * 0.4;
            e.bgDragY = 0;
        }

        return state;
    }

    drawTearZone(ctx, width, height, state) {
        if (state.bgDragY <= 0 && state.tearIntensity <= 0 && this.drips.length === 0 &&
            this.splatters.length === 0 && this.scratchMarks.length === 0) {
            return;
        }

        ctx.save();

        if (state.bgDragY > 0 || state.tearIntensity > 0) {
            const tearH = Math.max(state.bgDragY, state.tearIntensity * 18);
            const voidGrad = ctx.createLinearGradient(0, 0, 0, tearH + 30);
            voidGrad.addColorStop(0, '#050000');
            voidGrad.addColorStop(0.45, '#1a0000');
            voidGrad.addColorStop(1, 'rgba(40, 0, 0, 0.85)');
            ctx.fillStyle = voidGrad;
            ctx.fillRect(0, 0, width, tearH + 24);

            const edgeY = state.bgDragY;
            if (edgeY > 0) {
                ctx.strokeStyle = 'rgba(80, 0, 0, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let x = 0; x <= width; x += 6) {
                    const jag = Math.sin(x * 0.08 + state.tearX * 0.02) * 4 +
                        Math.sin(x * 0.19) * 2;
                    if (x === 0) ctx.moveTo(x, edgeY + jag);
                    else ctx.lineTo(x, edgeY + jag);
                }
                ctx.stroke();

                const bloodEdge = ctx.createLinearGradient(0, edgeY - 4, 0, edgeY + 22);
                bloodEdge.addColorStop(0, 'rgba(120, 0, 0, 0.8)');
                bloodEdge.addColorStop(1, 'rgba(60, 0, 0, 0)');
                ctx.fillStyle = bloodEdge;
                ctx.fillRect(0, edgeY - 2, width, 24);
            }
        }

        if (state.impactFlash > 0) {
            ctx.fillStyle = `rgba(180, 20, 20, ${state.impactFlash})`;
            ctx.fillRect(0, 0, width, height);
        }

        this._drawImpactRing(ctx, width, height, state);

        for (const mark of this.scratchMarks) {
            const alpha = mark.alpha * (mark.life / mark.maxLife);
            ctx.strokeStyle = `rgba(140, 10, 10, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(mark.x, mark.y);
            ctx.lineTo(
                mark.x + Math.cos(mark.angle) * mark.len,
                mark.y + Math.sin(mark.angle) * mark.len
            );
            ctx.stroke();
        }

        for (const s of this.splatters) {
            const alpha = (s.life / s.maxLife) * 0.85;
            ctx.fillStyle = `rgba(100, 0, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const d of this.drips) {
            const alpha = (d.life / d.maxLife) * 0.9;
            const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.length);
            grad.addColorStop(0, `rgba(140, 0, 0, ${alpha})`);
            grad.addColorStop(1, `rgba(60, 0, 0, 0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = d.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x + Math.sin(d.y * 0.1) * 2, d.y + d.length);
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawImpactRing(ctx, width, height, state) {
        if (state.impactFlash <= 0) return;
        const cx = state.tearX;
        const cy = state.bgDragY > 0 ? state.bgDragY : 0;
        const radius = 20 + (1 - state.impactFlash) * 120;
        const alpha = state.impactFlash * 0.55;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 60, 40, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, Math.max(4, radius * 0.25), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    drawHand(ctx, state) {
        if (!state.handVisible || state.handAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = state.handAlpha;
        ctx.translate(state.handX, state.handY);
        ctx.scale(state.handScale * state.handSide, state.handScale);

        const curl = state.handCurl;
        const skin = '#8a9a7a';
        const skinDark = '#4a5a42';
        const skinLight = '#a0b090';
        const skinRot = '#5a6a4a';
        const blood = '#6b0000';

        const drawFinger = (fx, fy, fw, fh, curlAmt) => {
            const tipY = fy - fh * (0.5 + curlAmt * 0.35);
            const midX = fx + fw * 0.5;

            // shadow depth
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.moveTo(fx + 2, fy + 2);
            ctx.quadraticCurveTo(fx + fw * 0.3 + 2, fy - fh * 0.4 + 2, fx + fw * 0.15 + 2, tipY + 2);
            ctx.quadraticCurveTo(fx + fw * 0.5 + 2, tipY + fh * 0.15 + 2, fx + fw + 2, fy + 2);
            ctx.closePath();
            ctx.fill();

            // finger base
            ctx.fillStyle = skin;
            ctx.strokeStyle = skinDark;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(fx + fw * 0.3, fy - fh * 0.4, fx + fw * 0.15, tipY);
            ctx.quadraticCurveTo(fx + fw * 0.5, tipY + fh * 0.15, fx + fw, fy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // knuckle joint
            ctx.fillStyle = skinRot;
            ctx.beginPath();
            ctx.arc(midX, fy - fh * 0.25, fw * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // torn nail
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.moveTo(fx + fw * 0.1, tipY + 2);
            ctx.lineTo(fx + fw * 0.45, tipY - 2);
            ctx.lineTo(fx + fw * 0.8, tipY + 3);
            ctx.closePath();
            ctx.fill();

            // bloodied fingertip
            ctx.fillStyle = blood;
            ctx.globalAlpha = state.handAlpha * 0.55;
            ctx.beginPath();
            ctx.arc(midX, tipY + 2, fw * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = state.handAlpha;
        };

        // shadow cast behind the hand (screen glass effect)
        ctx.save();
        ctx.translate(10, 14);
        ctx.scale(1, 0.65);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // wrist/forearm with torn sleeve edge
        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.moveTo(-18, -30);
        ctx.lineTo(18, -30);
        ctx.lineTo(23, 25);
        ctx.lineTo(-8, 22);
        ctx.lineTo(-23, 25);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // rotting patch on wrist
        ctx.fillStyle = 'rgba(40, 30, 30, 0.55)';
        ctx.beginPath();
        ctx.ellipse(6, -10, 7, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // palm
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(0, 8, 24, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // knuckle bumps
        const knuckleY = -4;
        for (const kx of [-15, -6, 3, 12]) {
            ctx.fillStyle = skinLight;
            ctx.beginPath();
            ctx.arc(kx, knuckleY, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = skinDark;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // palm crease lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(0, 8, 12, 2);
        ctx.stroke();

        drawFinger(-21, -2, 9, 28, curl);
        drawFinger(-10, -6, 9, 32, curl);
        drawFinger(1, -6, 9, 31, curl);
        drawFinger(12, -2, 9, 27, curl);

        // thumb
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(-25, 14, 10, 13, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // thumb nail
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(-30, 10, 3.5, 4.5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // blood pool on palm
        ctx.fillStyle = blood;
        ctx.globalAlpha = state.handAlpha * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 16, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = blood;
            ctx.fillRect(-14 + i * 8, 18, 3, 5 + curl * 8);
        }

        // glass sheen highlight
        ctx.globalAlpha = state.handAlpha * 0.2;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(-9, 2, 11, 5, 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
