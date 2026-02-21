// GameState - manages obstacles/lanes (server-authoritative) and relays player state
// Client owns all player physics (movement, collisions, log-riding, death, scoring)

import type {
  ClientToServerEvents,
  Lane,
  Obstacle,
  Player,
  Point,
  ServerToClientEvents,
  SpriteData,
  VehicleSize,
} from '../../shared/types.js';
import type { Server } from 'socket.io';
import { VEHICLES_BY_SIZE, SIZE_TO_WIDTH } from './sprites.js';
import { GRID_SIZE, SPRITE_BASE_PX, TICK_RATE_MS } from '../../shared/constants.js';

const START_POSITION: Point = { x: 10, y: 19 };

export class GameState {
  private lanes: Lane[] = [];
  private players: Map<string, Player> = new Map();
  private obstacleIdCounter = 0;
  private tickCounters: Map<number, number> = new Map(); // lane y -> ticks since last spawn
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.lanes = this.createLanes();
  }

  private createLanes(): Lane[] {
    const lanes: Lane[] = [];

    // Safe zone (bottom 2 rows)
    lanes.push({
      y: 19,
      type: 'safe',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });
    lanes.push({
      y: 18,
      type: 'safe',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });

    // Road lanes (rows 13-17)
    lanes.push({
      y: 17,
      type: 'road',
      obstacles: [],
      spawnRate: 20,
      direction: 1,
      speed: 0.5,
    });
    lanes.push({
      y: 16,
      type: 'road',
      obstacles: [],
      spawnRate: 25,
      direction: -1,
      speed: 0.3,
    });
    lanes.push({
      y: 15,
      type: 'road',
      obstacles: [],
      spawnRate: 18,
      direction: 1,
      speed: 0.4,
    });
    lanes.push({
      y: 14,
      type: 'road',
      obstacles: [],
      spawnRate: 22,
      direction: -1,
      speed: 0.6,
    });
    lanes.push({
      y: 13,
      type: 'road',
      obstacles: [],
      spawnRate: 30,
      direction: 1,
      speed: 0.35,
    });

    // Safe middle (row 12)
    lanes.push({
      y: 12,
      type: 'safe',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });

    // Water lanes (rows 8-11)
    lanes.push({
      y: 11,
      type: 'water',
      obstacles: [],
      spawnRate: 25,
      direction: -1,
      speed: 0.3,
    });
    lanes.push({
      y: 10,
      type: 'water',
      obstacles: [],
      spawnRate: 20,
      direction: 1,
      speed: 0.4,
    });
    lanes.push({
      y: 9,
      type: 'water',
      obstacles: [],
      spawnRate: 30,
      direction: -1,
      speed: 0.25,
    });
    lanes.push({
      y: 8,
      type: 'water',
      obstacles: [],
      spawnRate: 22,
      direction: 1,
      speed: 0.35,
    });

    // Safe middle (row 7)
    lanes.push({
      y: 7,
      type: 'safe',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });

    // Safe zone (row 6) - buffer between water and upper road
    lanes.push({
      y: 6,
      type: 'safe',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });

    // Second road lanes (rows 1-5) - 5 lanes
    lanes.push({
      y: 5,
      type: 'road',
      obstacles: [],
      spawnRate: 28,
      direction: -1,
      speed: 0.35,
    });
    lanes.push({
      y: 4,
      type: 'road',
      obstacles: [],
      spawnRate: 20,
      direction: 1,
      speed: 0.5,
    });
    lanes.push({
      y: 3,
      type: 'road',
      obstacles: [],
      spawnRate: 25,
      direction: -1,
      speed: 0.4,
    });
    lanes.push({
      y: 2,
      type: 'road',
      obstacles: [],
      spawnRate: 18,
      direction: 1,
      speed: 0.55,
    });
    lanes.push({
      y: 1,
      type: 'road',
      obstacles: [],
      spawnRate: 30,
      direction: -1,
      speed: 0.3,
    });

    // Goal zone (row 0)
    lanes.push({
      y: 0,
      type: 'goal',
      obstacles: [],
      spawnRate: 0,
      direction: 1,
      speed: 0,
    });

    return lanes;
  }

  // --- Obstacle tick loop (only thing server computes) ---

  /**
   * Start the game tick loop
   */
  startTickLoop(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tick();
      io.sockets.emit('obstacles', { lanes: this.lanes });
    }, TICK_RATE_MS);

    console.log('Game tick loop started');
  }

  stopTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Single game tick - spawn, move, and cull obstacles
   */
  private tick(): void {
    for (const lane of this.lanes) {
      if (lane.type === 'safe' || lane.type === 'goal') continue;

      // Update spawn counter
      const counter = (this.tickCounters.get(lane.y) || 0) + 1;
      this.tickCounters.set(lane.y, counter);

      // Spawn new obstacle when rate reached
      if (counter >= lane.spawnRate) {
        this.tickCounters.set(lane.y, 0);
        const obstacle = this.spawnObstacle(lane);
        lane.obstacles.push(obstacle);
      }

      // Move obstacles
      for (const obstacle of lane.obstacles) {
        obstacle.position.x += obstacle.velocity;
      }

      // Remove obstacles that left the grid
      lane.obstacles = lane.obstacles.filter((obstacle) => {
        const width = obstacle.width;
        if (lane.direction === 1) {
          return obstacle.position.x < GRID_SIZE;
        } else {
          return obstacle.position.x + width > 0;
        }
      });
    }
  }

  /**
   * Create a new obstacle at the spawn edge of a lane
   */
  private spawnObstacle(lane: Lane): Obstacle {
    const id = `obstacle-${this.obstacleIdCounter++}`;
    const isRoad = lane.type === 'road';

    // Pick a random size for both vehicles and logs
    const sizes: VehicleSize[] = ['s', 'm', 'l', 'xl'];
    const size: VehicleSize = sizes[Math.floor(Math.random() * sizes.length)];

    // Pick a random sprite for road obstacles
    let sprite: SpriteData | undefined;
    if (isRoad) {
      const candidates = VEHICLES_BY_SIZE[size];
      sprite = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const x = lane.direction === 1 ? -SIZE_TO_WIDTH[size] : GRID_SIZE;

    return {
      id,
      position: { x, y: lane.y },
      height: 1,
      width,
      size,
      velocity: lane.speed * lane.direction,
      type: isRoad ? 'car' : 'log',
      sprite,
    };
  }

  // --- Player state (stored for relay/late-joiner sync, not computed) ---

  getLanes(): Lane[] {
    return this.lanes;
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  addPlayer(id: string, name: string, color: number): Player {
    const player: Player = {
      id,
      name,
      color,
      position: { ...START_POSITION },
      width: 1,
      height: 1,
      isAlive: true,
      score: 0,
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  updatePlayerPosition(id: string, position: Point): void {
    const player = this.players.get(id);
    if (player) {
      player.position = position;
    }
  }

  setPlayerAlive(id: string, isAlive: boolean): void {
    const player = this.players.get(id);
    if (player) {
      player.isAlive = isAlive;
    }
  }

  updatePlayerScore(id: string, score: number): void {
    const player = this.players.get(id);
    if (player) {
      player.score = score;
    }
  }

  getLeaderboard(): Array<{ id: string; name: string; color: number; score: number }> {
    return Array.from(this.players.values())
      .map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }
}
