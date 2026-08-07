// Settings are persisted client-side. Increment when migrations or defaults change.
export const SETTINGS_VERSION = 5;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const clone = value => JSON.parse(JSON.stringify(value));
const numberRule = (min, max, step = 0) => ({ type: 'number', min, max, step });
const enumRule = values => ({ type: 'enum', values });
const boolRule = { type: 'boolean' };
const keyRule = { type: 'key' };
const buttonRule = { type: 'button' };

export const SETTING_SCHEMA = Object.freeze({
    audio: Object.freeze({
        masterVolume: numberRule(0, 1, 0.01),
        musicVolume: numberRule(0, 1, 0.01),
        sfxVolume: numberRule(0, 1, 0.01),
        muted: boolRule,
        walkingVolume: numberRule(0, 1, 0.01),
        gunshotVolume: numberRule(0, 1, 0.01),
        hitSoundVolume: numberRule(0, 1, 0.01),
        multiplierVolume: numberRule(0, 1, 0.01)
    }),
    video: Object.freeze({
        webgpuEnabled: boolRule,
        bloomIntensity: numberRule(0, 1, 0.01),
        particleCount: enumRule(['low', 'high', 'ultra']),
        lightingQuality: enumRule(['off', 'simple', 'advanced']),
        distortionEffects: boolRule,
        zombobsFXEnabled: boolRule,
        qualityPreset: enumRule(['low', 'medium', 'high', 'ultra', 'custom']),
        resolutionScale: numberRule(0.5, 2, 0.05),
        vignette: boolRule,
        shadows: boolRule,
        lighting: boolRule,
        lowHealthWarning: boolRule,
        floatingText: boolRule,
        dynamicCrosshair: boolRule,
        enemyHealthBars: boolRule,
        enemyNameTags: boolRule,
        reloadBar: boolRule,
        crosshairStyle: enumRule(['default', 'dot', 'cross', 'circle']),
        crosshairColor: { type: 'color' },
        screenShakeMultiplier: numberRule(0, 2, 0.05),
        bloodGoreLevel: numberRule(0, 1, 0.05),
        damageNumberStyle: enumRule(['floating', 'stacking', 'off']),
        damageNumberScale: numberRule(0.5, 2, 0.05),
        fpsLimit: enumRule([0, 30, 60, 90, 120, 144, 165, 240]),
        vsync: boolRule,
        uiScale: numberRule(0.5, 1.5, 0.05),
        showDebugStats: boolRule,
        effectIntensity: numberRule(0, 2, 0.05),
        postProcessingQuality: enumRule(['off', 'low', 'medium', 'high']),
        particleDetail: enumRule(['minimal', 'standard', 'detailed', 'ultra']),
        textRenderingQuality: enumRule(['low', 'medium', 'high']),
        rankBadgeSize: enumRule(['small', 'normal', 'large']),
        showRankBadge: boolRule,
        enemyHealthBarStyle: enumRule(['gradient', 'solid', 'simple']),
        chromaticAberration: numberRule(0, 1, 0.01),
        filmGrain: numberRule(0, 0.2, 0.01),
        vignetteIntensity: numberRule(0, 1, 0.01),
        impactFlashIntensity: numberRule(0, 1, 0.05),
        colorGrading: numberRule(0, 1, 0.01),
        scanlineIntensity: numberRule(0, 0.2, 0.01)
    }),
    gameplay: Object.freeze({
        enableAICompanion: boolRule,
        autoSprint: boolRule,
        autoReload: boolRule,
        pauseOnFocusLoss: boolRule,
        showFps: boolRule
    }),
    controls: Object.freeze({
        moveUp: keyRule,
        moveDown: keyRule,
        moveLeft: keyRule,
        moveRight: keyRule,
        sprint: keyRule,
        reload: keyRule,
        grenade: keyRule,
        melee: keyRule,
        weapon1: keyRule,
        weapon2: keyRule,
        weapon3: keyRule,
        weapon4: keyRule,
        weapon5: keyRule,
        weapon6: keyRule,
        weapon7: keyRule,
        weapon8: keyRule,
        scrollWheelSwitch: boolRule,
        flashlight: keyRule,
        dodge: keyRule,
        cycleThrowable: keyRule
    }),
    gamepad: Object.freeze({
        fire: buttonRule,
        reload: buttonRule,
        grenade: buttonRule,
        sprint: buttonRule,
        pause: buttonRule,
        prevWeapon: buttonRule,
        nextWeapon: buttonRule,
        melee: buttonRule,
        dodge: buttonRule,
        cycleThrowable: buttonRule
    }),
    ui: Object.freeze({
        controlMode: enumRule(['keyboard', 'gamepad'])
    })
});

