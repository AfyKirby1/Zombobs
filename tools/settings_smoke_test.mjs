import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
    getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
        storage.set(key, String(value));
    },
    removeItem(key) {
        storage.delete(key);
    }
};

const {
    SettingsManager,
    SETTINGS_VERSION,
    SETTING_SCHEMA
} = await import('../js/systems/SettingsManager.js');

storage.set('zombobs_settings', JSON.stringify({
    _version: 2,
    audio: {
        masterVolume: 99,
        musicVolume: 0.5,
        spatialAudio: true
    },
    video: {
        qualityPreset: 'custom',
        resolutionScale: 99,
        crosshairColor: 'not-a-color',
        fpsLimit: 55,
        autoSprint: true,
        zombobsFXEnabled: 'yes'
    },
    gameplay: {
        autoReload: 'no'
    },
    injected: {
        unsafe: true
    }
}));

const manager = new SettingsManager();
assert.equal(manager.settings._version, SETTINGS_VERSION, 'migration stamps current version');
assert.equal(manager.getSetting('audio', 'masterVolume'), 1, 'numbers are clamped');
assert.equal(manager.getSetting('audio', 'musicVolume'), 0.25, 'v3 music migration still runs');
assert.equal(manager.getSetting('video', 'resolutionScale'), 2, 'resolution is clamped');
assert.equal(manager.getSetting('video', 'crosshairColor'), '#00ff00', 'invalid colors use default');
assert.equal(manager.getSetting('video', 'fpsLimit'), 0, 'invalid enum uses default');
assert.equal(manager.getSetting('gameplay', 'autoSprint'), true, 'legacy autoSprint location migrates');
assert.equal(manager.getSetting('gameplay', 'autoReload'), true, 'invalid booleans use default');
assert.equal('spatialAudio' in manager.settings.audio, false, 'retired settings are removed');
assert.equal('injected' in manager.settings, false, 'unknown categories are removed');

for (const [category, rules] of Object.entries(SETTING_SCHEMA)) {
    assert.ok(manager.settings[category], `default category exists: ${category}`);
    for (const key of Object.keys(rules)) {
        assert.notEqual(manager.settings[category][key], undefined, `default exists: ${category}.${key}`);
    }
}

const changes = [];
manager.addChangeListener((category, key, value) => changes.push(`${category}.${key}:${value}`));
assert.equal(manager.applyVideoPreset('low'), true);
changes.length = 0;
assert.equal(manager.applyVideoPreset('ultra'), true);
assert.equal(manager.getSetting('video', 'qualityPreset'), 'ultra');
assert.equal(manager.getSetting('video', 'postProcessingQuality'), 'high');
assert.equal(manager.getSetting('video', 'colorGrading'), 0.55);
assert.ok(changes.some(change => change.startsWith('video.postProcessingQuality:')),
    'preset notifies post-processing consumer');
assert.ok(changes.some(change => change.startsWith('video.webgpuEnabled:')),
    'preset notifies WebGPU consumer');

changes.length = 0;
assert.equal(manager.setSetting('video', 'bloomIntensity', 0.37), true);
assert.equal(manager.getSetting('video', 'qualityPreset'), 'custom', 'manual quality tweak selects Custom');
assert.ok(changes.includes('video.qualityPreset:custom'), 'Custom transition is notified');

const previousParticleCount = manager.getSetting('video', 'particleCount');
assert.equal(manager.setSetting('video', 'particleCount', 'absurd'), false, 'invalid enum is rejected');
assert.equal(manager.getSetting('video', 'particleCount'), previousParticleCount);

manager.setSetting('video', 'fpsLimit', 120);
manager.setSetting('video', 'vsync', true);
assert.equal(manager.getSetting('video', 'fpsLimit'), 120, 'native pacing preserves selected FPS cap');

console.log('settings smoke test passed');
