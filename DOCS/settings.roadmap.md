# ⚙️ Settings Panel Roadmap

## Overview
A beginner-friendly settings panel that allows players to customize their gaming experience. The settings panel will be accessible from the main menu and pause menu, with all preferences saved to localStorage for persistence across sessions.

## Design Philosophy
- **KISS Principle** - Keep it simple and intuitive
- **Beginner-Friendly** - Clear labels, helpful tooltips, sensible defaults
- **Visual Feedback** - Immediate preview of changes (especially audio)
- **Persistence** - All settings saved automatically to localStorage
- **Accessibility** - Large buttons, clear contrast, keyboard navigation support

---

## Phase 1: Core Settings Panel (MVP)

### 1.1 Panel Structure
- **Access Points**:
  - Main menu "Settings" button (currently disabled)
  - Pause menu "Settings" option
  - ESC key to close settings and return to previous screen
- **Layout**: 
  - Centered modal overlay with dark semi-transparent background
  - Scrollable list of setting categories (if needed)
  - "Back" button to return to previous screen
  - "Reset to Defaults" button (optional for MVP)

### 1.2 Audio Settings
**Priority: HIGH** - Essential for user experience

| Setting | Type | Range/Options | Default | Description |
|---------|------|---------------|---------|-------------|
| **Master Volume** | Slider | 0-100% | 100% | Controls overall game audio volume |
| **SFX Volume** | Slider | 0-100% | 100% | Controls sound effects (gunshots, explosions, kills, damage) |
| **Music Volume** | Slider | 0-100% | 100% | Controls background music (if added later) |
| **Mute All** | Toggle | On/Off | Off | Quick mute/unmute for all audio |

**Implementation Notes**:
- Sliders use HTML5 range inputs or custom canvas sliders
- Real-time preview: play a test sound when slider is adjusted
- Visual indicator shows current volume level
- SFX and Music volumes are relative to Master Volume (Master × SFX = final SFX volume)

**Storage Key**: `zombobs_settings_audio`

---

### 1.3 Graphics Settings
**Priority: MEDIUM** - Performance and visual customization

| Setting | Type | Range/Options | Default | Description |
|---------|------|---------------|---------|-------------|
| **Screen Shake Intensity** | Slider | 0-200% | 100% | Controls camera shake intensity (0% = disabled) |
| **Particle Effects** | Toggle | On/Off | On | Enable/disable particle effects (blood, sparks, muzzle flash) |
| **Show FPS Counter** | Toggle | On/Off | On | Display FPS counter in top-right corner |
| **Render Quality** | Dropdown | Low/Medium/High | High | Adjusts particle count and visual effects (performance vs quality) |

**Implementation Notes**:
- Screen shake slider: 0% = no shake, 100% = default, 200% = double intensity
- Particle toggle: When off, disable all particle creation (performance boost)
- Render Quality affects:
  - Max particles on screen (Low: 50, Medium: 100, High: 200)
  - Blood splatter particle count
  - Muzzle flash complexity

**Storage Key**: `zombobs_settings_graphics`

---

### 1.4 Gameplay Settings
**Priority: LOW** - Nice-to-have customization

| Setting | Type | Range/Options | Default | Description |
|---------|------|---------------|---------|-------------|
| **Auto-Reload** | Toggle | On/Off | On | Automatically reload when ammo reaches 0 |
| **Show Damage Numbers** | Toggle | On/Off | On | Display floating damage numbers on hits |
| **Show Crosshair** | Toggle | On/Off | On | Display aiming crosshair at mouse cursor |
| **Difficulty Preset** | Dropdown | Easy/Normal/Hard | Normal | Adjusts starting zombie stats (future feature) |

**Implementation Notes**:
- Auto-reload toggle: When off, player must manually press R to reload
- Damage numbers toggle: Controls visibility of floating damage text
- Crosshair toggle: Shows/hides the custom crosshair reticle
- Difficulty preset: Placeholder for future difficulty system

**Storage Key**: `zombobs_settings_gameplay`

---

## Phase 2: Advanced Settings (Future)

### 2.1 Control Settings
**Priority: LOW** - Advanced customization

