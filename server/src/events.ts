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

    // Handle move event
    socket.on('move', ({ x, y }) => {
      gameState.updatePlayerPosition(socket.id, { x, y });

      // Broadcast to all other players
      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        x,
        y,
      });
    });

    // Handle death event
    socket.on('death', ({ cause }) => {
      console.log(`Player died: ${socket.id} (${cause})`);
      gameState.setPlayerAlive(socket.id, false);

      // Broadcast to all other players
      socket.broadcast.emit('playerDied', {
        playerId: socket.id,
      });

      // Reset player position after brief delay
      setTimeout(() => {
        const player = gameState.getPlayer(socket.id);
        if (player) {
          player.isAlive = true;
          player.position = { x: 10, y: 19 };
        }
      }, 1000);
    });

    // Handle victory event
    socket.on('victory', () => {
      console.log(`Player won: ${socket.id}`);

      // Broadcast to all players
      io.emit('playerWon', {
        playerId: socket.id,
      });
    });

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
