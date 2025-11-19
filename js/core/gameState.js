import { 
    WEAPONS, PLAYER_MAX_HEALTH, MAX_GRENADES, 
    PLAYER_BASE_SPEED, PLAYER_STAMINA_MAX 
} from './constants.js';

export const gameState = {
    gameRunning: true,
    gamePaused: false,
    showMainMenu: true,
    showSettingsPanel: false,
    showLobby: false,
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
    
    // Player state (will be initialized properly in startGame)
    player: {
        x: 0,
        y: 0,
        radius: 15,
        speed: PLAYER_BASE_SPEED,
        health: PLAYER_MAX_HEALTH,
        stamina: PLAYER_STAMINA_MAX,
        maxStamina: PLAYER_STAMINA_MAX,
        angle: 0,
        isSprinting: false,
        lastSprintTime: 0
    },
    
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
    
    // Game objects
    bullets: [],
    zombies: [],
    particles: [],
    healthPickups: [],
    ammoPickups: [],
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
    
    waveNotification: {
        active: false,
        text: '',
        life: 0,
        maxLife: 120
    },
    
    muzzleFlash: {
        active: false,
        intensity: 0,
        x: 0,
        y: 0,
        angle: 0,
        life: 0,
        maxLife: 5
    },
    
    // FPS counter
    fps: 0,
    lastFpsUpdateTime: 0,
    framesSinceFpsUpdate: 0,

    // Timers
    lastFootstepTime: 0,
    lastHealthPickupSpawnTime: 0,
    lastAmmoPickupSpawnTime: 0,
};

export function resetGameState(canvasWidth, canvasHeight) {
    gameState.score = 0;
    gameState.wave = 1;
    gameState.zombiesKilled = 0;
    gameState.zombiesPerWave = 5;
    gameState.isSpawningWave = false;
    
    gameState.player.health = PLAYER_MAX_HEALTH;
    gameState.player.stamina = PLAYER_STAMINA_MAX;
    gameState.player.isSprinting = false;
    gameState.player.x = canvasWidth / 2;
    gameState.player.y = canvasHeight / 2;
    
    gameState.bullets = [];
    gameState.zombies = [];
    gameState.particles = [];
    gameState.healthPickups = [];
    gameState.ammoPickups = [];
    gameState.grenades = [];
    gameState.grenadeCount = MAX_GRENADES;
    
    // Clear timeouts
    gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
    gameState.zombieSpawnTimeouts = [];
    
    gameState.lastHealthPickupSpawnTime = Date.now();
    gameState.lastAmmoPickupSpawnTime = Date.now();
    
    gameState.currentWeapon = WEAPONS.pistol;
    gameState.currentAmmo = WEAPONS.pistol.ammo;
    gameState.maxAmmo = WEAPONS.pistol.maxAmmo;
    gameState.isReloading = false;
    
    gameState.muzzleFlash.active = false;
    gameState.waveNotification.active = false;
}
