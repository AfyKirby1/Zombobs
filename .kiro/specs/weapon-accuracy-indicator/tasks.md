# Implementation Plan

- [ ] 1. Add accuracy state to player object
  - Add `weaponAccuracy`, `accuracyRecoveryRate`, `accuracyDegradationRate`, `minAccuracy` properties to player object in `gameState.js`
  - Initialize accuracy to 1.0 for all players (including multiplayer)
  - _Requirements: 1.1, 4.1, 5.1_

- [ ] 2. Implement accuracy update logic
  - [ ] 2.1 Create `updateWeaponAccuracy()` function in `combatUtils.js`
    - Degrade accuracy when firing (subtract degradationRate, clamp to minAccuracy)
    - Recover accuracy when not firing (add recoveryRate after 100ms grace period, clamp to 1.0)
    - _Requirements: 1.2, 1.5, 4.2, 4.3_

  - [ ]* 2.2 Write property test for accuracy bounds
    - **Property 1: Accuracy bounds invariant**
    - **Validates: Requirements 1.1, 1.5, 4.5**

  - [ ]* 2.3 Write property test for degradation monotonicity
    - **Property 2: Accuracy degradation monotonicity**
    - **Validates: Requirements 1.5, 4.2**

  - [ ]* 2.4 Write property test for recovery monotonicity
    - **Property 3: Accuracy recovery monotonicity**
    - **Validates: Requirements 1.5, 4.3**

- [ ] 3. Integrate accuracy with shooting mechanics
  - [ ] 3.1 Modify `shootBullet()` to call `updateWeaponAccuracy()` when firing
    - Pass `isFiring: true` when shooting
    - Update accuracy before calculating bullet spread
    - _Requirements: 4.1, 4.2_

  - [ ] 3.2 Update bullet spread calculation to use `player.weaponAccuracy`
    - Calculate spread angle based on accuracy value
    - Lower accuracy = wider spread
    - _Requirements: 4.1_

  - [ ]* 3.3 Write property test for bullet spread consistency
    - **Property 7: Bullet spread accuracy consistency**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 3.4 Call `updateWeaponAccuracy()` in game loop for recovery
    - Pass `isFiring: false` when not shooting
    - Check time since last shot for grace period
    - _Requirements: 1.5, 4.3_

- [ ] 4. Add weapon switch accuracy handling
  - [ ] 4.1 Reset accuracy to 1.0 when switching weapons
    - Modify `switchWeapon()` in `combatUtils.js`
    - Set `player.weaponAccuracy = 1.0` on weapon change
    - _Requirements: 4.4_

  - [ ]* 4.2 Write property test for weapon switch accuracy
    - **Property 8: Weapon switch accuracy preservation**
    - **Validates: Requirements 4.4**

- [ ] 5. Create HUD accuracy indicator component
  - [ ] 5.1 Add `drawAccuracyIndicator()` method to `GameHUD.js`
    - Position near weapon info area (below ammo counter)
    - Render horizontal bar (width: 100px, height: 8px)
    - Use glass-morphism background matching style guide
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 Implement color-coded accuracy display
    - Green (#4caf50) for accuracy >= 0.9
    - Yellow (#ffeb3b) for 0.7 <= accuracy < 0.9
    - Red (#ff1744) for accuracy < 0.7
    - Apply glow effect matching color (shadowBlur: 10px)
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.3 Write property test for color consistency
    - **Property 4: Indicator color consistency**
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [ ] 5.4 Add accuracy percentage text display
    - Show numeric percentage next to bar
    - Font: 'bold 14px "Roboto Mono"'
    - Color matches bar color
    - _Requirements: 3.2_

- [ ] 6. Add settings toggle for accuracy indicator
  - [ ] 6.1 Add `showAccuracyIndicator` to default settings in `SettingsManager.js`
    - Add to `video` settings category
    - Default value: `true`
    - _Requirements: 2.1, 2.4_

  - [ ] 6.2 Add toggle control in `SettingsPanel.js`
    - Add in Video settings section
    - Label: "Show Accuracy Indicator"
    - Use standard toggle component
    - _Requirements: 2.1_

  - [ ] 6.3 Check setting before rendering indicator
    - In `drawAccuracyIndicator()`, check `settingsManager.getSetting('video', 'showAccuracyIndicator')`
    - Return early if disabled
    - _Requirements: 2.2, 2.3_

  - [ ]* 6.4 Write property test for settings toggle
    - **Property 5: Settings toggle idempotence**
    - **Validates: Requirements 2.2, 2.4**

- [ ] 7. Implement multiplayer support
  - [ ] 7.1 Ensure each player has independent accuracy tracking
    - Verify accuracy properties exist on all player objects
    - Test with 2+ players in local co-op
    - _Requirements: 5.1, 5.2_

  - [ ] 7.2 Position indicator correctly in split-screen
    - Calculate position based on player viewport
    - Render in each player's HUD section
    - _Requirements: 5.5_

  - [ ]* 7.3 Write property test for multiplayer independence
    - **Property 6: Multiplayer independence**
    - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ] 8. Add constants for accuracy system
  - [ ] 8.1 Add accuracy constants to `constants.js`
    - `ACCURACY_RECOVERY_RATE = 0.02`
    - `ACCURACY_DEGRADATION_RATE = 0.05`
    - `MIN_ACCURACY = 0.3`
    - `ACCURACY_RECOVERY_DELAY = 100` (ms)
    - _Requirements: 1.1, 1.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Write unit tests for accuracy system
  - Test accuracy clamping (never exceeds 1.0 or goes below minAccuracy)
  - Test color mapping for all accuracy ranges
  - Test settings integration (show/hide)
  - Test multiplayer independence
  - _Requirements: All_
