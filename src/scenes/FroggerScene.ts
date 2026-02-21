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
import { NetworkManager } from '../network/NetworkManager.js';

// Audio
import { soundManager } from '../audio/SoundManager.js';

// UI
import { renderStartScreen } from '../ui/StartScreen.js';
import { renderHelpOverlay } from '../ui/HelpOverlay.js';
import { renderDebugPanel } from '../ui/DebugPanel.js';

import type { GameData, Lane, Player, Prize } from '../../shared/types.js';
import { loadSprites, loadBackground } from '../sprites.js';
import { GRID_SIZE, INVINCIBILITY_DURATION, POSITION_SYNC_INTERVAL } from '../../shared/constants.js';
import { isMobile } from '../../shared/utils.js';
import { getRandomFrogName } from '../../shared/frogNames.js';
import { createDefaultLanes } from '../../shared/laneConfig.js';
import { InputHandler, Direction } from './InputHandler.js';
import { GameRenderer } from './GameRenderer.js';

loadSprites();
loadBackground();
loadPrizeSprites();

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
  private inputHandler: InputHandler;
  private gameRenderer = new GameRenderer();

  // UI toggles
  private showHelp: boolean = false;
  private showDebug: boolean = false;

  // Multiplayer
  private networkManager = new NetworkManager();
  private localPlayerColor: number = 0x44ff44;
  private lastSyncTick: number = 0;

  //renderer.
  private renderer: Renderer | null = null;
  private mobileAutoStarted: boolean = false;

  constructor() {
    this.inputHandler = new InputHandler(
      {
        onStartGame: () => this.startGame(),
        onShootTongue: () => this.tongueSystem.shoot(this.gameData.frog.position),
        onToggleHelp: () => { this.showHelp = !this.showHelp; },
        onToggleDebug: () => { this.showDebug = !this.showDebug; },
        onMove: (direction: Direction) => this.handleMove(direction),
      },
      () => this.state === 'playing'
    );
  }

  init(context: GameContext): void {
    this.gridSize = context.gridSize;
    this.prizeSystem = new PrizeSystem(this.gridSize);
    this.resetGame();
    this.connectToServer();
  }

  private connectToServer(): void {
    this.networkManager.connect({
      onColorAssigned: (color) => {
        this.localPlayerColor = color;
        this.gameData.frog.color = color;
      },
      onLanesSync: (lanes) => this.syncLanesFromServer(lanes),
      onLocalPlayerSync: (player, shouldSync) => {
        // Sync local player's score from server (server handles prize scoring)
        this.gameData.score = player.score;

        // Check if it's time for a position sync
        const shouldSyncPosition = this.tickCount - this.lastSyncTick >= POSITION_SYNC_INTERVAL;
        if (shouldSyncPosition) {
          this.gameData.frog.position = { ...player.position };
          this.gameData.frog.isInvincible = player.isInvincible;
          this.gameData.frog.invincibilityEndTick = player.invincibilityEndTick;
          this.lastSyncTick = this.tickCount;
        }
      },
      onPrizesSync: (_prizes) => {
        // Prizes are managed by networkManager, no action needed
      },
      findUnoccupiedSpawnPosition: () => this.findUnoccupiedSpawnPosition(),
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
      lanes: createDefaultLanes(),
      score: 0,
      timeRemaining: 30,
      level: 1,
    };
    // Now find an unoccupied spawn position
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.tickCount = 0;
    this.prizeSystem?.reset();
    this.tongueSystem?.reset();
  }

  update(dt: number): void {
    if (this.state !== 'playing') return;

    this.tickCount++;

    // In multiplayer mode, server handles obstacle spawning/movement
    // Only run local spawn/movement if not connected
    if (!this.networkManager.isConnected) {
      this.spawnSystem.update(this.gameData, this.gridSize);
      this.movementSystem.update(this.gameData, dt, this.gridSize);
    } else {
      // Still update frog position on logs (client-side for responsiveness)
      this.movementSystem.update(this.gameData, dt, this.gridSize);
    }

    // Update prize system - use server prizes when connected, local otherwise
    if (!this.networkManager.isConnected) {
      this.prizeSystem.update(this.gridSize);
    }

    // Update tongue system
    this.tongueSystem.update();

    // Get active prizes (server or local depending on connection)
    const activePrizes = this.networkManager.isConnected ? this.networkManager.getServerPrizes() : this.prizeSystem.getActivePrizes();

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
        // Skip death if invincible
        if (!this.gameData.frog.isInvincible) {
          this.handleDeath(collision.type);
        }
        break;
      case 'water':
        // Water deaths are server-authoritative only - client/server log positions
        // can desync, causing false drowning. Let the server handle water deaths
        // and sync the position back to us via onGameState.
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
    this.networkManager.sendDeath(cause);

    // Respawn frog at start (local for immediate feedback)
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.gameData.frog.isOnLog = false;
  }

  private findUnoccupiedSpawnPosition(): { x: number; y: number } {
    const spawnY = this.gridSize - 1;
    const occupiedX = new Set<number>();

    // Add remote players on spawn row
    for (const player of this.networkManager.getRemotePlayers().values()) {
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
    this.networkManager.sendVictory();
    this.networkManager.sendScoreUpdate(this.gameData.score);

    // Respawn frog at start (local for immediate feedback)
    this.gameData.frog.position = this.findUnoccupiedSpawnPosition();
    this.gameData.frog.isOnLog = false;
  }

  private handlePrizeCollected(prize: Prize): void {
    console.log(`Collected ${prize.type}! +${prize.value} points`);

    // Send prize collection to server (server handles score)
    if (this.networkManager.isConnected) {
      this.networkManager.sendPrizeCollected(prize.id);
      // Remove from local array immediately for responsiveness
      this.networkManager.removeServerPrize(prize.id);
    } else {
      // Local mode - update score directly
      this.gameData.score += prize.value;
    }

    // Butterfly and crystal grant invincibility
    if (prize.type === 'butterfly' || prize.type === 'crystal') {
      this.gameData.frog.isInvincible = true;
      this.gameData.frog.invincibilityEndTick = this.tickCount + INVINCIBILITY_DURATION;
      console.log(`Invincibility activated! Ends at tick ${this.gameData.frog.invincibilityEndTick}`);
    }
  }

  render(renderer: Renderer): void {
    this.renderer = renderer;
    renderer.clear();

    switch (this.state) {
      case 'start':
        // On mobile, auto-start with a random frog name
        if (isMobile() && !this.mobileAutoStarted) {
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

  private startGame(): void {
    const name = this.renderer?.getNameValue() ?? '';
    if (this.state === 'start' && name !== '') {
      this.startGameWithName(name);
    }
  }

  private startGameWithName(name: string): void {
    this.networkManager.join(name);
    this.renderer?.hideInput();
    this.state = 'playing';
    soundManager.unlock();
    soundManager.playGameStart();
    soundManager.startMusic();
  }

  private renderGame(renderer: Renderer): void {
    const prizes = this.networkManager.isConnected ? this.networkManager.getServerPrizes() : this.prizeSystem.getActivePrizes();
    this.gameRenderer.renderGame(renderer, {
      gameData: this.gameData,
      remotePlayers: this.networkManager.getRemotePlayers(),
      prizes,
      tongue: this.tongueSystem.getTongue(),
      gridSize: this.gridSize,
      tickCount: this.tickCount,
    });
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

  private handleMove(direction: Direction): void {
    const moved = this.movementSystem.moveFrog(this.gameData, direction, this.gridSize);

    if (moved) {
      // Play hop sound on successful movement
      soundManager.playHop();

      // Send input direction to server (server-authoritative movement)
      this.networkManager.sendInput(direction);
    }
  }

  onKeyDown(key: string): void {
    this.inputHandler.handleKeyDown(key);
  }

  onKeyUp(key: string): void {
    this.inputHandler.handleKeyUp(key);
  }

  destroy(): void {
    // Disconnect from server
    this.networkManager.disconnect();
  }
}
