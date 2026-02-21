// Game Renderer - handles all rendering for the Frogger game
// Extracted from FroggerScene for single responsibility

import type { Renderer } from '../engine/types.js';
import type { GameData, Lane, Prize, Tongue } from '../../shared/types.js';
import type { RemotePlayer } from '../network/SocketClient.js';
import { renderHUD } from '../ui/HUD.js';

export interface RenderContext {
  gameData: GameData;
  remotePlayers: Map<string, RemotePlayer>;
  prizes: Prize[];
  tongue: Tongue;
  gridSize: number;
  tickCount: number;
}

export class GameRenderer {
  renderGame(renderer: Renderer, context: RenderContext): void {
    // Render lanes (background)
    this.renderLanes(renderer, context.gameData.lanes, context.gridSize, context.tickCount);

    // Render obstacles
    this.renderObstacles(renderer, context.gameData.lanes);

    // Render prizes
    this.renderPrizes(renderer, context.prizes, context.tickCount);

    // Render remote players
    this.renderRemotePlayers(renderer, context.remotePlayers);

    // Render tongue (before frog so it appears to come from mouth)
    this.renderTongue(renderer, context.tongue, context.gameData.frog.color);

    // Render local frog
    this.renderFrog(renderer, context.gameData);

    // Render HUD
    renderHUD(renderer, context.gameData.score);
  }

  private renderLanes(renderer: Renderer, lanes: Lane[], gridSize: number, tickCount: number): void {
    for (const lane of lanes) {
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
      renderer.drawRect(0, lane.y, gridSize, 1, color);

      // Road: dashed lane markings
      if (lane.type === 'road') {
        for (let x = 0; x < gridSize; x += 2) {
          renderer.drawRect(x + 0.25, lane.y, 0.5, 0.05, 0x5a5a5a);
        }
      }

      // Water: animated wave highlights that drift with the lane direction
      if (lane.type === 'water') {
        const drift = (tickCount * lane.speed * lane.direction * 0.05) % gridSize;
        for (let x = 0; x < gridSize; x += 1.5) {
          const waveX = (((x + drift) % gridSize) + gridSize) % gridSize;
          renderer.drawRect(waveX, lane.y + 0.3, 0.6, 0.1, 0x1156d6);
          renderer.drawRect(waveX + 0.7, lane.y + 0.6, 0.4, 0.08, 0x160096);
        }
      }
    }
  }

  private renderObstacles(renderer: Renderer, lanes: Lane[]): void {
    for (const lane of lanes) {
      for (const obstacle of lane.obstacles) {
        const car = obstacle.type === 'car';

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

  private renderPrizes(renderer: Renderer, prizes: Prize[], tickCount: number): void {
    for (const prize of prizes) {
      // Hover animation - bob up and down using sine wave
      // Use prize spawn time to offset phase so prizes don't all move in sync
      const hoverPhase = (tickCount + prize.spawnTime) * 0.15;
      const hoverOffset = Math.sin(hoverPhase) * 0.15; // 0.15 cells amplitude
      renderer.drawPrize(prize.position.x, prize.position.y + hoverOffset, prize.type);
    }
  }

  private renderRemotePlayers(renderer: Renderer, remotePlayers: Map<string, RemotePlayer>): void {
    for (const player of remotePlayers.values()) {
      if (player.isAlive) {
        const { x, y } = player.position;
        renderer.drawPlayer(x, y, player.color, player.isInvincible);
      }
    }
  }

  private renderFrog(renderer: Renderer, gameData: GameData): void {
    const { x, y } = gameData.frog.position;
    renderer.drawPlayer(x, y, gameData.frog.color, gameData.frog.isInvincible);
  }

  private renderTongue(renderer: Renderer, tongue: Tongue, frogColor: number): void {
    if (tongue.active) {
      renderer.drawTongue(tongue, frogColor);
    }
  }
}
