import { gameState, resetGameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { PLAYER_MAX_HEALTH, PLAYER_STAMINA_MAX } from '../core/constants.js';
import { playRestartSound, playMenuMusic, stopMenuMusic } from '../systems/AudioSystem.js';
import { saveHighScore, saveMultiplierStats } from '../utils/gameUtils.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';

/**
 * GameStateManager - Handles game lifecycle (start, restart, game over)
 */
export class GameStateManager {
    constructor(gameHUD, spawnZombiesCallback) {
        this.gameHUD = gameHUD;
        this.spawnZombiesCallback = spawnZombiesCallback;
    }

    /**
     * Handle game over
     */
    gameOver() {
        gameState.gameRunning = false;
        saveHighScore();

        // Update and save multiplier stats
        gameState.players.forEach(player => {
            if (player.maxMultiplierThisSession > gameState.allTimeMaxMultiplier) {
                gameState.allTimeMaxMultiplier = player.maxMultiplierThisSession;
            }
        });
        saveMultiplierStats();

        const p1 = gameState.players[0];
        const p2 = gameState.players[1];

        let scoreMsg = `You survived ${gameState.wave} waves!\nKilled: ${gameState.zombiesKilled}`;

        if (gameState.isCoop && p2) {
            scoreMsg = `Team survived ${gameState.wave} waves!\nTotal Kills: ${gameState.zombiesKilled}`;
        }

        this.gameHUD.showGameOver(scoreMsg);
    }

    /**
     * Restart game (return to main menu)
     */
    restartGame() {
        playRestartSound();
        if (!gameState.menuMusicMuted) {
            playMenuMusic();
        }
        gameState.showMainMenu = true;
        gameState.showAbout = false;
        gameState.gameRunning = false;
        gameState.gamePaused = false;
        gameState.showCoopLobby = false;
        gameState.showLobby = false;
        gameState.showAILobby = false;
        this.gameHUD.hidePauseMenu();
        this.gameHUD.hideGameOver();
        resetGameState(canvas.width, canvas.height);
    }

    /**
     * Start game
     */
    startGame() {
        stopMenuMusic();
        gameState.gameRunning = true;
        gameState.gamePaused = false;
        gameState.showLobby = false;
        gameState.showCoopLobby = false;
        gameState.showAILobby = false;

        // Do NOT reset players here for coop, we want to keep the lobby configuration
        if (!gameState.isCoop) {
            resetGameState(canvas.width, canvas.height);
        } else {
            // Just reset game objects, keep players
            gameState.score = 0;
            gameState.wave = 1;
            gameState.zombiesKilled = 0;
            gameState.bullets = [];
            gameState.zombies = [];
            gameState.particles = [];
            gameState.healthPickups = [];
            gameState.ammoPickups = [];
            gameState.damagePickups = [];
            gameState.nukePickups = [];
            gameState.grenades = [];
            gameState.acidProjectiles = [];
            gameState.acidPools = [];

            // Reset all players (including AI)
            gameState.players.forEach((p, index) => {
                p.health = PLAYER_MAX_HEALTH;
                p.stamina = PLAYER_STAMINA_MAX;
                // Spawn players with slight offset to avoid overlap
                p.x = canvas.width / 2 + (index * 50);
                p.y = canvas.height / 2;
            });
        }

        gameState.showMainMenu = false;

        triggerWaveNotification();
        this.spawnZombiesCallback(gameState.zombiesPerWave);
    }
}

