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

import { GameData, Lane } from '../../shared/types.js';
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

  // Interpolation
  private prevObstaclePositions = new Map<string, number>();
  private prevFrogX = 0;

  // Multiplayer state
  private multiplayerEnabled: boolean = true;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private localPlayerColor: number = 0x44ff44;
  //renderer.
  private renderer: Renderer | null = null;

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
        // Add existing players (excluding self)
        for (const player of players) {
          if (player.id !== playerId) {
            this.remotePlayers.set(player.id, player);
          }
        }
        // Sync lanes from server
        this.syncLanesFromServer(lanes);
      },
      onPlayerJoined: (playerId, color, name) => {
        this.remotePlayers.set(playerId, {
          id: playerId,
          name,
          color,
          position: { x: Math.floor(this.gridSize / 2), y: this.gridSize - 1 },
          isAlive: true,
          score: 0,
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
              player.position = {
                x: Math.floor(this.gridSize / 2),
                y: this.gridSize - 1,
              };
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
        updateLeaderboard(players, socketClient.playerId);
      },
    });
  }

  private syncLanesFromServer(serverLanes: Lane[]): void {
    // Update obstacle positions from server
    for (const serverLane of serverLanes) {
      const localLane = this.gameData.lanes.find((l) => l.y === serverLane.y);
      if (localLane) {
        localLane.obstacles = serverLane.obstacles;
        // Keep prev positions in sync so server corrections don't cause a visual snap
        for (const obs of serverLane.obstacles) {
          this.prevObstaclePositions.set(obs.id, obs.position.x);
        }
      }
    }
  }

  private resetGame(): void {
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
    this.tickCount = 0;
    this.prevFrogX = this.gameData.frog.position.x;
    this.prizeSystem?.reset();
    this.tongueSystem?.reset();
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

    // Snapshot positions before this tick for interpolation
    this.prevFrogX = this.gameData.frog.position.x;
    for (const lane of this.gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        this.prevObstaclePositions.set(obstacle.id, obstacle.position.x);
      }
    }

    this.tickCount++;

    // Server owns obstacle spawning/movement; client owns all player physics
    if (socketClient.isConnected) {
      this.movementSystem.update(this.gameData, dt, this.gridSize, true);
    } else {
      this.spawnSystem.update(this.gameData, this.gridSize);
      this.movementSystem.update(this.gameData, dt, this.gridSize);
    }

    // Update prize system (spawn/expire prizes)
    this.prizeSystem.update(this.gridSize);

    // Update tongue system
    this.tongueSystem.update();

    // Check for tongue catching prizes
    const tongueCatch = this.tongueSystem.checkPrizeCollision(this.prizeSystem.getActivePrizes());
    if (tongueCatch) {
      this.handlePrizeCollected(tongueCatch);
    }

    // Check for frog walking over prizes
    const prizeCollision = this.prizeSystem.checkCollision(
      this.gameData.frog.position.x,
      this.gameData.frog.position.y,
    );
    if (prizeCollision) {
      this.handlePrizeCollected(prizeCollision.prize);
    }

    // Check invincibility expiration
    if (
      this.gameData.frog.isInvincible &&
      this.tickCount >= this.gameData.frog.invincibilityEndTick
    ) {
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

    // Notify server of death
    if (socketClient.isConnected) {
      socketClient.sendDeath(cause);
    }

    // Respawn frog at start
    this.gameData.frog.position = {
      x: Math.floor(this.gridSize / 2),
      y: this.gridSize - 1,
    };
    this.gameData.frog.isOnLog = false;
    this.prevFrogX = this.gameData.frog.position.x;

    // Send respawn position to server
    if (socketClient.isConnected) {
      socketClient.sendMove(this.gameData.frog.position.x, this.gameData.frog.position.y);
    }
  }

  private handleVictory(): void {
    this.gameData.score += 100;

    // Play victory sound
    soundManager.playVictory();

    // Notify server of victory
    if (socketClient.isConnected) {
      socketClient.sendVictory();
      socketClient.sendScoreUpdate(this.gameData.score);
    }

    // Respawn frog at start
    this.gameData.frog.position = {
      x: Math.floor(this.gridSize / 2),
      y: this.gridSize - 1,
    };
    this.gameData.frog.isOnLog = false;
    this.prevFrogX = this.gameData.frog.position.x;

    // Send respawn position to server
    if (socketClient.isConnected) {
      socketClient.sendMove(this.gameData.frog.position.x, this.gameData.frog.position.y);
    }
  }

  private handlePrizeCollected(prize: import('../../shared/types.js').Prize): void {
    console.log(`Collected ${prize.type}! +${prize.value} points`);
    this.gameData.score += prize.value;

    // Send score update to server
    if (socketClient.isConnected) {
      socketClient.sendScoreUpdate(this.gameData.score);
    }

    // Butterfly and crystal grant invincibility
    if (prize.type === 'butterfly' || prize.type === 'crystal') {
      this.gameData.frog.isInvincible = true;
      this.gameData.frog.invincibilityEndTick =
        this.tickCount + FroggerScene.INVINCIBILITY_DURATION;
      console.log(
        `Invincibility activated! Ends at tick ${this.gameData.frog.invincibilityEndTick}`,
      );
    }
  }

  render(renderer: Renderer, alpha = 0): void {
    this.renderer = renderer;
    renderer.clear();

    switch (this.state) {
      case 'start':
        renderStartScreen(renderer);
        renderer.showNameInput();
        break;

      case 'playing':
        this.renderGame(renderer, alpha);
        if (this.showHelp) renderHelpOverlay(renderer);
        if (this.showDebug) renderDebugPanel(renderer, this.getDebugData());
        break;
    }
  }

  private renderGame(renderer: Renderer, alpha: number): void {
    // Render lanes (background)
    this.renderLanes(renderer);

    // Render obstacles
    this.renderObstacles(renderer, alpha);

    // Render prizes
    this.renderPrizes(renderer);

    // Render remote players
    this.renderRemotePlayers(renderer);

    // Render tongue (before frog so it appears to come from mouth)
    this.renderTongue(renderer);

    // Render local frog
    this.renderFrog(renderer, alpha);

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

  private renderObstacles(renderer: Renderer, alpha: number): void {
    for (const lane of this.gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        const prevX = this.prevObstaclePositions.get(obstacle.id) ?? obstacle.position.x;
        const drawX = prevX + (obstacle.position.x - prevX) * alpha;
        const car = obstacle.type === 'car';

        if (car && obstacle.sprite) {
          renderer.drawVehicle(drawX, obstacle.position.y, obstacle.size, obstacle.sprite);
        } else if (car) {
          // Fallback for cars without sprite data (e.g., from server)
          renderer.drawRect(drawX, obstacle.position.y, obstacle.width, 1, 0xff0000);
        } else {
          renderer.drawRect(drawX, obstacle.position.y, obstacle.width, 1, 0x8b4513);
        }
      }
    }
  }

  private renderPrizes(renderer: Renderer): void {
    for (const prize of this.prizeSystem.getActivePrizes()) {
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

        renderer.drawPlayer(x, y, player.color);
      }
    }
  }

  private renderFrog(renderer: Renderer, alpha: number): void {
    const drawX = this.prevFrogX + (this.gameData.frog.position.x - this.prevFrogX) * alpha;
    const y = this.gameData.frog.position.y;
    renderer.drawPlayer(drawX, y, this.gameData.frog.color, this.gameData.frog.isInvincible);
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
    // SPACE: Start / Restart / Shoot tongue
    if (key === 'Space') {
      console.log('space hit');
      if (this.state === 'start' && this.renderer?.getNameValue() !== '') {
        socketClient.join(this.renderer?.getNameValue());
        this.renderer?.hideInput();
        this.state = 'playing';
        soundManager.unlock(); // Ensure audio context is unlocked
        soundManager.playGameStart();
        soundManager.startMusic();
      } else if (this.state === 'playing') {
        // Shoot tongue during gameplay
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
        // Snap prevFrogX so key-press hops are instant (no lerp)
        this.prevFrogX = this.gameData.frog.position.x;
        // Play hop sound on successful movement
        soundManager.playHop();

        // Send position to server
        if (socketClient.isConnected) {
          socketClient.sendMove(this.gameData.frog.position.x, this.gameData.frog.position.y);
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
