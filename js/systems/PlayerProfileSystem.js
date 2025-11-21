import { rankSystem } from './RankSystem.js';
import { achievementSystem } from './AchievementSystem.js';
import { battlepassSystem } from './BattlepassSystem.js';
import { loadUsername } from '../utils/gameUtils.js';

/**
 * PlayerProfileSystem - Manages player profile data persistence
 */
export class PlayerProfileSystem {
    constructor() {
        this.profileVersion = 1;
        this.profile = null;
    }

    /**
     * Generate unique player ID
     * @returns {string} UUID-like player ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create default profile
     * @returns {Object} Default profile object
     */
    createDefaultProfile() {
        const username = loadUsername() || "Survivor";
        
        return {
            version: this.profileVersion,
            username: username,
            playerId: this.generatePlayerId(),
            avatar: null,
            title: null,
            rank: {
                rankXP: 0,
                rank: 1,
                rankTier: 1,
                rankName: "Private"
            },
            achievements: [],
            battlepass: {
                currentSeason: 1,
                battlepassXP: 0,
                currentTier: 1,
                unlockedTiers: [],
                completedChallenges: [],
                dailyChallenges: [],
                weeklyChallenges: [],
                lastDailyReset: null,
                lastWeeklyReset: null
            },
            stats: {
                totalGamesPlayed: 0,
                totalZombiesKilled: 0,
                totalWavesSurvived: 0,
                totalTimePlayed: 0,
                highestWave: 0,
                highestScore: 0,
                averageWave: 0,
                favoriteWeapon: null,
                totalHeadshots: 0,
                maxCombo: 0,
                totalPerfectWaves: 0,
                totalSkillsUnlocked: 0,
                totalPickupsCollected: 0,
                totalCoopWins: 0
            }
        };
    }

    /**
     * Load profile from localStorage
     * @returns {Object|null} Profile object or null
     */
    loadProfile() {
        try {
            const saved = localStorage.getItem('zombobs_player_profile');
            if (saved) {
                const profile = JSON.parse(saved);
                
                // Migrate old data if needed
                this.migrateProfile(profile);
                
                this.profile = profile;
                return profile;
            }
        } catch (error) {
            console.log('Failed to load player profile:', error);
        }
        
        // Create new profile if none exists
        this.profile = this.createDefaultProfile();
        this.saveProfile();
        return this.profile;
    }

    /**
     * Migrate profile data from older versions
     * @param {Object} profile - Profile to migrate
     */
    migrateProfile(profile) {
        // Migrate from version 0 (no version) to version 1
        if (!profile.version) {
            // Migrate existing username/high score data
            const username = loadUsername() || profile.username || "Survivor";
            profile.username = username;
            
            // Initialize missing fields
            if (!profile.playerId) {
                profile.playerId = this.generatePlayerId();
            }
            if (!profile.rank) {
                profile.rank = {
                    rankXP: 0,
                    rank: 1,
                    rankTier: 1,
                    rankName: "Private"
                };
            }
            if (!profile.achievements) {
                profile.achievements = [];
            }
            if (!profile.battlepass) {
                profile.battlepass = {
                    currentSeason: 1,
                    battlepassXP: 0,
                    currentTier: 1,
                    unlockedTiers: [],
                    completedChallenges: [],
                    dailyChallenges: [],
                    weeklyChallenges: [],
                    lastDailyReset: null,
                    lastWeeklyReset: null
                };
            }
            if (!profile.stats) {
                profile.stats = {
                    totalGamesPlayed: 0,
                    totalZombiesKilled: 0,
                    totalWavesSurvived: 0,
                    totalTimePlayed: 0,
                    highestWave: 0,
                    highestScore: 0,
                    averageWave: 0,
                    favoriteWeapon: null,
                    totalHeadshots: 0,
                    maxCombo: 0,
                    totalPerfectWaves: 0,
                    totalSkillsUnlocked: 0,
                    totalPickupsCollected: 0,
                    totalCoopWins: 0
                };
            }
            
            profile.version = this.profileVersion;
        }
    }

    /**
     * Save profile to localStorage
     */
    saveProfile() {
        if (!this.profile) return;

        try {
            // Update profile data from systems
            this.profile.rank = rankSystem.getData();
            this.profile.achievements = achievementSystem.getData();
            this.profile.battlepass = battlepassSystem.getData();
            this.profile.version = this.profileVersion;

            localStorage.setItem('zombobs_player_profile', JSON.stringify(this.profile));
        } catch (error) {
            console.error('Failed to save player profile:', error);
        }
    }

