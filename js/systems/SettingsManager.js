export class SettingsManager {
    constructor() {
        this.defaultSettings = {
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.5,
                sfxVolume: 1.0
            },
            video: {
                qualityPreset: 'high', // low, medium, high, custom
                particleCount: 200,
                resolutionScale: 1.0,
                vignette: true,
                shadows: true,
                lighting: true,
                lowHealthWarning: true,
                floatingText: true,
                dynamicCrosshair: true,
                enemyHealthBars: true,
                reloadBar: true,
                crosshairStyle: 'default', // default, dot, cross, circle
                screenShakeIntensity: 1.0, // 0.0 to 1.0
                damageNumberStyle: 'floating', // floating, stacking, off
                fpsLimit: 0, // 0 = unlimited, 30, 60, 120
                showDebugStats: false
            },
            gameplay: {
                autoSprint: false,
                pauseOnFocusLoss: true,
                showFps: false
            },
            controls: {
                moveUp: 'w',
                moveDown: 's',
                moveLeft: 'a',
                moveRight: 'd',
                sprint: 'shift',
                reload: 'r',
                grenade: 'g',
                melee: 'v',
                weapon1: '1',
                weapon2: '2',
                weapon3: '3',
                weapon4: '4',
                scrollWheelSwitch: true
            },
            gamepad: {
                fire: 7, // RT
                reload: 2, // X
                grenade: 5, // RB
                // interact: 0, // A (Not used in game logic yet, but good to have)
                sprint: 10, // L3
                pause: 9, // Start
                prevWeapon: 4, // LB
                nextWeapon: 3, // Y
                melee: 11 // R3
            }
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('zombobs_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                return this.mergeSettings(this.defaultSettings, parsed);
            }
        } catch (error) {
            console.log('Failed to load settings:', error);
        }
        // Return defaults copy
        return JSON.parse(JSON.stringify(this.defaultSettings));
    }

    mergeSettings(defaults, saved) {
        const merged = JSON.parse(JSON.stringify(defaults));
        
        // Merge saved values
        for (const category in saved) {
            if (merged[category]) {
                for (const key in saved[category]) {
                    merged[category][key] = saved[category][key];
                }
            }
        }

        // Migration: Check if autoSprint is in video (old location) and move to gameplay
        if (saved.video && saved.video.autoSprint !== undefined) {
            if (!merged.gameplay) merged.gameplay = {};
            merged.gameplay.autoSprint = saved.video.autoSprint;
            // We don't delete it from video in 'merged' because it wasn't there in defaults (we overwrote defaults structure initially but then merged saved into it... wait)
            // Actually merged starts as defaults. 
            // If saved.video has autoSprint, it gets added to merged.video because of the loop above if we are not careful.
            // But wait, the loop above iterates keys in saved[category]. If 'autoSprint' is in saved.video, it gets added to merged.video.
            // We should clean it up from merged.video if it shouldn't be there.
            delete merged.video.autoSprint;
        }
        
        // Ensure all default categories and keys exist (handles new updates)
        for (const category in defaults) {
            if (!merged[category]) {
                merged[category] = JSON.parse(JSON.stringify(defaults[category]));
            } else {
                for (const key in defaults[category]) {
                    if (merged[category][key] === undefined) {
                        merged[category][key] = defaults[category][key];
                    }
                }
            }
        }
        
        return merged;
    }

    saveSettings() {
        try {
            localStorage.setItem('zombobs_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.log('Failed to save settings:', error);
        }
    }

    getSetting(category, key) {
        return this.settings[category]?.[key];
    }

    setSetting(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        this.settings[category][key] = value;
        
        // If a video setting changes that isn't the preset itself, switch preset to 'custom'
        if (category === 'video' && key !== 'qualityPreset') {
            this.settings.video.qualityPreset = 'custom';
        }
        
        this.saveSettings();
    }
    
    applyVideoPreset(preset) {
        if (preset === 'low') {
            this.settings.video.particleCount = 50;
            this.settings.video.resolutionScale = 0.75;
            this.settings.video.vignette = false;
            this.settings.video.shadows = false;
            this.settings.video.lighting = false;
        } else if (preset === 'medium') {
            this.settings.video.particleCount = 100;
            this.settings.video.resolutionScale = 1.0;
            this.settings.video.vignette = true;
            this.settings.video.shadows = true;
            this.settings.video.lighting = false;
        } else if (preset === 'high') {
            this.settings.video.particleCount = 200;
            this.settings.video.resolutionScale = 1.0;
            this.settings.video.vignette = true;
            this.settings.video.shadows = true;
            this.settings.video.lighting = true;
        }
        this.settings.video.qualityPreset = preset;
        this.saveSettings();
    }
}

// Export a singleton instance
export const settingsManager = new SettingsManager();
