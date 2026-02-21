// GameState - manages obstacles, lanes, and tick loop
// Server owns obstacle spawning and movement

import type {
  ClientToServerEvents,
  Direction,
  ServerGameState,
  Lane,
  Obstacle,
  Player,
  Point,
  Prize,
  PrizeType,
  ServerToClientEvents,
  SpriteData,
  VehicleSize,
} from '../../shared/types.js';
import { PRIZE_CONFIGS, PRIZE_TYPES } from '../../shared/types.js';
import type { Server } from 'socket.io';
import { VEHICLES_BY_SIZE, SIZE_TO_WIDTH } from './sprites.js';
import { GRID_SIZE, SPRITE_BASE_PX, TICK_RATE_MS } from '../../shared/constants.js';

const RESPAWN_TICKS = 20; // 1 second at 50ms tick rate
const START_Y = 19;
const INVINCIBILITY_DURATION = 100; // ~5 seconds at 20 ticks/sec

// Prize configuration
const PRIZE_SPAWN_CHANCE = 0.08; // 8% chance per tick (increased from 2%)
const MAX_PRIZES = 12; // max prizes on screen (increased from 5)
const VALID_PRIZE_SPAWN_Y = Array.from({ length: 19 }, (_, i) => i + 1); // rows 1-19 (all except goal zone)

export class GameState {
  private lanes: Lane[] = [];
  private players: Map<string, Player> = new Map();
  private obstacleIdCounter = 0;
  private tickCounters: Map<number, number> = new Map(); // lane y -> ticks since last spawn
  private tickInterval: NodeJS.Timeout | null = null;

  // Prize state
  private prizes: Prize[] = [];
  private prizeIdCounter = 0;
  private tickCount = 0;

  constructor() {
    this.lanes = this.createLanes();
  }

  queueInput(id: string, direction: Direction): void {
    const player = this.players.get(id);
    if (player && player.isAlive) {
      player.pendingInput = direction;
    }
  }

  private getLaneAtY(y: number): Lane | undefined {
    return this.lanes.find((lane) => lane.y === y);
  }

  private processInputs(): void {
    for (const player of this.players.values()) {
      // being dead or having no input means player doesn't move
      if (!player.isAlive || !player.pendingInput) continue;

      // consume player input: get direction and set player input to nothing
      const dir = player.pendingInput;
      player.pendingInput = undefined;

      // determine x/y change
      let dx = 0;
      let dy = 0;
      if (dir === 'up') {
        dy = -1;
      } else if (dir === 'down') {
        dy = 1;
      } else if (dir === 'left') {
        dx = -1;
      } else {
        // dir === 'right'
        dx = 1;
      }

      // don't let frog go through walls
      const newX = Math.max(0, Math.min(GRID_SIZE - 1, player.position.x + dx));
      const newY = Math.max(0, Math.min(GRID_SIZE - 1, player.position.y + dy));

      /**
       * EASTER EGG: THE BOLD AND EXPLORATORY CAN FARM SCORE BY MOVING BACK AND FORTH
       *
       * TODO: remove this line if people hate it
       * but right now I think it's kinda funny
       */
      if (dy === -1) player.score += 10; // moved up

      // apply x/y change
      player.position = { x: newX, y: newY };
    }
  }

  private updateFrogsOnLogs(): void {
    for (const player of this.players.values()) {
      if (!player.isAlive) continue;

      const lane = this.getLaneAtY(player.position.y);
      if (!lane || lane.type !== 'water') {
        player.ridingObstacleId = null;
        continue;
      }

      // Find a log overlapping this player's x position
      const log = lane.obstacles.find(
        (obs) =>
          obs.type === 'log' &&
          obs.position.x <= player.position.x &&
          obs.position.x + obs.width > player.position.x,
      );

      if (log) {
        player.ridingObstacleId = log.id;
        // Carry player with the log (same velocity applied this tick)
        const newX = player.position.x + log.velocity;
        // If log carries player off screen, drown them
        if (newX < 0 || newX >= 20) {
          this.killPlayer(player);
        } else {
          player.position.x = newX;
        }
      } else {
        // In water, not on a log → drown
        player.ridingObstacleId = null;
        this.killPlayer(player);
      }
    }
  }

  private detectCollisions(): void {
    for (const player of this.players.values()) {
      if (!player.isAlive) continue;

      const lane = this.getLaneAtY(player.position.y);
      if (!lane) continue;

      if (lane.type === 'road') {
        // AABB: player occupies [x, x+1). Car occupies [car.x, car.x + car.width).
        const hit = lane.obstacles.some(
          (obs) =>
            obs.position.x < player.position.x + 1 &&
            obs.position.x + obs.width > player.position.x,
        );
        if (hit) {
          this.killPlayer(player);
        }
      }

      if (lane.type === 'goal') {
        // Player reached the goal zone — victory
        player.score += 100;
        player.position = this.findUnoccupiedSpawnPosition();
        // player stays alive, just resets to start
      }
    }
  }

  private killPlayer(player: Player): void {
    // Invincible players can't die
    if (player.isInvincible) return;

    player.isAlive = false;
    player.respawnTimer = RESPAWN_TICKS;
    player.ridingObstacleId = null;
  }

