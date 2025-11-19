import {
    WEAPONS, PLAYER_MAX_HEALTH, MAX_GRENADES,
    PLAYER_BASE_SPEED, PLAYER_STAMINA_MAX
} from './constants.js';

// Available player colors for co-op
const PLAYER_COLORS = [
    { name: 'blue', light: '#66b3ff', dark: '#0066cc', outline: '#003d7a', glow: 'rgba(0, 136, 255, 0.4)' },
    { name: 'red', light: '#ff6666', dark: '#cc0000', outline: '#7a0000', glow: 'rgba(255, 0, 0, 0.4)' },
    { name: 'green', light: '#66ff66', dark: '#00cc00', outline: '#007a00', glow: 'rgba(0, 255, 0, 0.4)' },
    { name: 'orange', light: '#ffaa66', dark: '#ff6600', outline: '#cc4400', glow: 'rgba(255, 136, 0, 0.4)' },
    { name: 'purple', light: '#cc66ff', dark: '#8800cc', outline: '#55007a', glow: 'rgba(136, 0, 255, 0.4)' }
];

export function createPlayer(x, y, colorIndex = 0) {
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

    return {
        x, y,
        radius: 15,
        speed: PLAYER_BASE_SPEED,
        health: PLAYER_MAX_HEALTH,
        maxHealth: PLAYER_MAX_HEALTH,
        stamina: PLAYER_STAMINA_MAX,
        maxStamina: PLAYER_STAMINA_MAX,
        angle: 0,
        isSprinting: false,
        lastSprintTime: 0,

        // Weapon state
        currentWeapon: WEAPONS.pistol,
        lastShotTime: 0,
        isReloading: false,
        reloadStartTime: 0,
        currentAmmo: WEAPONS.pistol.ammo,
        maxAmmo: WEAPONS.pistol.maxAmmo,

        // Melee state
        lastMeleeTime: 0,
        activeMeleeSwipe: null,

        // Grenade state
        grenadeCount: MAX_GRENADES,
        lastGrenadeThrowTime: 0,

        // Shield
        shield: 0,
        maxShield: 50,

        // Visual
        color: color,
        muzzleFlash: {
            active: false,
            intensity: 0,
            x: 0, y: 0, angle: 0,
            life: 0, maxLife: 5
        },

        // Input
        inputSource: 'mouse', // 'mouse', 'keyboard_arrow', 'gamepad'
        gamepadIndex: null
    };
}

export const gameState = {
    gameRunning: true,
    gamePaused: false,
    showMainMenu: true,
    showSettingsPanel: false,
    showLobby: false,
    isCoop: false,
    showCoopLobby: false,

    multiplayer: {
        active: false,
        connected: false,
        socket: null,
        playerId: null,
        players: []
    },
    username: 'Survivor',

    score: 0,
    wave: 1,
    zombiesKilled: 0,
    zombiesPerWave: 5,
    highScore: 0,

    isSpawningWave: false,
    waveBreakActive: false,
    waveBreakEndTime: 0,

    // Boss State
    bossActive: false,
    boss: null,

    players: [createPlayer(0, 0)],

    // Game objects
    bullets: [],
    zombies: [],
    particles: [],
    healthPickups: [],
    ammoPickups: [],
    damagePickups: [],
    nukePickups: [],
    speedPickups: [],
    rapidFirePickups: [],
    shieldPickups: [],
    zombieSpawnTimeouts: [],
    shells: [],
    damageNumbers: [],
    grenades: [],

    // Visual effects
    shakeAmount: 0,
    shakeDecay: 0.9,

    damageIndicator: {
        active: false,
        intensity: 0,
        decay: 0.95
    },

    // Buffs & Streaks
    damageMultiplier: 1,
    damageBuffEndTime: 0,
    speedBoostEndTime: 0,
    rapidFireEndTime: 0,
    killStreak: 0,
    lastKillTime: 0,

    waveNotification: {
        active: false,
        text: '',
        life: 0,
        maxLife: 120
    },

    // FPS counter
    fps: 0,
    lastFpsUpdateTime: 0,
    framesSinceFpsUpdate: 0,

    // Timers
    lastFootstepTime: 0, // Kept global for now, or can be per player
    lastHealthPickupSpawnTime: 0,
    lastAmmoPickupSpawnTime: 0,
    lastPowerupSpawnTime: 0,
};