    /**
     * Update profile stats from session
     * @param {Object} sessionStats - Session statistics
     */
    updateStats(sessionStats) {
        if (!this.profile) return;

        const stats = this.profile.stats;
        
        // Update cumulative stats
        stats.totalGamesPlayed += 1;
        stats.totalZombiesKilled += sessionStats.kills || 0;
        stats.totalWavesSurvived += sessionStats.wave || 0;
        stats.totalTimePlayed += sessionStats.timeSurvived || 0;
        
        // Update highests
        if (sessionStats.wave > stats.highestWave) {
            stats.highestWave = sessionStats.wave;
        }
        if (sessionStats.score > stats.highestScore) {
            stats.highestScore = sessionStats.score;
        }
        
        // Update average wave
        if (stats.totalGamesPlayed > 0) {
            stats.averageWave = stats.totalWavesSurvived / stats.totalGamesPlayed;
        }
        
        // Update other stats if provided
        if (sessionStats.headshots !== undefined) {
            stats.totalHeadshots += sessionStats.headshots;
        }
        if (sessionStats.maxCombo !== undefined) {
            stats.maxCombo = Math.max(stats.maxCombo, sessionStats.maxCombo);
        }
        if (sessionStats.perfectWaves !== undefined) {
            stats.totalPerfectWaves += sessionStats.perfectWaves;
        }
        if (sessionStats.pickupsCollected !== undefined) {
            stats.totalPickupsCollected += sessionStats.pickupsCollected;
        }
        if (sessionStats.coopWin) {
            stats.totalCoopWins += 1;
        }
    }

    /**
     * Initialize all systems from profile
     */
    initializeSystems() {
        if (!this.profile) {
            this.loadProfile();
        }

        rankSystem.initialize(this.profile);
        achievementSystem.loadAchievements(this.profile.achievements);
        battlepassSystem.initialize(this.profile);
    }

    /**
     * Process game session end
     * @param {Object} sessionStats - Session statistics
     * @returns {Object} Session results
     */
    processSessionEnd(sessionStats) {
        if (!this.profile) {
            this.loadProfile();
        }

        // Update stats
        this.updateStats(sessionStats);

        // Add rank XP
        const rankProgress = rankSystem.addSessionXP(sessionStats.score || 0, sessionStats.wave || 0);

        // Update achievements
        const sessionStatsForAchievements = {
            ...sessionStats,
            totalKills: this.profile.stats.totalZombiesKilled,
            highestWave: this.profile.stats.highestWave,
            totalGamesPlayed: this.profile.stats.totalGamesPlayed,
            totalHeadshots: this.profile.stats.totalHeadshots,
            maxCombo: this.profile.stats.maxCombo,
            totalPerfectWaves: this.profile.stats.totalPerfectWaves,
            totalPickupsCollected: this.profile.stats.totalPickupsCollected,
            totalCoopWins: this.profile.stats.totalCoopWins
        };
        const newlyUnlocked = achievementSystem.updateProgress(sessionStatsForAchievements);

        // Update battlepass (basic match completion bonus)
        const battlepassProgress = battlepassSystem.addXP(10); // Base match completion

        // Save profile
        this.saveProfile();

        return {
            rankProgress,
            newlyUnlocked,
            battlepassProgress
        };
    }

    /**
     * Get profile data
     * @returns {Object} Profile object
     */
    getProfile() {
        if (!this.profile) {
            this.loadProfile();
        }
        return this.profile;
    }

    /**
     * Update username
     * @param {string} username - New username
     */
    setUsername(username) {
        if (!this.profile) {
            this.loadProfile();
        }
        this.profile.username = username;
        this.saveProfile();
    }

    /**
     * Set title
     * @param {string} title - Title to set
     */
    setTitle(title) {
        if (!this.profile) {
            this.loadProfile();
        }
        this.profile.title = title;
        this.saveProfile();
    }

    /**
     * Export profile data (for backup)
     * @returns {string} JSON string of profile
     */
    exportProfile() {
        if (!this.profile) {
            this.loadProfile();
        }
        return JSON.stringify(this.profile, null, 2);
    }

    /**
     * Import profile data (from backup)
     * @param {string} profileJson - JSON string of profile
     * @returns {boolean} True if successful
     */
    importProfile(profileJson) {
        try {
            const profile = JSON.parse(profileJson);
            this.migrateProfile(profile);
            this.profile = profile;
            this.saveProfile();
            this.initializeSystems();
            return true;
        } catch (error) {
            console.error('Failed to import profile:', error);
            return false;
        }
    }
}

export const playerProfileSystem = new PlayerProfileSystem();

