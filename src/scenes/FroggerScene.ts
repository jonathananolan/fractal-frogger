// Frogger Scene - main game scene with multiplayer support
// Owner: Systems Integrator

import type { Scene, GameContext, Renderer, GameState, DebugData } from '../engine/types.js';

// Systems
import { MovementSystem } from '../systems/MovementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { PrizeSystem } from '../prizes/PrizeSystem.js';
import { TongueSystem } from '../systems/TongueSystem.js';
import { loadPrizeSprites } from '../prizes/PrizeRegistry.js';

// Network
import { socketClient, RemotePlayer } from '../network/SocketClient.js';

// Audio
import { soundManager } from '../audio/SoundManager.js';

// UI
import { renderStartScreen } from '../ui/StartScreen.js';
import { renderHUD } from '../ui/HUD.js';
import { renderHelpOverlay } from '../ui/HelpOverlay.js';
import { renderDebugPanel } from '../ui/DebugPanel.js';
import { updateLeaderboard } from '../ui/Leaderboard.js';

// Server URL - use localhost in dev, same origin in production
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

import { GameData, Lane, LeaderboardEntry, Player, Prize, VehicleSize, SIZE_TO_WIDTH } from '../../shared/types.js';
import { loadSprites, loadBackground } from '../sprites.js';
import { GRID_SIZE } from '../../shared/constants.js';

loadSprites();
loadBackground();
loadPrizeSprites();

// Direction mapping
const KEY_DIRECTION: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

// Random frog names for mobile players
const FROG_NAMES = [
  'Ribbit Rick',
  'Hoppy',
  'Sir Croaks',
  'Lily Pad',
  'Bog Boss',
  'Swamp Thing',
  'Toad Warrior',
  'Frogzilla',
  'Leap Lord',
  'Pond Prince',
  'Marsh Mallow',
  'Croak Master',
  'Jumpy Jeff',
  'Splashy',
  'Webfoot',
  'Green Bean',
  'Tadpole',
  'Frogsworth',
  'Hopper',
  'Slick Frog',
];

function getRandomFrogName(): string {
  return FROG_NAMES[Math.floor(Math.random() * FROG_NAMES.length)];
}

export class FroggerScene implements Scene {
  // Game state
  private state: GameState = 'start';
  private gameData!: GameData;
  private gridSize: number = GRID_SIZE;
  private tickCount: number = 0;

  // Systems
  private movementSystem = new MovementSystem();
  private collisionSystem = new CollisionSystem();
  private spawnSystem = new SpawnSystem();
  private prizeSystem!: PrizeSystem;
  private tongueSystem = new TongueSystem();

  // Invincibility duration in ticks (~5 seconds at 20 ticks/sec)
  private static readonly INVINCIBILITY_DURATION = 100;

  // UI toggles
  private showHelp: boolean = false;
  private showDebug: boolean = false;

  // Multiplayer state
  private multiplayerEnabled: boolean = true;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private localPlayerColor: number = 0x44ff44;
  private leaderboardData: LeaderboardEntry[] = [];
  private serverPrizes: Prize[] = [];
  private lastSyncTick: number = 0;
  private static readonly POSITION_SYNC_INTERVAL = 40; // Sync every ~2 seconds at 20 ticks/sec

  //renderer.
  private renderer: Renderer | null = null;
  private mobileAutoStarted: boolean = false;

  init(context: GameContext): void {
    this.gridSize = context.gridSize;
    this.prizeSystem = new PrizeSystem(this.gridSize);
    this.resetGame();
    this.connectToServer();
  }

