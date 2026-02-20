// Frogger Scene - main game scene with multiplayer support
// Owner: Systems Integrator

import type { Scene, GameContext, Renderer, GameState, DebugData } from '../engine/types.js';

// Network
import { socketClient } from '../network/SocketClient.js';

// Audio
import { soundManager } from '../audio/SoundManager.js';

// UI
import { renderStartScreen } from '../ui/StartScreen.js';
import { renderHUD } from '../ui/HUD.js';
import { renderHelpOverlay } from '../ui/HelpOverlay.js';
import { renderDebugPanel } from '../ui/DebugPanel.js';

// Server URL - use localhost in dev, same origin in production
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

import { ServerGameState, Direction } from '../../shared/types.js';
import { loadSprites, loadBackground } from '../sprites.js';
import { GRID_SIZE } from '../../shared/constants.js';

loadSprites();
loadBackground();

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
  private gridSize: number = GRID_SIZE;
  private tickCount: number = 0;

  // UI toggles
  private showHelp: boolean = false;
  private showDebug: boolean = false;

  private serverGameState: ServerGameState | null = null;
  private localPlayerId: string | null = null;
  private localPlayerColor: number = 0x44ff44;

  private state: 'start' | 'playing' = 'start';

  init(context: GameContext): void {
    this.resetGame();
    this.connectToServer();
  }

  private connectToServer(): void {
    socketClient.connect(SERVER_URL, {
      onWelcome: (playerId, color) => {
        this.localPlayerId = playerId;
        this.localPlayerColor = color;
      },
      onPlayerJoined: (_playerId, _color, _name) => {
        soundManager.playPlayerJoined();
      },
      onPlayerLeft: (_playerId) => {
        // no-op: gameState will stop including them next tick
      },
      onGameState: (state) => {
        this.serverGameState = state;
      },
    });

    setTimeout(() => {
      socketClient.join();
    }, 100);
  }

  private resetGame(): void {
    this.serverGameState = null;
    this.localPlayerId = null;
    this.tickCount = 0;
  }

  update(_dt: number): void {
    if (this.state !== 'playing') return;
    this.tickCount++;
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
    }
  }

  private renderGame(renderer: Renderer): void {
    if (!this.serverGameState) return;

    // Render lanes (background)
    this.renderLanes(renderer);

    // Render obstacles
    this.renderObstacles(renderer);

    // Render remote players
    this.renderPlayers(renderer);

    // Render HUD
    this.renderHUD(renderer);
  }

  private renderLanes(renderer: Renderer): void {
    for (const lane of this.serverGameState.lanes) {
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
    for (const lane of this.serverGameState.lanes) {
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

  private renderPlayers(renderer: Renderer): void {
    for (const player of this.serverGameState!.players) {
      if (player.isAlive) {
        renderer.drawPlayer(player.position.x, player.position.y, player.color);
      }
    }
  }

  private renderHUD(renderer: Renderer): void {
    const localPlayer = this.serverGameState?.players.find((p) => p.id === this.localPlayerId);
    renderHUD(renderer, localPlayer?.score ?? 0);
  }

  private getDebugData(): DebugData {
    const localPlayer = this.serverGameState?.players.find((p) => p.id === this.localPlayerId);
    const lane = this.serverGameState?.lanes.find((l) => l.y === localPlayer?.position.y);

    return {
      frogPosition: localPlayer?.position ?? { x: 0, y: 0 },
      currentLaneType: lane?.type ?? 'safe',
      isOnLog: !!localPlayer?.ridingObstacleId,
      tickCount: this.tickCount,
    };
  }

  onKeyDown(key: string): void {
    // SPACE: Start / Restart
    if (key === 'Space') {
      if (this.state === 'start') {
        this.state = 'playing';
        soundManager.unlock();
        soundManager.playGameStart();
        soundManager.startMusic();
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
      socketClient.sendInput(direction);
      soundManager.playHop();
    }
  }

  destroy(): void {
    // Disconnect from server
    socketClient.disconnect();
  }
}
