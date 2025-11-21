const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Configure Socket.io with CORS for Hugging Face Spaces
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (you can restrict this to specific domains)
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Support both transports
});

const players = new Map();

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
  io.emit('lobby:update', Array.from(players.values()));
}

function formatPlayerList() {
  if (players.size === 0) return 'none';
  return Array.from(players.values())
    .map((player) => `${player.name}(${player.id.slice(-4)})`)
    .join(', ');
}

// Local server uses port 3000 by default, but allow override via env var
const PORT = process.env.PORT || 3000;

// Serve static files from the parent directory (where index.html is located)
const parentDir = path.join(__dirname, '..');
app.use(express.static(parentDir));

// Root endpoint - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(parentDir, 'index.html'));
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
  const defaultName = `Player-${socket.id.slice(-4)}`;
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

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ CLIENT CONNECTED!`);
  console.log(`   Player: ${defaultName}`);
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Is Leader: ${isFirstPlayer}`);
  console.log(`   Total Players Online: ${players.size}`);
  console.log(`   Active Players: ${formatPlayerList()}`);
  console.log(`${'='.repeat(60)}\n`);
  broadcastLobby();

  // Handle player registration
  socket.on('player:register', (payload = {}) => {
    const rawName = typeof payload.name === 'string' ? payload.name : defaultName;
    const name = rawName.trim().substring(0, 24) || defaultName;
    const current = players.get(socket.id) || { id: socket.id, isReady: false, isLeader: false };
    players.set(socket.id, { ...current, name });
    console.log(
      `[~] ${socket.id} set name to "${name}" | Players online: ${players.size}`
    );
    broadcastLobby();
  });

  // Handle ready toggle
  socket.on('player:ready', () => {
    const player = players.get(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      console.log(
        `[~] ${player.name} ${player.isReady ? 'READY' : 'NOT READY'} | Players online: ${players.size}`
      );
      broadcastLobby();
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
    
    // All checks passed - broadcast game start to all clients
    console.log(`[+] Game starting! All players ready.`);
    io.emit('game:start');
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
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`❌ CLIENT DISCONNECTED`);
    console.log(`   Player: ${displayName}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Was Leader: ${wasLeader}`);
    console.log(`   Remaining Players: ${players.size}`);
    console.log(`   Active Players: ${formatPlayerList()}`);
    console.log(`${'='.repeat(60)}\n`);
    broadcastLobby();
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`✅ Local server is READY and accepting connections`);
  console.log(`\n📊 Connection Status:`);
  console.log(`   - Local Server: http://localhost:${PORT} [READY]`);
  console.log(`   - Waiting for client connections...\n`);
});
