import { settingsManager } from './SettingsManager.js';

// Audio Context for sound effects
let audioContext = null;
let gunshotBuffer = null; // Cache gunshot audio buffer
let masterGainNode = null; // Master volume control
let sfxGainNode = null; // SFX volume control
let menuMusic = null; // HTMLAudioElement for menu music
let menuMusicSource = null; // MediaElementSourceNode
let menuMusicGain = null; // Gain node for menu music

// Initialize audio context (needs user interaction first)
export function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for global volume control
            masterGainNode = audioContext.createGain();
            const masterVol = settingsManager.getSetting('audio', 'masterVolume');
            masterGainNode.gain.value = masterVol !== undefined ? masterVol : 1.0;
            masterGainNode.connect(audioContext.destination);

            // Create SFX gain node
            sfxGainNode = audioContext.createGain();
            const sfxVol = settingsManager.getSetting('audio', 'sfxVolume');
            sfxGainNode.gain.value = sfxVol !== undefined ? sfxVol : 1.0;
            sfxGainNode.connect(masterGainNode);

            // Pre-create the gunshot buffer once for performance
            createGunshotBuffer();
            
            // Update music volume if it exists
            if (menuMusicGain) {
                const musicVol = settingsManager.getSetting('audio', 'musicVolume');
                menuMusicGain.gain.value = (musicVol !== undefined ? musicVol : 0.5);
            }

        } catch (error) {
            console.log('Audio context not supported:', error);
        }
    }
    return audioContext;
}

export function getMasterGainNode() {
    return masterGainNode;
}

export function updateAudioSettings() {
    if (!audioContext) return;
    
    const masterVol = settingsManager.getSetting('audio', 'masterVolume');
    if (masterGainNode) {
        masterGainNode.gain.value = masterVol !== undefined ? masterVol : 1.0;
    }

    const sfxVol = settingsManager.getSetting('audio', 'sfxVolume');
    if (sfxGainNode) {
        sfxGainNode.gain.value = sfxVol !== undefined ? sfxVol : 1.0;
    }

    const musicVol = settingsManager.getSetting('audio', 'musicVolume');
    if (menuMusicGain) {
        menuMusicGain.gain.value = musicVol !== undefined ? musicVol : 0.5;
    } else if (menuMusic) {
        // Fallback if Web Audio API isn't fully connected for music
        menuMusic.volume = (musicVol !== undefined ? musicVol : 0.5) * (masterVol !== undefined ? masterVol : 1.0);
    }
}

export function playMenuMusic() {
    if (!menuMusic) {
        menuMusic = new Audio('assets/Shadows of the Wasteland.mp3');
        menuMusic.loop = true;
    }

    if (!audioContext) {
        initAudio();
    }

    if (audioContext && !menuMusicSource) {
        // Connect to Web Audio API if possible for volume control
        try {
            menuMusicSource = audioContext.createMediaElementSource(menuMusic);
            menuMusicGain = audioContext.createGain();
            const musicVol = settingsManager.getSetting('audio', 'musicVolume');
            menuMusicGain.gain.value = musicVol !== undefined ? musicVol : 0.5; 
            menuMusicSource.connect(menuMusicGain);
            menuMusicGain.connect(masterGainNode || audioContext.destination);
        } catch (e) {
            console.log("Could not connect menu music to audio context", e);
        }
    }

    // Play if not already playing
    if (menuMusic.paused) {
        menuMusic.play().catch(e => console.log("Menu music play failed (likely autoplay block):", e));
    }
}

export function stopMenuMusic() {
    if (menuMusic) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
}

// Create and cache the gunshot sound buffer (called once)
function createGunshotBuffer() {
    if (!audioContext || gunshotBuffer) return;
    
    const duration = 0.1; // 100ms
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate gunshot waveform (sharp attack + decay)
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Initial sharp crack (high frequency noise)
        let sample = Math.random() * 2 - 1;
        // Add low frequency boom
        sample += Math.sin(t * 60) * 0.5;
        // Quick decay envelope
        const envelope = Math.max(0, 1 - (t / duration) * 3);
        data[i] = sample * envelope * 0.3; // Volume
    }
    
    gunshotBuffer = buffer;
}

// Play cached gunshot sound using Web Audio API
export function playGunshotSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }
    
    // Ensure buffer exists (in case audioContext was created elsewhere)
    if (!gunshotBuffer) {
        createGunshotBuffer();
        if (!gunshotBuffer) return;
    }
    
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4; // Volume level relative to SFX
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play (e.g., browser restrictions)
    }
}

