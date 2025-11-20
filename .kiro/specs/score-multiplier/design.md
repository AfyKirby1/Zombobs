# Design Document

## Overview

The Score Multiplier system rewards players for consecutive kills without taking damage by applying an increasing multiplier (1x to 5x) to their score. The feature tracks kill streaks, manages multiplier tiers, provides visual/audio feedback, and integrates with the existing scoring and HUD systems. The multiplier resets when the player takes damage, encouraging skillful play and risk management.

## Architecture

### Component Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Game Loop (main.js)                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  updateGame() → Check damage events, update score  │ │
│  │  drawGame() → Render HUD with multiplier display   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Player State (gameState.js)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  player.scoreMultiplier: number (1.0 to 5.0)       │ │
│  │  player.consecutiveKills: number                   │ │
│  │  player.maxMultiplierThisSession: number           │ │
│  │  player.totalMultiplierBonus: number               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│           Combat Utils (combatUtils.js)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  handleBulletZombieCollisions()                    │ │
│  │  - Increment consecutiveKills on kill              │ │
│  │  - Update multiplier tier                          │ │
│  │  - Award score with multiplier                     │ │
│  │                                                     │ │
│  │  handlePlayerZombieCollisions()                    │ │
│  │  - Reset multiplier on damage                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              GameHUD Component (GameHUD.js)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  drawMultiplierIndicator(player, x, y)             │ │
│  │  - Display current multiplier (2x, 3x, 4x, 5x)     │ │
│  │  - Show progress to next tier                      │ │
│  │  - Render pulsing glow effect                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│           Audio System (AudioSystem.js)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  playMultiplierUpSound(tier)                       │ │
│  │  playMultiplierMaxSound()                          │ │
│  │  playMultiplierLostSound()                         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Player State Extension

**Location:** `js/core/gameState.js`

Add to player object:
```javascript
player.scoreMultiplier = 1.0;           // Current multiplier (1.0 to 5.0)
player.consecutiveKills = 0;            // Kills without taking damage
player.maxMultiplierThisSession = 1.0;  // Highest multiplier this game
player.totalMultiplierBonus = 0;        // Total bonus score from multipliers
player.multiplierTierThresholds = [0, 3, 6, 10, 15];  // Kills needed for each tier
```

### 2. Multiplier Update Logic

**Location:** `js/utils/combatUtils.js`

**Interface:**
```javascript
function updateScoreMultiplier(player) {
    const kills = player.consecutiveKills;
    const thresholds = player.multiplierTierThresholds;
    
    // Determine multiplier tier based on kills
    if (kills >= thresholds[4]) {
        player.scoreMultiplier = 5.0;
    } else if (kills >= thresholds[3]) {
        player.scoreMultiplier = 4.0;
    } else if (kills >= thresholds[2]) {
        player.scoreMultiplier = 3.0;
    } else if (kills >= thresholds[1]) {
        player.scoreMultiplier = 2.0;
    } else {
        player.scoreMultiplier = 1.0;
    }
    
    // Track max multiplier
    if (player.scoreMultiplier > player.maxMultiplierThisSession) {
        player.maxMultiplierThisSession = player.scoreMultiplier;
    }
}

function awardScore(player, baseScore, zombieType) {
    const multipliedScore = Math.floor(baseScore * player.scoreMultiplier);
    player.score += multipliedScore;
    
    // Track bonus
    const bonus = multipliedScore - baseScore;
    player.totalMultiplierBonus += bonus;
    
    return multipliedScore;
}

function resetMultiplier(player) {
    player.scoreMultiplier = 1.0;
    player.consecutiveKills = 0;
    
    // Trigger notification and audio
    createMultiplierLostNotification(player);
    playMultiplierLostSound();
}
```

### 3. Kill Tracking

**Location:** `js/utils/combatUtils.js` - `handleBulletZombieCollisions()`

```javascript
// On zombie kill
player.consecutiveKills++;

// Check for boss zombie (worth 3 kills)
if (zombie instanceof BossZombie) {
    player.consecutiveKills += 2;  // +3 total (1 base + 2 bonus)
}

// Check for tier increase
const oldMultiplier = player.scoreMultiplier;
updateScoreMultiplier(player);

if (player.scoreMultiplier > oldMultiplier) {
    // Tier increased - trigger feedback
    createMultiplierUpNotification(player);
    playMultiplierUpSound(player.scoreMultiplier);
}

// Award score with multiplier
const baseScore = getZombieBaseScore(zombie);
const finalScore = awardScore(player, baseScore, zombie.type);

// Show damage number with multiplier
if (player.scoreMultiplier > 1.0) {
    createDamageNumber(zombie.x, zombie.y, `+${finalScore} (${player.scoreMultiplier}x)`);
}
```

### 4. Damage Detection

**Location:** `js/utils/combatUtils.js` - `handlePlayerZombieCollisions()`

```javascript
// On player damage (health reduced)
if (player.health < previousHealth && player.shield === 0) {
    resetMultiplier(player);
}

// Shield absorbs damage - multiplier preserved
if (player.shield > 0) {
    // Damage absorbed by shield, don't reset multiplier
}
```

