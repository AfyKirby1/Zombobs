# Design Document

## Overview

The Weapon Accuracy Indicator provides real-time visual feedback about weapon accuracy during gameplay. The feature integrates with the existing weapon system, HUD rendering, and settings management to display a color-coded accuracy bar near the weapon information area. The indicator updates every frame to reflect the current accuracy value used for bullet spread calculations.

## Architecture

### Component Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Game Loop (main.js)                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  updateGame() → Update weapon accuracy values      │ │
│  │  drawGame() → Render HUD with accuracy indicator   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Player State (gameState.js)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  player.weaponAccuracy: number (0.0 to 1.0)        │ │
│  │  player.lastShotTime: timestamp                    │ │
│  │  player.currentWeapon: weapon reference            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              GameHUD Component (GameHUD.js)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  drawAccuracyIndicator(player, x, y, width)        │ │
│  │  - Reads player.weaponAccuracy                     │ │
│  │  - Renders color-coded bar                         │ │
│  │  - Applies glow effects                            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│         Settings Manager (SettingsManager.js)            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  video.showAccuracyIndicator: boolean              │ │
│  │  - Default: true                                   │ │
│  │  - Persisted to localStorage                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Player State Extension

**Location:** `js/core/gameState.js`

Add to player object:
```javascript
player.weaponAccuracy = 1.0;  // Current accuracy (0.0 to 1.0)
player.accuracyRecoveryRate = 0.02;  // Recovery per frame when not firing
player.accuracyDegradationRate = 0.05;  // Degradation per shot
player.minAccuracy = 0.3;  // Minimum accuracy threshold
```

### 2. Accuracy Update Logic

**Location:** `js/utils/combatUtils.js` - `shootBullet()` function

**Interface:**
```javascript
function updateWeaponAccuracy(player, isFiring) {
    if (isFiring) {
        // Degrade accuracy when firing
        player.weaponAccuracy = Math.max(
            player.minAccuracy,
            player.weaponAccuracy - player.accuracyDegradationRate
        );
    } else {
        // Recover accuracy when not firing
        const timeSinceLastShot = Date.now() - player.lastShotTime;
        if (timeSinceLastShot > 100) {  // 100ms grace period
            player.weaponAccuracy = Math.min(
                1.0,
                player.weaponAccuracy + player.accuracyRecoveryRate
            );
        }
    }
}
```

### 3. HUD Indicator Component

**Location:** `js/ui/GameHUD.js`

**Interface:**
```javascript
drawAccuracyIndicator(player, x, y, width) {
    // Check settings
    if (!settingsManager.getSetting('video', 'showAccuracyIndicator')) {
        return;
    }
    
    const height = 8;
    const accuracy = player.weaponAccuracy;
    
    // Determine color based on accuracy
    let color;
    if (accuracy >= 0.9) {
        color = '#4caf50';  // Green
    } else if (accuracy >= 0.7) {
        color = '#ffeb3b';  // Yellow
    } else {
        color = '#ff1744';  // Red
    }
    
    // Render bar with glow
    // ... (implementation details)
}
```

### 4. Settings Integration

**Location:** `js/systems/SettingsManager.js`

Add to `defaultSettings.video`:
```javascript
showAccuracyIndicator: true
```

**Location:** `js/ui/SettingsPanel.js`

Add toggle control in Video settings section.

## Data Models

### Player Accuracy State

```javascript
{
    weaponAccuracy: number,           // 0.0 to 1.0
    accuracyRecoveryRate: number,     // Per-frame recovery
    accuracyDegradationRate: number,  // Per-shot degradation
    minAccuracy: number,              // Minimum threshold (0.3)
    lastShotTime: number              // Timestamp of last shot
}
```

### Settings Model