  private connectToServer(): void {
    if (!this.multiplayerEnabled) return;

    socketClient.connect(SERVER_URL, {
      onWelcome: (playerId, color, players, lanes) => {
        this.localPlayerColor = color;
        // Update the frog's color to match server-assigned color
        this.gameData.frog.color = color;
        // Add existing players (excluding self)
        for (const player of players) {
          if (player.id !== playerId) {
            this.remotePlayers.set(player.id, player);
          }
        }
        // Sync lanes from server
        this.syncLanesFromServer(lanes);
      },
      onPlayerJoined: (playerId, color, name, position) => {
        this.remotePlayers.set(playerId, {
          id: playerId,
          name,
          color,
          position,
          isAlive: true,
          score: 0,
          isInvincible: false,
        });
        // Play sound when another player joins
        soundManager.playPlayerJoined();
      },
      onPlayerLeft: (playerId) => {
        this.remotePlayers.delete(playerId);
      },
      onPlayerMoved: (playerId, x, y) => {
        const player = this.remotePlayers.get(playerId);
        if (player) {
          player.position = { x, y };
        }
      },
      onPlayerDied: (playerId) => {
        const player = this.remotePlayers.get(playerId);
        if (player) {
          player.isAlive = false;
          // Reset after brief delay
          setTimeout(() => {
            if (player) {
              player.isAlive = true;
              player.position = this.findUnoccupiedSpawnPosition();
            }
          }, 1000);
        }
      },
      onPlayerWon: (playerId) => {
        console.log(`Player ${playerId} won!`);
      },
      onObstacles: (lanes) => {
        this.syncLanesFromServer(lanes);
      },
      onLeaderboard: (players) => {
        this.leaderboardData = players;
        updateLeaderboard(players, socketClient.playerId);
      },
      onGameState: (players, lanes, prizes) => {
        // Check if it's time for a position sync
        const shouldSyncPosition = this.tickCount - this.lastSyncTick >= FroggerScene.POSITION_SYNC_INTERVAL;

        // Update player positions from server state
        for (const player of players) {
          if (player.id === socketClient.playerId) {
            // Sync local player's score from server (server handles prize scoring)
            this.gameData.score = player.score;

            // Periodically sync local player position to correct drift
            if (shouldSyncPosition) {
              this.gameData.frog.position = { ...player.position };
              this.gameData.frog.isInvincible = player.isInvincible;
              this.gameData.frog.invincibilityEndTick = player.invincibilityEndTick;
              this.lastSyncTick = this.tickCount;
            }
            continue;
          }

          const existing = this.remotePlayers.get(player.id);
          if (existing) {
            existing.position = player.position;
            existing.isAlive = player.isAlive;
            existing.score = player.score;
            existing.isInvincible = player.isInvincible;
          } else {
            // New player we haven't seen yet
            this.remotePlayers.set(player.id, {
              id: player.id,
              name: player.name,
              color: player.color,
              position: player.position,
              isAlive: player.isAlive,
              score: player.score,
              isInvincible: player.isInvincible,
            });
          }
        }
        // Sync lanes and prizes from server
        this.syncLanesFromServer(lanes);
        this.serverPrizes = prizes;
      },
      onPrizeCollected: (prizeId, playerId) => {
        // Remove collected prize from local state
        this.serverPrizes = this.serverPrizes.filter(p => p.id !== prizeId);
        console.log(`Prize ${prizeId} collected by ${playerId}`);
      },
    });
  }

  private syncLanesFromServer(serverLanes: Lane[]): void {
    // Update obstacle positions from server
    for (const serverLane of serverLanes) {
      const localLane = this.gameData.lanes.find((l) => l.y === serverLane.y);
      if (localLane) {
        localLane.obstacles = serverLane.obstacles;
      }
    }
  }

