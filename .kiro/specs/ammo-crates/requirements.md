# Requirements Document

## Introduction

The Ammo Crates feature introduces rare, high-value pickups that fully refill ammunition for the player's current weapon or all weapons in their inventory. This feature adds strategic depth to resource management and provides exciting moments of relief during intense combat situations.

## Glossary

- **System**: The ZOMBOBS game engine
- **Player**: The human-controlled character in the game
- **Ammo Crate**: A rare pickup item that restores ammunition
- **Current Weapon**: The weapon the player has actively equipped at the time of collection
- **Weapon Inventory**: The complete set of weapons available to the player
- **Full Refill**: Restoring ammunition to the maximum capacity for a weapon
- **Spawn Condition**: The game state requirements that must be met for an ammo crate to appear
- **Pickup Radius**: The distance within which a player can collect a pickup item
- **HUD**: Heads-Up Display, the on-screen user interface showing game information
- **Floating Text**: Temporary text that appears above a pickup location to provide feedback
- **Particle Effect**: Visual effect particles that appear when a pickup is collected

## Requirements

### Requirement 1

**User Story:** As a player, I want to find rare ammo crates that fully refill my ammunition, so that I have strategic opportunities to recover from low ammo situations.

#### Acceptance Criteria

1. WHEN an ammo crate spawns THEN the System SHALL place it at a random location within the playable area
2. WHEN a player collects an ammo crate THEN the System SHALL fully refill ammunition for the player's current weapon to maximum capacity
3. WHEN ammunition is refilled THEN the System SHALL update the player's ammo count to match the weapon's maxAmmo value
4. WHEN the ammo crate is collected THEN the System SHALL remove the crate from the game world
5. WHEN the player's current weapon already has maximum ammunition THEN the System SHALL still allow collection and refill other weapons

### Requirement 2

**User Story:** As a player, I want ammo crates to be visually distinct from regular ammo pickups, so that I can immediately recognize their higher value.

#### Acceptance Criteria

1. WHEN an ammo crate is rendered THEN the System SHALL display it with a larger size than regular ammo pickups (16px radius vs 10px)
2. WHEN an ammo crate is rendered THEN the System SHALL use a distinct color scheme (gold/orange gradient: #ffd700 to #ff8c00)
3. WHEN an ammo crate is rendered THEN the System SHALL display a crate/box icon instead of a bullet icon
4. WHEN an ammo crate is rendered THEN the System SHALL apply a pulsing glow animation with 400ms cycle time
5. WHEN an ammo crate is rendered THEN the System SHALL display a stronger glow effect than regular pickups

### Requirement 3

**User Story:** As a player, I want ammo crates to spawn rarely and strategically, so that finding one feels rewarding and impactful.

#### Acceptance Criteria

1. WHEN the spawn timer triggers THEN the System SHALL have a 15% chance to spawn an ammo crate
2. WHEN checking spawn conditions THEN the System SHALL only spawn an ammo crate if at least one player has less than 50% total ammunition across all weapons
3. WHEN an ammo crate exists in the game world THEN the System SHALL not spawn additional ammo crates until the existing one is collected
4. WHEN the spawn timer triggers THEN the System SHALL check for spawn opportunity every 45 seconds
5. WHEN wave number is below 3 THEN the System SHALL not spawn ammo crates

### Requirement 4

**User Story:** As a player, I want clear feedback when I collect an ammo crate, so that I understand what ammunition was refilled.

#### Acceptance Criteria

1. WHEN a player collects an ammo crate THEN the System SHALL create 15 gold particle effects at the collection location
2. WHEN a player collects an ammo crate THEN the System SHALL display floating text showing "AMMO CRATE!" in gold color (#ffd700)
3. WHEN a player collects an ammo crate THEN the System SHALL display floating text showing the weapon name and ammo refilled
4. WHEN a player collects an ammo crate THEN the System SHALL play a distinct audio cue (higher pitch than regular ammo pickup)
5. WHEN ammunition is refilled THEN the System SHALL briefly highlight the ammo counter in the HUD with a gold glow

### Requirement 5

**User Story:** As a player, I want ammo crates to refill all weapons when I'm critically low on ammunition, so that I can recover from desperate situations.

#### Acceptance Criteria

1. WHEN a player collects an ammo crate AND total ammunition across all weapons is below 20% THEN the System SHALL refill all weapons to maximum capacity
2. WHEN a player collects an ammo crate AND total ammunition is above 20% THEN the System SHALL refill only the current weapon
3. WHEN all weapons are refilled THEN the System SHALL display floating text showing "ALL WEAPONS REFILLED!"
4. WHEN only current weapon is refilled THEN the System SHALL display floating text showing the weapon name
5. WHEN ammunition is refilled THEN the System SHALL update the weapon state for all affected weapons

### Requirement 6

**User Story:** As a player, I want ammo crates to work correctly in multiplayer mode, so that only one player can collect each crate.

#### Acceptance Criteria

1. WHEN multiple players are near an ammo crate THEN the System SHALL allow only the first player to collide with it to collect it
2. WHEN a player collects an ammo crate THEN the System SHALL immediately remove it from the game world
3. WHEN an ammo crate is collected THEN the System SHALL prevent other players from collecting the same crate
4. WHEN checking spawn conditions in multiplayer THEN the System SHALL consider ammunition levels of all active players
5. WHEN an ammo crate spawns THEN the System SHALL be visible to all players

### Requirement 7

**User Story:** As a player, I want ammo crates to have a setting to toggle their spawn, so that I can customize the difficulty of my game.

#### Acceptance Criteria

1. WHEN a player opens the Settings Panel THEN the System SHALL display a toggle option for ammo crates in the Gameplay settings section
2. WHEN ammo crates are disabled in settings THEN the System SHALL not spawn any ammo crates during gameplay
3. WHEN ammo crates are enabled in settings THEN the System SHALL spawn ammo crates according to normal spawn rules
4. WHEN a player changes the setting THEN the System SHALL persist the preference to localStorage
5. WHEN a player loads the game THEN the System SHALL restore the ammo crate setting from localStorage

### Requirement 8

**User Story:** As a player, I want ammo crates to also refill my grenades, so that collecting a crate provides comprehensive ammunition support.

#### Acceptance Criteria

1. WHEN a player collects an ammo crate THEN the System SHALL refill grenades to maximum capacity (3 grenades)
2. WHEN grenades are refilled THEN the System SHALL update the player's grenade count
3. WHEN grenades are already at maximum THEN the System SHALL not increase grenade count beyond maximum
4. WHEN floating text is displayed THEN the System SHALL include grenade refill information if grenades were below maximum
5. WHEN grenades are refilled THEN the System SHALL briefly highlight the grenade counter in the HUD
