import { gameState } from '../core/gameState.js';

export function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
}

export function triggerDamageIndicator() {
    gameState.damageIndicator.active = true;
    gameState.damageIndicator.intensity = 1.0;
}

export function triggerWaveNotification() {
    gameState.waveNotification.active = true;
    gameState.waveNotification.text = `Wave ${gameState.wave} Starting!`;
    gameState.waveNotification.life = gameState.waveNotification.maxLife;
}

export function triggerMuzzleFlash(x, y, angle) {
    gameState.muzzleFlash.active = true;
    gameState.muzzleFlash.intensity = 1.0;
    gameState.muzzleFlash.x = x;
    gameState.muzzleFlash.y = y;
    gameState.muzzleFlash.angle = angle;
    gameState.muzzleFlash.life = gameState.muzzleFlash.maxLife;
}

export function loadHighScore() {
    const savedHighScore = localStorage.getItem('zombieSurvivalHighScore');
    if (savedHighScore !== null) {
        gameState.highScore = parseInt(savedHighScore);
    }
}

export function saveHighScore() {
    if (gameState.zombiesKilled > gameState.highScore) {
        gameState.highScore = gameState.zombiesKilled;
        localStorage.setItem('zombieSurvivalHighScore', gameState.highScore.toString());
    }
}

export function loadUsername() {
    const savedUsername = localStorage.getItem('zombobs_username');
    if (savedUsername !== null && savedUsername.trim() !== '') {
        gameState.username = savedUsername.trim();
    }
}

export function saveUsername() {
    if (gameState.username && gameState.username.trim() !== '') {
        localStorage.setItem('zombobs_username', gameState.username.trim());
    }
}

export function loadMenuMusicMuted() {
    const savedMuted = localStorage.getItem('zombobs_menuMusicMuted');
    if (savedMuted !== null) {
        gameState.menuMusicMuted = savedMuted === 'true';
    }
}

export function saveMenuMusicMuted() {
    localStorage.setItem('zombobs_menuMusicMuted', gameState.menuMusicMuted.toString());
}