const VIDEO_PRESETS = Object.freeze({
    low: Object.freeze({
        webgpuEnabled: false,
        particleCount: 'low',
        resolutionScale: 0.75,
        textRenderingQuality: 'low',
        vignette: false,
        shadows: false,
        lighting: false,
        bloomIntensity: 0,
        lightingQuality: 'off',
        distortionEffects: false,
        zombobsFXEnabled: false,
        effectIntensity: 0.65,
        postProcessingQuality: 'off',
        particleDetail: 'minimal',
        chromaticAberration: 0,
        filmGrain: 0,
        vignetteIntensity: 0,
        impactFlashIntensity: 0.3,
        colorGrading: 0,
        scanlineIntensity: 0
    }),
    medium: Object.freeze({
        webgpuEnabled: true,
        particleCount: 'low',
        resolutionScale: 1,
        textRenderingQuality: 'medium',
        vignette: true,
        shadows: true,
        lighting: false,
        bloomIntensity: 0.25,
        lightingQuality: 'simple',
        distortionEffects: true,
        zombobsFXEnabled: false,
        effectIntensity: 0.85,
        postProcessingQuality: 'low',
        particleDetail: 'standard',
        chromaticAberration: 0.12,
        filmGrain: 0.02,
        vignetteIntensity: 0.18,
        impactFlashIntensity: 0.45,
        colorGrading: 0.16,
        scanlineIntensity: 0.01
    }),
    high: Object.freeze({
        webgpuEnabled: true,
        particleCount: 'high',
        resolutionScale: 1.25,
        textRenderingQuality: 'high',
        vignette: true,
        shadows: true,
        lighting: true,
        bloomIntensity: 0.6,
        lightingQuality: 'advanced',
        distortionEffects: true,
        zombobsFXEnabled: true,
        effectIntensity: 1,
        postProcessingQuality: 'high',
        particleDetail: 'detailed',
        chromaticAberration: 0.3,
        filmGrain: 0.05,
        vignetteIntensity: 0.26,
        impactFlashIntensity: 0.65,
        colorGrading: 0.35,
        scanlineIntensity: 0.025
    }),
    ultra: Object.freeze({
        webgpuEnabled: true,
        particleCount: 'ultra',
        resolutionScale: 1.5,
        textRenderingQuality: 'high',
        vignette: true,
        shadows: true,
        lighting: true,
        bloomIntensity: 0.8,
        lightingQuality: 'advanced',
        distortionEffects: true,
        zombobsFXEnabled: true,
        effectIntensity: 1.15,
        postProcessingQuality: 'high',
        particleDetail: 'ultra',
        chromaticAberration: 0.5,
        filmGrain: 0.07,
        vignetteIntensity: 0.34,
        impactFlashIntensity: 0.85,
        colorGrading: 0.55,
        scanlineIntensity: 0.04
    })
});

const QUALITY_PRESET_KEYS = new Set(
    Object.keys(VIDEO_PRESETS.high)
);

function normalizeNumber(value, rule) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const clamped = Math.max(rule.min, Math.min(rule.max, numeric));
    if (!rule.step) return clamped;
    const stepped = Math.round((clamped - rule.min) / rule.step) * rule.step + rule.min;
    return Number(Math.max(rule.min, Math.min(rule.max, stepped)).toFixed(4));
}

function normalizeSettingValue(rule, value) {
    if (!rule) return null;
    if (rule.type === 'number') return normalizeNumber(value, rule);
    if (rule.type === 'boolean') return typeof value === 'boolean' ? value : null;
    if (rule.type === 'enum') return rule.values.includes(value) ? value : null;
    if (rule.type === 'color') {
        return typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : null;
    }
    if (rule.type === 'key') {
        return typeof value === 'string' && value.length > 0 && value.length <= 32
            ? value.toLowerCase()
            : null;
    }
    if (rule.type === 'button') {
        return Number.isInteger(value) && value >= 0 && value <= 31 ? value : null;
    }
    return null;
}

