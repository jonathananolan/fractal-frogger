// Socket event handlers for multiplayer Frogger
// Server is a pure relay — client owns all player physics

import type { Server, Socket } from 'socket.io';
import { GameState } from './GameState.js';
import { ClientToServerEvents, PLAYER_COLORS, ServerToClientEvents } from '../../shared/types.js';

let colorIndex = 0;

function getNextColor(): number {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  colorIndex++;
  return color;
}

// For testing - resets the color index
export function resetColorIndex(): void {
  colorIndex = 0;
}

export function setupEventHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  gameState: GameState,
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join', ({ name }) => {
      const playerName = name || `Player ${socket.id.slice(0, 4)}`;
      const color = getNextColor();
      gameState.addPlayer(socket.id, playerName, color);

      console.log(`Player joined: ${playerName} (${socket.id})`);

      // Send welcome with current state
      socket.emit('welcome', {
        playerId: socket.id,
        color,
        players: gameState.getPlayers(),
        lanes: gameState.getLanes(),
      });

      // Broadcast new player to others
      socket.broadcast.emit('playerJoined', {
        playerId: socket.id,
        color,
        name: playerName,
      });

      io.emit('leaderboard', { players: gameState.getLeaderboard() });
    });

    // Client moved — store and rebroadcast
    socket.on('move', ({ x, y }) => {
      gameState.updatePlayerPosition(socket.id, { x, y });
      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        x,
        y,
      });
    });

    // Client died — store and rebroadcast
    socket.on('death', ({ cause }) => {
      console.log(`Player died: ${socket.id} (${cause})`);
      gameState.setPlayerAlive(socket.id, false);
      socket.broadcast.emit('playerDied', { playerId: socket.id });
    });

    // Client won — rebroadcast
    socket.on('victory', () => {
      console.log(`Player won: ${socket.id}`);
      gameState.setPlayerAlive(socket.id, true);
      io.emit('playerWon', { playerId: socket.id });
    });

    // Client score update — store and rebroadcast leaderboard
    socket.on('scoreUpdate', ({ score }) => {
      gameState.updatePlayerScore(socket.id, score);
      io.emit('leaderboard', { players: gameState.getLeaderboard() });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      gameState.removePlayer(socket.id);

      socket.broadcast.emit('playerLeft', { playerId: socket.id });
      io.emit('leaderboard', { players: gameState.getLeaderboard() });
    });
  });
}
