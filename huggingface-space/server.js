const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const packageJson = require('./package.json');

const app = express();
const httpServer = createServer(app);

// Trust proxy (Hugging Face Spaces uses reverse proxy)
app.set('trust proxy', true);

// Add Express CORS middleware for all HTTP requests (including Socket.io polling)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure Socket.io with CORS for Hugging Face Spaces
// Hugging Face Spaces uses a reverse proxy, so we need specific configuration
const io = new Server(httpServer, {
  path: '/socket.io/', // Explicit path for Socket.io endpoint
  cors: {
    origin: "*", // Allow all origins (you can restrict this to specific domains)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: false // Set to false when origin is "*"
  },
  transports: ['polling', 'websocket'], // Support both transports (polling first for compatibility)
  allowEIO3: true, // Allow Engine.IO v3 clients (for compatibility)
  pingTimeout: 60000, // Increase timeout for slower connections
  pingInterval: 25000, // Standard ping interval
  maxHttpBufferSize: 1e6 // 1MB max message size
});

const players = new Map();
const recentEvents = [];

function logEvent(message) {
  const timestamp = new Date().toLocaleTimeString();
  recentEvents.unshift(`[${timestamp}] ${message}`);
  if (recentEvents.length > 10) recentEvents.pop();
}

function assignLeader() {
  // Assign leader to first player in Map
  if (players.size === 0) return;

  // Clear all leader flags
  players.forEach((player) => {
    player.isLeader = false;
  });

  // Assign to first player
  const firstPlayerId = Array.from(players.keys())[0];
  const firstPlayer = players.get(firstPlayerId);
  if (firstPlayer) {
    firstPlayer.isLeader = true;
  }
}

function broadcastLobby() {
  const playerList = Array.from(players.values());
  console.log(`[broadcastLobby] Broadcasting lobby update to all clients`);
  console.log(`[broadcastLobby] Player count: ${playerList.length}`);
  console.log(`[broadcastLobby] Players:`, playerList.map(p => ({
    id: p.id,
    name: p.name,
    isReady: p.isReady,
    isLeader: p.isLeader
  })));

  try {
    io.emit('lobby:update', playerList);
    console.log(`[broadcastLobby] Successfully emitted lobby:update event`);
  } catch (error) {
    console.error(`[broadcastLobby] ERROR emitting lobby:update:`, error);
    console.error(`[broadcastLobby] Error stack:`, error.stack);
    throw error;
  }
}

function formatPlayerList() {
  if (players.size === 0) return 'none';
  return Array.from(players.values())
    .map((player) => `${player.name}(${player.id.slice(-4)})`)
    .join(', ');
}

