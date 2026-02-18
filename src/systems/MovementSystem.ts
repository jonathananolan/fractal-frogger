// Movement System - handles frog and obstacle movement
// Owner: Engine Developer

import { GameData, SIZE_TO_WIDTH } from "../../shared/types";

//import type { GameData, Lane, Obstacle, Point } from '../entities/types.js';
//import { SIZE_TO_WIDTH } from '../entities/types.js';

export class MovementSystem {
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
        const width = SIZE_TO_WIDTH[obstacle.size];
        if (obstacle.velocity > 0 && obstacle.position.x > gridSize) {
          obstacle.position.x = -width;
        } else if (obstacle.velocity < 0 && obstacle.position.x + width < 0) {
          obstacle.position.x = gridSize;
        }
      }
    }

    // if frog on log, move frog
    if (gameData.frog.isOnLog) {
      // get frog's log
      const logId = gameData.frog.currentLogId as string
      const log = gameData.lanes
        .flatMap(l => l.obstacles)
        .find(o => o.id === logId)

      // update frog's position
      //const frogVelocity = log.direction * log.speed
      if (log) {
        gameData.frog.position.x += log.velocity * dt
      } else {
        throw new Error("no log found")
      }
    }
  }
}