### 5. HUD Multiplier Display

**Location:** `js/ui/GameHUD.js`

**Interface:**
```javascript
drawMultiplierIndicator(player, x, y) {
    if (player.scoreMultiplier <= 1.0) {
        return;  // Don't show at 1x
    }
    
    const width = 120;
    const height = 40;
    
    // Pulsing glow effect
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    
    // Color based on tier
    let color;
    if (player.scoreMultiplier >= 5.0) {
        color = '#ffd700';  // Gold for max
    } else if (player.scoreMultiplier >= 4.0) {
        color = '#ff9800';  // Orange
    } else if (player.scoreMultiplier >= 3.0) {
        color = '#ffeb3b';  // Yellow
    } else {
        color = '#4caf50';  // Green
    }
    
    // Render multiplier text
    ctx.font = 'bold 24px "Roboto Mono"';
    ctx.fillStyle = color;
    ctx.shadowBlur = 15 * pulse;
    ctx.shadowColor = color;
    ctx.fillText(`${player.scoreMultiplier}x`, x, y);
    ctx.shadowBlur = 0;
    
    // Progress bar to next tier
    drawMultiplierProgress(player, x, y + 30);
}

drawMultiplierProgress(player, x, y) {
    const kills = player.consecutiveKills;
    const thresholds = player.multiplierTierThresholds;
    
    // Find current and next threshold
    let currentThreshold = 0;
    let nextThreshold = thresholds[1];
    
    for (let i = 0; i < thresholds.length - 1; i++) {
        if (kills >= thresholds[i] && kills < thresholds[i + 1]) {
            currentThreshold = thresholds[i];
            nextThreshold = thresholds[i + 1];
            break;
        }
    }
    
    // At max tier
    if (kills >= thresholds[thresholds.length - 1]) {
        ctx.fillText('MAX', x, y);
        return;
    }
    
    // Calculate progress
    const progress = (kills - currentThreshold) / (nextThreshold - currentThreshold);
    
    // Render progress bar
    // ... (bar rendering)
}
```

### 6. Audio Feedback

**Location:** `js/systems/AudioSystem.js`

**Interface:**
```javascript
export function playMultiplierUpSound(tier) {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Higher pitch for higher tiers
    const baseFreq = 400;
    oscillator.frequency.value = baseFreq + (tier * 100);
    
    oscillator.connect(gainNode);
    gainNode.connect(getMasterGainNode());
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

export function playMultiplierMaxSound() {
    // Special fanfare for reaching 5x
    // ... (implementation)
}

export function playMultiplierLostSound() {
    // Negative sound for losing multiplier
    // ... (implementation)
}
```

### 7. Statistics Tracking

**Location:** `js/core/gameState.js`

Add to game state:
```javascript
gameState.allTimeMaxMultiplier = 1.0;  // Loaded from localStorage
```

**Location:** `js/utils/gameUtils.js`

```javascript
export function saveMultiplierStats() {
    const stats = {
        allTimeMaxMultiplier: gameState.allTimeMaxMultiplier
    };
    localStorage.setItem('zombobs_multiplier_stats', JSON.stringify(stats));
}

export function loadMultiplierStats() {
    try {
        const saved = localStorage.getItem('zombobs_multiplier_stats');
        if (saved) {
            const stats = JSON.parse(saved);
            gameState.allTimeMaxMultiplier = stats.allTimeMaxMultiplier || 1.0;
        }
    } catch (error) {
        console.log('Failed to load multiplier stats:', error);
    }
}
```

## Data Models

### Player Multiplier State

```javascript
{
    scoreMultiplier: number,           // 1.0, 2.0, 3.0, 4.0, or 5.0
    consecutiveKills: number,          // 0 to infinity
    maxMultiplierThisSession: number,  // 1.0 to 5.0
    totalMultiplierBonus: number,      // Cumulative bonus score
    multiplierTierThresholds: [0, 3, 6, 10, 15]  // Kills for each tier
}
```

### Zombie Base Scores