// Generate damage/hurt sound using Web Audio API
export function playDamageSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }
    
    try {
        // Create a damage sound (grunt/impact like)
        const duration = 0.2; // 200ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate damage waveform (grunt-like with impact)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Low frequency grunt/hurt sound (vowel-like)
            let sample = 0;
            // Fundamental frequency (human-like grunt around 150-200Hz)
            sample += Math.sin(t * 175 * 2 * Math.PI) * 0.6;
            // Add harmonics for more body
            sample += Math.sin(t * 175 * 4 * Math.PI) * 0.3;
            sample += Math.sin(t * 175 * 6 * Math.PI) * 0.1;
            // Add slight noise for impact texture
            sample += (Math.random() * 2 - 1) * 0.2;
            // Envelope: quick attack, slower decay (like a grunt)
            const attack = Math.min(1, t / 0.02); // 20ms attack
            const decay = Math.max(0, 1 - (t - 0.02) / (duration - 0.02));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.25; // Volume
        }
        
        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.375; // Volume level (reduced by 25%)
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate kill confirmed sound using Web Audio API
export function playKillSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }
    
    try {
        // Create a satisfying kill confirmation sound (pop/thud)
        const duration = 0.15; // 150ms - shorter and punchier than damage sound
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate kill sound waveform (satisfying pop/thud)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            // Higher frequency pop (around 300-400Hz) for satisfying "pop" feel
            sample += Math.sin(t * 350 * 2 * Math.PI) * 0.5;
            // Add lower frequency thud (around 100Hz) for impact
            sample += Math.sin(t * 100 * 2 * Math.PI) * 0.4;
            // Add higher harmonics for crispness
            sample += Math.sin(t * 700 * 2 * Math.PI) * 0.2;
            // Add slight noise burst for texture
            sample += (Math.random() * 2 - 1) * 0.15;
            // Envelope: very quick attack, fast decay (punchy)
            const attack = Math.min(1, t / 0.01); // 10ms attack - very quick
            const decay = Math.max(0, 1 - (t - 0.01) / (duration - 0.01));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.3; // Slightly louder than damage sound
        }
        
        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate walking/footstep sound using Web Audio API
export function playFootstepSound(isSprinting = false) {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }
    
    try {
        // Create a footstep sound (thud/tap like)
        const duration = 0.15; // 150ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate footstep waveform (impact + low thud)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Initial impact (high frequency tap)
            // Sprinting footsteps have slightly higher frequency for more impact
            const impactFreq = isSprinting ? (900 + Math.random() * 200) : (800 + Math.random() * 200);
            sample += Math.sin(t * impactFreq * 2 * Math.PI) * 0.3 * Math.exp(-t * 30);
            
            // Low frequency thud (bass) - louder when sprinting
            const bassVolume = isSprinting ? 0.5 : 0.4;
            sample += Math.sin(t * 80 * 2 * Math.PI) * bassVolume;
            sample += Math.sin(t * 120 * 2 * Math.PI) * (bassVolume * 0.5);
            
            // Add texture with filtered noise (like ground contact) - more noise when sprinting
            const noiseAmount = isSprinting ? 0.2 : 0.15;
            const noise = (Math.random() * 2 - 1) * noiseAmount;
            const noiseFilter = Math.exp(-t * 15); // High frequency decays quickly
            sample += noise * noiseFilter;
            
            // Envelope: very quick attack, medium decay
            const attack = Math.min(1, t / 0.01); // 10ms attack
            const decay = Math.max(0, 1 - (t - 0.01) / (duration - 0.01));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.2; // Volume
        }
        
        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        // Sprinting footsteps are louder (50% increase vs normal)
        gainNode.gain.value = isSprinting ? 0.5625 : 0.375; // 0.375 * 1.5 = 0.5625
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Play explosion sound
export function playExplosionSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }
    
    try {
        const duration = 0.4; // 400ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate explosion waveform (low rumble with high crack)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            // Low frequency rumble
            sample += Math.sin(t * 60 * 2 * Math.PI) * 0.4;
            sample += Math.sin(t * 120 * 2 * Math.PI) * 0.3;
            // High frequency crack
            sample += Math.sin(t * 800 * 2 * Math.PI) * 0.2 * Math.exp(-t * 5);
            // Envelope: quick attack, slow decay
            const envelope = Math.exp(-t * 2);
            data[i] = sample * envelope * 0.3;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

export function playRestartSound() {
    // Play a restart confirmation sound
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }
    
    try {
        // Create a rising tone for restart confirmation
        const duration = 0.3; // 300ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate rising tone waveform
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Rising frequency from 200Hz to 800Hz
            const freq = 200 + (t / duration) * 600;
            let sample = Math.sin(t * freq * 2 * Math.PI);
            // Add some harmonics for richness
            sample += Math.sin(t * freq * 2 * 2 * Math.PI) * 0.3;
            sample += Math.sin(t * freq * 3 * 2 * Math.PI) * 0.1;
            // Envelope: medium attack, medium decay
            const attack = Math.min(1, t / 0.05); // 50ms attack
            const decay = Math.max(0, 1 - (t - 0.05) / (duration - 0.05));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.2; // Volume
        }
        
        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.3; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate hit marker sound using Web Audio API
export function playHitSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }
    
    try {
        // Create a quick, sharp hit marker sound (like a "tick" or "click")
        const duration = 0.08; // 80ms - very short and sharp
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate hit sound waveform (sharp tick)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            // High frequency tick (around 1000Hz) for sharpness
            sample += Math.sin(t * 1000 * 2 * Math.PI) * 0.4;
            // Add higher harmonics for crispness
            sample += Math.sin(t * 2000 * 2 * Math.PI) * 0.2;
            // Add slight noise burst for texture
            sample += (Math.random() * 2 - 1) * 0.1;
            // Very quick envelope: fast attack, fast decay
            const attack = Math.min(1, t / 0.005); // 5ms attack - very quick
            const decay = Math.max(0, 1 - (t - 0.005) / (duration - 0.005));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.25; // Volume
        }
        
        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.35; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}