| Setting | Type | Description |
|---------|------|-------------|
| **Key Bindings** | Key Remap | Allow players to rebind movement, shooting, weapon switching, reload, grenade keys |
| **Mouse Sensitivity** | Slider | Adjust mouse aiming sensitivity (if needed) |
| **Invert Y-Axis** | Toggle | Invert vertical mouse movement (for aiming) |

**Implementation Notes**:
- Key binding UI: Click setting → Press new key → Save
- Prevent duplicate key bindings
- Show current key bindings in settings
- Reset to defaults option

**Storage Key**: `zombobs_settings_controls`

---

### 2.2 Display Settings
**Priority: LOW** - Advanced display options

| Setting | Type | Description |
|---------|------|-------------|
| **Fullscreen** | Toggle | Toggle fullscreen mode |
| **Resolution Scale** | Slider | Adjust canvas resolution (performance vs quality) |
| **VSync** | Toggle | Enable/disable vertical sync (if applicable) |
| **Color Blind Mode** | Toggle | Adjust colors for colorblind accessibility |

**Implementation Notes**:
- Fullscreen uses Fullscreen API
- Resolution scale: 50%-200% (affects canvas size)
- VSync: Browser-dependent, may not be available

**Storage Key**: `zombobs_settings_display`

---

### 2.3 Accessibility Settings
**Priority: MEDIUM** - Important for inclusivity

| Setting | Type | Description |
|---------|------|-------------|
| **High Contrast Mode** | Toggle | Increase contrast for better visibility |
| **Large UI Text** | Toggle | Increase HUD text size |
| **Reduced Motion** | Toggle | Disable screen shake and particle effects |
| **Subtitles** | Toggle | Show text for audio cues (if audio descriptions added) |

**Storage Key**: `zombobs_settings_accessibility`

---

## UI/UX Design

### Visual Design
- **Background**: Dark semi-transparent overlay (rgba(0, 0, 0, 0.85))
- **Panel**: Centered modal with rounded corners, dark theme matching game aesthetic
- **Typography**: Roboto Mono for consistency with game HUD
- **Colors**: 
  - Primary: #ff1744 (game red)
  - Secondary: #ff9800 (orange accents)
  - Text: #ffffff (white)
  - Disabled: #666666 (gray)

### Layout Structure
```
┌─────────────────────────────────────┐
│         SETTINGS                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🔊 Audio                      │ │
│  │  Master Volume:  [━━━━━━━━━]  │ │
│  │  SFX Volume:     [━━━━━━━━━]  │ │
│  │  Music Volume:   [━━━━━━━━━]  │ │
│  │  Mute All:       [●] On       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🎨 Graphics                   │ │
│  │  Screen Shake:   [━━━━━━━━━]  │ │
│  │  Particles:      [●] On       │ │
│  │  FPS Counter:    [●] On       │ │
│  │  Render Quality: [▼] High     │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🎮 Gameplay                   │ │
│  │  Auto-Reload:    [●] On       │ │
│  │  Damage Numbers: [●] On       │ │
│  │  Crosshair:      [●] On       │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Reset to Defaults]  [Back]        │
└─────────────────────────────────────┘
```

### Interaction Design
- **Sliders**: 
  - Click and drag to adjust
  - Click on track to jump to position
  - Show numeric value next to slider
  - Real-time preview for audio sliders
- **Toggles**: 
  - Large clickable areas
  - Visual on/off state (filled circle = on, empty = off)
  - Smooth animation on toggle
- **Dropdowns**: 
  - Click to open, click option to select
  - Highlight current selection
- **Navigation**:
  - Tab key to cycle through settings
  - Enter/Space to toggle/activate
  - ESC to close settings panel

---

## Implementation Plan

### Step 1: Settings Data Structure
```javascript
const defaultSettings = {
    audio: {
        masterVolume: 1.0,      // 0.0 to 1.0
        sfxVolume: 1.0,        // 0.0 to 1.0
        musicVolume: 1.0,     // 0.0 to 1.0
        muted: false
    },
    graphics: {
        screenShakeIntensity: 1.0,  // 0.0 to 2.0
        particlesEnabled: true,
        showFPS: true,
        renderQuality: 'high'        // 'low', 'medium', 'high'
    },
    gameplay: {
        autoReload: true,
        showDamageNumbers: true,
        showCrosshair: true,
        difficulty: 'normal'         // 'easy', 'normal', 'hard'
    }
};
```

