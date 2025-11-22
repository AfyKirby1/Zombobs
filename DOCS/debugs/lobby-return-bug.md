# Multiplayer Lobby Return Bug Fix

**Date:** 2025-11-22  
**Status:** ✅ Fixed  
**Version:** Unreleased

## Issue Description

When clicking "Back to Lobby" from a dead multiplayer game, the lobby would display a stuck "GO!" countdown screen instead of the normal lobby interface. The countdown overlay would remain visible, blocking interaction with the lobby.

## Root Cause

The `gameState.multiplayer.isGameStarting` flag and `gameStartTime` value were not being reset when returning to the lobby from the game over screen. This caused the lobby's `drawLobby()` method to continue displaying the countdown overlay because it checks `if (gameState.multiplayer.isGameStarting)` before drawing the normal lobby interface.

## Solution

Added explicit state reset in the `gameover_lobby` button handler in `js/main.js`:

```javascript
// Reset multiplayer game starting state to prevent stuck "GO!" screen
gameState.multiplayer.isGameStarting = false;
gameState.multiplayer.gameStartTime = 0;
```

This ensures that when returning to the lobby:
1. The countdown overlay flag is cleared
2. The game start time is reset
3. The normal lobby interface is displayed correctly

## Files Modified

- `js/main.js` - Added state reset in gameover_lobby button handler (lines 1394-1396)

## Testing

To test the fix:
1. Start a multiplayer game
2. Die in the game
3. Click "Back to Lobby" button
4. Verify that the lobby displays normally (no stuck "GO!" screen)

## Related Code

- `js/ui/GameHUD.js` - `drawLobby()` method checks `isGameStarting` flag (line 3021)
- `js/main.js` - `gameover_lobby` button click handler (line 1382)