  private tickRespawns(): void {
    for (const player of this.players.values()) {
      if (player.isAlive || player.respawnTimer <= 0) continue;
      player.respawnTimer -= 1;
      if (player.respawnTimer === 0) {
        player.isAlive = true;
        player.position = this.findUnoccupiedSpawnPosition();
      }
    }
  }

  private tickInvincibility(): void {
    for (const player of this.players.values()) {
      if (player.isInvincible && this.tickCount >= player.invincibilityEndTick) {
        player.isInvincible = false;
      }
    }
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
    const position = this.findUnoccupiedSpawnPosition();
    const player: Player = {
      id,
      name,
      color,
      position,
      width: 1,
      height: 1,
      isAlive: true,
      score: 0,
      respawnTimer: 0,
      ridingObstacleId: null,
      isInvincible: false,
      invincibilityEndTick: 0,
    };
    this.players.set(id, player);
    return player;
  }

  findUnoccupiedSpawnPosition(): Point {
    const occupiedX = new Set<number>();
    for (const player of this.players.values()) {
      if (player.position.y === START_Y) {
        occupiedX.add(player.position.x);
      }
    }

    // Try center first, then expand outward
    const center = Math.floor(GRID_SIZE / 2);
    for (let offset = 0; offset < GRID_SIZE; offset++) {
      const leftX = center - offset;
      const rightX = center + offset;

      if (leftX >= 0 && !occupiedX.has(leftX)) {
        return { x: leftX, y: START_Y };
      }
      if (rightX < GRID_SIZE && rightX !== leftX && !occupiedX.has(rightX)) {
        return { x: rightX, y: START_Y };
      }
    }

    // Fallback to center if all positions are somehow occupied
    return { x: center, y: START_Y };
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
      .map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  // Prize methods
  getPrizes(): Prize[] {
    return this.prizes.filter(p => !p.collected);
  }

  collectPrize(prizeId: string, playerId: string): Prize | null {
    const prize = this.prizes.find(p => p.id === prizeId && !p.collected);
    if (!prize) return null;

    prize.collected = true;

    // Update player score and handle special effects
    const player = this.players.get(playerId);
    if (player) {
      player.score += prize.value;

      // Crystal and butterfly grant invincibility
      if (prize.type === 'crystal' || prize.type === 'butterfly') {
        player.isInvincible = true;
        player.invincibilityEndTick = this.tickCount + INVINCIBILITY_DURATION;
      }
    }

    return prize;
  }

  private spawnPrize(): void {
    const type = this.getRandomPrizeType();
    const config = PRIZE_CONFIGS[type];

    // Random position on valid row
    const y = VALID_PRIZE_SPAWN_Y[Math.floor(Math.random() * VALID_PRIZE_SPAWN_Y.length)];
    const x = Math.floor(Math.random() * GRID_SIZE);

    // Check for overlap with existing prizes
    const overlaps = this.prizes.some(p => !p.collected && p.position.x === x && p.position.y === y);
    if (overlaps) return;

    const prize: Prize = {
      id: `prize-${this.prizeIdCounter++}`,
      position: { x, y },
      type,
      value: config.value,
      collected: false,
      spawnTime: this.tickCount,
    };

    this.prizes.push(prize);
  }

  private getRandomPrizeType(): PrizeType {
    // Build weighted pool - lower rarity = more entries
    const pool: PrizeType[] = [];
    for (const type of PRIZE_TYPES) {
      const config = PRIZE_CONFIGS[type];
      const weight = 11 - config.rarity; // rarity 1 gets 10 entries, rarity 10 gets 1
      for (let i = 0; i < weight; i++) {
        pool.push(type);
      }
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private updatePrizes(): void {
    // Try to spawn a new prize
    if (this.getPrizes().length < MAX_PRIZES && Math.random() < PRIZE_SPAWN_CHANCE) {
      this.spawnPrize();
    }

    // Remove expired prizes
    this.prizes = this.prizes.filter(prize => {
      if (prize.collected) return false;
      const config = PRIZE_CONFIGS[prize.type];
      if (config.duration === 0) return true; // permanent
      const age = this.tickCount - prize.spawnTime;
      return age < config.duration;
    });
  }

  /**
   * Start the game tick loop
   */
  startTickLoop(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tick();
      // New: full game state broadcast (for PR2 clients)
      io.sockets.emit('gameState', {
        players: this.getPlayers(),
        lanes: this.lanes,
        prizes: this.getPrizes(),
      });
      // Kept: backward-compat obstacle broadcast (for current clients)
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
   * Single game tick - inputs, obstacles, physics, collisions, respawns, prizes
   */
  private tick(): void {
    this.tickCount++;

    // 1. Apply pending player inputs
    this.processInputs();

    // 2. Update prizes (spawn/expire)
    this.updatePrizes();

    // 2. Spawn and move obstacles
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
          // Moving right - remove when fully past right edge
          return obstacle.position.x < GRID_SIZE;
        } else {
          // Moving left - remove when fully past left edge
          return obstacle.position.x + width > 0;
        }
      });
    }

    // 3. Carry frogs riding logs
    this.updateFrogsOnLogs();

    // 4. Detect car collisions and victories
    this.detectCollisions();

    // 5. Tick respawn timers
    this.tickRespawns();

    // 6. Tick invincibility timers
    this.tickInvincibility();
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

    const width = sprite ? sprite.length / SPRITE_BASE_PX : SIZE_TO_WIDTH[size];
    const x = lane.direction === 1 ? -width : GRID_SIZE;

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
}
