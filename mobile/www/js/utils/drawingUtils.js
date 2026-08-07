import { gameState } from '../core/gameState.js';
import { canvas, ctx } from '../core/canvas.js';
import { MELEE_RANGE } from '../core/constants.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { cameraSystem } from '../systems/CameraSystem.js';
import { isCampaignMode } from './gameUtils.js';

/**
 * Drawing utility functions for UI elements and visual effects
 */

/**
 * Draw melee swipe animation
 */
export function drawMeleeSwipe(player) {
    const now = Date.now();
    const elapsed = now - player.activeMeleeSwipe.startTime;
    const progress = Math.min(elapsed / player.activeMeleeSwipe.duration, 1);

    const startAngle = player.activeMeleeSwipe.angle - Math.PI * 0.4; // Match wider arc
    const endAngle = player.activeMeleeSwipe.angle + Math.PI * 0.4;
    const currentAngle = startAngle + (endAngle - startAngle) * progress;

    const swipeRadius = MELEE_RANGE;

    ctx.save();

    // Create gradient for the swipe
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, swipeRadius);
    gradient.addColorStop(0, 'rgba(255, 170, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 170, 0, 0.6)');

    // Draw filled sector
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.lineTo(player.x, player.y);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw outer edge glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.stroke();

    // Draw tip spark
    const tipX = player.x + Math.cos(currentAngle) * swipeRadius;
    const tipY = player.y + Math.sin(currentAngle) * swipeRadius;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw crosshair at mouse position
 */
