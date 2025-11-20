# AI Companion System - Technical Design Document

**Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Active Development

## Table of Contents

1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Architecture](#architecture)
4. [Behavior Patterns](#behavior-patterns)
5. [API Reference](#api-reference)
6. [Integration Points](#integration-points)
7. [Design Decisions](#design-decisions)
8. [Known Limitations](#known-limitations)
9. [Future Improvements](#future-improvements)
10. [Advanced AI Features](#advanced-ai-features)
11. [Performance Considerations](#performance-considerations)
12. [Testing Strategy](#testing-strategy)

---

## Overview

The AI Companion System provides intelligent NPC allies that assist the player in combat. Companions follow the player, engage enemies, and maintain tactical positioning. The system is designed to be modular and extensible, preparing for future enhancements like roles, commands, and complex behaviors.

### Goals

- **Combat Assistance**: Companions engage zombies and provide fire support
- **Tactical Positioning**: Maintain formation with player while avoiding danger
- **Autonomous Behavior**: Operate independently without micromanagement
- **Extensibility**: Architecture supports roles, commands, and state machines

### Non-Goals (Current)

- Player-controlled commands (planned for future)
- Role-based specializations (planned for future)
- Resource sharing/management (planned for future)
- Revive mechanics (planned for future)

---

## Current Implementation

### File Structure

```
js/companions/
└── CompanionSystem.js    # Main companion management class
```

### Core Class: `CompanionSystem`

**Location**: `js/companions/CompanionSystem.js`

**Responsibilities**:
- Managing companion lifecycle (adding/removing)
- Centralizing AI decision-making per frame
- Handling combat, movement, and positioning behaviors

**Key Properties**:
```javascript
{
    maxCompanions: 4,           // Maximum number of companions
    leashDistance: 500,         // Max distance from P1 before forcing return
    followDistance: 150,        // Preferred distance from P1 when idle
    combatRange: 500,           // Max range to engage zombies
    kiteDistance: 200,          // Distance at which to back away from zombies
    engageDistance: 350         // Distance at which to approach zombies
}
```

### Integration

**Main Game Loop** (`js/main.js`):
- `companionSystem` initialized as singleton
- `addAIPlayer()` delegates to `companionSystem.addCompanion()`
- `updatePlayers()` calls `companionSystem.update(player)` for AI-controlled players
- Movement vectors integrated with existing physics system

---

## Architecture

### System Design

```
┌─────────────────────────────────────────┐
│         Main Game Loop (main.js)        │
│  ┌───────────────────────────────────┐ │
│  │    updatePlayers()                │ │
│  │    └─> companionSystem.update()   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      CompanionSystem (Singleton)        │
│  ┌───────────────────────────────────┐ │
│  │  addCompanion()                   │ │
│  │  update(player)                   │ │
│  │    ├─> Find nearest zombie        │ │
│  │    ├─> Calculate movement         │ │
│  │    ├─> Handle combat             │ │
│  │    └─> Return movement vector     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │
              ├─> gameState (read)
              ├─> combatUtils (shootBullet, reloadWeapon)
              └─> player object (modify directly)
```

### Data Flow

1. **Initialization**: `CompanionSystem` instance created in `main.js`
2. **Companion Creation**: `addCompanion()` creates player object with `inputSource: 'ai'`
3. **Update Loop**: Each frame, `updatePlayers()` calls `update(player)` for each AI companion
4. **Decision Making**: `update()` analyzes game state, determines actions
5. **State Modification**: Directly modifies player object (angle, speed, isSprinting)
6. **Movement Return**: Returns `{moveX, moveY}` vector for physics integration

### Dependencies

**Imports**:
- `gameState` - Read game state (players, zombies, canvas dimensions)
- `canvas` - Canvas dimensions for spawn positioning
- `createPlayer` - Factory function for creating player objects
- `PLAYER_BASE_SPEED` - Movement speed constant
- `shootBullet` - Combat utility for firing weapons
- `reloadWeapon` - Combat utility for reloading

**Exports**:
- `CompanionSystem` class

---

## Behavior Patterns

### State Machine (Implicit)

The current implementation uses implicit state logic rather than a formal state machine:

1. **Idle/Following** (No enemies)
   - Maintains `followDistance` (150px) from Player 1
   - Faces movement direction
   - Moves toward P1 if too far

2. **Combat** (Enemy detected)
   - Faces nearest zombie
   - Engages if within `combatRange` (500px)
   - Kites away if within `kiteDistance` (200px)
   - Approaches if beyond `engageDistance` (350px)

3. **Leash Enforcement** (Too far from P1)
   - Prioritizes regrouping over combat
   - Moves toward P1 if beyond `leashDistance` (500px)
   - Overrides combat positioning

### Decision Tree

```
Is player alive?
├─ No → Stand still, return {0, 0}
└─ Yes
    └─ Is P1 alive?
        ├─ No → Stand still, return {0, 0}
        └─ Yes
            └─ Find nearest zombie
                ├─ No zombie found
                │   └─ Distance to P1 > followDistance?
                │       ├─ Yes → Move toward P1
                │       └─ No → Stand still
                └─ Zombie found
                    ├─ Distance to zombie < kiteDistance?
                    │   └─ Yes → Back away from zombie
                    ├─ Distance to P1 > leashDistance?
                    │   └─ Yes → Move toward P1 (override combat)
                    ├─ Distance to zombie > engageDistance?
                    │   └─ Yes → Approach zombie (slowly)
                    └─ In combat range?
                        └─ Yes → Face zombie, shoot if able
```

### Combat Behavior

**Target Selection**:
- Always targets nearest zombie (linear search through `gameState.zombies`)
- No target prioritization (bosses, special zombies treated equally)

**Aiming**:
- Directly faces target zombie (`player.angle = Math.atan2(dy, dx)`)
- No predictive aiming (shoots at current position)
- Random inaccuracy: ±20px offset for realism

**Shooting**:
- Fires if: not reloading, has ammo, target within `combatRange`
- Auto-reloads when ammo depleted
- Fire rate controlled by `shootBullet()` (respects weapon cooldowns)

**Movement**:
- Never sprints (always `PLAYER_BASE_SPEED`)
- Movement normalized to unit vector
- Kiting: full speed away from danger
- Approach: 50% speed when closing gap

---

## API Reference

### `CompanionSystem` Class

#### Constructor

```javascript
new CompanionSystem()
```

Creates a new `CompanionSystem` instance with default configuration.

**Configuration**:
- `maxCompanions`: 4
- `leashDistance`: 500
- `followDistance`: 150
- `combatRange`: 500
- `kiteDistance`: 200
- `engageDistance`: 350

#### Methods

##### `addCompanion()`

Creates and adds a new AI companion to the game.

**Returns**: `Object|null`
- Returns the created companion player object on success
- Returns `null` if maximum companions reached

**Behavior**:
- Checks if `gameState.players.length >= maxCompanions`
- Creates player using `createPlayer()` factory
- Assigns next available color index
- Spawns with offset (50px per companion) to avoid overlap
- Sets `inputSource: 'ai'` for identification
- Adds to `gameState.players` array

**Example**:
```javascript
const companion = companionSystem.addCompanion();
if (companion) {
    console.log(`Added companion: ${companion.name}`);
}
```

##### `update(player)`

Updates AI companion behavior for a single frame.

**Parameters**:
- `player` (Object): The AI companion player object to update

**Returns**: `{moveX: number, moveY: number}`
- Movement vector for physics integration
- Normalized to unit vector (length ≤ 1)

**Side Effects**:
- Modifies `player.angle` (facing direction)
- Modifies `player.isSprinting` (always `false`)
- Modifies `player.speed` (always `PLAYER_BASE_SPEED`)
- May call `shootBullet()` if conditions met
- May call `reloadWeapon()` if ammo depleted

**Example**:
```javascript
gameState.players.forEach((player, index) => {
    if (player.inputSource === 'ai') {
        const movement = companionSystem.update(player);
        // Movement integrated with physics in updatePlayers()
    }
});
```

---

## Integration Points

### Main Game Loop

**Location**: `js/main.js`

**Initialization**:
```javascript
import { CompanionSystem } from './companions/CompanionSystem.js';

const companionSystem = new CompanionSystem();
window.companionSystem = companionSystem; // Global access
```

**Companion Creation**:
```javascript
function addAIPlayer() {
    companionSystem.addCompanion();
}
```

**Update Integration**:
```javascript
function updatePlayers() {
    gameState.players.forEach((player, index) => {
        if (player.inputSource === 'ai') {
            const aiMovement = companionSystem.update(player);
            moveX = aiMovement.moveX;
            moveY = aiMovement.moveY;
            // Physics applied in same function
        }
    });
}
```

### Player Object Structure

Companions use the standard player object structure:

```javascript
{
    x, y,                          // Position
    radius: 15,                    // Collision radius
    name: "RandomName",            // AI-generated name
    speed: PLAYER_BASE_SPEED,      // Movement speed
    health: PLAYER_MAX_HEALTH,     // Current health
    maxHealth: PLAYER_MAX_HEALTH,  // Maximum health
    angle: 0,                      // Facing direction (radians)
    isSprinting: false,            // Always false for AI
    inputSource: 'ai',            // Identifier for AI companions
    currentWeapon: WEAPONS.pistol, // Current weapon
    currentAmmo: 10,              // Current ammo count
    isReloading: false,            // Reload state
    // ... other player properties
}
```

### Combat System Integration

**Shooting**: Uses `shootBullet(targetPos, canvas, player)` from `combatUtils.js`
- Respects weapon fire rate cooldowns
- Handles ammo consumption
- Creates bullet entities in game state

**Reloading**: Uses `reloadWeapon(player)` from `combatUtils.js`
- Sets `isReloading` flag
- Starts reload timer
- Completes after weapon reload time

---

## Design Decisions

### Why Direct State Modification?

**Decision**: `update()` modifies player object directly instead of returning all state changes.

**Rationale**:
- Simpler API (single return value for movement)
- Consistent with existing player update pattern
- Reduces parameter passing complexity
- Movement vector is primary output, other changes are side effects

**Trade-offs**:
- Less explicit about what's being modified
- Could cause confusion if not documented
- Future: Consider returning state delta object

### Why No Formal State Machine?

**Decision**: Implicit state logic rather than formal state machine pattern.

**Rationale**:
- Current behavior is simple enough for conditional logic
- Easier to understand and modify for basic behaviors
- No performance overhead from state transitions
- Can refactor to state machine when complexity increases

**Future**: Migrate to state machine when adding:
- Command system (HOLD, ATTACK, FOLLOW states)
- Role behaviors (Medic, Sniper states)
- Revive mechanics (DOWNED, REVIVING states)

### Why Linear Zombie Search?

**Decision**: O(n) linear search through all zombies to find nearest.

**Rationale**:
- Simple implementation
- Acceptable performance for current zombie counts (<100 typically)
- No spatial partitioning overhead
- Easy to understand and debug

**Future Optimization**: Use quadtree or spatial hash when:
- Zombie counts exceed 200+
- Multiple companions need target selection
- Performance profiling shows bottleneck

### Why No Target Prioritization?

**Decision**: Always target nearest zombie, regardless of type.

**Rationale**:
- Simplest behavior to implement
- Prevents companions from ignoring immediate threats
- Consistent, predictable behavior
- Can add prioritization later without breaking existing logic

**Future Enhancement**: Priority system for:
- Boss zombies (highest priority)
- Special zombies (Spitter, Exploding)
- Zombies attacking player
- Zombies with low health (finish off)

---

## Known Limitations

### Current Limitations

1. **No Role Specialization**
   - All companions behave identically
   - No unique abilities or stats
   - Cannot assign different roles

2. **No Command System**
   - Companions operate fully autonomously
   - Player cannot issue tactical commands
   - No "Hold Position", "Cover Me", etc.

3. **Simple Target Selection**
   - Always targets nearest zombie
   - No prioritization (bosses, special types)
   - No target sharing (multiple companions may target same zombie)

4. **No Resource Management**
   - Companions don't share ammo with player
   - No health sharing or healing
   - No pickup prioritization

5. **No Revive Mechanics**
   - Companions cannot be revived if downed
   - No downed state or revive interaction
   - Dead companions remain dead

6. **No Formation System**
   - Companions don't maintain relative positions
   - No squad formation (line, wedge, etc.)
   - May cluster together

7. **Limited Combat Intelligence**
   - No cover seeking
   - No grenade avoidance
   - No coordinated attacks
   - No weapon switching strategy

8. **No Trust/Loyalty System**
   - All companions behave identically regardless of player actions
   - No relationship mechanics
   - No dynamic behavior changes

### Performance Considerations

1. **Linear Zombie Search**: O(n) per companion per frame
   - With 4 companions and 50 zombies: 200 distance calculations per frame
   - Acceptable for current scale, may need optimization later

2. **No Spatial Partitioning**: All zombies checked every frame
   - Could use quadtree for better performance at scale
   - Current implementation is simple and fast enough

3. **Direct State Modification**: No cloning or immutability
   - Fast but could cause issues with state management
   - Acceptable for current architecture

---

## Future Improvements

### Planned Features (from Roadmap)

#### 1. AI Companion Roles/Classes 🔴

**Goal**: Different companion specializations with unique abilities.

**Proposed Roles**:
- **Medic**: Heals player, revives faster, prioritizes health pickups
- **Heavy Gunner/Tank**: High health, high damage, slower movement
- **Scout**: Fast movement, marks enemies, better vision range
- **Engineer**: Repairs base structures, sets traps, utility focus

**Implementation Strategy**:
```javascript
// Role-based behavior classes
class MedicBehavior extends CompanionBehavior {
    update(player) {
        // Prioritize healing player
        // Faster revive speed
        // Health pickup priority
    }
}

class HeavyGunnerBehavior extends CompanionBehavior {
    update(player) {
        // Aggressive positioning
        // Higher damage output
        // Tank damage for team
    }
}
```

**Design Considerations**:
- Role selection in AI lobby before game starts
- Visual distinction (colors, icons, effects)
- Role-specific stats and abilities
- Balance between roles

#### 2. AI Companion Command System 🟡

**Goal**: Player can issue tactical commands to companions.

**Proposed Commands**:
- **Follow**: Default behavior, follow player
- **Hold Position**: Stay at current location
- **Cover Me**: Provide covering fire while player moves
- **Scavenge**: Search for pickups
- **Defend Area**: Guard specific location
- **Focus Fire**: Target specific zombie

**Implementation Strategy**:
```javascript
class CompanionSystem {
    constructor() {
        this.commands = new Map(); // companion -> command
    }
    
    issueCommand(companion, command, target = null) {
        this.commands.set(companion, { type: command, target });
    }
    
    update(player) {
        const command = this.commands.get(player);
        if (command) {
            return this.executeCommand(player, command);
        }
        // Default behavior
    }
}
```

**UI Requirements**:
- Radial menu or hotkey system
- Visual command indicators above companions
- Audio confirmations ("Roger!", "Moving out!")
- Command cooldowns to prevent spam

#### 3. AI Companion Upgrade System 🟡

**Goal**: Upgrade companions between waves with improved stats.

**Proposed Upgrades**:
- **Stats**: Health, damage, speed, accuracy
- **Abilities**: New skills, improved cooldowns
- **Equipment**: Better weapons, armor, tools

**Implementation Strategy**:
```javascript
class CompanionUpgrade {
    constructor(companion) {
        this.healthBonus = 0;
        this.damageMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        this.accuracyBonus = 0;
    }
    
    apply(companion) {
        companion.maxHealth += this.healthBonus;
        companion.damageMultiplier *= this.damageMultiplier;
        // etc.
    }
}
```

**Design Considerations**:
- Upgrade menu between waves
- Resource cost (scrap, currency)
- Permanent vs temporary upgrades
- Visual feedback for upgrades

#### 4. AI Companion Trust/Loyalty System 🟡

**Goal**: Dynamic relationship system affecting companion behavior.

**Proposed Mechanics**:
- Trust increases: Revive companion, share resources, complete objectives
- Trust decreases: Leave companion to die, ignore downed companion
- Effects: Higher trust = better accuracy, faster reactions, more aggressive support

**Implementation Strategy**:
```javascript
class CompanionTrust {
    constructor(companion) {
        this.trust = 50; // 0-100 scale
        this.trustHistory = [];
    }
    
    increase(amount, reason) {
        this.trust = Math.min(100, this.trust + amount);
        this.trustHistory.push({ amount, reason, timestamp: Date.now() });
    }
    
    getAccuracyBonus() {
        return (this.trust - 50) * 0.01; // -0.5 to +0.5
    }
}
```

**Visual Indicators**:
- Trust meter in companion HUD
- Color coding (red = low, green = high)
- Trust-based dialogue/audio cues

### Technical Improvements

#### 1. State Machine Refactoring

**Current**: Implicit state logic  
**Future**: Formal state machine

```javascript
class CompanionStateMachine {
    constructor() {
        this.states = {
            IDLE: new IdleState(),
            FOLLOWING: new FollowingState(),
            COMBAT: new CombatState(),
            REVIVING: new RevivingState(),
            DOWNED: new DownedState()
        };
        this.currentState = this.states.IDLE;
    }
    
    transition(newState) {
        this.currentState.exit();
        this.currentState = this.states[newState];
        this.currentState.enter();
    }
    
    update(player) {
        return this.currentState.update(player);
    }
}
```

**Benefits**:
- Clear state transitions
- Easier to add new behaviors
- Better debugging (current state visible)
- Supports complex behaviors

#### 2. Spatial Partitioning for Target Selection

**Current**: Linear search O(n)  
**Future**: Quadtree or spatial hash

```javascript
class CompanionSystem {
    update(player) {
        // Use quadtree for efficient zombie queries
        const nearbyZombies = quadtree.query(
            player.x, player.y, this.combatRange
        );
        const nearestZombie = findNearest(player, nearbyZombies);
        // ...
    }
}
```

**Benefits**:
- O(log n) query time
- Scales better with many zombies
- Can query by range efficiently

#### 3. Behavior Tree System

**Future**: For complex decision-making

```javascript
class BehaviorTree {
    constructor() {
        this.root = new Selector([
            new Sequence([
                new CheckHasCommand(),
                new ExecuteCommand()
            ]),
            new Sequence([
                new CheckEnemyNearby(),
                new CombatBehavior()
            ]),
            new FollowPlayerBehavior()
        ]);
    }
    
    update(player) {
        return this.root.tick(player);
    }
}
```

**Benefits**:
- Modular, composable behaviors
- Easy to add new behaviors
- Visual debugging tools possible
- Industry-standard pattern

---

## Advanced AI Features

This section explores advanced AI techniques to add more life, personality, and intelligence to companions. These features go beyond basic combat assistance to create engaging, believable NPCs that feel like real teammates.

### 1. Dialogue & Communication System

#### Chat Box System

**Concept**: Companions communicate with the player and each other through speech bubbles or chat messages.

**Implementation Strategy**:

```javascript
class CompanionDialogue {
    constructor(companion) {
        this.companion = companion;
        this.personality = companion.personality; // Aggressive, Calm, Supportive, etc.
        this.speechQueue = [];
        this.currentMessage = null;
        this.messageLifetime = 3000; // 3 seconds
    }
    
    // Context-aware dialogue triggers
    triggerDialogue(context, priority = 'normal') {
        const dialogue = this.getDialogue(context);
        if (dialogue) {
            this.speechQueue.push({ text: dialogue, priority, timestamp: Date.now() });
        }
    }
    
    getDialogue(context) {
        const templates = this.personality.dialogue[context];
        if (templates && templates.length > 0) {
            return templates[Math.floor(Math.random() * templates.length)];
        }
        return null;
    }
    
    update() {
        // Process speech queue
        if (this.speechQueue.length > 0 && !this.currentMessage) {
            // Sort by priority
            this.speechQueue.sort((a, b) => {
                const priorityOrder = { critical: 3, high: 2, normal: 1, low: 0 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            
            this.currentMessage = this.speechQueue.shift();
            this.showSpeechBubble(this.currentMessage.text);
        }
        
        // Remove expired messages
        if (this.currentMessage && 
            Date.now() - this.currentMessage.timestamp > this.messageLifetime) {
            this.hideSpeechBubble();
            this.currentMessage = null;
        }
    }
}
```

**Dialogue Contexts**:

```javascript
const dialogueTemplates = {
    aggressive: {
        spawn: ["Let's do this!", "Time to kill!", "I'm ready for action!"],
        enemySpotted: ["Target acquired!", "I see one!", "Engaging!"],
        lowAmmo: ["Running low on ammo!", "Need to reload soon!"],
        lowHealth: ["I'm hit!", "Taking damage!", "Need backup!"],
        playerLowHealth: ["Hang in there!", "Stay alive!", "I got your back!"],
        killStreak: ["That's how it's done!", "Another one down!", "Keep it up!"],
        waveComplete: ["Wave cleared!", "Nice work!", "On to the next!"],
        bossSpawn: ["Big one incoming!", "Boss detected!", "This is serious!"],
        companionDown: ["No! [Name]!", "We lost one!", "Damn it!"],
        pickupFound: ["Found something!", "Pickup here!", "Resource located!"]
    },
    calm: {
        spawn: ["Ready when you are.", "Let's proceed carefully.", "I'm here to help."],
        enemySpotted: ["Enemy contact.", "Threat detected.", "Engaging target."],
        lowAmmo: ["Ammunition running low.", "Should reload soon."],
        lowHealth: ["I've taken damage.", "Health is critical."],
        playerLowHealth: ["You're hurt. Stay safe.", "Watch your health."],
        killStreak: ["Excellent work.", "Impressive.", "Well executed."],
        waveComplete: ["Wave cleared successfully.", "Good job."],
        bossSpawn: ["Major threat incoming.", "Boss detected."],
        companionDown: ["We lost [Name].", "Casualty reported."],
        pickupFound: ["Resource located.", "Found a pickup."]
    },
    supportive: {
        spawn: ["I'm here to help!", "Let's survive together!", "Teamwork makes the dream work!"],
        enemySpotted: ["I'll cover you!", "Enemy ahead, be careful!", "I see them!"],
        lowAmmo: ["I'm low on ammo, but I'll manage!", "Running out soon!"],
        lowHealth: ["I'm hurt, but I'll keep fighting!", "Still in the fight!"],
        playerLowHealth: ["You're hurt! Stay behind me!", "I'll protect you!", "Hang on!"],
        killStreak: ["You're amazing!", "Incredible work!", "You're unstoppable!"],
        waveComplete: ["We did it together!", "Great teamwork!", "Another wave down!"],
        bossSpawn: ["Big one! Stick together!", "Boss! We need to coordinate!"],
        companionDown: ["[Name]! No!", "We lost a friend...", "Rest in peace, [Name]."],
        pickupFound: ["Found something useful!", "Here's a pickup!", "Resource here!"]
    }
};
```

**Visual Implementation**:

```javascript
class SpeechBubble {
    constructor(companion, text) {
        this.companion = companion;
        this.text = text;
        this.life = 3000; // 3 seconds
        this.maxLife = 3000;
        this.offsetY = -companion.radius - 30;
    }
    
    draw(ctx) {
        const alpha = Math.min(1, this.life / 500); // Fade in
        const x = this.companion.x;
        const y = this.companion.y + this.offsetY;
        
        // Measure text
        ctx.font = '12px "Roboto Mono", monospace';
        const metrics = ctx.measureText(this.text);
        const textWidth = metrics.width;
        const padding = 10;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = 24;
        
        // Draw speech bubble
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Bubble background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        
        // Rounded rectangle
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(x - bubbleWidth/2, y - bubbleHeight, bubbleWidth, bubbleHeight, radius);
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, x, y - bubbleHeight/2);
        
        // Pointer to companion
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y - 8);
        ctx.lineTo(x + 8, y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }
}
```

**Cross-Companion Communication**:

```javascript
class CompanionCommunication {
    constructor(companions) {
        this.companions = companions;
        this.conversations = [];
    }
    
    // Companions can talk to each other
    initiateConversation(speaker, listener, topic) {
        const response = listener.personality.getResponse(topic);
        this.conversations.push({
            speaker, listener, topic,
            speakerMessage: speaker.dialogue.triggerDialogue(topic),
            listenerMessage: response,
            timestamp: Date.now()
        });
    }
    
    // Example: Companion warns others about danger
    broadcastWarning(warningCompanion, threat) {
        this.companions.forEach(companion => {
            if (companion !== warningCompanion) {
                companion.dialogue.triggerDialogue('companionWarning', 'high');
            }
        });
    }
}
```

#### Voice Lines & Audio

**Concept**: Add audio feedback to dialogue for more immersion.

**Implementation**:

```javascript
class CompanionVoice {
    constructor(companion) {
        this.companion = companion;
        this.voiceProfile = this.generateVoiceProfile(companion.personality);
        this.audioContext = null;
    }
    
    generateVoiceProfile(personality) {
        // Procedural voice generation parameters
        return {
            pitch: personality === 'aggressive' ? 0.9 : 1.1, // Lower for aggressive
            speed: personality === 'calm' ? 0.9 : 1.1,      // Slower for calm
            tone: personality === 'supportive' ? 'warm' : 'neutral'
        };
    }
    
    speak(text, emotion = 'neutral') {
        // Use Web Speech API or Web Audio API for text-to-speech
        // Or use pre-recorded voice clips with variations
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = this.voiceProfile.pitch;
        utterance.rate = this.voiceProfile.speed;
        speechSynthesis.speak(utterance);
    }
}
```

### 2. Advanced Movement Algorithms

#### Flocking Behavior

**Concept**: Companions maintain natural formation using Craig Reynolds' flocking algorithm.

**Implementation**:

```javascript
class FlockingBehavior {
    constructor(companion, companions) {
        this.companion = companion;
        this.companions = companions;
        this.separationWeight = 1.5;  // Avoid crowding
        this.alignmentWeight = 1.0;   // Match velocity
        this.cohesionWeight = 1.0;    // Move toward group
    }
    
    calculateFlockingForce() {
        const separation = this.separate();
        const alignment = this.align();
        const cohesion = this.cohere();
        
        return {
            x: separation.x * this.separationWeight + 
               alignment.x * this.alignmentWeight + 
               cohesion.x * this.cohesionWeight,
            y: separation.y * this.separationWeight + 
               alignment.y * this.alignmentWeight + 
               cohesion.y * this.cohesionWeight
        };
    }
    
    separate() {
        // Steer away from nearby companions
        const desiredSeparation = 80;
        let steerX = 0, steerY = 0;
        let count = 0;
        
        this.companions.forEach(other => {
            if (other === this.companion) return;
            
            const dx = this.companion.x - other.x;
            const dy = this.companion.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < desiredSeparation && dist > 0) {
                // Normalize and weight by distance
                const weight = 1 / dist;
                steerX += (dx / dist) * weight;
                steerY += (dy / dist) * weight;
                count++;
            }
        });
        
        if (count > 0) {
            steerX /= count;
            steerY /= count;
            // Normalize to unit vector
            const len = Math.sqrt(steerX * steerX + steerY * steerY);
            if (len > 0) {
                steerX /= len;
                steerY /= len;
            }
        }
        
        return { x: steerX, y: steerY };
    }
    
    align() {
        // Match velocity of nearby companions
        const neighborDist = 100;
        let sumX = 0, sumY = 0;
        let count = 0;
        
        this.companions.forEach(other => {
            if (other === this.companion) return;
            
            const dx = this.companion.x - other.x;
            const dy = this.companion.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < neighborDist) {
                // Use movement direction as "velocity"
                const angle = other.angle;
                sumX += Math.cos(angle);
                sumY += Math.sin(angle);
                count++;
            }
        });
        
        if (count > 0) {
            sumX /= count;
            sumY /= count;
            const len = Math.sqrt(sumX * sumX + sumY * sumY);
            if (len > 0) {
                sumX /= len;
                sumY /= len;
            }
        }
        
        return { x: sumX, y: sumY };
    }
    
    cohere() {
        // Move toward center of nearby companions
        const neighborDist = 150;
        let sumX = 0, sumY = 0;
        let count = 0;
        
        this.companions.forEach(other => {
            if (other === this.companion) return;
            
            const dx = other.x - this.companion.x;
            const dy = other.y - this.companion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < neighborDist) {
                sumX += other.x;
                sumY += other.y;
                count++;
            }
        });
        
        if (count > 0) {
            sumX = (sumX / count) - this.companion.x;
            sumY = (sumY / count) - this.companion.y;
            const len = Math.sqrt(sumX * sumX + sumY * sumY);
            if (len > 0) {
                sumX /= len;
                sumY /= len;
            }
        }
        
        return { x: sumX, y: sumY };
    }
}
```

#### Pathfinding & Obstacle Avoidance

**Concept**: Companions navigate around obstacles and find optimal paths.

**Implementation**:

```javascript
class PathfindingBehavior {
    constructor(companion) {
        this.companion = companion;
        this.currentPath = [];
        this.obstacleAvoidanceRadius = 50;
    }
    
    // Simple obstacle avoidance using steering
    avoidObstacles(targetX, targetY) {
        const obstacles = this.getNearbyObstacles();
        let avoidanceX = 0, avoidanceY = 0;
        
        obstacles.forEach(obstacle => {
            const dx = this.companion.x - obstacle.x;
            const dy = this.companion.y - obstacle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const avoidanceDist = this.obstacleAvoidanceRadius + obstacle.radius;
            
            if (dist < avoidanceDist && dist > 0) {
                const strength = (avoidanceDist - dist) / avoidanceDist;
                avoidanceX += (dx / dist) * strength;
                avoidanceY += (dy / dist) * strength;
            }
        });
        
        return { x: avoidanceX, y: avoidanceY };
    }
    
    getNearbyObstacles() {
        // Could include: zombies, walls, acid pools, other companions
        const obstacles = [];
        
        // Avoid zombies (steer around them)
        gameState.zombies.forEach(zombie => {
            const dx = this.companion.x - zombie.x;
            const dy = this.companion.y - zombie.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.obstacleAvoidanceRadius + zombie.radius) {
                obstacles.push({ x: zombie.x, y: zombie.y, radius: zombie.radius });
            }
        });
        
        // Avoid acid pools
        gameState.acidPools.forEach(pool => {
            const dx = this.companion.x - pool.x;
            const dy = this.companion.y - pool.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.obstacleAvoidanceRadius + pool.radius) {
                obstacles.push({ x: pool.x, y: pool.y, radius: pool.radius });
            }
        });
        
        return obstacles;
    }
    
    // A* pathfinding for complex navigation (future)
    findPath(startX, startY, endX, endY) {
        // Grid-based A* implementation
        // Convert world coordinates to grid
        // Find path through grid
        // Convert back to world coordinates
        // Return path as array of waypoints
    }
}
```

#### Dynamic Formation System

**Concept**: Companions maintain tactical formations relative to player.

**Implementation**:

```javascript
class FormationSystem {
    constructor(companions, leader) {
        this.companions = companions;
        this.leader = leader;
        this.formationType = 'wedge'; // wedge, line, circle, vanguard
        this.formationSpacing = 80;
    }
    
    getFormationPosition(companion, index) {
        const leaderAngle = this.leader.angle;
        const leaderX = this.leader.x;
        const leaderY = this.leader.y;
        
        switch (this.formationType) {
            case 'wedge':
                return this.getWedgePosition(companion, index, leaderAngle, leaderX, leaderY);
            case 'line':
                return this.getLinePosition(companion, index, leaderAngle, leaderX, leaderY);
            case 'circle':
                return this.getCirclePosition(companion, index, leaderX, leaderY);
            case 'vanguard':
                return this.getVanguardPosition(companion, index, leaderAngle, leaderX, leaderY);
            default:
                return { x: leaderX, y: leaderY };
        }
    }
    
    getWedgePosition(companion, index, angle, leaderX, leaderY) {
        // V-formation behind leader
        const offset = (index + 1) * this.formationSpacing;
        const side = index % 2 === 0 ? 1 : -1; // Alternate sides
        const row = Math.floor(index / 2) + 1;
        
        const perpAngle = angle + Math.PI / 2;
        const backAngle = angle + Math.PI;
        
        const x = leaderX + 
                  Math.cos(backAngle) * offset * row +
                  Math.cos(perpAngle) * side * offset * 0.5;
        const y = leaderY + 
                  Math.sin(backAngle) * offset * row +
                  Math.sin(perpAngle) * side * offset * 0.5;
        
        return { x, y };
    }
    
    getLinePosition(companion, index, angle, leaderX, leaderY) {
        // Horizontal line perpendicular to movement
        const perpAngle = angle + Math.PI / 2;
        const offset = (index - this.companions.length / 2) * this.formationSpacing;
        
        const x = leaderX + Math.cos(perpAngle) * offset;
        const y = leaderY + Math.sin(perpAngle) * offset;
        
        return { x, y };
    }
    
    switchFormation(type) {
        this.formationType = type;
        // Notify companions of formation change
        this.companions.forEach(c => c.dialogue?.triggerDialogue('formationChange'));
    }
}
```

### 3. State-of-the-Art AI Improvements

#### Utility-Based AI

**Concept**: Use utility scores to make decisions rather than hard-coded rules.

**Implementation**:

```javascript
class UtilityAI {
    constructor(companion) {
        this.companion = companion;
        this.actions = [
            new CombatAction(),
            new ReloadAction(),
            new FollowAction(),
            new PickupAction(),
            new CoverAction(),
            new FlankAction()
        ];
    }
    
    selectAction() {
        // Evaluate utility of each action
        const utilities = this.actions.map(action => ({
            action,
            utility: action.evaluateUtility(this.companion)
        }));
        
        // Select highest utility action
        utilities.sort((a, b) => b.utility - a.utility);
        return utilities[0].action;
    }
}

class CombatAction {
    evaluateUtility(companion) {
        const nearestZombie = findNearestZombie(companion);
        if (!nearestZombie) return 0;
        
        const dist = getDistance(companion, nearestZombie);
        const hasAmmo = companion.currentAmmo > 0;
        const isReloading = companion.isReloading;
        
        // Utility calculation
        let utility = 0;
        
        // Higher utility if zombie is close but not too close
        if (dist > 200 && dist < 500) {
            utility += 50;
        }
        
        // Higher utility if we have ammo
        if (hasAmmo && !isReloading) {
            utility += 30;
        }
        
        // Lower utility if zombie is too close (danger)
        if (dist < 150) {
            utility -= 40;
        }
        
        // Higher utility if zombie is attacking player
        if (isZombieTargetingPlayer(nearestZombie)) {
            utility += 20;
        }
        
        return utility;
    }
    
    execute(companion) {
        // Perform combat action
        const nearestZombie = findNearestZombie(companion);
        companion.angle = Math.atan2(
            nearestZombie.y - companion.y,
            nearestZombie.x - companion.x
        );
        shootBullet({ x: nearestZombie.x, y: nearestZombie.y }, canvas, companion);
    }
}
```

#### Goal-Oriented Action Planning (GOAP)

**Concept**: Companions plan sequences of actions to achieve goals.

**Implementation**:

```javascript
class GOAPPlanner {
    constructor(companion) {
        this.companion = companion;
        this.goals = [
            new Goal('Survive', 100),      // Highest priority
            new Goal('ProtectPlayer', 80),
            new Goal('EliminateThreats', 60),
            new Goal('CollectResources', 40)
        ];
        this.actions = [
            new Action('Shoot', ['hasAmmo', 'enemyInRange'], ['enemyDamaged']),
            new Action('Reload', ['hasWeapon'], ['hasAmmo']),
            new Action('MoveToCover', [], ['inCover']),
            new Action('PickupHealth', ['healthPickupNearby'], ['healthRestored'])
        ];
    }
    
    plan() {
        // Select highest priority goal
        const goal = this.selectGoal();
        
        // Find action sequence to achieve goal
        const plan = this.findPlan(goal);
        
        return plan;
    }
    
    findPlan(goal) {
        // A* search through action space
        // Find sequence of actions that achieve goal
        // Consider preconditions and effects
    }
}
```

#### Machine Learning Integration (Future)

**Concept**: Train companions to improve behavior over time.

**Potential Approaches**:

1. **Reinforcement Learning**: Companions learn optimal strategies through trial and error
2. **Imitation Learning**: Learn from player behavior patterns
3. **Neural Networks**: Deep learning for complex decision-making

**Example Architecture**:

```javascript
class MLCompanion {
    constructor(companion) {
        this.companion = companion;
        this.brain = new NeuralNetwork([10, 20, 10, 5]); // Input, hidden, output layers
        this.memory = new ExperienceReplay(1000);
    }
    
    getState() {
        // Convert game state to neural network input
        return [
            this.companion.health / this.companion.maxHealth,
            this.companion.currentAmmo / this.companion.maxAmmo,
            distanceToNearestZombie / 500,
            distanceToPlayer / 500,
            // ... more features
        ];
    }
    
    decide(state) {
        // Neural network outputs action probabilities
        const output = this.brain.predict(state);
        return this.selectAction(output);
    }
    
    learn(experience) {
        // Store experience in replay buffer
        this.memory.add(experience);
        
        // Train on batch of experiences
        if (this.memory.size() > 100) {
            const batch = this.memory.sample(32);
            this.brain.train(batch);
        }
    }
}
```

### 4. Personality & Emotion System

**Concept**: Companions have distinct personalities that affect behavior and dialogue.

**Implementation**:

```javascript
class CompanionPersonality {
    constructor(type) {
        this.type = type; // aggressive, calm, supportive, cautious, reckless
        this.traits = this.generateTraits(type);
        this.emotion = 'neutral'; // neutral, happy, angry, scared, determined
        this.emotionIntensity = 0.5; // 0.0 to 1.0
    }
    
    generateTraits(type) {
        const traitSets = {
            aggressive: {
                combatAggressiveness: 0.9,
                riskTolerance: 0.8,
                socialWarmth: 0.3,
                accuracy: 0.7,
                speedPreference: 1.2
            },
            calm: {
                combatAggressiveness: 0.5,
                riskTolerance: 0.4,
                socialWarmth: 0.6,
                accuracy: 0.9,
                speedPreference: 0.9
            },
            supportive: {
                combatAggressiveness: 0.6,
                riskTolerance: 0.5,
                socialWarmth: 0.9,
                accuracy: 0.8,
                speedPreference: 1.0
            }
        };
        
        return traitSets[type] || traitSets.calm;
    }
    
    updateEmotion(context) {
        // Emotion changes based on game events
        switch (context) {
            case 'playerHurt':
                this.emotion = 'concerned';
                this.emotionIntensity = 0.8;
                break;
            case 'enemyKilled':
                this.emotion = 'satisfied';
                this.emotionIntensity = 0.6;
                break;
            case 'lowHealth':
                this.emotion = 'scared';
                this.emotionIntensity = 0.9;
                break;
            case 'waveComplete':
                this.emotion = 'happy';
                this.emotionIntensity = 0.7;
                break;
        }
        
        // Emotion decays over time
        setTimeout(() => {
            this.emotionIntensity *= 0.95;
            if (this.emotionIntensity < 0.1) {
                this.emotion = 'neutral';
            }
        }, 1000);
    }
    
    influenceBehavior(baseBehavior) {
        // Personality traits modify behavior
        return {
            combatRange: baseBehavior.combatRange * this.traits.combatAggressiveness,
            accuracy: baseBehavior.accuracy * this.traits.accuracy,
            movementSpeed: baseBehavior.movementSpeed * this.traits.speedPreference,
            riskTaking: this.traits.riskTolerance
        };
    }
}
```

### 5. Dynamic Reaction System

**Concept**: Companions react dynamically to game events with appropriate behaviors.

**Implementation**:

```javascript
class ReactionSystem {
    constructor(companion) {
        this.companion = companion;
        this.reactions = new Map();
        this.setupReactions();
    }
    
    setupReactions() {
        // Boss spawn reaction
        this.reactions.set('bossSpawn', {
            behavior: () => {
                // Increase combat range, prioritize boss
                companion.combatRange *= 1.5;
                companion.dialogue.triggerDialogue('bossSpawn', 'critical');
            },
            duration: 5000
        });
        
        // Player low health reaction
        this.reactions.set('playerLowHealth', {
            behavior: () => {
                // Move closer to player, become more aggressive
                companion.followDistance *= 0.7;
                companion.combatAggressiveness *= 1.3;
                companion.dialogue.triggerDialogue('playerLowHealth', 'high');
            },
            duration: 10000
        });
        
        // Companion downed reaction
        this.reactions.set('companionDowned', {
            behavior: () => {
                // Brief pause, emotional response, then increased aggression
                companion.pauseBehavior(500);
                companion.dialogue.triggerDialogue('companionDowned', 'critical');
                companion.combatAggressiveness *= 1.2;
            },
            duration: 8000
        });
        
        // Nuke pickup reaction
        this.reactions.set('nukeActivated', {
            behavior: () => {
                // Celebrate, move to safe position
                companion.dialogue.triggerDialogue('nukeActivated', 'high');
                companion.seekCover();
            },
            duration: 3000
        });
    }
    
    triggerReaction(eventType) {
        const reaction = this.reactions.get(eventType);
        if (reaction) {
            reaction.behavior();
            // Reaction expires after duration
            setTimeout(() => {
                this.endReaction(eventType);
            }, reaction.duration);
        }
    }
    
    endReaction(eventType) {
        // Reset behavior to normal
        const reaction = this.reactions.get(eventType);
        if (reaction && reaction.reset) {
            reaction.reset();
        }
    }
}
```

### 6. Advanced Combat Tactics

**Concept**: Companions use sophisticated combat strategies.

**Implementation**:

```javascript
class CombatTactics {
    constructor(companion) {
        this.companion = companion;
        this.tactics = [
            new FlankingTactic(),
            new SuppressingFireTactic(),
            new FocusFireTactic(),
            new CoveringFireTactic()
        ];
    }
    
    selectTactic(situation) {
        // Analyze situation and select best tactic
        const scores = this.tactics.map(tactic => ({
            tactic,
            score: tactic.evaluateSituation(situation)
        }));
        
        scores.sort((a, b) => b.score - a.score);
        return scores[0].tactic;
    }
}

class FlankingTactic {
    evaluateSituation(situation) {
        // High score if enemies are clustered and we can flank
        if (situation.enemyClusterSize > 3 && situation.canFlank) {
            return 80;
        }
        return 20;
    }
    
    execute(companion, situation) {
        // Move to flanking position
        const flankAngle = situation.enemyAngle + Math.PI / 2;
        const flankX = situation.enemyX + Math.cos(flankAngle) * 200;
        const flankY = situation.enemyY + Math.sin(flankAngle) * 200;
        
        companion.moveTo(flankX, flankY);
    }
}

class FocusFireTactic {
    evaluateSituation(situation) {
        // High score if multiple companions can focus same target
        if (situation.coordinationPossible && situation.priorityTarget) {
            return 70;
        }
        return 30;
    }
    
    execute(companion, situation) {
        // Coordinate with other companions to focus fire
        companion.target = situation.priorityTarget;
        companion.dialogue.triggerDialogue('focusFire', 'normal');
    }
}
```

### 7. Memory & Learning System

**Concept**: Companions remember past events and learn from experience.

**Implementation**:

```javascript
class CompanionMemory {
    constructor(companion) {
        this.companion = companion;
        this.memories = [];
        this.maxMemories = 50;
        this.importantEvents = new Set(['playerSaved', 'companionDied', 'bossDefeated']);
    }
    
    remember(event, context) {
        const memory = {
            event,
            context,
            timestamp: Date.now(),
            importance: this.importantEvents.has(event) ? 'high' : 'normal',
            emotionalImpact: this.calculateEmotionalImpact(event)
        };
        
        this.memories.push(memory);
        
        // Keep only recent memories
        if (this.memories.length > this.maxMemories) {
            this.memories.shift();
        }
    }
    
    recall(eventType) {
        // Find relevant memories
        return this.memories.filter(m => m.event === eventType);
    }
    
    influenceBehavior() {
        // Past experiences influence current behavior
        const badExperiences = this.memories.filter(m => m.emotionalImpact < 0);
        const goodExperiences = this.memories.filter(m => m.emotionalImpact > 0);
        
        // More cautious if had bad experiences
        if (badExperiences.length > goodExperiences.length) {
            this.companion.riskTolerance *= 0.9;
        }
    }
}
```

### Integration Example

**Combining All Systems**:

```javascript
class AdvancedCompanionSystem extends CompanionSystem {
    constructor() {
        super();
        this.companions = [];
    }
    
    addCompanion() {
        const companion = super.addCompanion();
        if (companion) {
            // Initialize advanced systems
            companion.personality = new CompanionPersonality('aggressive');
            companion.dialogue = new CompanionDialogue(companion);
            companion.flocking = new FlockingBehavior(companion, this.companions);
            companion.pathfinding = new PathfindingBehavior(companion);
            companion.utilityAI = new UtilityAI(companion);
            companion.reactions = new ReactionSystem(companion);
            companion.memory = new CompanionMemory(companion);
            companion.tactics = new CombatTactics(companion);
            
            this.companions.push(companion);
        }
        return companion;
    }
    
    update(player) {
        // Base movement
        const baseMovement = super.update(player);
        
        // Apply advanced behaviors
        const flockingForce = player.flocking?.calculateFlockingForce() || { x: 0, y: 0 };
        const avoidanceForce = player.pathfinding?.avoidObstacles(targetX, targetY) || { x: 0, y: 0 };
        
        // Combine forces
        const finalMovement = {
            moveX: baseMovement.moveX + flockingForce.x * 0.3 + avoidanceForce.x * 0.5,
            moveY: baseMovement.moveY + flockingForce.y * 0.3 + avoidanceForce.y * 0.5
        };
        
        // Normalize
        const len = Math.sqrt(finalMovement.moveX ** 2 + finalMovement.moveY ** 2);
        if (len > 1) {
            finalMovement.moveX /= len;
            finalMovement.moveY /= len;
        }
        
        // Update dialogue
        player.dialogue?.update();
        
        // Update reactions
        player.reactions?.checkEvents();
        
        // Update memory
        player.memory?.influenceBehavior();
        
        return finalMovement;
    }
}
```

---

## Performance Considerations

### Current Performance

### Current Performance

**Per-Frame Cost** (per companion):
- Zombie search: O(n) where n = zombie count
- Distance calculations: ~n calculations
- Movement vector calculation: O(1)
- Shooting logic: O(1)

**Typical Frame** (4 companions, 50 zombies):
- 200 distance calculations
- 4 movement vector calculations
- ~4 shooting checks
- **Estimated**: <1ms per frame (acceptable)

### Optimization Opportunities

1. **Spatial Partitioning**: Reduce zombie search to O(log n)
2. **Target Caching**: Cache nearest zombie for multiple frames
3. **Update Throttling**: Update companions every N frames instead of every frame
4. **LOD System**: Simplify AI for off-screen companions

### Profiling Recommendations

- Profile with 4 companions + 100+ zombies
- Measure frame time impact
- Identify bottlenecks (likely zombie search)
- Optimize only if performance issues arise

---

## Testing Strategy

### Unit Tests (Future)

```javascript
describe('CompanionSystem', () => {
    describe('addCompanion', () => {
        it('should create companion with correct properties', () => {
            const companion = system.addCompanion();
            expect(companion.inputSource).toBe('ai');
            expect(companion.health).toBe(PLAYER_MAX_HEALTH);
        });
        
        it('should return null when max companions reached', () => {
            // Add 4 companions
            for (let i = 0; i < 4; i++) {
                system.addCompanion();
            }
            expect(system.addCompanion()).toBeNull();
        });
    });
    
    describe('update', () => {
        it('should return zero movement when player dead', () => {
            player.health = 0;
            const movement = system.update(player);
            expect(movement).toEqual({ moveX: 0, moveY: 0 });
        });
        
        it('should follow P1 when no enemies', () => {
            gameState.zombies = [];
            const movement = system.update(player);
            // Should move toward P1 if too far
        });
        
        it('should engage nearest zombie', () => {
            const zombie = createZombie(player.x + 100, player.y);
            gameState.zombies = [zombie];
            system.update(player);
            // Should face zombie and shoot
        });
    });
});
```

### Integration Tests

- Test companion spawning in AI lobby
- Test companion behavior during gameplay
- Test companion removal on death
- Test multiple companions coordination

### Manual Testing Checklist

- [ ] Companions spawn correctly in AI lobby
- [ ] Companions follow player at appropriate distance
- [ ] Companions engage zombies when in range
- [ ] Companions kite away when too close
- [ ] Companions regroup when too far from player
- [ ] Companions reload when out of ammo
- [ ] Companions shoot with reasonable accuracy
- [ ] Multiple companions don't interfere with each other
- [ ] Companions handle edge cases (no P1, no zombies, etc.)

---

## Conclusion

The AI Companion System provides a solid foundation for NPC allies. The current implementation is simple, functional, and performant. The modular architecture prepares for future enhancements while maintaining clean separation of concerns.

### Key Strengths

- ✅ Clean separation from main game loop
- ✅ Configurable behavior parameters
- ✅ Simple, understandable logic
- ✅ Extensible architecture
- ✅ Good performance for current scale

### Areas for Growth

- 🔄 State machine for complex behaviors
- 🔄 Role-based specializations
- 🔄 Command system for player control
- 🔄 Trust/loyalty mechanics
- 🔄 Performance optimizations at scale

### Next Steps

1. **Short-term**: Add basic command system (Follow/Hold)
2. **Medium-term**: Implement role system (Medic, Heavy, Scout)
3. **Long-term**: Full state machine + behavior tree system

---

## Appendix

### Configuration Reference

```javascript
// Default CompanionSystem configuration
{
    maxCompanions: 4,        // Maximum companions allowed
    leashDistance: 500,      // Max distance from P1 (pixels)
    followDistance: 150,     // Preferred idle distance (pixels)
    combatRange: 500,         // Max engagement range (pixels)
    kiteDistance: 200,       // Back away threshold (pixels)
    engageDistance: 350      // Approach threshold (pixels)
}
```

### Code Examples

**Adding a Companion**:
```javascript
const companion = companionSystem.addCompanion();
if (companion) {
    console.log(`Added: ${companion.name}`);
}
```

**Updating Companions**:
```javascript
gameState.players.forEach(player => {
    if (player.inputSource === 'ai') {
        const movement = companionSystem.update(player);
        // Apply movement in physics system
    }
});
```

**Custom Configuration**:
```javascript
const customSystem = new CompanionSystem();
customSystem.leashDistance = 600;
customSystem.combatRange = 600;
```

---

**Document Maintained By**: Development Team  
**Review Frequency**: After major feature additions  
**Related Documents**: `ARCHITECTURE.md`, `roadmap.md`, `CHANGELOG.md`

