// Game constants
export const RENDER_SCALE = 0.75;

// Player stats
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_BASE_SPEED = 4;
export const PLAYER_SPRINT_SPEED = 7;
export const PLAYER_STAMINA_MAX = 100;
export const PLAYER_STAMINA_DRAIN = 1.0; // Stamina cost per frame while sprinting
export const PLAYER_STAMINA_REGEN = 0.5; // Stamina recovery per frame
export const PLAYER_STAMINA_REGEN_DELAY = 1000; // ms to wait before regenerating

// Health pickup settings
export const HEALTH_PICKUP_HEAL_AMOUNT = 25;
export const HEALTH_PICKUP_SPAWN_INTERVAL = 15000; // ms between spawns
export const MAX_HEALTH_PICKUPS = 3;

// Ammo pickup settings
export const AMMO_PICKUP_AMOUNT = 15; // Ammo restored per pickup
export const AMMO_PICKUP_SPAWN_INTERVAL = 20000; // ms between spawns
export const MAX_AMMO_PICKUPS = 2;

// Low ammo threshold (25% of max ammo)
export const LOW_AMMO_FRACTION = 0.25;

// Melee attack constants
export const MELEE_COOLDOWN = 500; // ms between melee attacks
export const MELEE_RANGE = 70; // pixels
export const MELEE_DAMAGE = 3; // damage per hit
export const MELEE_SWIPE_DURATION = 200; // ms for swipe animation

// Wave settings
export const WAVE_BREAK_DURATION = 3000; // 3 seconds between waves

// Grenade system
export const MAX_GRENADES = 3; // Maximum grenades player can carry
export const GRENADE_COOLDOWN = 2000; // 2 seconds between throws
export const GRENADE_EXPLOSION_RADIUS = 80; // AOE damage radius
export const GRENADE_DAMAGE = 50; // High damage for AOE
export const GRENADE_FUSE_TIME = 1500; // 1.5 seconds before explosion

// Particle limit
export const MAX_PARTICLES = 500;

// Crosshair configuration
export const CROSSHAIR_SIZE = 12;
export const CROSSHAIR_LINE_WIDTH = 2;
export const CROSSHAIR_COLOR = '#ffffff';
export const CROSSHAIR_OUTLINE_COLOR = '#000000';

// Zombie base scores (for score multiplier system)
export const ZOMBIE_BASE_SCORES = {
    normal: 10,
    fast: 15,
    armored: 25,
    exploding: 20,
    ghost: 18,
    spitter: 22,
    boss: 100
};

// Multiplayer settings
export const MAX_LOCAL_PLAYERS = 4;
export const SERVER_URL = "https://ottertondays-zombs.hf.space";

// News ticker updates for main menu
export const NEWS_UPDATES = "V0.4.2: Ready Button Fixed! ✅ | Players Join Together! 🎮 | Game Start Sync 🔧 | V0.4.1: Multiplayer Sync Fixed! 🔧 | Leader System 👑 | Ready Up ✅ | Synchronized Game Start 🎮 | V0.4.0: Cloud Server 🌐 | Hugging Face Spaces ☁️ | Smart Connection 🔌 | Auto Health Checks 💚 | WebGPU Fixes ⚡ | And More...";

// Weapon definitions
export const WEAPONS = {
    pistol: {
        name: "Pistol",
        damage: 1,
        fireRate: 400, // ms between shots
        ammo: 10,
        maxAmmo: 10,
        reloadTime: 1000 // ms (1 second)
    },
    shotgun: {
        name: "Shotgun",
        damage: 3,
        fireRate: 800, // ms between shots
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 1000 // ms (1 second)
    },
    rifle: {
        name: "Rifle",
        damage: 2,
        fireRate: 200, // ms between shots
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 1000 // ms (1 second)
    },
    flamethrower: {
        name: "Flamethrower",
        damage: 0.5, // Low per-tick damage
        fireRate: 50, // Very fast (ms between shots)
        ammo: 100,
        maxAmmo: 100,
        reloadTime: 2000, // 2 seconds (slower reload)
        range: 200, // Short range
        type: 'flame'
    },
    smg: {
        name: "SMG",
        damage: 0.8,
        fireRate: 80, // Fast fire rate
        ammo: 40,
        maxAmmo: 40,
        reloadTime: 1200 // Slightly slower than pistol
    },
    sniper: {
        name: "Sniper",
        damage: 15, // High damage
        fireRate: 1500, // Slow fire rate
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 2500, // Slow reload
        type: 'piercing'
    },
    rocketLauncher: {
        name: "RPG",
        damage: 0, // Impact damage handled by explosion
        fireRate: 2000, // Very slow
        ammo: 3,
        maxAmmo: 3,
        reloadTime: 3000,
        type: 'rocket',
        explosionRadius: 150,
        explosionDamage: 60
    }
};