```javascript
{
    video: {
        showAccuracyIndicator: boolean  // Default: true
    }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Accuracy bounds invariant
*For any* player state, the weaponAccuracy value should always be within the range [minAccuracy, 1.0], regardless of how many shots are fired or how much time passes.
**Validates: Requirements 1.1, 1.5, 4.5**

### Property 2: Accuracy degradation monotonicity
*For any* sequence of consecutive shots without pause, each shot should result in weaponAccuracy being less than or equal to the previous value, until minAccuracy is reached.
**Validates: Requirements 1.5, 4.2**

### Property 3: Accuracy recovery monotonicity
*For any* period of not firing (time since last shot > 100ms), each frame should result in weaponAccuracy being greater than or equal to the previous value, until 1.0 is reached.
**Validates: Requirements 1.5, 4.3**

### Property 4: Indicator color consistency
*For any* accuracy value, the displayed color should be deterministic: green for accuracy >= 0.9, yellow for 0.7 <= accuracy < 0.9, red for accuracy < 0.7.
**Validates: Requirements 3.3, 3.4, 3.5**

### Property 5: Settings toggle idempotence
*For any* settings state, toggling showAccuracyIndicator twice should result in the same state as the original.
**Validates: Requirements 2.2, 2.4**

### Property 6: Multiplayer independence
*For any* two players, changing one player's weaponAccuracy should not affect the other player's weaponAccuracy value.
**Validates: Requirements 5.1, 5.2, 5.4**

### Property 7: Bullet spread accuracy consistency
*For any* bullet fired, the spread angle used should equal the spread calculated from the player's current weaponAccuracy value at the time of firing.
**Validates: Requirements 4.1, 4.2**

### Property 8: Weapon switch accuracy preservation
*For any* weapon switch, if the player has not fired the new weapon recently, its accuracy should be 1.0.
**Validates: Requirements 4.4**

## Error Handling

### Invalid Accuracy Values

**Scenario:** Accuracy value goes outside valid range due to calculation errors

**Handling:**
- Clamp accuracy to [minAccuracy, 1.0] range
- Log warning to console in debug mode
- Continue gameplay without interruption

### Missing Settings

**Scenario:** showAccuracyIndicator setting not found in localStorage

**Handling:**
- Use default value (true)
- Save default to localStorage
- Display indicator normally

### Rendering Errors

**Scenario:** Canvas context unavailable or HUD rendering fails

**Handling:**
- Skip indicator rendering for current frame
- Log error to console
- Retry on next frame

### Multiplayer Sync Issues

**Scenario:** Player accuracy state not properly initialized in multiplayer

**Handling:**
- Initialize accuracy to 1.0 for new players
- Ensure each player has independent accuracy tracking
- Validate player object has accuracy properties before rendering

## Testing Strategy

### Unit Tests

**Test Suite:** `AccuracyIndicator.test.js`

1. **Accuracy Clamping**
   - Test accuracy never exceeds 1.0
   - Test accuracy never goes below minAccuracy
   - Test edge cases (exactly 0.0, exactly 1.0)

2. **Color Mapping**
   - Test green color for accuracy >= 0.9
   - Test yellow color for 0.7 <= accuracy < 0.9
   - Test red color for accuracy < 0.7
   - Test boundary values (0.7, 0.9)

3. **Settings Integration**
   - Test indicator hidden when setting is false
   - Test indicator shown when setting is true
   - Test settings persistence

4. **Multiplayer**
   - Test each player has independent accuracy
   - Test accuracy updates don't affect other players

### Property-Based Tests

**Test Suite:** `AccuracyIndicator.properties.test.js`

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Minimum 100 iterations per property

1. **Property 1: Accuracy bounds invariant**
   - Generate random sequences of shots and recovery periods
   - Verify accuracy always in [minAccuracy, 1.0]
   - **Feature: weapon-accuracy-indicator, Property 1: Accuracy bounds invariant**

2. **Property 2: Accuracy degradation monotonicity**
   - Generate random number of consecutive shots
   - Verify accuracy decreases or stays same each shot
   - **Feature: weapon-accuracy-indicator, Property 2: Accuracy degradation monotonicity**

3. **Property 3: Accuracy recovery monotonicity**
   - Generate random recovery periods
   - Verify accuracy increases or stays same each frame
   - **Feature: weapon-accuracy-indicator, Property 3: Accuracy recovery monotonicity**

4. **Property 4: Indicator color consistency**
   - Generate random accuracy values in [0.0, 1.0]
   - Verify color mapping is deterministic
   - **Feature: weapon-accuracy-indicator, Property 4: Indicator color consistency**

5. **Property 5: Settings toggle idempotence**
   - Generate random initial settings states
   - Toggle twice, verify same as original
   - **Feature: weapon-accuracy-indicator, Property 5: Settings toggle idempotence**

6. **Property 6: Multiplayer independence**
   - Generate random player states
   - Modify one player's accuracy
   - Verify other players unchanged
   - **Feature: weapon-accuracy-indicator, Property 6: Multiplayer independence**

7. **Property 7: Bullet spread accuracy consistency**
   - Generate random accuracy values
   - Fire bullet, verify spread matches accuracy
   - **Feature: weapon-accuracy-indicator, Property 7: Bullet spread accuracy consistency**

8. **Property 8: Weapon switch accuracy preservation**
   - Generate random weapon switches
   - Verify new weapon starts at 1.0 accuracy
   - **Feature: weapon-accuracy-indicator, Property 8: Weapon switch accuracy preservation**

### Integration Tests

1. **Full Gameplay Flow**
   - Start game, fire weapon continuously
   - Verify accuracy degrades visually
   - Stop firing, verify accuracy recovers
   - Verify indicator color changes appropriately

2. **Settings Flow**
   - Toggle indicator off in settings
   - Verify indicator disappears
   - Toggle back on, verify indicator reappears
   - Restart game, verify setting persisted

3. **Multiplayer Flow**
   - Start 2-player game
   - Have player 1 fire continuously
   - Verify player 2's indicator unaffected
   - Verify each player's indicator shows correct accuracy
