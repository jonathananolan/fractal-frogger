// Frogger Scene - main game scene
// Owner: Systems Integrator

import type { Scene, GameContext, Renderer } from '../engine/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from '../engine/types.js';
import type { GameData, GameState, DebugData, Lane } from '../entities/types.js';

// Systems
import { MovementSystem } from '../systems/MovementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';

// UI
import { renderStartScreen } from '../ui/StartScreen.js';
import { renderGameOverScreen } from '../ui/GameOverScreen.js';
import { renderVictoryScreen } from '../ui/VictoryScreen.js';
import { renderHUD } from '../ui/HUD.js';
import { renderHelpOverlay } from '../ui/HelpOverlay.js';
import { renderDebugPanel } from '../ui/DebugPanel.js';

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

  // UI toggles
  private showHelp: boolean = false;
  private showDebug: boolean = false;

  init(context: GameContext): void {
    this.gridSize = context.gridSize;
    this.resetGame();
  }

  private resetGame(): void {
    this.gameData = {
      frog: {
        position: { x: Math.floor(this.gridSize / 2), y: this.gridSize - 1 },
        lives: 3,
        isAlive: true,
        isOnLog: false,
      },
      lanes: this.createLanes(),
      score: 0,
      timeRemaining: 30,
      level: 1,
    };
    this.tickCount = 0;

    // TEST: Add a car to see it render (remove later)
    const roadLane = this.gameData.lanes.find((l) => l.y === 17);
    if (roadLane) {
      roadLane.obstacles.push({
        id: 'test-car-1',
        position: { x: 5, y: 17 },
        width: 2,
        velocity: 5,
        type: 'car',
      });
    }

    // TEST: Add a log to see it render (remove later)
    const waterLane = this.gameData.lanes.find((l) => l.y === 11);
    if (waterLane) {
      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 11 },
        width: 3,
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 9 },
        width: 3,
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 10 },
        width: 3,
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 8 },
        width: 3,
        velocity: 0.3,
        type: 'log',
      });

      waterLane.obstacles.push({
        id: 'test-log-1',
        position: { x: 8, y: 7 },
        width: 3,
        velocity: 0.3,
        type: 'log',
      });
    }
  }

  private createLanes(): Lane[] {
    // TODO: Configure lanes for Frogger layout
    // Bottom rows: safe zone
    // Middle rows: road with cars
    // Upper-middle rows: water with logs
    // Top row: goal zone

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

    // Update systems
    this.spawnSystem.update(this.gameData, this.gridSize);
    this.movementSystem.update(this.gameData, dt, this.gridSize);

    const collision = this.collisionSystem.update(this.gameData);

    // Handle collision results
    switch (collision.type) {
      case 'car':
      case 'water':
        this.handleDeath();
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

  private handleDeath(): void {
    if (this.collisionSystem.isGodMode()) return;

    this.gameData.frog.lives--;

    if (this.gameData.frog.lives <= 0) {
      this.state = 'gameOver';
    } else {
      // Respawn frog at start
      this.gameData.frog.position = {
        x: Math.floor(this.gridSize / 2),
        y: this.gridSize - 1,
      };
      this.gameData.frog.isOnLog = false;
    }
  }

  private handleVictory(): void {
    this.gameData.score += 100;
    this.state = 'victory';
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

    // Render frog
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
    }
  }

  private renderObstacles(renderer: Renderer): void {
    for (const lane of this.gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        const color = obstacle.type === 'car' ? 0xcc4444 : 0x8b4513; // red for cars, brown for logs
        renderer.drawRect(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.width,
          1,
          color,
        );
      }
    }
  }

  private renderFrog(renderer: Renderer): void {
    const { x, y } = this.gameData.frog.position;
    renderer.drawRect(x, y, 1, 1, 0x44ff44); // bright green frog
  }

  private getDebugData(): DebugData {
    const frogY = this.gameData.frog.position.y;
    const currentLane = this.gameData.lanes.find((l) => l.y === frogY);

    return {
      frogPosition: this.gameData.frog.position,
      currentLaneType: currentLane?.type ?? 'safe',
      isOnLog: this.gameData.frog.isOnLog,
      godMode: this.collisionSystem.isGodMode(),
      tickCount: this.tickCount,
    };
  }

  onKeyDown(key: string): void {
    // SPACE: Start / Restart
    if (key === 'Space') {
      console.log('space hit');
      if (this.state === 'start') {
        this.state = 'playing';
      } else if (this.state === 'gameOver' || this.state === 'victory') {
        this.resetGame();
        this.state = 'start';
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

    // D: Toggle debug
    if (key === 'KeyD') {
      this.showDebug = !this.showDebug;
      return;
    }

    // G: Toggle god mode (only when debug is on)
    if (key === 'KeyG' && this.showDebug) {
      this.collisionSystem.setGodMode(!this.collisionSystem.isGodMode());
      return;
    }

    // Movement
    const direction = KEY_DIRECTION[key];
    if (direction) {
      this.movementSystem.moveFrog(this.gameData, direction, this.gridSize);
    }
  }

  onKeyUp(_key: string): void {
    // No-op for Frogger
  }

  destroy(): void {
    // Clean up if needed
  }
}
