// Multiplayer Frogger Server
// Express + Socket.io server for real-time game state sync

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import type { ClientToServerEvents, ServerToClientEvents } from './types.js';
import { GameState } from './GameState.js';
import { setupEventHandlers } from './events.js';

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, '../../dist');

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
  res.sendFile(path.join(DIST_PATH, 'index.html'));
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
