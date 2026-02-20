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
import { renderGameOverScreen } from '../ui/GameOverScreen.js';
import { renderVictoryScreen } from '../ui/VictoryScreen.js';
import { renderHUD } from '../ui/HUD.js';
import { renderHelpOverlay } from '../ui/HelpOverlay.js';
import { renderDebugPanel } from '../ui/DebugPanel.js';

// Server URL - use localhost in dev, same origin in production
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

import { GameData, Lane, VehicleSize, SIZE_TO_WIDTH } from '../../shared/types.js';
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

  // Multiplayer state
  private multiplayerEnabled: boolean = true;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private localPlayerColor: number = 0x44ff44;

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
    });

    // Join once connected
    setTimeout(() => {
      socketClient.join();
    }, 100);
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

    // Notify server of death
    if (socketClient.isConnected) {
      socketClient.sendDeath(cause);
    }

    this.gameData.frog.lives--;

    if (this.gameData.frog.lives <= 0) {
      this.state = 'gameOver';
      soundManager.stopMusic();
    } else {
      // Respawn frog at start
      this.gameData.frog.position = {
        x: Math.floor(this.gridSize / 2),
        y: this.gridSize - 1,
      };
      this.gameData.frog.isOnLog = false;

      // Send respawn position to server
      if (socketClient.isConnected) {
        socketClient.sendMove(this.gameData.frog.position.x, this.gameData.frog.position.y);
      }
    }
  }

  private handleVictory(): void {
    this.gameData.score += 100;
    this.state = 'victory';

    // Play victory sound and stop music
    soundManager.playVictory();
    soundManager.stopMusic();

    // Notify server of victory
    if (socketClient.isConnected) {
      socketClient.sendVictory();
    }
  }

  private handlePrizeCollected(prize: import('../../shared/types.js').Prize): void {
    console.log(`Collected ${prize.type}! +${prize.value} points`);
    this.gameData.score += prize.value;

    // Butterfly and crystal grant invincibility
    if (prize.type === 'butterfly' || prize.type === 'crystal') {
      this.gameData.frog.isInvincible = true;
      this.gameData.frog.invincibilityEndTick = this.tickCount + FroggerScene.INVINCIBILITY_DURATION;
      console.log(`Invincibility activated! Ends at tick ${this.gameData.frog.invincibilityEndTick}`);
    }
  }

  render(renderer: Renderer): void {
    renderer.clear();

    switch (this.state) {
      case 'start':
        renderStartScreen(renderer);
        break;

      case 'playing':
        this.renderGame(renderer);
        if (this.showHelp) renderHelpOverlay(renderer);
        if (this.showDebug) renderDebugPanel(renderer, this.getDebugData());
        break;

      case 'gameOver':
        this.renderGame(renderer);
        renderGameOverScreen(renderer, this.gameData.score);
        break;

      case 'victory':
        this.renderGame(renderer);
        renderVictoryScreen(renderer, this.gameData.score);
        break;
    }
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
    renderHUD(renderer, this.gameData.frog.lives, this.gameData.score);
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
          renderer.drawRect(
            Math.floor(obstacle.position.x),
            obstacle.position.y,
            obstacle.width,
            1,
            0x8b4513, // brown for logs
          );
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
    // SPACE: Start / Restart / Shoot tongue
    if (key === 'Space') {
      if (this.state === 'start') {
        this.state = 'playing';
        soundManager.unlock(); // Ensure audio context is unlocked
        soundManager.playGameStart();
        soundManager.startMusic();
      } else if (this.state === 'gameOver' || this.state === 'victory') {
        this.resetGame();
        this.state = 'start';
        soundManager.playRestart();
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
