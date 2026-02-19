// Multiplayer Frogger Server
// Express + Socket.io server for real-time game state sync

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types.js';
import { GameState } from './GameState.js';
import { setupEventHandlers } from './events.js';

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, '../../../../dist');

console.log('__dirname:', __dirname);
console.log('DIST_PATH:', DIST_PATH);
console.log('DIST_PATH exists:', fs.existsSync(DIST_PATH));
if (fs.existsSync(DIST_PATH)) {
  console.log('DIST_PATH contents:', fs.readdirSync(DIST_PATH));
} else {
  console.log('Checking parent directories...');
  const parent = path.dirname(DIST_PATH);
  console.log('Parent dir:', parent, 'exists:', fs.existsSync(parent));
  if (fs.existsSync(parent)) {
    console.log('Parent contents:', fs.readdirSync(parent));
  }
}

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Create Socket.io server with CORS
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://fractal-frogger.onrender.com',
    ],
    methods: ['GET', 'POST'],
  },
});

// Create game state
const gameState = new GameState();

// Setup socket event handlers
setupEventHandlers(io, gameState);

// Start the game tick loop
gameState.startTickLoop(io);

// Simple health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', players: gameState.getPlayers().length });
});

// Serve static frontend files in production
app.use(express.static(DIST_PATH));

// SPA fallback - serve index.html for all other routes
app.get('*', (_req, res) => {
  const indexPath = path.join(DIST_PATH, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Frogger server running on port ${PORT}`);
  console.log(`WebSocket ready for connections`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  gameState.stopTickLoop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
