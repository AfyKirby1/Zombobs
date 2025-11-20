# Implementation Plan

- [x] 1. Add multiplier state to player object


  - Add `scoreMultiplier`, `consecutiveKills`, `maxMultiplierThisSession`, `totalMultiplierBonus`, `multiplierTierThresholds` properties to player object in `gameState.js`
  - Initialize multiplier to 1.0, kills to 0 for all players
  - Set tier thresholds: [0, 3, 6, 10, 15]
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 2. Create zombie base score constants

  - [x] 2.1 Add zombie score values to `constants.js`


    - Normal: 10, Fast: 15, Armored: 25, Exploding: 20, Ghost: 18, Spitter: 22, Boss: 100
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Implement multiplier calculation logic

  - [x] 3.1 Create `updateScoreMultiplier()` function in `combatUtils.js`


    - Calculate multiplier tier based on consecutiveKills
    - 0-2 kills: 1.0x, 3-5: 2.0x, 6-9: 3.0x, 10-14: 4.0x, 15+: 5.0x
    - Update `maxMultiplierThisSession` if current exceeds it
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.2 Write property test for tier determinism
    - **Property 1: Multiplier tier determinism**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

  - [ ]* 3.3 Write property test for multiplier bounds
    - **Property 6: Multiplier bounds invariant**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**


- [ ] 4. Implement score calculation with multiplier
  - [x] 4.1 Create `awardScore()` function in `combatUtils.js`

    - Calculate finalScore = floor(baseScore × multiplier)
    - Add finalScore to player.score
    - Track bonus = finalScore - baseScore
    - Add bonus to player.totalMultiplierBonus
    - Return finalScore for display
    - _Requirements: 1.1_

  - [ ]* 4.2 Write property test for score calculation
    - **Property 2: Score calculation consistency**
    - **Validates: Requirements 1.1**

  - [ ]* 4.3 Write property test for bonus accumulation
    - **Property 9: Bonus score accumulation**
    - **Validates: Requirements 7.5**


