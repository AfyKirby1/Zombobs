export class SettingsManager {
    constructor() {
        this.defaultSettings = {
            audio: {
                masterVolume: 1.0
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
                weapon3: '3'
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
        for (const category in saved) {
            if (merged[category]) {
                for (const key in saved[category]) {
                    merged[category][key] = saved[category][key];
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
        this.saveSettings();
    }
}

// Export a singleton instance
export const settingsManager = new SettingsManager();