```javascript
{
    normal: 10,
    fast: 15,
    armored: 25,
    exploding: 20,
    ghost: 18,
    spitter: 22,
    boss: 100
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Multiplier tier determinism
*For any* number of consecutive kills, the score multiplier should be deterministic based on the tier thresholds: 1x for 0-2 kills, 2x for 3-5 kills, 3x for 6-9 kills, 4x for 10-14 kills, 5x for 15+ kills.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Score calculation consistency
*For any* base score and multiplier value, the final score should equal floor(baseScore × multiplier), and the bonus should equal finalScore - baseScore.
**Validates: Requirements 1.1**

### Property 3: Multiplier reset on damage
*For any* player state where health decreases and shield is 0, the consecutiveKills should reset to 0 and scoreMultiplier should reset to 1.0.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: Shield damage preservation
*For any* damage event where shield > 0 absorbs damage, the consecutiveKills and scoreMultiplier should remain unchanged.
**Validates: Requirements 2.5**

### Property 5: Kill counter monotonicity
*For any* sequence of kills without damage, consecutiveKills should increase by at least 1 for each kill (3 for boss kills).
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Multiplier bounds invariant
*For any* player state, scoreMultiplier should always be one of [1.0, 2.0, 3.0, 4.0, 5.0], never any other value.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 7: Max multiplier tracking
*For any* game session, maxMultiplierThisSession should always be greater than or equal to the current scoreMultiplier.
**Validates: Requirements 7.1, 7.2**

### Property 8: Multiplayer independence
*For any* two players, one player's damage event should reset only that player's multiplier, leaving the other player's multiplier unchanged.
**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 9: Bonus score accumulation
*For any* sequence of kills with multiplier > 1.0, totalMultiplierBonus should equal the sum of all (finalScore - baseScore) values.
**Validates: Requirements 7.5**

### Property 10: Tier transition monotonicity
*For any* sequence of kills without damage, the multiplier should never decrease, only increase or stay the same.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

## Error Handling

### Invalid Multiplier Values

**Scenario:** Multiplier calculation results in invalid value

**Handling:**
- Clamp multiplier to valid tiers [1.0, 2.0, 3.0, 4.0, 5.0]
- Log warning to console
- Continue gameplay

### Negative Kill Counter

**Scenario:** consecutiveKills becomes negative due to bug

**Handling:**
- Reset to 0
- Reset multiplier to 1.0
- Log error to console

### Score Overflow

**Scenario:** Score exceeds JavaScript number limits

**Handling:**
- Cap score at Number.MAX_SAFE_INTEGER
- Display "MAX" in score display
- Continue tracking kills and multiplier

### Missing Audio Context

**Scenario:** Audio feedback fails to play

**Handling:**
- Skip audio playback
- Continue with visual feedback
- Log warning to console

## Testing Strategy

### Unit Tests

**Test Suite:** `ScoreMultiplier.test.js`

1. **Tier Calculation**
   - Test correct multiplier for each kill count range
   - Test boundary values (3, 6, 10, 15 kills)
   - Test boss kill bonus (+3 instead of +1)

2. **Score Calculation**
   - Test score = floor(base × multiplier)
   - Test bonus = final - base
   - Test various base scores and multipliers

3. **Reset Logic**
   - Test multiplier resets to 1.0 on damage
   - Test kills reset to 0 on damage
   - Test shield prevents reset

4. **Multiplayer**
   - Test independent multipliers per player
   - Test damage to one player doesn't affect others

### Property-Based Tests

**Test Suite:** `ScoreMultiplier.properties.test.js`

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Minimum 100 iterations per property

1. **Property 1: Multiplier tier determinism**
   - Generate random kill counts (0 to 100)
   - Verify multiplier matches expected tier
   - **Feature: score-multiplier, Property 1: Multiplier tier determinism**

2. **Property 2: Score calculation consistency**
   - Generate random base scores and multipliers
   - Verify finalScore = floor(base × multiplier)
   - **Feature: score-multiplier, Property 2: Score calculation consistency**

3. **Property 3: Multiplier reset on damage**
   - Generate random player states
   - Apply damage with shield = 0
   - Verify multiplier = 1.0, kills = 0
   - **Feature: score-multiplier, Property 3: Multiplier reset on damage**

4. **Property 4: Shield damage preservation**
   - Generate random player states with shield > 0
   - Apply damage
   - Verify multiplier and kills unchanged
   - **Feature: score-multiplier, Property 4: Shield damage preservation**

5. **Property 5: Kill counter monotonicity**
   - Generate random sequences of kills
   - Verify kills increases each time
   - **Feature: score-multiplier, Property 5: Kill counter monotonicity**

6. **Property 6: Multiplier bounds invariant**
   - Generate random game states
   - Verify multiplier in [1.0, 2.0, 3.0, 4.0, 5.0]
   - **Feature: score-multiplier, Property 6: Multiplier bounds invariant**

7. **Property 7: Max multiplier tracking**
   - Generate random kill sequences
   - Verify maxMultiplier >= current multiplier
   - **Feature: score-multiplier, Property 7: Max multiplier tracking**

8. **Property 8: Multiplayer independence**
   - Generate random 2-player states
   - Damage one player
   - Verify other player unchanged
   - **Feature: score-multiplier, Property 8: Multiplayer independence**

9. **Property 9: Bonus score accumulation**
   - Generate random kill sequences with multipliers
   - Verify totalBonus = sum of all bonuses
   - **Feature: score-multiplier, Property 9: Bonus score accumulation**

10. **Property 10: Tier transition monotonicity**
    - Generate random kill sequences without damage
    - Verify multiplier never decreases
    - **Feature: score-multiplier, Property 10: Tier transition monotonicity**

### Integration Tests

1. **Full Gameplay Flow**
   - Kill 3 zombies, verify 2x multiplier
   - Kill 3 more, verify 3x multiplier
   - Take damage, verify reset to 1x
   - Verify visual and audio feedback

2. **Boss Kill Bonus**
   - Kill 1 normal zombie (1 kill)
   - Kill 1 boss zombie (4 kills total)
   - Verify 2x multiplier achieved

3. **Shield Protection**
   - Achieve 3x multiplier
   - Take damage with shield active
   - Verify multiplier preserved
   - Take damage with no shield
   - Verify multiplier reset