- [ ] 5. Integrate kill tracking with zombie kills
  - [x] 5.1 Modify `handleBulletZombieCollisions()` to track kills


    - Increment `player.consecutiveKills` on zombie death
    - Add +2 bonus for boss zombies (total +3)
    - Store old multiplier value before update
    - Call `updateScoreMultiplier(player)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Award score with multiplier


    - Get base score from zombie type
    - Call `awardScore(player, baseScore, zombieType)`
    - Display damage number with multiplier if > 1.0x
    - _Requirements: 1.1_

  - [ ]* 5.3 Write property test for kill counter monotonicity
    - **Property 5: Kill counter monotonicity**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 5.4 Write property test for tier transition monotonicity
    - **Property 10: Tier transition monotonicity**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 6. Implement multiplier tier-up feedback

  - [x] 6.1 Detect tier increases

    - Compare old multiplier with new multiplier after update
    - If increased, trigger visual and audio feedback
    - _Requirements: 3.1, 4.1_

  - [x] 6.2 Create multiplier-up notification

    - Display floating text showing new multiplier (e.g., "3x MULTIPLIER!")
    - Use DamageNumber class with yellow-gold gradient
    - Position at player location
    - _Requirements: 3.4_

  - [x] 6.3 Add multiplier-up audio feedback


    - Create `playMultiplierUpSound(tier)` in `AudioSystem.js`
    - Higher pitch for higher tiers (400Hz + tier × 100Hz)
    - 0.3 second duration with exponential decay
    - _Requirements: 4.1_

  - [x] 6.4 Add special max multiplier audio

    - Create `playMultiplierMaxSound()` in `AudioSystem.js`
    - Special fanfare for reaching 5x
    - _Requirements: 4.2_

- [x] 7. Implement multiplier reset on damage

  - [x] 7.1 Create `resetMultiplier()` function in `combatUtils.js`

    - Set scoreMultiplier to 1.0
    - Set consecutiveKills to 0
    - Trigger "Multiplier Lost" notification
    - Play negative audio cue
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 7.2 Modify `handlePlayerZombieCollisions()` to reset multiplier


    - Check if player health decreased AND shield is 0
    - Call `resetMultiplier(player)` on damage
    - Preserve multiplier if shield absorbed damage
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 7.3 Handle explosion damage

    - Check for explosion damage in `triggerExplosion()`
    - Reset multiplier if player takes damage
    - _Requirements: 2.3_

  - [x] 7.4 Handle acid pool damage

    - Check for acid pool damage in `AcidPool.update()`
    - Reset multiplier if player takes damage
    - _Requirements: 2.2_

  - [ ]* 7.5 Write property test for multiplier reset
    - **Property 3: Multiplier reset on damage**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 7.6 Write property test for shield protection
    - **Property 4: Shield damage preservation**
    - **Validates: Requirements 2.5**


- [ ] 8. Create HUD multiplier display
  - [x] 8.1 Add `drawMultiplierIndicator()` method to `GameHUD.js`


    - Only display if multiplier > 1.0x
    - Position in top-center or near score display
    - Font: 'bold 24px "Roboto Mono"'
    - _Requirements: 3.1, 3.2_

  - [x] 8.2 Implement color-coded multiplier display

    - Gold (#ffd700) for 5x
    - Orange (#ff9800) for 4x
    - Yellow (#ffeb3b) for 3x
    - Green (#4caf50) for 2x
    - Apply pulsing glow effect (200ms cycle)
    - _Requirements: 3.2, 4.3_

  - [x] 8.3 Add progress bar to next tier


    - Create `drawMultiplierProgress()` helper method
    - Show kills remaining to next tier
    - Display "MAX" when at 5x
    - Horizontal bar below multiplier text
    - _Requirements: 3.3_

- [x] 9. Add multiplier lost feedback

  - [x] 9.1 Create multiplier lost notification

    - Display "MULTIPLIER LOST" floating text in red
    - Position at player location
    - _Requirements: 3.5_

  - [x] 9.2 Add multiplier lost audio

    - Create `playMultiplierLostSound()` in `AudioSystem.js`
    - Negative descending tone
    - _Requirements: 4.5_

- [x] 10. Implement statistics tracking

  - [x] 10.1 Add global multiplier stats to `gameState.js`




    - Add `allTimeMaxMultiplier` property
    - Initialize from localStorage on game start
    - _Requirements: 7.3, 7.4_


  - [x] 10.2 Create stats persistence functions in `gameUtils.js`






    - `saveMultiplierStats()` - Save to localStorage
    - `loadMultiplierStats()` - Load from localStorage
    - Key: 'zombobs_multiplier_stats'
    - _Requirements: 7.3, 7.4_


  - [x] 10.3 Update stats on game over


    - Save maxMultiplierThisSession if it exceeds allTimeMaxMultiplier
    - Call `saveMultiplierStats()` on game over
    - _Requirements: 7.1, 7.3_


  - [x] 10.4 Display stats in game over screen

    - Show "Max Multiplier: Xx" in game over stats
    - Show "Total Bonus Score: X" from multiplier
    - _Requirements: 7.2, 7.5_

  - [x] 10.5 Display all-time best in main menu


    - Show "Best Multiplier: Xx" in main menu
    - Load from localStorage on menu display
    - _Requirements: 7.4_


- [ ] 11. Implement multiplayer support
  - [x] 11.1 Ensure independent multiplier tracking per player

    - Verify each player has own multiplier state
    - Test with 2+ players in local co-op
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.2 Position multiplier display in split-screen


    - Calculate position based on player viewport
    - Render in each player's HUD section
    - _Requirements: 6.4_

  - [ ]* 11.3 Write property test for multiplayer independence
    - **Property 8: Multiplayer independence**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 12. Add helper function for zombie base score


  - [x] 12.1 Create `getZombieBaseScore()` in `combatUtils.js`

    - Return base score based on zombie type
    - Use constants from `constants.js`
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 14. Write unit tests for multiplier system
  - Test tier calculation for all kill ranges
  - Test score calculation with various multipliers
  - Test reset logic (damage vs shield)
  - Test multiplayer independence
  - _Requirements: All_

- [ ]* 15. Write property test for max multiplier tracking
  - **Property 7: Max multiplier tracking**
  - **Validates: Requirements 7.1, 7.2**
