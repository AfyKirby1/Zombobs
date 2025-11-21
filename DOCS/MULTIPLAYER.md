# Multiplayer Architecture Documentation

## Overview

The multiplayer system uses Socket.io for real-time communication between clients and a Node.js server. The system implements a lobby-based matchmaking system with leader-based game start synchronization.

## Architecture

### Server-Side (`server/server.js` & `huggingface-space/server.js`)

The server maintains a `Map` of connected players, where each player object contains:
- `id`: Socket.io socket ID
- `name`: Player display name (max 24 characters)
- `isReady`: Boolean indicating if player is ready to start
- `isLeader`: Boolean indicating if player is the lobby leader

#### Key Functions

- `assignLeader()`: Assigns leader status to the first player in the Map. Clears all leader flags first, then assigns to the first player.
- `broadcastLobby()`: Emits `lobby:update` event to all connected clients with the current player list.

#### Socket Events

**Connection (`connection`)**
- Creates player object with default name, `isReady: false`, and `isLeader: true` if first player
- If not first player, calls `assignLeader()` to ensure leader is set
- Broadcasts lobby update

**Player Registration (`player:register`)**
- Updates player name from payload
- Sanitizes name (trim, max 24 chars)
- Broadcasts lobby update

**Ready Toggle (`player:ready`)**
- Toggles `isReady` status for the requesting player
- Broadcasts lobby update

**Game Start (`game:start`)**
- Validates requester is leader
- Validates all players are ready
- If valid, broadcasts `game:start` to all clients
- If invalid, sends `game:start:error` to requester

**Disconnect (`disconnect`)**
- Removes player from Map
- If leader disconnected and players remain, assigns new leader
- Broadcasts lobby update

### Client-Side

#### State Management (`js/core/gameState.js`)

The `gameState.multiplayer` object tracks:
- `connected`: Boolean connection status
- `status`: Connection state string ('connecting' | 'connected' | 'error' | 'disconnected')
- `serverStatus`: Server health status
- `socket`: Socket.io socket instance
- `playerId`: Local player's socket ID
- `players`: Array of all players in lobby (from server)
- `isLeader`: Boolean indicating if local player is leader
- `isReady`: Boolean indicating if local player is ready

#### Network Initialization (`js/main.js`)

**Connection Handler**
- Sets connection status
- Stores player ID
- Resets ready/leader flags
- Emits `player:register` with username

**Lobby Update Handler (`lobby:update`)**
- Updates player list
- Updates local `isLeader` and `isReady` from server data

**Game Start Handler (`game:start`)**
- Receives synchronized game start signal
- Calls `startGame()` to begin gameplay

**Error Handler (`game:start:error`)**
- Logs error message
- Could display error to user in UI

#### UI Rendering (`js/ui/GameHUD.js`)

**Lobby Display (`drawLobby`)**
- Shows connection status
- Displays player list with:
  - Player name and ID suffix
  - 👑 icon for leader
  - ✅ Ready or ❌ Not Ready status
  - Green highlight for local player
- Shows appropriate action buttons:
  - **All Players**: "Ready" / "Unready" toggle button (top position)
  - **Leader Only**: "Start Game" button (middle position, disabled if not all ready)
  - **All Players**: "Back" button (bottom position)

**Button Click Handling (`checkMenuButtonClick`)**
- Detects clicks on lobby buttons
- Returns `'lobby_start'` for leader's start button
- Returns `'lobby_ready'` for ready button (all players)
- Returns `'lobby_back'` for back button

**Click Action Handler (`main.js` mousedown event)**
- `'lobby_start'`: Emits `game:start` to server (leader only)
- `'lobby_ready'`: Emits `player:ready` to server (all players, including leaders)
  - Validates socket exists and is connected before emitting
  - Includes debug logging for troubleshooting
- `'lobby_back'`: Returns to main menu

## Packet Flow

### Player Joins Lobby

1. Client connects to server
2. Server creates player object, assigns leader if first player
3. Server broadcasts `lobby:update` to all clients
4. Client receives update, displays player list

### Player Toggles Ready

1. Player (leader or non-leader) clicks "Ready" button
2. Client validates socket connection
3. Client emits `player:ready` to server
3. Server toggles player's `isReady` flag
4. Server broadcasts `lobby:update` to all clients
5. All clients update UI to show new ready status

### Leader Starts Game

1. Leader clicks "Start Game" button (only enabled when all ready)
2. Client emits `game:start` to server
3. Server validates:
   - Requester is leader
   - All players are ready
4. If valid:
   - Server broadcasts `game:start` to all clients
   - All clients receive signal simultaneously
   - Each client:
     - Sets `gameState.isCoop = true` to enable multiplayer mode
     - Synchronizes players from `gameState.multiplayer.players` to `gameState.players`
     - Creates player entities for each lobby player with correct IDs and names
     - Sets `inputSource` to `'mouse'` for local player, `'remote'` for others
     - Calls `startGame()` to begin gameplay
   - All players join the same game session together
5. If invalid:
   - Server sends `game:start:error` to requester
   - Error is logged (could show UI message)

### Leader Disconnects

1. Leader disconnects
2. Server removes player from Map
3. Server calls `assignLeader()` to assign new leader
4. Server broadcasts `lobby:update` to all clients
5. New leader's UI updates to show "Start Game" button

## Username System

- Username is stored in `gameState.username` (default: 'Survivor')
- Loaded from localStorage via `loadUsername()` before connection
- Sent to server in `player:register` event on connection
- Can be changed via main menu username button
- Persisted to localStorage via `saveUsername()`

## Synchronization Guarantees

- **Leader Assignment**: First player is always leader. On leader disconnect, first remaining player becomes leader.
- **Ready State**: Each player independently toggles ready state. Server validates all ready before allowing game start.
- **Game Start**: Only leader can initiate start. Server validates all ready before broadcasting start signal to all clients simultaneously.
- **State Consistency**: Server is source of truth. All state changes broadcast via `lobby:update` to keep clients synchronized.

## Error Handling

- Connection errors: Client shows "Connecting..." status
- Game start errors: Server sends `game:start:error` with message
- Disconnection: Server reassigns leader if needed, broadcasts update
- Invalid operations: Server validates permissions before processing

## In-Game Synchronization

### Player State Updates
- **Client → Server**: Local player sends position, angle, health, stamina, weapon, and ammo state every frame via `player:state` event
- **Server → Client**: Server broadcasts player state updates to all other clients via `player:state:update` event
- **Client**: Remote players receive state updates and apply them to their local player objects

### Player Actions
- **Client → Server**: Local player sends actions (shoot, melee, reload, grenade, switchWeapon) via `player:action` event
- **Server → Client**: Server broadcasts actions to all other clients via `player:action:update` event
- **Client**: Remote players receive actions and execute them locally (e.g., create bullets, perform melee, etc.)

### Remote Player Handling
- Remote players have `inputSource: 'remote'` and skip local input handling
- Remote players are updated via socket events only
- Remote player actions are executed locally but triggered by network events

## Future Enhancements

- Room/Game session management (multiple concurrent games)
- Player limit enforcement
- Spectator mode
- Reconnection handling (resume ready state)
- Lag compensation and interpolation for smoother movement
- Client-side prediction for local player

