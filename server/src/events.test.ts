import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupEventHandlers, resetColorIndex } from './events.js';
import { GameState } from './GameState.js';
import { PLAYER_COLORS } from '../../shared/types.js';

// Mock socket factory
function createMockSocket(id: string) {
  const handlers: Record<string, Function> = {};

  return {
    id,
    on: vi.fn((event: string, handler: Function) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
    broadcast: {
      emit: vi.fn(),
    },
    // Helper to trigger events
    _trigger: (event: string, payload?: any) => {
      if (handlers[event]) {
        handlers[event](payload);
      }
    },
    _handlers: handlers,
  };
}

// Mock io factory
function createMockIo() {
  let connectionHandler: Function | null = null;

  return {
    on: vi.fn((event: string, handler: Function) => {
      if (event === 'connection') {
        connectionHandler = handler;
      }
    }),
    emit: vi.fn(),
    // Helper to simulate connection
    _simulateConnection: (socket: any) => {
      if (connectionHandler) {
        connectionHandler(socket);
      }
    },
  };
}

describe('Event Handlers', () => {
  let mockIo: ReturnType<typeof createMockIo>;
  let gameState: GameState;

  beforeEach(() => {
    resetColorIndex();
    mockIo = createMockIo();
    gameState = new GameState();
    setupEventHandlers(mockIo as any, gameState);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Connection', () => {
    it('registers connection handler', () => {
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('Join Event', () => {
    it('adds player to game state', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);

      socket._trigger('join', { name: 'TestPlayer' });

      const player = gameState.getPlayer('socket-1');
      expect(player).toBeDefined();
      expect(player!.name).toBe('TestPlayer');
    });

    it('assigns default name when none provided', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);

      socket._trigger('join', {});

      const player = gameState.getPlayer('socket-1');
      expect(player!.name).toBe('Player sock');
    });

    it('sends welcome event to joining player', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);

      socket._trigger('join', { name: 'TestPlayer' });

      expect(socket.emit).toHaveBeenCalledWith('welcome', {
        playerId: 'socket-1',
        color: expect.any(Number),
        players: expect.any(Array),
        lanes: expect.any(Array),
      });
    });

    it('broadcasts playerJoined to other players', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);

      socket._trigger('join', { name: 'TestPlayer' });

      expect(socket.broadcast.emit).toHaveBeenCalledWith('playerJoined', {
        playerId: 'socket-1',
        color: expect.any(Number),
        name: 'TestPlayer',
      });
    });

    it('cycles through player colors', () => {
      const colors: number[] = [];

      for (let i = 0; i < PLAYER_COLORS.length + 2; i++) {
        const socket = createMockSocket(`socket-${i}`);
        mockIo._simulateConnection(socket);
        socket._trigger('join', { name: `Player${i}` });

        const welcomeCall = (socket.emit as any).mock.calls.find(
          (call: any) => call[0] === 'welcome'
        );
        colors.push(welcomeCall[1].color);
      }

      // First colors should match palette
      for (let i = 0; i < PLAYER_COLORS.length; i++) {
        expect(colors[i]).toBe(PLAYER_COLORS[i]);
      }

      // Should cycle back
      expect(colors[PLAYER_COLORS.length]).toBe(PLAYER_COLORS[0]);
    });
  });

  describe('Move Event', () => {
    it('updates player position in game state', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('move', { x: 5, y: 15 });

      const player = gameState.getPlayer('socket-1');
      expect(player!.position).toEqual({ x: 5, y: 15 });
    });

    it('broadcasts playerMoved to other players', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('move', { x: 5, y: 15 });

      expect(socket.broadcast.emit).toHaveBeenCalledWith('playerMoved', {
        playerId: 'socket-1',
        x: 5,
        y: 15,
      });
    });
  });

  describe('Death Event', () => {
    it('sets player as not alive', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('death', { cause: 'car' });

      const player = gameState.getPlayer('socket-1');
      expect(player!.isAlive).toBe(false);
    });

    it('broadcasts playerDied to other players', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('death', { cause: 'car' });

      expect(socket.broadcast.emit).toHaveBeenCalledWith('playerDied', {
        playerId: 'socket-1',
      });
    });

    it('resets player position after 1 second delay', () => {
      vi.useFakeTimers();
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      // Move player away from spawn
      gameState.updatePlayerPosition('socket-1', { x: 5, y: 10 });

      socket._trigger('death', { cause: 'car' });

      // Before delay
      let player = gameState.getPlayer('socket-1');
      expect(player!.position).toEqual({ x: 5, y: 10 });
      expect(player!.isAlive).toBe(false);

      // After delay
      vi.advanceTimersByTime(1000);

      player = gameState.getPlayer('socket-1');
      expect(player!.position).toEqual({ x: 10, y: 19 });
      expect(player!.isAlive).toBe(true);
    });

    it('handles death when player has disconnected', () => {
      vi.useFakeTimers();
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('death', { cause: 'car' });

      // Remove player before timeout fires
      gameState.removePlayer('socket-1');

      // Should not throw
      expect(() => {
        vi.advanceTimersByTime(1000);
      }).not.toThrow();
    });
  });

  describe('Victory Event', () => {
    it('broadcasts playerWon to all players', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('victory');

      expect(mockIo.emit).toHaveBeenCalledWith('playerWon', {
        playerId: 'socket-1',
      });
    });
  });

  describe('Disconnect', () => {
    it('removes player from game state', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      expect(gameState.getPlayer('socket-1')).toBeDefined();

      socket._trigger('disconnect');

      expect(gameState.getPlayer('socket-1')).toBeUndefined();
    });

    it('broadcasts playerLeft to remaining players', () => {
      const socket = createMockSocket('socket-1');
      mockIo._simulateConnection(socket);
      socket._trigger('join', { name: 'TestPlayer' });

      socket._trigger('disconnect');

      expect(socket.broadcast.emit).toHaveBeenCalledWith('playerLeft', {
        playerId: 'socket-1',
      });
    });
  });

  describe('Multiple Players', () => {
    it('handles multiple simultaneous players', () => {
      const socket1 = createMockSocket('socket-1');
      const socket2 = createMockSocket('socket-2');

      mockIo._simulateConnection(socket1);
      mockIo._simulateConnection(socket2);

      socket1._trigger('join', { name: 'Player1' });
      socket2._trigger('join', { name: 'Player2' });

      expect(gameState.getPlayers()).toHaveLength(2);

      // Player 2's welcome should include Player 1
      const welcomeCall = (socket2.emit as any).mock.calls.find(
        (call: any) => call[0] === 'welcome'
      );
      expect(welcomeCall[1].players).toHaveLength(2);
    });

    it('broadcasts moves between players', () => {
      const socket1 = createMockSocket('socket-1');
      const socket2 = createMockSocket('socket-2');

      mockIo._simulateConnection(socket1);
      mockIo._simulateConnection(socket2);

      socket1._trigger('join', { name: 'Player1' });
      socket2._trigger('join', { name: 'Player2' });

      socket1._trigger('move', { x: 3, y: 18 });

      expect(socket1.broadcast.emit).toHaveBeenCalledWith('playerMoved', {
        playerId: 'socket-1',
        x: 3,
        y: 18,
      });
    });
  });
});