### Step 2: Settings Manager Class
```javascript
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }
    
    loadSettings() {
        // Load from localStorage or return defaults
    }
    
    saveSettings() {
        // Save to localStorage
    }
    
    getSetting(category, key) {
        // Get specific setting value
    }
    
    setSetting(category, key, value) {
        // Set specific setting value and save
    }
    
    resetToDefaults() {
        // Reset all settings to defaults
    }
}
```

### Step 3: Settings UI Component
```javascript
class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        this.selectedCategory = 'audio';
    }
    
    draw() {
        // Render settings panel UI
    }
    
    handleClick(x, y) {
        // Handle button/slider clicks
    }
    
    handleKeyPress(key) {
        // Handle keyboard navigation
    }
}
```

### Step 4: Integration Points
- **Audio System**: Apply volume settings to all audio nodes
- **Screen Shake**: Multiply shakeAmount by screenShakeIntensity
- **Particle System**: Check particlesEnabled before creating particles
- **HUD**: Show/hide FPS counter based on setting
- **Gameplay**: Check autoReload setting before auto-reloading

---

## Testing Checklist

### Audio Settings
- [ ] Master volume slider adjusts all sounds
- [ ] SFX volume slider adjusts only sound effects
- [ ] Music volume slider adjusts only music (when implemented)
- [ ] Mute toggle works correctly
- [ ] Settings persist after page reload
- [ ] Test sound plays when adjusting sliders

### Graphics Settings
- [ ] Screen shake intensity affects camera shake
- [ ] Particle toggle disables/enables all particles
- [ ] FPS counter shows/hides correctly
- [ ] Render quality affects particle counts
- [ ] Settings persist after page reload

### Gameplay Settings
- [ ] Auto-reload toggle works correctly
- [ ] Damage numbers show/hide correctly
- [ ] Crosshair shows/hides correctly
- [ ] Settings persist after page reload

### UI/UX
- [ ] Settings panel opens from main menu
- [ ] Settings panel opens from pause menu
- [ ] ESC key closes settings panel
- [ ] Back button returns to previous screen
- [ ] All controls are keyboard accessible
- [ ] Settings save automatically on change
- [ ] Reset to defaults works correctly

---

## Future Enhancements

### Phase 3: Advanced Features
- **Profile System**: Multiple player profiles with different settings
- **Import/Export**: Share settings via JSON export/import
- **Presets**: Quick-select presets (Performance, Quality, Balanced)
- **Tooltips**: Helpful descriptions for each setting
- **Search**: Search bar to quickly find settings

### Phase 4: Platform-Specific
- **Mobile**: Touch-optimized controls and settings
- **Console**: Controller support and settings
- **Steam Deck**: Optimized presets for handheld devices

---

## Technical Considerations

### localStorage Structure
```javascript
// Settings stored as JSON string
localStorage.setItem('zombobs_settings', JSON.stringify({
    audio: { ... },
    graphics: { ... },
    gameplay: { ... },
    version: '1.0'  // For future migration
}));
```

### Performance Impact
- Settings panel should not impact game performance when closed
- Slider updates should be throttled/debounced if needed
- Settings checks should be minimal overhead

### Browser Compatibility
- localStorage available in all modern browsers
- Fullscreen API may need fallback for older browsers
- Audio context volume control works in all modern browsers

---

## Success Metrics
- ✅ Settings panel accessible from main menu and pause menu
- ✅ All Phase 1 settings functional and persistent
- ✅ Zero performance impact when settings panel is closed
- ✅ Settings apply immediately without requiring restart
- ✅ User can reset to defaults easily
- ✅ Settings survive page reload

---

## Next Steps
1. **Implement SettingsManager class** - Core settings management
2. **Create SettingsPanel UI component** - Visual settings interface
3. **Integrate with existing systems** - Apply settings to audio, graphics, gameplay
4. **Add localStorage persistence** - Save and load settings
5. **Test and polish** - Ensure smooth UX and functionality

---

*Last Updated: Based on current game architecture and roadmap*

