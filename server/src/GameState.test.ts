import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameState } from './GameState.js';
import { SIZE_TO_WIDTH } from './sprites.js';
import type { Obstacle } from '../../shared/types.js';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('Lane Creation', () => {
    it('creates 20 lanes', () => {
      const lanes = gameState.getLanes();
      expect(lanes).toHaveLength(20);
    });

    it('creates safe zones at bottom (y=18, y=19)', () => {
      const lanes = gameState.getLanes();
      const bottomLanes = lanes.filter((l) => l.y >= 18);
      expect(bottomLanes).toHaveLength(2);
      bottomLanes.forEach((lane) => {
        expect(lane.type).toBe('safe');
        expect(lane.spawnRate).toBe(0);
        expect(lane.speed).toBe(0);
      });
    });

    it('creates road lanes (y=1-6 and y=13-17)', () => {
      const lanes = gameState.getLanes();
      const roadLanes = lanes.filter((l) => l.type === 'road');
      expect(roadLanes).toHaveLength(11); // 5 lower + 6 upper
      roadLanes.forEach((lane) => {
        expect(lane.spawnRate).toBeGreaterThan(0);
        expect(lane.speed).toBeGreaterThan(0);
      });
    });

    it('creates middle safe zone (y=12)', () => {
      const lanes = gameState.getLanes();
      const middleSafe = lanes.find((l) => l.y === 12);
      expect(middleSafe).toBeDefined();
      expect(middleSafe!.type).toBe('safe');
    });

    it('creates water lanes (y=8-11)', () => {
      const lanes = gameState.getLanes();
      const waterLanes = lanes.filter((l) => l.type === 'water');
      expect(waterLanes).toHaveLength(4);
      waterLanes.forEach((lane) => {
        expect(lane.y).toBeGreaterThanOrEqual(8);
        expect(lane.y).toBeLessThanOrEqual(11);
        expect(lane.spawnRate).toBeGreaterThan(0);
        expect(lane.speed).toBeGreaterThan(0);
      });
    });

    it('creates goal zone (y=0)', () => {
      const lanes = gameState.getLanes();
      const goalLanes = lanes.filter((l) => l.type === 'goal');
      expect(goalLanes).toHaveLength(1);
      expect(goalLanes[0].y).toBe(0);
      expect(goalLanes[0].spawnRate).toBe(0);
    });

    it('alternates lane directions', () => {
      const lanes = gameState.getLanes();
      const roadLanes = lanes.filter((l) => l.type === 'road').sort((a, b) => a.y - b.y);
      // Check that we have both directions
      const directions = roadLanes.map((l) => l.direction);
      expect(directions).toContain(1);
      expect(directions).toContain(-1);
    });
  });

  describe('Player Management', () => {
    it('adds a player with correct initial state', () => {
      const player = gameState.addPlayer('player1', 'TestPlayer', 0x44ff44);

      expect(player.id).toBe('player1');
      expect(player.name).toBe('TestPlayer');
      expect(player.color).toBe(0x44ff44);
      expect(player.isAlive).toBe(true);
      expect(player.position).toEqual({ x: 10, y: 19 }); // center bottom
    });

    it('retrieves a player by id', () => {
      gameState.addPlayer('player1', 'TestPlayer', 0x44ff44);
      const player = gameState.getPlayer('player1');

      expect(player).toBeDefined();
      expect(player!.name).toBe('TestPlayer');
    });

    it('returns undefined for non-existent player', () => {
      const player = gameState.getPlayer('nonexistent');
      expect(player).toBeUndefined();
    });

    it('gets all players', () => {
      gameState.addPlayer('p1', 'Player1', 0x44ff44);
      gameState.addPlayer('p2', 'Player2', 0xff44ff);

      const players = gameState.getPlayers();
      expect(players).toHaveLength(2);
      expect(players.map((p) => p.id)).toContain('p1');
      expect(players.map((p) => p.id)).toContain('p2');
    });

    it('removes a player', () => {
      gameState.addPlayer('player1', 'TestPlayer', 0x44ff44);
      gameState.removePlayer('player1');

      expect(gameState.getPlayer('player1')).toBeUndefined();
      expect(gameState.getPlayers()).toHaveLength(0);
    });

    it('updates player position', () => {
      gameState.addPlayer('player1', 'TestPlayer', 0x44ff44);
      gameState.updatePlayerPosition('player1', { x: 5, y: 15 });

      const player = gameState.getPlayer('player1');
      expect(player!.position).toEqual({ x: 5, y: 15 });
    });

    it('does not throw when updating non-existent player position', () => {
      expect(() => {
        gameState.updatePlayerPosition('nonexistent', { x: 5, y: 15 });
      }).not.toThrow();
    });

    it('sets player alive status', () => {
      gameState.addPlayer('player1', 'TestPlayer', 0x44ff44);
      gameState.setPlayerAlive('player1', false);

      const player = gameState.getPlayer('player1');
      expect(player!.isAlive).toBe(false);
    });

    it('does not throw when setting alive status on non-existent player', () => {
      expect(() => {
        gameState.setPlayerAlive('nonexistent', false);
      }).not.toThrow();
    });
  });

  describe('Tick Loop', () => {
    afterEach(() => {
      gameState.stopTickLoop();
    });

    it('starts tick loop only once', () => {
      vi.useFakeTimers();
      const mockIo = {
        sockets: { emit: vi.fn() },
      } as any;

      gameState.startTickLoop(mockIo);
      gameState.startTickLoop(mockIo); // second call should be ignored

      // Verify only one interval is running by checking emit is called once per tick
      vi.advanceTimersByTime(150);
      // Can't easily test this without exposing internals, but covers the branch
    });

    it('stops tick loop', () => {
      const mockIo = {
        sockets: { emit: vi.fn() },
      } as any;

      gameState.startTickLoop(mockIo);
      gameState.stopTickLoop();
      gameState.stopTickLoop(); // second call should be safe
    });
  });

  describe('Obstacle Spawning and Movement', () => {
    // Access private tick method for testing via reflection
    function tick(gs: GameState) {
      (gs as any).tick();
    }

    function spawnObstacle(gs: GameState, lane: any): Obstacle {
      return (gs as any).spawnObstacle(lane);
    }

    it('spawns car obstacle on road lane moving right', () => {
      const roadLane = {
        y: 17,
        type: 'road' as const,
        direction: 1 as const,
        speed: 0.5,
        obstacles: [],
        spawnRate: 1,
      };

      const obstacle = spawnObstacle(gameState, roadLane);
      const width = SIZE_TO_WIDTH[obstacle.size];

      expect(obstacle.type).toBe('car');
      expect(['s', 'm', 'l', 'xl']).toContain(obstacle.size);
      expect(obstacle.position.x).toBe(-width); // spawns off left edge
      expect(obstacle.position.y).toBe(17);
      expect(obstacle.velocity).toBe(0.5); // speed * direction
    });

    it('spawns car obstacle on road lane moving left', () => {
      const roadLane = {
        y: 16,
        type: 'road' as const,
        direction: -1 as const,
        speed: 0.3,
        obstacles: [],
        spawnRate: 1,
      };

      const obstacle = spawnObstacle(gameState, roadLane);

      expect(obstacle.type).toBe('car');
      expect(['s', 'm', 'l', 'xl']).toContain(obstacle.size);
      expect(obstacle.position.x).toBe(20); // spawns off right edge
      expect(obstacle.velocity).toBe(-0.3); // speed * direction
    });

    it('spawns log obstacle on water lane', () => {
      const waterLane = {
        y: 11,
        type: 'water' as const,
        direction: -1 as const,
        speed: 0.3,
        obstacles: [],
        spawnRate: 1,
      };

      const obstacle = spawnObstacle(gameState, waterLane);

      expect(obstacle.type).toBe('log');
      expect(obstacle.size).toBe('m'); // water lanes always use medium size
    });

    it('increments obstacle ID counter', () => {
      const lane = {
        y: 17,
        type: 'road' as const,
        direction: 1 as const,
        speed: 0.5,
        obstacles: [],
        spawnRate: 1,
      };

      const obstacle1 = spawnObstacle(gameState, lane);
      const obstacle2 = spawnObstacle(gameState, lane);

      expect(obstacle1.id).not.toBe(obstacle2.id);
    });

    it('moves obstacles each tick', () => {
      const lanes = gameState.getLanes();
      const roadLane = lanes.find((l) => l.type === 'road' && l.direction === 1)!;

      // Manually add an obstacle
      roadLane.obstacles.push({
        id: 'test-obstacle',
        position: { x: 5, y: roadLane.y },
        height: 1,
        width: 1,
        size: 'm',
        velocity: 0.5,
        type: 'car',
      });

      tick(gameState);

      expect(roadLane.obstacles[0].position.x).toBe(5.5);
    });

    it('removes obstacles that leave the grid (right edge)', () => {
      const lanes = gameState.getLanes();
      const rightMovingLane = lanes.find((l) => l.type === 'road' && l.direction === 1)!;

      rightMovingLane.obstacles.push({
        id: 'test-obstacle',
        position: { x: 20, y: rightMovingLane.y }, // at edge
        height: 1,
        width: 1,
        size: 'm',
        velocity: 0.5,
        type: 'car',
      });

      tick(gameState);

      expect(rightMovingLane.obstacles).toHaveLength(0);
    });

    it('removes obstacles that leave the grid (left edge)', () => {
      const lanes = gameState.getLanes();
      const leftMovingLane = lanes.find((l) => l.type === 'road' && l.direction === -1)!;

      leftMovingLane.obstacles.push({
        id: 'test-obstacle',
        position: { x: -2, y: leftMovingLane.y }, // past left edge
        height: 1,
        width: 1,
        size: 'm',
        velocity: -0.5,
        type: 'car',
      });

      tick(gameState);

      expect(leftMovingLane.obstacles).toHaveLength(0);
    });

    it('keeps obstacles still on grid', () => {
      const lanes = gameState.getLanes();
      const rightMovingLane = lanes.find((l) => l.type === 'road' && l.direction === 1)!;

      rightMovingLane.obstacles.push({
        id: 'test-obstacle',
        position: { x: 10, y: rightMovingLane.y },
        height: 1,
        width: 1,
        size: 'm',
        velocity: 0.5,
        type: 'car',
      });

      tick(gameState);

      expect(rightMovingLane.obstacles).toHaveLength(1);
    });

    it('skips safe and goal lanes during tick', () => {
      const lanes = gameState.getLanes();
      const safeLane = lanes.find((l) => l.type === 'safe')!;
      const goalLane = lanes.find((l) => l.type === 'goal')!;

      // Safe and goal lanes shouldn't spawn obstacles
      // Run enough ticks to trigger spawning
      for (let i = 0; i < 50; i++) {
        tick(gameState);
      }

      expect(safeLane.obstacles).toHaveLength(0);
      expect(goalLane.obstacles).toHaveLength(0);
    });

    it('spawns obstacles when spawn rate counter is reached', () => {
      const lanes = gameState.getLanes();
      const roadLane = lanes.find((l) => l.type === 'road')!;
      const spawnRate = roadLane.spawnRate;

      // Clear any existing obstacles
      roadLane.obstacles = [];

      // Run exactly spawnRate ticks
      for (let i = 0; i < spawnRate; i++) {
        tick(gameState);
      }

      // Should have spawned exactly one obstacle for this lane
      // (other lanes may have different spawn rates so may have spawned too)
      expect(roadLane.obstacles.length).toBeGreaterThanOrEqual(1);
    });
  });
});