// Hugging Face Spaces uses port 7860, but allow override via env var
const PORT = process.env.PORT || 7860;

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatMemory(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// Root endpoint - serve a simple HTML page
app.get('/', (req, res) => {
  const uptime = formatUptime(process.uptime());
  const memoryMB = formatMemory(process.memoryUsage().heapUsed);
  const version = packageJson.version;
  const eventsHTML = recentEvents.length > 0
    ? recentEvents.map(event => `<li>${event}</li>`).join('')
    : '<li><em>No recent activity... yet.</em></li>';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="10">
      <title>Zombobs Server - Apocalypse Status</title>
      <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #0f0f0f;
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8)),
            url('data:image/svg+xml;utf8,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%232a0a0a" fill-opacity="0.4"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"/%3E%3C/g%3E%3C/svg%3E');
          color: #dcdcdc;
          text-align: center;
        }

        h1 { 
          font-family: 'Creepster', cursive;
          color: #ff4444;
          font-size: 4em;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 2px 2px 0px #000;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }

        .subtitle {
          font-family: 'Creepster', cursive;
          color: #88ff88;
          font-size: 1.8em;
          margin-bottom: 40px;
          opacity: 0.9;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
        }

        .play-section {
          margin: 40px 0;
        }

        .play-button {
          display: inline-block;
          background: linear-gradient(180deg, #ff4444 0%, #cc0000 100%);
          color: #fff;
          padding: 20px 60px;
          font-family: 'Creepster', cursive;
          font-size: 2.5em;
          text-decoration: none;
          border-radius: 8px;
          border: 2px solid #500;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
          text-shadow: 2px 2px 0 #500;
        }

        .play-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.2);
          background: linear-gradient(180deg, #ff5555 0%, #dd0000 100%);
        }

        .play-button:active {
          transform: scale(0.98);
        }

        .stats-container {
          background: rgba(20, 20, 20, 0.8);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 25px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
        }

        .status-indicator {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          border-radius: 20px;
          font-weight: bold;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); opacity: 1; }
          50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); opacity: 0.8; }
          100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); opacity: 1; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: #252525;
          padding: 20px;
          border-radius: 8px;
          border-top: 3px solid #888;
          text-align: left;
        }

        .stat-card.online { border-color: #00ff00; }
        .stat-card.uptime { border-color: #ffaa00; }
        .stat-card.version { border-color: #00aaff; }

        .stat-label {
          font-size: 0.8em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #fff;
          font-family: 'Courier New', monospace;
        }

        .activity-log {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          text-align: left;
        }

        .activity-log h3 {
          margin-top: 0;
          color: #ff4444;
          font-family: 'Creepster', cursive;
          letter-spacing: 1px;
          font-size: 1.4em;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .activity-log ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .activity-log li {
          padding: 8px 0;
          border-bottom: 1px solid #2a2a2a;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: #bbb;
        }

        .activity-log li:last-child {
          border-bottom: none;
        }

        .footer {
          margin-top: 40px;
          color: #555;
          font-size: 0.8em;
        }
        
        .port-info {
            color: #444;
            margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <h1>🧟 Zombobs Server 🧟</h1>
      <div class="subtitle">The Horde Awaits...</div>

      <div class="play-section">
        <a href="https://otterdays.itch.io/zombobs" target="_blank" rel="noopener noreferrer" class="play-button">
          PLAY NOW!
        </a>
      </div>

      <div class="stats-container">
        <div class="status-indicator">● Server Online</div>

        <div class="stats-grid">
          <div class="stat-card online">
            <div class="stat-label">Survivors Online</div>
            <div class="stat-value">${players.size}</div>
          </div>
          <div class="stat-card uptime">
            <div class="stat-label">Time Since Outbreak</div>
            <div class="stat-value">${uptime}</div>
          </div>
          <div class="stat-card version">
            <div class="stat-label">Server Version</div>
            <div class="stat-value">v${version}</div>
          </div>
        </div>

        <div class="activity-log">
          <h3>Radio Chatter</h3>
          <ul>
            ${eventsHTML}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Server auto-refreshes every 10 seconds</p>
        <p class="port-info">Port: ${PORT} • Memory: ${memoryMB} MB</p>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint for Hugging Face
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const defaultName = `Survivor-${socket.id.slice(-4)}`;
  const isFirstPlayer = players.size === 0;

  players.set(socket.id, {
    id: socket.id,
    name: defaultName,
    isReady: false,
    isLeader: isFirstPlayer
  });

  // If not first player, ensure leader is assigned
  if (!isFirstPlayer) {
    assignLeader();
  }

  console.log(
    `[+] ${defaultName} connected (${socket.id}) | Players online: ${players.size}`
  );
  console.log(`    Is Leader: ${isFirstPlayer}`);
  console.log(`    Active players: ${formatPlayerList()}`);
  logEvent(`${defaultName} joined the fight`);
  broadcastLobby();

  // Handle player registration
  socket.on('player:register', (payload = {}) => {
    // Basic name sanitization (trim & length limit)
    const rawName = typeof payload.name === 'string' ? payload.name : defaultName;
    const name = rawName.trim().substring(0, 24) || defaultName;

    const current = players.get(socket.id) || { id: socket.id, isReady: false, isLeader: false };
    players.set(socket.id, { ...current, name });

    console.log(
      `[~] ${socket.id} set name to "${name}" | Players online: ${players.size}`
    );
    logEvent(`${name} updated their ID tag`);
    broadcastLobby();
  });

  // Handle ready toggle
  socket.on('player:ready', () => {
    try {
      console.log(`[player:ready] Event received from socket.id: ${socket.id}`);
      console.log(`[player:ready] Current players in Map: ${players.size}`);
      console.log(`[player:ready] Player IDs in Map:`, Array.from(players.keys()));

      const player = players.get(socket.id);
      if (player) {
        const oldReadyState = player.isReady;
        console.log(`[player:ready] Player found: ${player.name}, current ready state: ${oldReadyState}`);

        player.isReady = !player.isReady;
        const newReadyState = player.isReady;

        console.log(
          `[~] ${player.name} ${player.isReady ? 'READY' : 'NOT READY'} | Players online: ${players.size}`
        );
        console.log(`[player:ready] State changed: ${oldReadyState} -> ${newReadyState}`);

        logEvent(`${player.name} ${player.isReady ? 'is ready' : 'is not ready'}`);

        try {
          console.log(`[player:ready] Calling broadcastLobby()...`);
          broadcastLobby();
          console.log(`[player:ready] broadcastLobby() completed successfully`);
        } catch (error) {
          console.error(`[player:ready] ERROR in broadcastLobby():`, error);
          console.error(`[player:ready] Error stack:`, error.stack);
          throw error; // Re-throw to be caught by outer try-catch
        }
      } else {
        console.error(`[player:ready] ERROR: Player not found in Map for socket.id: ${socket.id}`);
        console.error(`[player:ready] Available socket IDs:`, Array.from(players.keys()));
        console.error(`[player:ready] This may indicate a disconnect or connection issue`);
        // Emit error back to client for debugging
        socket.emit('player:ready:error', {
          message: 'Player not found in server Map',
          socketId: socket.id,
          availablePlayers: Array.from(players.keys())
        });
      }
    } catch (error) {
      console.error(`[player:ready] UNEXPECTED ERROR in handler:`, error);
      console.error(`[player:ready] Error stack:`, error.stack);
      // Emit error back to client
      socket.emit('player:ready:error', {
        message: 'Server error processing ready toggle',
        error: error.message
      });
    }
  });

  // Handle game start request (leader only)
  socket.on('game:start', () => {
    const player = players.get(socket.id);
    if (!player) return;

    // Check if requester is leader
    if (!player.isLeader) {
      console.log(`[!] Non-leader ${player.name} attempted to start game`);
      socket.emit('game:start:error', { message: 'Only the lobby leader can start the game' });
      return;
    }

    // Check if all players are ready
    const allReady = Array.from(players.values()).every(p => p.isReady);
    if (!allReady) {
      console.log(`[!] Leader ${player.name} attempted to start game but not all players ready`);
      socket.emit('game:start:error', { message: 'All players must be ready to start' });
      return;
    }

    // All checks passed - broadcast game starting countdown
    console.log(`[+] Leader ${player.name} initiated game start. Countdown starting...`);

    // Broadcast countdown start (3 seconds)
    const countdownDuration = 3000;
    const startTime = Date.now() + countdownDuration;

    io.emit('game:starting', {
      startTime: startTime,
      duration: countdownDuration
    });

    // Set timeout to actually start the game
    setTimeout(() => {
      console.log(`[+] Game starting! All players ready.`);
      logEvent('Game starting - all survivors ready!');
      io.emit('game:start');
    }, countdownDuration);
  });

  // Handle player state updates (position, angle, actions)
  socket.on('player:state', (state) => {
    const player = players.get(socket.id);
    if (!player) return;

    // Broadcast player state to all other clients
    socket.broadcast.emit('player:state:update', {
      playerId: socket.id,
      ...state
    });
  });

  // Handle player action (shooting, melee, etc.)
  socket.on('player:action', (action) => {
    const player = players.get(socket.id);
    if (!player) return;

    // Broadcast action to all other clients
    socket.broadcast.emit('player:action:update', {
      playerId: socket.id,
      ...action
    });
  });

  // --- Zombie Synchronization ---

  // Handle zombie spawns (Leader only)
  socket.on('zombie:spawn', (data) => {
    // Broadcast to all others
    socket.broadcast.emit('zombie:spawn', data);
  });

  // Handle zombie updates (Leader only)
  socket.on('zombie:update', (data) => {
    // Volatile broadcast for frequent position updates (can be dropped)
    socket.broadcast.volatile.emit('zombie:update', data);
  });

  // Handle zombie hit/damage
  socket.on('zombie:hit', (data) => {
    socket.broadcast.emit('zombie:hit', data);
  });

  // Handle zombie death
  socket.on('zombie:die', (data) => {
    socket.broadcast.emit('zombie:die', data);
  });

  // --- Game State Synchronization ---

  // Handle XP gain
  socket.on('game:xp', (amount) => {
    socket.broadcast.emit('game:xp', amount);
  });

  // Handle Level Up event (if shared)
  socket.on('game:levelup', (data) => {
    socket.broadcast.emit('game:levelup', data);
  });

  // Handle Skill Selection
  socket.on('game:skill', (skillId) => {
    socket.broadcast.emit('game:skill', skillId);
  });

  // Handle Game Pause
  socket.on('game:pause', () => {
    socket.broadcast.emit('game:pause');
  });

  // Handle Game Resume
  socket.on('game:resume', () => {
    socket.broadcast.emit('game:resume');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    const wasLeader = player?.isLeader || false;
    players.delete(socket.id);

    const displayName = player?.name || defaultName;

    // If leader disconnected, assign new leader
    if (wasLeader && players.size > 0) {
      assignLeader();
      console.log(`[~] New leader assigned after ${displayName} disconnected`);
      logEvent(`New leader assigned after ${displayName} left`);
    }

    console.log(
      `[-] ${displayName} disconnected (${socket.id}) | Players online: ${players.size}`
    );
    console.log(`    Was Leader: ${wasLeader}`);
    console.log(`    Active players: ${formatPlayerList()}`);
    logEvent(`${displayName} was lost to the horde`);
    broadcastLobby();

    // Notify other clients that this player disconnected
    socket.broadcast.emit('player:disconnected', { playerId: socket.id });
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[!] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[!] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server with error handling
try {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Zombobs Server running on port ${PORT}`);
    console.log(`🧟 The horde is approaching...`);
  });

  httpServer.on('error', (error) => {
    console.error('[!] Server error:', error);
  });
} catch (error) {
  console.error('[!] Failed to start server:', error);
  process.exit(1);
}
