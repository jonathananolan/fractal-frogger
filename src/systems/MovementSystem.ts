// Movement System - handles frog and obstacle movement
// Owner: Engine Developer

import type { GameData, Lane, Point } from '../entities/types.js';

export class MovementSystem {
  /**
   * Move the frog one cell in the given direction.
   * Returns true if move was valid, false if blocked (edge of grid).
   */
  moveFrog(gameData: GameData, direction: 'up' | 'down' | 'left' | 'right', gridSize: number): boolean {
    if (direction == 'left' && gameData.frog.position.x > 0) {
      gameData.frog.position.x -= 1

    } else if (direction == 'right' && gameData.frog.position.x < gridSize - 1) {
      gameData.frog.position.x += 1

    } else if (direction == 'up' && gameData.frog.position.y > 0) {
      gameData.frog.position.y -= 1

    } else if (direction == 'down' && gameData.frog.position.y < gridSize - 1) {
      gameData.frog.position.y += 1
    }
    return true;
  }

  /**
   * Update all obstacle positions based on their velocities.
   * Also moves frog if riding a log.
   */
  update(gameData: GameData, dt: number, gridSize: number): void {
    // TODO: Implement obstacle movement
    // - Loop through all lanes
    // - Move each obstacle by velocity * dt
    // - If frog is on a log, move frog with log

    // move all objects
    for (const lane of gameData.lanes) {
      for (const obstacle of lane.obstacles) {
        obstacle.position.x += obstacle.velocity * dt
      }
    }

    // if frog on log, move frog
    if (gameData.frog.isOnLog) {
      // get frog's Y position
      const frogY = gameData.frog.position.y

      // match frog's Y position with lane
      let frogLane: Lane = gameData.lanes[0] // HACKY, should always correctly assign lane in bottom loop
      for (const lane of gameData.lanes) {
        if (frogY == lane.y) {
          frogLane = lane
        }
      }

      // update frog's position
      const frogVelocity = frogLane.direction * frogLane.speed
      gameData.frog.position.x += frogVelocity * dt
    }
  }
}