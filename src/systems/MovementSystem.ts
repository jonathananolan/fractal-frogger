// Movement System - handles frog and obstacle movement
// Owner: Engine Developer

import { GameData } from '../../shared/types';

//import type { GameData, Lane, Obstacle, Point } from '../entities/types.js';
//import { SIZE_TO_WIDTH } from '../entities/types.js';

export class MovementSystem {
  // Track the last known log position to calculate delta movement
  private lastLogX: number | null = null;
  /**
   * Move the frog one cell in the given direction.
   * Returns true if move was valid, false if blocked (edge of grid).
   */
  moveFrog(
    gameData: GameData,
    direction: 'up' | 'down' | 'left' | 'right',
    gridSize: number,
  ): boolean {
    const { position } = gameData.frog;
    let newX = position.x;
    let newY = position.y;

    switch (direction) {
      case 'up':
        newY -= 1;
        break;
      case 'down':
        newY += 1;
        break;
      case 'left':
        newX -= 1;
        break;
      case 'right':
        newX += 1;
        break;
    }

    // Check grid boundaries
    if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
      return false;
    }

    // Update position
    position.x = newX;
    position.y = newY;
    return true;
  }

  /**
   * Update all obstacle positions based on their velocities.
   * Also moves frog if riding a log.
   */
  update(gameData: GameData, dt: number, gridSize: number): void {
    // Move all obstacles
    for (const lane of gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        obstacle.position.x += obstacle.velocity * dt;

        // Wrap around when obstacle goes off screen
        const width = obstacle.width;
        if (obstacle.velocity > 0 && obstacle.position.x > gridSize) {
          obstacle.position.x = -width;
        } else if (obstacle.velocity < 0 && obstacle.position.x + width < 0) {
          obstacle.position.x = gridSize;
        }
      }
    }

    // if frog on log, move frog by tracking log's actual position change
    if (gameData.frog.isOnLog) {
      const logId = gameData.frog.currentLogId as string;
      const log = gameData.lanes.flatMap((l) => l.obstacles).find((o) => o.id === logId);

      if (log) {
        // If we have a previous log position, move frog by the same delta
        if (this.lastLogX !== null) {
          const logDelta = log.position.x - this.lastLogX;
          gameData.frog.position.x += logDelta;
        }
        // Remember current log position for next frame
        this.lastLogX = log.position.x;
      } else {
        // Log disappeared (went off screen), reset tracking
        this.lastLogX = null;
      }
    } else {
      // Frog not on log, reset tracking
      this.lastLogX = null;
    }
  }
}