export function drawCrosshair(mouse) {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby) return;

    // Cache settings at function start to avoid repeated lookups
    const cachedDynamicCrosshair = settingsManager.getSetting('video', 'dynamicCrosshair') ?? true;
    const cachedCrosshairStyle = settingsManager.getSetting('video', 'crosshairStyle') || 'default';

    // Find local player (mouse user)
    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
    if (!localPlayer) return;

    if (mouse.x < 0 || mouse.x > canvas.width || mouse.y < 0 || mouse.y > canvas.height) return;

    let crosshairX = mouse.x;
    let crosshairY = mouse.y;
    if (localPlayer.sirenJitterUntil && localPlayer.sirenJitterUntil > Date.now()) {
        crosshairX += (Math.random() - 0.5) * 18;
        crosshairY += (Math.random() - 0.5) * 18;
    }

    ctx.save();

    // Subtle drop shadow so the crosshair stays visible on bright backgrounds
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Get crosshair settings
    const crosshairColorHex = settingsManager.getSetting('video', 'crosshairColor') || '#00ff00';
    const crosshairSizeMult = settingsManager.getSetting('video', 'crosshairSize') ?? 1.0;
    const crosshairOpacity = settingsManager.getSetting('video', 'crosshairOpacity') ?? 1.0;
    
    // Convert hex to rgba helper
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    const baseCrosshairSize = 12 * crosshairSizeMult;
    const crosshairLineWidth = 2;
    const crosshairColor = hexToRgba(crosshairColorHex, crosshairOpacity);
    const crosshairOutlineColor = `rgba(0, 0, 0, ${crosshairOpacity * 0.8})`; // Outline with reduced opacity

    const crosshairColorCurrent = localPlayer.isReloading ? hexToRgba('#888888', crosshairOpacity) : crosshairColor;

    // Dynamic crosshair: expand when moving or shooting
    let crosshairSize = baseCrosshairSize;
    const dynamicCrosshair = cachedDynamicCrosshair;

    if (dynamicCrosshair && localPlayer) {
        const player = localPlayer;
        // Check if player is moving (approximate by checking if they moved recently)
        const isMoving = Math.abs(player.x - (player.lastX || player.x)) > 0.1 ||
            Math.abs(player.y - (player.lastY || player.y)) > 0.1;
        player.lastX = player.x;
        player.lastY = player.y;

        // Expand crosshair when moving or recently shot
        const timeSinceLastShot = Date.now() - (player.lastShotTime || 0);
        const recentlyShot = timeSinceLastShot < 200; // 200ms after shooting

        if (isMoving || recentlyShot) {
            const expansion = isMoving ? 4 : (recentlyShot ? 6 : 0);
            crosshairSize = baseCrosshairSize + expansion;
        }
    }

    // Get crosshair style from cached settings
    const crosshairStyle = cachedCrosshairStyle;

    // Draw based on style
    if (crosshairStyle === 'dot') {
        // ── Premium dot crosshair ──
        // Outer ring
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = crosshairLineWidth + 1.5;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, 5 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.stroke();

        // Inner filled dot
        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, 3 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.fill();

        // Bright center pip
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = crosshairOpacity * 0.6;
        ctx.beginPath();
        ctx.arc(crosshairX - 0.5, crosshairY - 0.5, 1 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

    } else if (crosshairStyle === 'circle') {
        // ── Premium circle crosshair ──
        const gap = 3 * crosshairSizeMult;

        // Outline ring
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = crosshairLineWidth + 2;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, crosshairSize, 0, Math.PI * 2);
        ctx.stroke();

        // Colored ring
        ctx.strokeStyle = crosshairColorCurrent;
        ctx.lineWidth = crosshairLineWidth;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, crosshairSize, 0, Math.PI * 2);
        ctx.stroke();

        // Four cardinal tick marks (inside the circle)
        ctx.strokeStyle = crosshairColorCurrent;
        ctx.lineWidth = crosshairLineWidth;
        ctx.lineCap = 'round';
        const innerTick = crosshairSize * 0.55;
        const outerTick = crosshairSize * 0.85;
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx, dy] of dirs) {
            // Outline
            ctx.strokeStyle = crosshairOutlineColor;
            ctx.lineWidth = crosshairLineWidth + 2;
            ctx.beginPath();
            ctx.moveTo(crosshairX + dx * innerTick, crosshairY + dy * innerTick);
            ctx.lineTo(crosshairX + dx * outerTick, crosshairY + dy * outerTick);
            ctx.stroke();
            // Fill
            ctx.strokeStyle = crosshairColorCurrent;
            ctx.lineWidth = crosshairLineWidth;
            ctx.beginPath();
            ctx.moveTo(crosshairX + dx * innerTick, crosshairY + dy * innerTick);
            ctx.lineTo(crosshairX + dx * outerTick, crosshairY + dy * outerTick);
            ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, 1.8 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.fill();

    } else if (crosshairStyle === 'cross') {
        // ── Premium cross (no center dot, gapped) ──
        const gap = 3 * crosshairSizeMult;
        ctx.lineCap = 'round';

        // Four arms with gap
        const arms = [
            [crosshairX - crosshairSize, crosshairY, crosshairX - gap, crosshairY],
            [crosshairX + gap, crosshairY, crosshairX + crosshairSize, crosshairY],
            [crosshairX, crosshairY - crosshairSize, crosshairX, crosshairY - gap],
            [crosshairX, crosshairY + gap, crosshairX, crosshairY + crosshairSize],
        ];

        for (const [x1, y1, x2, y2] of arms) {
            // Outline
            ctx.strokeStyle = crosshairOutlineColor;
            ctx.lineWidth = crosshairLineWidth + 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            // Fill
            ctx.strokeStyle = crosshairColorCurrent;
            ctx.lineWidth = crosshairLineWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

    } else {
        // ── Default: cross with center dot, gapped arms ──
        const gap = 3 * crosshairSizeMult;
        ctx.lineCap = 'round';

        // Four arms with gap
        const arms = [
            [crosshairX - crosshairSize, crosshairY, crosshairX - gap, crosshairY],
            [crosshairX + gap, crosshairY, crosshairX + crosshairSize, crosshairY],
            [crosshairX, crosshairY - crosshairSize, crosshairX, crosshairY - gap],
            [crosshairX, crosshairY + gap, crosshairX, crosshairY + crosshairSize],
        ];

        for (const [x1, y1, x2, y2] of arms) {
            // Outline
            ctx.strokeStyle = crosshairOutlineColor;
            ctx.lineWidth = crosshairLineWidth + 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            // Fill
            ctx.strokeStyle = crosshairColorCurrent;
            ctx.lineWidth = crosshairLineWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = crosshairOutlineColor;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, 2.5 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, 1.5 * crosshairSizeMult, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Hit marker (animated X with scale punch) ──
    if (gameState.hitMarker.active) {
        const alpha = gameState.hitMarker.life / gameState.hitMarker.maxLife;
        const punch = 1 + (1 - alpha) * 0.4; // scale punch outward as it fades
        const markerSize = 8 * punch;

        ctx.save();
        ctx.translate(crosshairX, crosshairY);
        ctx.rotate(alpha * 0.15); // tiny spin for kinetic feel

        // Glow
        ctx.shadowColor = `rgba(255, 255, 0, ${alpha * 0.6})`;
        ctx.shadowBlur = 6;

        // White core → yellow fade
        const mr = Math.round(255);
        const mg = Math.round(255);
        const mb = Math.round(255 - (1 - alpha) * 255);
        ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(-markerSize, -markerSize);
        ctx.lineTo(markerSize, markerSize);
        ctx.moveTo(markerSize, -markerSize);
        ctx.lineTo(-markerSize, markerSize);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    ctx.restore();
}

/**
 * Draw wave break UI overlay
 */
export function drawWaveBreak() {
    if (!gameState.waveBreakActive) return;

    const remainingMs = gameState.waveBreakEndTime - Date.now();
    if (remainingMs < 0) return;

    const remainingTime = Math.ceil(remainingMs / 1000);
    const isBrief = remainingMs <= 1200;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = isBrief ? 'bold 48px Creepster, system-ui' : 'bold 40px Creepster, system-ui';
    ctx.fillStyle = isBrief ? '#ff5252' : '#ffc107';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(isBrief ? 'INCOMING!' : 'Wave Cleared!', canvas.width / 2, canvas.height / 2 - 80);

    if (!isBrief) {
        ctx.font = '30px "Roboto Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Next wave in ${remainingTime}...`, canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '20px "Roboto Mono", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Reload [R] | Heal Up', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        ctx.font = '22px "Roboto Mono", monospace';
        ctx.fillStyle = '#ff8a80';
        ctx.fillText(`${remainingTime}s`, canvas.width / 2, canvas.height / 2 - 20);
    }

    ctx.restore();
}

/**
 * Draw wave notification text
 */
export function drawWaveNotification() {
    if (!gameState.waveNotification.active) return;

    ctx.save();
    const alpha = Math.min(1, gameState.waveNotification.life / 30);
    const fadeOut = Math.min(1, gameState.waveNotification.life / 40);
    const finalAlpha = alpha * fadeOut;

    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(255, 23, 68, ${finalAlpha * 0.6})`;

    ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
    ctx.font = 'bold 32px \"Roboto Mono\", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.waveNotification.text, canvas.width / 2, canvas.height / 2 - 40);

    const sub = gameState.waveNotification.subtitle;
    const isCampaign = gameState.waveNotification.kind === 'campaign';
    if (sub || !isCampaign) {
        ctx.fillStyle = `rgba(255, 200, 200, ${finalAlpha * 0.8})`;
        ctx.font = '14px \"Roboto Mono\", monospace';
        const subText = sub || 'Get ready...';
        ctx.fillText(subText, canvas.width / 2, canvas.height / 2 + 10);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Persistent campaign objective banner (top-center).
 */
export function drawCampaignObjective() {
    if (!isCampaignMode(gameState) || !gameState.campaignObjective || !gameState.gameRunning || gameState.gamePaused) {
        return;
    }

    const zoneLabel = gameState.campaignZone > 0 ? `ZONE ${gameState.campaignZone}` : 'CAMPAIGN';
    const text = gameState.campaignObjective;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const bannerY = 18;
    const bannerWidth = Math.min(canvas.width - 40, Math.max(280, text.length * 9 + 120));
    const bannerX = (canvas.width - bannerWidth) * 0.5;

    ctx.fillStyle = 'rgba(8, 10, 14, 0.72)';
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, 68, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 140, 80, 0.95)';
    ctx.font = 'bold 11px "Roboto Mono", monospace';
    ctx.fillText(zoneLabel, canvas.width / 2, bannerY + 10);

    ctx.fillStyle = 'rgba(245, 245, 245, 0.95)';
    ctx.font = 'bold 14px "Roboto Mono", monospace';
    ctx.fillText(text, canvas.width / 2, bannerY + 28);

    // Active quest progress when away from NPC
    const run = gameState.campaignSurvivorRun;
    if (run?.quest && !run.questDone?.[run.quest.survivorId] && window.mapLoader?.getQuestProgressText) {
        const qProg = window.mapLoader.getQuestProgressText();
        if (qProg?.progress) {
            ctx.fillStyle = 'rgba(255, 213, 79, 0.9)';
            ctx.font = '10px "Roboto Mono", monospace';
            ctx.fillText(`${qProg.name}: ${qProg.progress}`, canvas.width / 2, bannerY + 44);
        }
    }

    // Hold-E prompt when near coupler / terminal / survivor
    if (typeof window !== 'undefined' && window.mapLoader?.getInteractPrompt) {
        const player = gameState.players[0];
        const prompt = window.mapLoader.getInteractPrompt(player);
        if (prompt) {
            ctx.fillStyle = '#ffb300';
            ctx.font = 'bold 12px "Roboto Mono", monospace';
            ctx.fillText(prompt.label, canvas.width / 2, bannerY + 50);
        }
    }

    const target = gameState.campaignObjectiveTarget;
    const player = gameState.players[0];
    if (target && player) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.round(Math.hypot(dx, dy));
        ctx.fillStyle = 'rgba(0, 255, 127, 0.85)';
        ctx.font = '10px "Roboto Mono", monospace';
        ctx.fillText(`${dist}m`, canvas.width / 2, bannerY + 58);

        const screen = cameraSystem.worldToScreen(target.x, target.y);
        const offScreen = screen.x < 0 || screen.x > canvas.width || screen.y < 0 || screen.y > canvas.height;
        if (offScreen) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const angle = Math.atan2(dy, dx);
            const radius = Math.min(canvas.width, canvas.height) * 0.38;
            const ax = cx + Math.cos(angle) * radius;
            const ay = cy + Math.sin(angle) * radius;

            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(angle);
            ctx.fillStyle = 'rgba(0, 255, 127, 0.9)';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-6, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    ctx.restore();
}

/**
 * Persistent Boss Rush mode banner (top-center).
 * [TRACE: SCRATCHPAD.md] — imported by GameLoopSystem; was missing after Boss Rush commit.
 */
export function drawBossRushHeader() {
    if (gameState.gameMode !== 'boss_rush' || !gameState.gameRunning || gameState.gamePaused) {
        return;
    }

    const wave = gameState.wave || 1;
    const eliteHint = gameState.bossActive ? 'BOSS + ELITES' : 'CLEAR THE WAVE';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const bannerY = 18;
    const bannerWidth = Math.min(canvas.width - 40, 320);
    const bannerX = (canvas.width - bannerWidth) * 0.5;

    ctx.fillStyle = 'rgba(12, 4, 8, 0.78)';
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, 52, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 82, 82, 0.95)';
    ctx.font = 'bold 11px "Roboto Mono", monospace';
    ctx.fillText('👹 BOSS RUSH', canvas.width / 2, bannerY + 8);

    ctx.fillStyle = 'rgba(245, 245, 245, 0.95)';
    ctx.font = 'bold 15px "Roboto Mono", monospace';
    ctx.fillText(`WAVE ${wave}`, canvas.width / 2, bannerY + 24);

    ctx.fillStyle = 'rgba(255, 180, 180, 0.8)';
    ctx.font = '10px "Roboto Mono", monospace';
    ctx.fillText(eliteHint, canvas.width / 2, bannerY + 40);

    ctx.restore();
}

/**
 * Zone transition interstitial overlay (campaign).
 */
export function drawCampaignTransition() {
    const tr = gameState.campaignTransition;
    if (!tr?.active || Date.now() >= tr.until) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0f7ff';
    ctx.font = 'bold 28px "Roboto Mono", monospace';
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
    ctx.fillText(tr.title || '', canvas.width / 2, canvas.height / 2 - 20);
    ctx.shadowBlur = 0;

    if (tr.subtitle) {
        ctx.fillStyle = 'rgba(200, 230, 255, 0.85)';
        ctx.font = '14px "Roboto Mono", monospace';
        ctx.fillText(tr.subtitle, canvas.width / 2, canvas.height / 2 + 18);
    }
    ctx.restore();
}

/**
 * Draw FPS counter and debug stats
 */
export function drawFpsCounter() {
    // Cache settings at function start to avoid repeated lookups
    const cachedShowFps = settingsManager.getSetting('gameplay', 'showFps') ?? false;
    const cachedShowDebugStats = settingsManager.getSetting('video', 'showDebugStats') ?? false;
    
    const showFps = cachedShowFps;
    const showDebugStats = cachedShowDebugStats;

    if (!showFps && !showDebugStats) return;

    ctx.save();

    if (showFps) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px "Roboto Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(`${gameState.fps} FPS`, canvas.width - 20, 20);
    }

    // Detailed stats overlay
    if (showDebugStats && gameState.gameRunning && !gameState.gamePaused) {
        const statsY = 45;
        const lineHeight = 18;
        let currentY = statsY;

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 200, statsY - 5, 195, 120);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvas.width - 200, statsY - 5, 195, 120);

        // Stats
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`Zombies: ${gameState.zombies.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;
        ctx.fillText(`Bullets: ${gameState.bullets.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;
        ctx.fillText(`Particles: ${gameState.particles.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;

        if (gameState.players.length > 0 && gameState.players[0]) {
            const p1 = gameState.players[0];
            ctx.fillText(`Player X: ${Math.floor(p1.x)}`, canvas.width - 195, currentY);
            currentY += lineHeight;
            ctx.fillText(`Player Y: ${Math.floor(p1.y)}`, canvas.width - 195, currentY);
            currentY += lineHeight;
        }

        // Memory usage (approximate)
        if (performance.memory) {
            const memMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            ctx.fillText(`Memory: ${memMB} MB`, canvas.width - 195, currentY);
        }
    }

    ctx.restore();
}