export class SettingsManager {
    constructor() {
        this.callbacks = [];
        this.defaultSettings = {
            _version: SETTINGS_VERSION,
            audio: {
                masterVolume: 1,
                musicVolume: 0.25,
                sfxVolume: 1,
                muted: false,
                walkingVolume: 1,
                gunshotVolume: 1,
                hitSoundVolume: 1,
                multiplierVolume: 1
            },
            video: {
                webgpuEnabled: true,
                bloomIntensity: 0.6,
                particleCount: 'high',
                lightingQuality: 'advanced',
                distortionEffects: true,
                zombobsFXEnabled: true,
                qualityPreset: 'high',
                resolutionScale: 1.25,
                vignette: true,
                shadows: true,
                lighting: true,
                lowHealthWarning: true,
                floatingText: true,
                dynamicCrosshair: true,
                enemyHealthBars: true,
                enemyNameTags: true,
                reloadBar: true,
                crosshairStyle: 'default',
                crosshairColor: '#00ff00',
                screenShakeMultiplier: 1,
                bloodGoreLevel: 1,
                damageNumberStyle: 'floating',
                damageNumberScale: 1,
                fpsLimit: 0,
                vsync: true,
                uiScale: 1,
                showDebugStats: false,
                effectIntensity: 1,
                postProcessingQuality: 'high',
                particleDetail: 'detailed',
                textRenderingQuality: 'high',
                rankBadgeSize: 'normal',
                showRankBadge: true,
                enemyHealthBarStyle: 'gradient',
                chromaticAberration: 0.3,
                filmGrain: 0.05,
                vignetteIntensity: 0.26,
                impactFlashIntensity: 0.65,
                colorGrading: 0.35,
                scanlineIntensity: 0.025
            },
            gameplay: {
                enableAICompanion: true,
                autoSprint: false,
                autoReload: true,
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
                weapon5: '5',
                weapon6: '6',
                weapon7: '7',
                weapon8: '8',
                scrollWheelSwitch: true,
                flashlight: 'f',
                dodge: ' ',
                cycleThrowable: 'q'
            },
            gamepad: {
                fire: 7,
                reload: 2,
                grenade: 5,
                sprint: 10,
                pause: 9,
                prevWeapon: 4,
                nextWeapon: 3,
                melee: 11,
                dodge: 1,
                cycleThrowable: 13
            },
            ui: {
                controlMode: 'keyboard'
            }
        };

        if (typeof window !== 'undefined') {
            const width = window.innerWidth || 0;
            const nav = typeof navigator !== 'undefined' ? navigator : null;
            const ua = nav?.userAgent || '';
            const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
                || (typeof window.matchMedia === 'function'
                    && window.matchMedia('(pointer: coarse)').matches
                    && (nav?.maxTouchPoints || 0) > 0
                    && width > 0 && width <= 900);
            if (isMobile) {
                Object.assign(this.defaultSettings.video, VIDEO_PRESETS.low);
                this.defaultSettings.video.qualityPreset = 'low';
                this.defaultSettings.video.uiScale = width >= 900 ? 1.4 : 1.2;
            }
        }

        this.settings = this.loadSettings();
        this.applySettingsMigrations();
    }

    applySettingsMigrations() {
        const savedVersion = Number.isInteger(this.settings._version) ? this.settings._version : 1;
        let changed = false;

        if (savedVersion < 3 && this.settings.audio.musicVolume === 0.5) {
            this.settings.audio.musicVolume = 0.25;
            changed = true;
        }

        if (savedVersion < 5) {
            const preset = this.settings.video.qualityPreset;
            const presetValues = VIDEO_PRESETS[preset];
            if (presetValues) {
                for (const [key, value] of Object.entries(presetValues)) {
                    if (this.settings.video[key] !== value) {
                        this.settings.video[key] = value;
                        changed = true;
                    }
                }
            }
        }

        if (this.settings._version !== SETTINGS_VERSION) {
            this.settings._version = SETTINGS_VERSION;
            changed = true;
        }

        if (changed) this.saveSettings();
    }