// Compatibility getters/setters for single-player code
Object.defineProperties(gameState, {
    player: { get: () => gameState.players[0] },

    // Map global properties to player 1
    currentWeapon: { get: () => gameState.players[0].currentWeapon, set: (v) => gameState.players[0].currentWeapon = v },
    currentAmmo: { get: () => gameState.players[0].currentAmmo, set: (v) => gameState.players[0].currentAmmo = v },
    maxAmmo: { get: () => gameState.players[0].maxAmmo, set: (v) => gameState.players[0].maxAmmo = v },
    isReloading: { get: () => gameState.players[0].isReloading, set: (v) => gameState.players[0].isReloading = v },
    reloadStartTime: { get: () => gameState.players[0].reloadStartTime, set: (v) => gameState.players[0].reloadStartTime = v },
    grenadeCount: { get: () => gameState.players[0].grenadeCount, set: (v) => gameState.players[0].grenadeCount = v },
    activeMeleeSwipe: { get: () => gameState.players[0].activeMeleeSwipe, set: (v) => gameState.players[0].activeMeleeSwipe = v },
    muzzleFlash: { get: () => gameState.players[0].muzzleFlash, set: (v) => gameState.players[0].muzzleFlash = v },
    lastMeleeTime: { get: () => gameState.players[0].lastMeleeTime, set: (v) => gameState.players[0].lastMeleeTime = v },
    lastShotTime: { get: () => gameState.players[0].lastShotTime, set: (v) => gameState.players[0].lastShotTime = v },
    lastGrenadeThrowTime: { get: () => gameState.players[0].lastGrenadeThrowTime, set: (v) => gameState.players[0].lastGrenadeThrowTime = v },
});

export function resetGameState(canvasWidth, canvasHeight) {
    gameState.score = 0;
    gameState.wave = 1;
    gameState.zombiesKilled = 0;
    gameState.zombiesPerWave = 5;
    gameState.isSpawningWave = false;

    gameState.bossActive = false;
    gameState.boss = null;

    // Initialize Players with different colors
    const p1 = createPlayer(canvasWidth / 2, canvasHeight / 2, 0); // Blue
    // P1 defaults to mouse/keyboard
    p1.inputSource = 'mouse';

    if (gameState.isCoop) {
        const p2 = createPlayer(canvasWidth / 2 + 50, canvasHeight / 2, 1); // Red
        // P2 defaults to arrows/numpad or gamepad. 
        // We'll determine specific input in main.js or InputSystem
        p2.inputSource = 'keyboard_arrow';
        gameState.players = [p1, p2];
    } else {
        gameState.players = [p1];
    }

    gameState.bullets = [];
    gameState.zombies = [];
    gameState.particles = [];
    gameState.healthPickups = [];
    gameState.ammoPickups = [];
    gameState.damagePickups = [];
    gameState.nukePickups = [];
    gameState.speedPickups = [];
    gameState.rapidFirePickups = [];
    gameState.shieldPickups = [];
    gameState.grenades = [];

    // Clear timeouts
    gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
    gameState.zombieSpawnTimeouts = [];

    gameState.lastHealthPickupSpawnTime = Date.now();
    gameState.lastAmmoPickupSpawnTime = Date.now();
    gameState.lastPowerupSpawnTime = Date.now();
    gameState.damageMultiplier = 1;
    gameState.damageBuffEndTime = 0;
    gameState.speedBoostEndTime = 0;
    gameState.rapidFireEndTime = 0;
    gameState.killStreak = 0;
    gameState.lastKillTime = 0;

    gameState.waveNotification.active = false;
}
