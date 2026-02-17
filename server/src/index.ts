// Multiplayer Frogger Server
// Express + Socket.io server for real-time game state sync

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './types.js';
import { GameState } from './GameState.js';
import { setupEventHandlers } from './events.js';

const PORT = process.env.PORT || 3001;

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Create Socket.io server with CORS for local dev
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
