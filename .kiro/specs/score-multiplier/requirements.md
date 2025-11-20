# Requirements Document

## Introduction

The Score Multiplier feature rewards players for consecutive kills without taking damage by applying an increasing multiplier to their score. This feature encourages skillful play, risk-taking, and maintaining combat momentum while providing satisfying feedback for successful kill streaks.

## Glossary

- **System**: The ZOMBOBS game engine
- **Player**: The human-controlled character in the game
- **Score**: The numerical value representing the player's performance in the current game session
- **Kill**: The event when a player defeats a zombie enemy
- **Consecutive Kills**: Multiple kills achieved in sequence without taking damage
- **Score Multiplier**: A numerical value (1.0x to 5.0x) that multiplies the base score earned per kill
- **Multiplier Tier**: A discrete level of the score multiplier (1x, 2x, 3x, 4x, 5x)
- **Damage Event**: Any instance where the player's health is reduced by zombie attacks or environmental hazards
- **HUD**: Heads-Up Display, the on-screen user interface showing game information
- **Multiplier Indicator**: A visual UI element displaying the current score multiplier and progress
- **Base Score**: The default score value awarded for killing a zombie (varies by zombie type)

## Requirements

### Requirement 1

**User Story:** As a player, I want to earn bonus score for consecutive kills, so that I am rewarded for skillful play and maintaining combat momentum.

#### Acceptance Criteria

1. WHEN a player kills a zombie THEN the System SHALL award base score multiplied by the current multiplier value
2. WHEN a player achieves 3 consecutive kills without taking damage THEN the System SHALL increase the multiplier to 2.0x
3. WHEN a player achieves 6 consecutive kills without taking damage THEN the System SHALL increase the multiplier to 3.0x
4. WHEN a player achieves 10 consecutive kills without taking damage THEN the System SHALL increase the multiplier to 4.0x
5. WHEN a player achieves 15 consecutive kills without taking damage THEN the System SHALL increase the multiplier to 5.0x (maximum)
6. WHEN the multiplier is at maximum (5.0x) THEN the System SHALL not increase the multiplier further

### Requirement 2

**User Story:** As a player, I want my score multiplier to reset when I take damage, so that maintaining the multiplier requires skillful avoidance of enemy attacks.

#### Acceptance Criteria

1. WHEN a player takes damage from a zombie THEN the System SHALL reset the score multiplier to 1.0x
2. WHEN a player takes damage from an environmental hazard THEN the System SHALL reset the score multiplier to 1.0x
3. WHEN a player takes damage from an explosion THEN the System SHALL reset the score multiplier to 1.0x
4. WHEN the multiplier resets THEN the System SHALL reset the consecutive kill counter to zero
5. WHEN shield absorbs damage (health unchanged) THEN the System SHALL not reset the score multiplier

### Requirement 3

**User Story:** As a player, I want to see my current score multiplier and progress toward the next tier, so that I understand how close I am to earning higher bonuses.

#### Acceptance Criteria

1. WHEN the score multiplier is active (above 1.0x) THEN the System SHALL display the multiplier value in the HUD
2. WHEN the multiplier is displayed THEN the System SHALL show the current tier (2x, 3x, 4x, or 5x) with prominent styling
3. WHEN the player is progressing toward the next tier THEN the System SHALL display a progress indicator showing kills remaining
4. WHEN the multiplier increases to a new tier THEN the System SHALL display a visual notification with the new multiplier value
5. WHEN the multiplier resets to 1.0x THEN the System SHALL display a brief "Multiplier Lost" notification

### Requirement 4

**User Story:** As a player, I want the score multiplier to have satisfying visual and audio feedback, so that achieving higher multipliers feels rewarding.

#### Acceptance Criteria

1. WHEN the multiplier increases to a new tier THEN the System SHALL play a distinct audio cue
2. WHEN the multiplier reaches maximum (5.0x) THEN the System SHALL play a special "max multiplier" audio cue
3. WHEN the multiplier is active THEN the System SHALL display the indicator with a pulsing glow effect
4. WHEN the multiplier increases THEN the System SHALL display floating text showing the new multiplier value
5. WHEN the multiplier resets THEN the System SHALL play a negative audio cue

### Requirement 5

**User Story:** As a player, I want different zombie types to contribute to my multiplier progress, so that all kills count toward maintaining my streak.

#### Acceptance Criteria

1. WHEN a player kills a Normal Zombie THEN the System SHALL increment the consecutive kill counter by 1
2. WHEN a player kills a Fast Zombie THEN the System SHALL increment the consecutive kill counter by 1
3. WHEN a player kills an Armored Zombie THEN the System SHALL increment the consecutive kill counter by 1
4. WHEN a player kills an Exploding Zombie THEN the System SHALL increment the consecutive kill counter by 1
5. WHEN a player kills a Boss Zombie THEN the System SHALL increment the consecutive kill counter by 3

### Requirement 6

**User Story:** As a player, I want the score multiplier to work correctly in multiplayer mode, so that each player has their own independent multiplier.

#### Acceptance Criteria

1. WHEN multiple players are active THEN the System SHALL track separate multiplier values for each player
2. WHEN a player takes damage THEN the System SHALL reset only that player's multiplier
3. WHEN a player achieves kills THEN the System SHALL update only that player's multiplier
4. WHEN displaying multipliers in split-screen THEN the System SHALL show each player's multiplier in their respective HUD section
5. WHEN one player's multiplier resets THEN the System SHALL not affect other players' multipliers

### Requirement 7

**User Story:** As a player, I want my score multiplier progress to be saved in my session statistics, so that I can see my best multiplier achieved.

#### Acceptance Criteria

1. WHEN a game session ends THEN the System SHALL record the highest multiplier achieved during that session
2. WHEN displaying game over statistics THEN the System SHALL show the maximum multiplier reached
3. WHEN a player achieves a new personal best multiplier THEN the System SHALL save it to localStorage
4. WHEN displaying the main menu THEN the System SHALL show the player's all-time best multiplier
5. WHEN the player views statistics THEN the System SHALL display total score earned from multiplier bonuses