  private resetGame(): void {
    // Initialize gameData first so findUnoccupiedSpawnPosition can access remotePlayers
    this.gameData = {
      frog: {
        position: { x: Math.floor(this.gridSize / 2), y: this.gridSize - 1 },
        height: 1,
        width: 1,
        lives: 3,
        isAlive: true,
        isOnLog: false,
        color: this.localPlayerColor,
        isInvincible: false,
        invincibilityEndTick: 0,
      },
      lanes: this.createLanes(),
      score: 0,
      timeRemaining: 30,
      level: 1,
    };
    // Now find an unoccupied spawn position
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.tickCount = 0;
    this.prizeSystem?.reset();
    this.tongueSystem?.reset();

    // TEST: Add a car to see it render (remove later)
    const roadLane = this.gameData.lanes.find((l) => l.y === 17);
    if (roadLane) {
      roadLane.obstacles.push({
        id: 'test-car-1',
        position: { x: 5, y: 17 },
        height: 1,
        width: 1,
        size: 'm',
        velocity: 5,
        type: 'car',
        sprite: { file: 'Vehicle_Dementia.png', length: 48 },
      });
    }

    // TEST: Add a log to see it render (remove later)
    const waterLane = this.gameData.lanes.find((l) => l.y === 11);
    if (waterLane) {
      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 11 },
        height: 1,
        width: SIZE_TO_WIDTH['m'],
        size: 'm',
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 9 },
        height: 1,
        width: SIZE_TO_WIDTH['m'],
        size: 'm',
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 10 },
        height: 1,
        width: SIZE_TO_WIDTH['m'],
        size: 'm',
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 8 },
        height: 1,
        width: SIZE_TO_WIDTH['m'],
        size: 'm',
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 7 },
        height: 1,
        width: SIZE_TO_WIDTH['m'],
        size: 'm',
        velocity: 0.3,
        type: 'log',
      });
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

  update(dt: number): void {
    if (this.state !== 'playing') return;

    this.tickCount++;

    // In multiplayer mode, server handles obstacle spawning/movement
    // Only run local spawn/movement if not connected
    if (!socketClient.isConnected) {
      this.spawnSystem.update(this.gameData, this.gridSize);
      this.movementSystem.update(this.gameData, dt, this.gridSize);
    } else {
      // Still update frog position on logs (client-side for responsiveness)
      this.movementSystem.update(this.gameData, dt, this.gridSize);
    }

    // Update prize system - use server prizes when connected, local otherwise
    if (!socketClient.isConnected) {
      this.prizeSystem.update(this.gridSize);
    }

    // Update tongue system
    this.tongueSystem.update();

    // Get active prizes (server or local depending on connection)
    const activePrizes = socketClient.isConnected ? this.serverPrizes : this.prizeSystem.getActivePrizes();

    // Check for tongue catching prizes
    const tongueCatch = this.tongueSystem.checkPrizeCollision(activePrizes);
    if (tongueCatch) {
      this.handlePrizeCollected(tongueCatch);
    }

    // Check for frog walking over prizes
    const frogX = Math.floor(this.gameData.frog.position.x);
    const frogY = this.gameData.frog.position.y;
    for (const prize of activePrizes) {
      if (Math.floor(prize.position.x) === frogX && prize.position.y === frogY) {
        this.handlePrizeCollected(prize);
        break;
      }
    }

    // Check invincibility expiration
    if (this.gameData.frog.isInvincible && this.tickCount >= this.gameData.frog.invincibilityEndTick) {
      this.gameData.frog.isInvincible = false;
      console.log('Invincibility expired!');
    }

    const collision = this.collisionSystem.update(this.gameData);

    // Handle collision results
    switch (collision.type) {
      case 'car':
      case 'water':
        // Skip death if invincible
        if (!this.gameData.frog.isInvincible) {
          this.handleDeath(collision.type);
        }
        break;
      case 'log':
        this.gameData.frog.isOnLog = true;
        this.gameData.frog.currentLogId = collision.logId;
        break;
      case 'goal':
        this.handleVictory();
        break;
      case 'none':
        this.gameData.frog.isOnLog = false;
        this.gameData.frog.currentLogId = undefined;
        break;
    }
  }

  private handleDeath(cause: string): void {
    // Play death sound
    soundManager.playDeath();

    // Notify server of death (server handles respawn position)
    if (socketClient.isConnected) {
      socketClient.sendDeath(cause);
    }

    // Respawn frog at start (local for immediate feedback)
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.gameData.frog.isOnLog = false;
  }

  private findUnoccupiedSpawnPosition(): { x: number; y: number } {
    const spawnY = this.gridSize - 1;
    const occupiedX = new Set<number>();

    // Add remote players on spawn row
    for (const player of this.remotePlayers.values()) {
      if (player.position.y === spawnY) {
        occupiedX.add(Math.floor(player.position.x));
      }
    }

    // Add local frog if it's on spawn row (for cases like resetGame)
    if (this.gameData?.frog?.position?.y === spawnY) {
      occupiedX.add(Math.floor(this.gameData.frog.position.x));
    }

    // Try center first, then expand outward
    const center = Math.floor(this.gridSize / 2);
    for (let offset = 0; offset < this.gridSize; offset++) {
      const leftX = center - offset;
      const rightX = center + offset;

      if (leftX >= 0 && !occupiedX.has(leftX)) {
        return { x: leftX, y: spawnY };
      }
      if (rightX < this.gridSize && rightX !== leftX && !occupiedX.has(rightX)) {
        return { x: rightX, y: spawnY };
      }
    }

    // Fallback to center if all positions are somehow occupied
    return { x: center, y: spawnY };
  }

  private handleVictory(): void {
    this.gameData.score += 100;

    // Play victory sound
    soundManager.playVictory();

    // Notify server of victory (server handles respawn position)
    if (socketClient.isConnected) {
      socketClient.sendVictory();
      socketClient.sendScoreUpdate(this.gameData.score);
    }

    // Respawn frog at start (local for immediate feedback)
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.gameData.frog.isOnLog = false;
  }

  private handlePrizeCollected(prize: import('../../shared/types.js').Prize): void {
    console.log(`Collected ${prize.type}! +${prize.value} points`);

    // Send prize collection to server (server handles score)
    if (socketClient.isConnected) {
      socketClient.sendPrizeCollected(prize.id);
      // Remove from local array immediately for responsiveness
      this.serverPrizes = this.serverPrizes.filter(p => p.id !== prize.id);
    } else {
      // Local mode - update score directly
      this.gameData.score += prize.value;
    }

    // Butterfly and crystal grant invincibility
    if (prize.type === 'butterfly' || prize.type === 'crystal') {
      this.gameData.frog.isInvincible = true;
      this.gameData.frog.invincibilityEndTick = this.tickCount + FroggerScene.INVINCIBILITY_DURATION;
      console.log(`Invincibility activated! Ends at tick ${this.gameData.frog.invincibilityEndTick}`);
    }
  }

  render(renderer: Renderer): void {
    this.renderer = renderer;
    renderer.clear();

    switch (this.state) {
      case 'start':
        // On mobile, auto-start with a random frog name
        if (this.isMobile() && !this.mobileAutoStarted) {
          this.mobileAutoStarted = true;
          this.startGameWithName(getRandomFrogName());
          return;
        }

        renderStartScreen(renderer);
        renderer.showNameInput();
        break;

      case 'playing':
        this.renderGame(renderer);
        if (this.showHelp) renderHelpOverlay(renderer);
        if (this.showDebug) renderDebugPanel(renderer, this.getDebugData());
        break;
    }
  }

  private isMobile(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private startGame(): void {
    const name = this.renderer?.getNameValue() ?? '';
    if (this.state === 'start' && name !== '') {
      this.startGameWithName(name);
    }
  }

  private startGameWithName(name: string): void {
    socketClient.join(name);
    this.renderer?.hideInput();
    this.state = 'playing';
    soundManager.unlock();
    soundManager.playGameStart();
    soundManager.startMusic();
  }

  private renderGame(renderer: Renderer): void {
    // Render lanes (background)
    this.renderLanes(renderer);

    // Render obstacles
    this.renderObstacles(renderer);

    // Render prizes
    this.renderPrizes(renderer);

    // Render remote players
    this.renderRemotePlayers(renderer);

    // Render tongue (before frog so it appears to come from mouth)
    this.renderTongue(renderer);

    // Render local frog
    this.renderFrog(renderer);

    // Render HUD
    renderHUD(renderer, this.gameData.score);
  }

  private renderLanes(renderer: Renderer): void {
    for (const lane of this.gameData.lanes) {
      let color: number;
      switch (lane.type) {
        case 'safe':
          color = 0x228822; // grass green
          break;
        case 'road':
          color = 0x444444; // gray
          break;
        case 'water':
          color = 0x2244aa; // blue
          break;
        case 'goal':
          color = 0x226622; // darker green
          break;
      }
      renderer.drawRect(0, lane.y, this.gridSize, 1, color);

      // Road: dashed lane markings
      if (lane.type === 'road') {
        for (let x = 0; x < this.gridSize; x += 2) {
          renderer.drawRect(x + 0.25, lane.y, 0.5, 0.05, 0x5a5a5a);
        }
      }

      // Water: animated wave highlights that drift with the lane direction
      if (lane.type === 'water') {
        const drift = (this.tickCount * lane.speed * lane.direction * 0.05) % this.gridSize;
        for (let x = 0; x < this.gridSize; x += 1.5) {
          const waveX = (((x + drift) % this.gridSize) + this.gridSize) % this.gridSize;
          renderer.drawRect(waveX, lane.y + 0.3, 0.6, 0.1, 0x1156d6);
          renderer.drawRect(waveX + 0.7, lane.y + 0.6, 0.4, 0.08, 0x160096);
        }
      }
    }
  }

  private renderObstacles(renderer: Renderer): void {
    for (const lane of this.gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        let car = obstacle.type === 'car';

        if (car && obstacle.sprite) {
          renderer.drawVehicle(
            obstacle.position.x,
            obstacle.position.y,
            obstacle.size,
            obstacle.sprite,
          );
        } else if (car) {
          // Fallback for cars without sprite data (e.g., from server)
          renderer.drawRect(
            Math.floor(obstacle.position.x),
            obstacle.position.y,
            obstacle.width,
            1,
            0xff0000,
          );
        } else {
          // Render log with sprites
          renderer.drawLog(obstacle.position.x, obstacle.position.y, obstacle.width, lane.direction);
        }
      }
    }
  }

  private renderPrizes(renderer: Renderer): void {
    // Use server prizes when connected, local otherwise
    const prizes = socketClient.isConnected ? this.serverPrizes : this.prizeSystem.getActivePrizes();
    for (const prize of prizes) {
      // Hover animation - bob up and down using sine wave
      // Use prize spawn time to offset phase so prizes don't all move in sync
      const hoverPhase = (this.tickCount + prize.spawnTime) * 0.15;
      const hoverOffset = Math.sin(hoverPhase) * 0.15; // 0.15 cells amplitude
      renderer.drawPrize(prize.position.x, prize.position.y + hoverOffset, prize.type);
    }
  }

  private renderRemotePlayers(renderer: Renderer): void {
    for (const player of this.remotePlayers.values()) {
      if (player.isAlive) {
        const { x, y } = player.position;

        renderer.drawPlayer(x, y, player.color, player.isInvincible);
      }
    }
  }

  private renderFrog(renderer: Renderer): void {
    const { x, y } = this.gameData.frog.position;
    renderer.drawPlayer(x, y, this.gameData.frog.color, this.gameData.frog.isInvincible);
  }

  private renderTongue(renderer: Renderer): void {
    const tongue = this.tongueSystem.getTongue();
    if (tongue.active) {
      renderer.drawTongue(tongue, this.gameData.frog.color);
    }
  }

  private getDebugData(): DebugData {
    const frogY = this.gameData.frog.position.y;
    const currentLane = this.gameData.lanes.find((l) => l.y === frogY);

    return {
      frogPosition: this.gameData.frog.position,
      currentLaneType: currentLane?.type ?? 'safe',
      isOnLog: this.gameData.frog.isOnLog,
      tickCount: this.tickCount,
    };
  }

  onKeyDown(key: string): void {
    // ENTER: Start game from name entry screen
    if (key === 'Enter') {
      this.startGame();
      return;
    }

    // SPACE: Shoot tongue during gameplay
    if (key === 'Space') {
      if (this.state === 'playing') {
        this.tongueSystem.shoot(this.gameData.frog.position);
      }
      return;
    }

    // Only handle other keys during play
    if (this.state !== 'playing') return;

    // H: Toggle help
    if (key === 'KeyH') {
      this.showHelp = !this.showHelp;
      return;
    }

    // P: Toggle debug
    if (key === 'KeyP') {
      this.showDebug = !this.showDebug;
      return;
    }

    // Movement
    const direction = KEY_DIRECTION[key];
    if (direction) {
      const moved = this.movementSystem.moveFrog(this.gameData, direction, this.gridSize);

      if (moved) {
        // Play hop sound on successful movement
        soundManager.playHop();

        // Send input direction to server (server-authoritative movement)
        if (socketClient.isConnected) {
          socketClient.sendInput(direction);
        }
      }
    }
  }

  onKeyUp(_key: string): void {
    // No-op for Frogger
  }

  destroy(): void {
    // Disconnect from server
    socketClient.disconnect();
  }
}