    loadSettings() {
        try {
            const savedRaw = globalThis.localStorage?.getItem('zombobs_settings');
            if (savedRaw) {
                const parsed = JSON.parse(savedRaw);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('settings payload is not an object');
                }
                if (parsed._version !== SETTINGS_VERSION) {
                    console.log(`[Settings] Migrating from v${parsed._version || 1} to v${SETTINGS_VERSION}`);
                }
                return this.mergeSettings(this.defaultSettings, parsed);
            }
        } catch (error) {
            console.warn('[Settings] Failed to load settings, using defaults:', error.message);
        }
        return clone(this.defaultSettings);
    }

    mergeSettings(defaults, saved) {
        const merged = clone(defaults);
        merged._version = Number.isInteger(saved?._version) ? saved._version : 1;

        for (const category of Object.keys(SETTING_SCHEMA)) {
            const savedCategory = saved?.[category];
            const rules = SETTING_SCHEMA[category];
            if (!savedCategory || typeof savedCategory !== 'object' || Array.isArray(savedCategory)) continue;

            for (const key of Object.keys(rules)) {
                if (savedCategory[key] === undefined) continue;
                const normalized = normalizeSettingValue(rules[key], savedCategory[key]);
                if (normalized !== null) merged[category][key] = normalized;
            }
        }

        // v1/v2 stored autoSprint under video.
        if (saved?.gameplay?.autoSprint === undefined && typeof saved?.video?.autoSprint === 'boolean') {
            merged.gameplay.autoSprint = saved.video.autoSprint;
        }

        return merged;
    }

    saveSettings() {
        try {
            globalThis.localStorage?.setItem('zombobs_settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.warn('[Settings] Failed to save settings:', error.message);
            return false;
        }
    }

    _notify(changes) {
        for (const change of changes) {
            for (const callback of this.callbacks) {
                try {
                    callback(change.category, change.key, change.value);
                } catch (error) {
                    console.error('[Settings] Change listener failed:', error);
                }
            }
        }
    }

    resetToDefaults() {
        const previous = this.settings;
        this.settings = clone(this.defaultSettings);
        this.saveSettings();
        const changes = [];
        for (const category of Object.keys(SETTING_SCHEMA)) {
            for (const key of Object.keys(SETTING_SCHEMA[category])) {
                if (previous?.[category]?.[key] !== this.settings[category][key]) {
                    changes.push({ category, key, value: this.settings[category][key] });
                }
            }
        }
        this._notify(changes);
        console.log('[Settings] Reset to defaults');
        return true;
    }

    resetCategory(category) {
        if (!SETTING_SCHEMA[category]) {
            console.warn(`[Settings] Unknown category: ${category}`);
            return false;
        }
        const previous = this.settings[category];
        this.settings[category] = clone(this.defaultSettings[category]);
        this.saveSettings();
        const changes = [];
        for (const key of Object.keys(SETTING_SCHEMA[category])) {
            if (previous?.[key] !== this.settings[category][key]) {
                changes.push({ category, key, value: this.settings[category][key] });
            }
        }
        this._notify(changes);
        console.log(`[Settings] Reset category: ${category}`);
        return true;
    }

    isModified(category, key) {
        return this.settings[category]?.[key] !== this.defaultSettings[category]?.[key];
    }

    getSetting(category, key) {
        return this.settings[category]?.[key];
    }

    setSetting(category, key, value) {
        const rule = SETTING_SCHEMA[category]?.[key];
        if (!rule) {
            console.warn(`[Settings] Unknown setting: ${category}.${key}`);
            return false;
        }

        const normalized = normalizeSettingValue(rule, value);
        if (normalized === null) {
            console.warn(`[Settings] Rejected invalid value for ${category}.${key}:`, value);
            return false;
        }

        if (category === 'video' && key === 'qualityPreset' && normalized !== 'custom') {
            return this.applyVideoPreset(normalized);
        }

        const changes = [];
        if (this.settings[category][key] !== normalized) {
            this.settings[category][key] = normalized;
            changes.push({ category, key, value: normalized });
        }

        if (category === 'video' && key !== 'qualityPreset' && QUALITY_PRESET_KEYS.has(key)
            && this.settings.video.qualityPreset !== 'custom') {
            this.settings.video.qualityPreset = 'custom';
            changes.push({ category: 'video', key: 'qualityPreset', value: 'custom' });
        }

        if (changes.length === 0) return true;
        this.saveSettings();
        this._notify(changes);
        return true;
    }

    addChangeListener(callback) {
        if (typeof callback === 'function' && !this.callbacks.includes(callback)) {
            this.callbacks.push(callback);
        }
        return () => this.removeChangeListener(callback);
    }

    removeChangeListener(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) this.callbacks.splice(index, 1);
    }

    applyVideoPreset(preset) {
        if (preset === 'custom') {
            return this.setSetting('video', 'qualityPreset', 'custom');
        }
        const values = VIDEO_PRESETS[preset];
        if (!values) {
            console.warn(`[Settings] Unknown video preset: ${preset}`);
            return false;
        }

        const changes = [];
        for (const [key, value] of Object.entries(values)) {
            if (this.settings.video[key] !== value) {
                this.settings.video[key] = value;
                changes.push({ category: 'video', key, value });
            }
        }
        if (this.settings.video.qualityPreset !== preset) {
            this.settings.video.qualityPreset = preset;
            changes.unshift({ category: 'video', key: 'qualityPreset', value: preset });
        }

        if (changes.length === 0) return true;
        this.saveSettings();
        this._notify(changes);
        return true;
    }
}

export const settingsManager = new SettingsManager();
