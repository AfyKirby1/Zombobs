import { gameState } from '../core/gameState.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { isCampaignMode } from '../utils/gameUtils.js';

export class GameOverScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
        this.finalScore = '';
        this.shownAt = 0;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    // [TRACE: SCRATCHPAD.md] Mobile draw scaled 0.8; hit-test must match
    getEffectiveScale() {
        let scale = this.getUIScale();
        const isMobile = this.hud && this.hud.isMobile && this.hud.isMobile();
        if (isMobile) scale *= 0.8;
        return scale;
    }

    _getProfile() {
        try {
            if (playerProfileSystem) return playerProfileSystem.getProfile();
        } catch (e) {
            // Profile unavailable
        }
        return null;
    }

    // Single vertical flow for draw + hit-test. No overlapping cy+offset soup.
    resolveLayout(scale) {
        const h = this.canvas.height;
        const line = (n) => n * scale;

        const isActClear = gameState.campaignActClear || gameState.campaignScript?.actClear;
        const isZoneClear = gameState.campaignZoneCleared;
        const wasMultiplayer = gameState.multiplayer.active || gameState.multiplayer.connected;
        const isCampaignDeath = !isActClear && !isZoneClear &&
            gameState.campaignRetryMapId && isCampaignMode(gameState);

        const rankProgress = gameState.sessionResults?.rankProgress || null;
        const bpProgress = gameState.sessionResults?.battlepassProgress || null;
        const hasRank = !!rankProgress;
        const hasBp = !!bpProgress;
        const hasRankUp = !!(rankProgress && rankProgress.rankUp);
        const hasBpTier = !!(bpProgress && bpProgress.tierUp);
        const hasBpRewards = !!(bpProgress && bpProgress.claimedRewards && bpProgress.claimedRewards.length > 0);

        const player = gameState.players[0];
        const hasMult = !!(player && player.maxMultiplierThisSession > 1.0);
        const hasMultBonus = !!(hasMult && player.totalMultiplierBonus > 0);

        const profile = this._getProfile();
        const sessionScore = gameState.score || 0;
        const previousScore = profile && profile.stats ? profile.stats.highestScore : 0;
        const previousWave = profile && profile.stats ? profile.stats.highestWave : 0;
        const previousStreak = profile && profile.stats ? profile.stats.maxCombo : 0;
        const bannerVisible = sessionScore > previousScore && previousScore > 0;

        const sessionKills = gameState.zombiesKilled || 0;
        const sessionWave = gameState.wave || 0;
        const sessionStreak = gameState.maxKillStreak || 0;
        const waveRecord = sessionWave > previousWave;
        const streakRecord = sessionStreak > previousStreak;
        const anyStatRecord = waveRecord || streakRecord;

        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        const buttonSpacing = 15 * scale;
        const statsCardH = 60 * scale;
        const gap = 14 * scale;
        const bottomMargin = 16 * scale;
        const topMargin = 20 * scale;

        // Measure block height with a dry-run cursor (absolute Y later = origin + cursor)
        let cursor = 0;
        const yTitle = cursor; cursor += line(44);
        const yCauseLabel = cursor; cursor += line(18);
        const yEpitaph = cursor; cursor += line(28);
        cursor += line(8); // divider air
        const yCombat = cursor; cursor += line(22);
        const yScore = cursor; cursor += line(28);

        let yMult = 0;
        let yMultBonus = 0;
        if (hasMult) {
            yMult = cursor; cursor += line(22);
            if (hasMultBonus) {
                yMultBonus = cursor; cursor += line(22);
            }
        }
        cursor += line(8);

        let yRank = 0;
        let yRankUp = 0;
        if (hasRank) {
            yRank = cursor; cursor += line(24);
            if (hasRankUp) {
                yRankUp = cursor; cursor += line(22);
            }
        }

        let yBp = 0;
        let yBpTier = 0;
        let yBpRewards = 0;
        if (hasBp) {
            yBp = cursor; cursor += line(22);
            if (hasBpTier) {
                yBpTier = cursor; cursor += line(22);
            }
            if (hasBpRewards) {
                yBpRewards = cursor; cursor += line(22);
            }
        }

        cursor += line(14);
        // Reserve space above cards for NEW RECORD badges so they don't sit on tier text
        if (anyStatRecord) cursor += line(14);
        const yStats = cursor;
        cursor += statsCardH;

        let yBanner = 0;
        if (bannerVisible) {
            cursor += line(10);
            yBanner = cursor;
            cursor += line(22);
        }
        cursor += line(12);
        const contentH = cursor;

        const buttonIds = [];
        if (isCampaignDeath) buttonIds.push('gameover_retry');
        if (wasMultiplayer) buttonIds.push('gameover_lobby');
        buttonIds.push('gameover_copy');
        buttonIds.push('gameover_menu');
        const stackH = buttonIds.length * buttonHeight + (buttonIds.length - 1) * buttonSpacing;
        const totalH = contentH + gap + stackH;

        // Center whole dossier+buttons; clamp so it stays on-screen
        let originY = Math.round((h - totalH) / 2);
        if (originY < topMargin) originY = topMargin;
        if (originY + totalH > h - bottomMargin) {
            originY = Math.max(topMargin, h - bottomMargin - totalH);
        }

        const abs = (rel) => originY + rel;
        const buttonY = {};
        let btnY = originY + contentH + gap;
        for (let i = 0; i < buttonIds.length; i++) {
            buttonY[buttonIds[i]] = btnY;
            btnY += buttonHeight + buttonSpacing;
        }

        const cardPadX = 24 * scale;
        const cardTop = originY - line(16);
        const cardBottom = originY + contentH + line(8);

        return {
            isActClear,
            isZoneClear,
            hasRank,
            hasBp,
            hasRankUp,
            hasBpTier,
            hasBpRewards,
            hasMult,
            hasMultBonus,
            rankProgress,
            bpProgress,
            bannerVisible,
            sessionScore,
            sessionKills,
            sessionWave,
            sessionStreak,
            waveRecord,
            streakRecord,
            anyStatRecord,
            originY,
            cardTop,
            cardBottom,
            cardPadX,
            buttonWidth,
            buttonHeight,
            buttonIds,
            buttonY,
            statsCardH,
            yTitle: abs(yTitle),
            yCauseLabel: abs(yCauseLabel),
            yEpitaph: abs(yEpitaph),
            yCombat: abs(yCombat),
            yScore: abs(yScore),
            yMult: hasMult ? abs(yMult) : 0,
            yMultBonus: hasMultBonus ? abs(yMultBonus) : 0,
            yRank: hasRank ? abs(yRank) : 0,
            yRankUp: hasRankUp ? abs(yRankUp) : 0,
            yBp: hasBp ? abs(yBp) : 0,
            yBpTier: hasBpTier ? abs(yBpTier) : 0,
            yBpRewards: hasBpRewards ? abs(yBpRewards) : 0,
            yStats: abs(yStats),
            yBanner: bannerVisible ? abs(yBanner) : 0
        };
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        const scale = this.getEffectiveScale();
        const L = this.resolveLayout(scale);

        const now = performance.now();
        const shownAt = this.shownAt || now;
        const t = Math.max(0, Math.min(1, (now - shownAt) / 550));
        const p = 1 - Math.pow(1 - t, 3);
        const contentAlpha = Math.min(1, p * 1.5);
        const rise = (1 - p) * 34 * scale;

        // Blood edge vignette
        const vig = ctx.createRadialGradient(cx, h / 2, Math.min(w, h) * 0.32, cx, h / 2, Math.max(w, h) * 0.72);
        vig.addColorStop(0, 'rgba(255, 23, 68, 0)');
        vig.addColorStop(1, 'rgba(255, 23, 68, 0.12)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        const title = L.isActClear ? 'ACT 1 CLEAR' : (L.isZoneClear ? 'ZONE CLEAR' : (isCampaignMode(gameState) && gameState.campaignRetryMapId ? 'ZONE FAIL' : 'GAME OVER'));
        const titleColor = L.isActClear ? '#e0f7ff' : (L.isZoneClear ? '#00ff00' : (isCampaignMode(gameState) && gameState.campaignRetryMapId ? '#ffb300' : '#ff0000'));
        const titleShadow = L.isActClear ? 'rgba(0, 229, 255, 0.9)' : (L.isZoneClear ? 'rgba(0, 255, 0, 0.8)' : (isCampaignMode(gameState) && gameState.campaignRetryMapId ? 'rgba(255, 179, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'));

        ctx.save();
        ctx.globalAlpha = contentAlpha;
        ctx.translate(0, rise);

        // Dossier card
        const cardGrad = ctx.createLinearGradient(0, L.cardTop, 0, L.cardBottom);
        cardGrad.addColorStop(0, 'rgba(12, 14, 18, 0.72)');
        cardGrad.addColorStop(1, 'rgba(8, 10, 14, 0.78)');
        ctx.fillStyle = cardGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 300 * scale, L.cardTop, 600 * scale, Math.max(40 * scale, L.cardBottom - L.cardTop), 14 * scale);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.45)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - 282 * scale, L.cardBottom - 2 * scale);
        ctx.lineTo(cx + 282 * scale, L.cardBottom - 2 * scale);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        // Title
        const gameOverFontSize = Math.max(32, 48 * scale);
        ctx.font = `${gameOverFontSize}px "Creepster", cursive`;
        ctx.fillStyle = titleColor;
        ctx.shadowBlur = (18 + 5 * Math.sin(now / 260)) * scale;
        ctx.shadowColor = titleShadow;
        ctx.fillText(title, cx, L.yTitle + gameOverFontSize * 0.75);
        ctx.shadowBlur = 0;

        ctx.font = `${Math.max(9, Math.round(10 * scale))}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText('CAUSE OF TERMINATION', cx, L.yCauseLabel + 12 * scale);

        const epitaph = gameState.lastDeathCause || 'Overwhelmed by Undead';
        ctx.font = `italic ${Math.max(12, Math.round(16 * scale))}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#ff8a80';
        ctx.fillText(`"${epitaph}"`, cx, L.yEpitaph + 16 * scale);

        // Divider under epitaph
        const divY = L.yEpitaph + 24 * scale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6 * scale, 6 * scale]);
        ctx.beginPath();
        ctx.moveTo(cx - 242 * scale, divY);
        ctx.lineTo(cx + 242 * scale, divY);
        ctx.stroke();
        ctx.setLineDash([]);

        const fired = gameState.totalShotsFired || 0;
        const hit = gameState.totalShotsHit || 0;
        const accuracy = fired > 0 ? Math.min(100, Math.round((hit / fired) * 100)) : 0;
        ctx.font = `${Math.max(10, Math.round(13 * scale))}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#81d4fa';
        ctx.fillText(`[ ACCURACY ${accuracy}% ]  [ HEADSHOTS ${gameState.headshots || 0} ]  [ SCRAP ${gameState.scrapCollected || 0} ]`, cx, L.yCombat + 14 * scale);

        const scoreFontSize = Math.max(14, Math.round(20 * scale));
        ctx.font = `700 ${scoreFontSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.finalScore, cx, L.yScore + 18 * scale);

        if (L.hasMult) {
            const player = gameState.players[0];
            const multiplierFontSize = Math.max(12, Math.round(18 * scale));
            ctx.font = `${multiplierFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`Max Multiplier: ${player.maxMultiplierThisSession}x`, cx, L.yMult + 16 * scale);
            if (L.hasMultBonus) {
                ctx.fillStyle = '#4caf50';
                ctx.fillText(`Bonus Score: +${Math.floor(player.totalMultiplierBonus)}`, cx, L.yMultBonus + 16 * scale);
            }
        }

        if (L.hasRank) {
            const rankFontSize = Math.max(16, Math.round(18 * scale));
            ctx.font = `${rankFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ff6b00';
            ctx.fillText(`Rank XP Gained: +${L.rankProgress.xpGained}`, cx, L.yRank + 16 * scale);
            if (L.hasRankUp) {
                ctx.fillStyle = '#00ff00';
                ctx.fillText(`RANK UP! ${L.rankProgress.rankName} Tier ${L.rankProgress.newTier}`, cx, L.yRankUp + 16 * scale);
            }
        }

        if (L.hasBp) {
            const bpFontSize = Math.max(14, Math.round(16 * scale));
            ctx.font = `${bpFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#4fc3f7';
            ctx.fillText(`Battlepass XP: +${L.bpProgress.xpGained}`, cx, L.yBp + 14 * scale);
            if (L.hasBpTier) {
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 10 * scale;
                ctx.shadowColor = '#ffd700';
                ctx.fillText(`BATTLEPASS TIER UP! Tier ${L.bpProgress.newTier}`, cx, L.yBpTier + 14 * scale);
                ctx.shadowBlur = 0;
            }
            if (L.hasBpRewards) {
                ctx.fillStyle = '#81c784';
                const rewardText = L.bpProgress.claimedRewards.map(cr => `Tier ${cr.tier}`).join(', ');
                ctx.fillText(`Rewards Claimed: ${rewardText}`, cx, L.yBpRewards + 14 * scale);
            }
        }

        this.drawQuickStats(L, scale, contentAlpha);

        if (L.bannerVisible) {
            const recordFontSize = Math.max(12, Math.round(16 * scale));
            ctx.font = `700 ${recordFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#00ff00';
            ctx.shadowBlur = 10 * scale;
            ctx.shadowColor = '#00ff00';
            ctx.fillText(`🏆 NEW HIGH SCORE: ${L.sessionScore}!`, cx, L.yBanner + 14 * scale);
            ctx.shadowBlur = 0;
        }

        ctx.restore();

        // Nav buttons (outside rise translate; hit boxes match)
        const copyLabel = (this.reportCopiedTime && Date.now() - this.reportCopiedTime < 2500) ? '✓ Report Copied!' : '📋 Copy Report';
        const labels = {
            gameover_retry: 'Retry Zone',
            gameover_lobby: 'Back to Lobby',
            gameover_copy: copyLabel,
            gameover_menu: 'Back to Main Menu'
        };
        for (let i = 0; i < L.buttonIds.length; i++) {
            const id = L.buttonIds[i];
            this.hud.drawMenuButton(
                labels[id],
                cx - L.buttonWidth / 2,
                L.buttonY[id],
                L.buttonWidth,
                L.buttonHeight,
                this.hoveredButton === id,
                false
            );
        }
    }

    drawQuickStats(L, scale, alpha) {
        const ctx = this.ctx;
        const stats = [
            { label: 'Kills', value: L.sessionKills, icon: '💀', color: '#ff1744', isRecord: false },
            { label: 'Wave', value: L.sessionWave, icon: '🌊', color: '#ffc107', isRecord: L.waveRecord },
            { label: 'Max Streak', value: L.sessionStreak, icon: '🔥', color: '#ff6b00', isRecord: L.streakRecord }
        ];
        stats.sort((a, b) => b.value - a.value);

        const stagger = Math.min(1, Math.max(0, (alpha - 0.25) * 1.5));
        const cardWidth = 180 * scale;
        const cardHeight = L.statsCardH;
        const cardSpacing = 15 * scale;
        const totalWidth = (cardWidth * stats.length) + (cardSpacing * (stats.length - 1));
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = L.yStats;

        ctx.save();
        ctx.globalAlpha = alpha * stagger;

        for (let index = 0; index < stats.length; index++) {
            const stat = stats[index];
            const x = startX + (index * (cardWidth + cardSpacing));

            ctx.fillStyle = 'rgba(6, 8, 12, 0.85)';
            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.fillStyle = stat.color;
            ctx.fillRect(x, y, cardWidth, 3 * scale);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1.5 * scale;
            ctx.strokeRect(x, y, cardWidth, cardHeight);

            const labelFontSize = Math.max(10, Math.round(12 * scale));
            ctx.font = `${labelFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#9e9e9e';
            ctx.textAlign = 'center';
            ctx.fillText(`${stat.icon} ${stat.label.toUpperCase()}`, x + cardWidth / 2, y + cardHeight * 0.35);

            const valueFontSize = Math.max(14, Math.round(20 * scale));
            ctx.font = `700 ${valueFontSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = stat.color;
            ctx.fillText(stat.value.toString(), x + cardWidth / 2, y + cardHeight * 0.7);

            if (stat.isRecord) {
                const badgeFontSize = Math.max(8, Math.round(10 * scale));
                ctx.font = `700 ${badgeFontSize}px "Roboto Mono", monospace`;
                ctx.fillStyle = '#00ff00';
                ctx.shadowBlur = 5 * scale;
                ctx.shadowColor = '#00ff00';
                ctx.fillText('NEW RECORD!', x + cardWidth / 2, y - 5 * scale);
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
    }

    checkButtonClick(x, y) {
        const scale = this.getEffectiveScale();
        const L = this.resolveLayout(scale);
        const centerX = this.canvas.width / 2;
        const left = centerX - L.buttonWidth / 2;
        const right = centerX + L.buttonWidth / 2;

        for (let i = 0; i < L.buttonIds.length; i++) {
            const id = L.buttonIds[i];
            const top = L.buttonY[id];
            if (x >= left && x <= right && y >= top && y <= top + L.buttonHeight) {
                return id;
            }
        }
        return null;
    }

    copyReportToClipboard() {
        const fired = gameState.totalShotsFired || 0;
        const hit = gameState.totalShotsHit || 0;
        const accuracy = fired > 0 ? Math.min(100, Math.round((hit / fired) * 100)) : 0;
        const text = `🧟 ZOMBOBS SURVIVAL REPORT 🧟\n` +
            `Player: ${gameState.username || 'Survivor'}\n` +
            `Mode: ${(gameState.gameMode || 'arcade').toUpperCase()}\n` +
            `Wave Reached: ${gameState.wave}\n` +
            `Kills: ${gameState.zombiesKilled}\n` +
            `Accuracy: ${accuracy}%\n` +
            `Headshots: ${gameState.headshots || 0}\n` +
            `Scrap Collected: ${gameState.scrapCollected || 0}\n` +
            `Score: ${gameState.score.toLocaleString()}\n` +
            `Cause of Death: ${gameState.lastDeathCause || 'Overwhelmed'}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => {});
        }
        this.reportCopiedTime = Date.now();
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}
