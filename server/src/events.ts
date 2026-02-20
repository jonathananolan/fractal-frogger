// Socket event handlers for multiplayer Frogger

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

    // Handle join event
    socket.on('join', ({ name }) => {
      const playerName = name || `Player ${socket.id.slice(0, 4)}`;
      const color = getNextColor();
      const player = gameState.addPlayer(socket.id, playerName, color);

      console.log(`Player joined: ${playerName} (${socket.id})`);

      // Send welcome to joining player with current state
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
    });

    // Handle input event — server now owns frog movement
    socket.on('input', ({ direction }) => {
      gameState.queueInput(socket.id, direction);
    });

    // Deprecated: server now owns frog position/lifecycle. Kept as no-ops so old clients don't error.
    socket.on('move', () => {});
    socket.on('death', () => {});
    socket.on('victory', () => {});

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      gameState.removePlayer(socket.id);

      // Broadcast to remaining players
      socket.broadcast.emit('playerLeft', {
        playerId: socket.id,
      });
    });
  });
}
