const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const players = new Map();

function broadcastLobby() {
  io.emit('lobby:update', Array.from(players.values()));
}

function formatPlayerList() {
  if (players.size === 0) return 'none';
  return Array.from(players.values())
    .map((player) => `${player.name}(${player.id.slice(-4)})`)
    .join(', ');
}

const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, '..');

// Serve static files from project root
app.use(express.static(PROJECT_ROOT));

// Basic socket.io setup for multiplayer
io.on('connection', (socket) => {
  const defaultName = `Player-${socket.id.slice(-4)}`;
  players.set(socket.id, { id: socket.id, name: defaultName });

  console.log(
    `[+] ${defaultName} connected (${socket.id}) | Players online: ${players.size}`
  );
  console.log(`    Active players: ${formatPlayerList()}`);
  broadcastLobby();

  socket.on('player:register', (payload = {}) => {
    const rawName = typeof payload.name === 'string' ? payload.name : defaultName;
    const name = rawName.trim().substring(0, 24) || defaultName;
    const current = players.get(socket.id) || { id: socket.id };
    players.set(socket.id, { ...current, name });
    console.log(
      `[~] ${socket.id} set name to "${name}" | Players online: ${players.size}`
    );
    broadcastLobby();
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    players.delete(socket.id);
    const displayName = player?.name || defaultName;
    console.log(
      `[-] ${displayName} disconnected (${socket.id}) | Players online: ${players.size}`
    );
    console.log(`    Active players: ${formatPlayerList()}`);
    broadcastLobby();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
