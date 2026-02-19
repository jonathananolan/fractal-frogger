// GameState - manages obstacles, lanes, and tick loop
// Server owns obstacle spawning and movement

import type {
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

const GRID_SIZE = 20;
const TICK_INTERVAL = 150; // ms, matches client

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

    // Water lanes (rows 7-11)
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
    lanes.push({
      y: 7,
      type: 'water',
      obstacles: [],
      spawnRate: 28,
      direction: -1,
      speed: 0.3,
    });

    // Goal zone (rows 0-6)
    for (let y = 0; y <= 6; y++) {
      lanes.push({
        y,
        type: 'goal',
        obstacles: [],
        spawnRate: 0,
        direction: 1,
        speed: 0,
      });
    }

    return lanes;
  }

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
      position: { x: Math.floor(GRID_SIZE / 2), y: GRID_SIZE - 1 },
      width: 1,
      height: 1,
      isAlive: true,
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

  /**
   * Start the game tick loop
   */
  startTickLoop(io: Server<any, ServerToClientEvents>): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tick();
      // Broadcast obstacle positions to all clients
      io.emit('obstacles', { lanes: this.lanes });
    }, TICK_INTERVAL);

    console.log('Game tick loop started');
  }

  stopTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Single game tick - spawn and move obstacles
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
        const width = SIZE_TO_WIDTH[obstacle.size];
        if (lane.direction === 1) {
          // Moving right - remove when fully past right edge
          return obstacle.position.x < GRID_SIZE;
        } else {
          // Moving left - remove when fully past left edge
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

    // Pick a random vehicle size (logs default to "m" for now)
    const sizes: VehicleSize[] = ['s', 'm', 'l', 'xl'];
    const size: VehicleSize = isRoad ? sizes[Math.floor(Math.random() * sizes.length)] : 'm';

    // Pick a random sprite for road obstacles
    let sprite: SpriteData | undefined;
    if (isRoad) {
      const candidates = VEHICLES_BY_SIZE[size];
      sprite = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const width = SIZE_TO_WIDTH[size];
    const x = lane.direction === 1 ? -width : GRID_SIZE;

    return {
      id,
      position: { x, y: lane.y },
      height: 1,
      width: width,
      size,
      velocity: lane.speed * lane.direction,
      type: isRoad ? 'car' : 'log',
      sprite,
    };
  }
}
