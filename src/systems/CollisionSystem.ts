// Collision System - detects frog collisions with obstacles and zones
// Owner: Engine Developer

import { GameData } from '../../shared/types';

export type CollisionResult =
  | { type: 'none' }
  | { type: 'car' }
  | { type: 'water' }
  | { type: 'log'; logId: string }
  | { type: 'goal' };

export class CollisionSystem {
  /**
   * Check what the frog is colliding with.
   * Returns the collision result.
   */
  update(gameData: GameData): CollisionResult {
    const frogX = gameData.frog.position.x;
    const frogY = gameData.frog.position.y;
    const frogHeight = gameData.frog.height;
    const frogWidth = gameData.frog.width;

    // Find which lane the frog is in
    const currentLane = gameData.lanes.find((l) => l.y === frogY);
    if (!currentLane) {
      return { type: 'none' };
    }

    // Check lane type
    switch (currentLane.type) {
      case 'goal':
        return { type: 'goal' };

      case 'safe':
        return { type: 'none' };

      case 'road':
        // Check collision with cars
        for (const obstacle of currentLane.obstacles) {
          const obstacleX = obstacle.position.x;
          const obstacleY = obstacle.position.y;
          const obstacleWidth = obstacle.width;
          const obstacleHeight = obstacle.height;
          if (
            this.collides(
              frogX,
              frogY,
              frogWidth,
              frogHeight,
              obstacleX,
              obstacleY,
              obstacleWidth,
              obstacleHeight,
            )
          ) {
            return { type: 'car' };
          }
        }
        return { type: 'none' };

      case 'water':
        // Check if on a log
        for (const obstacle of currentLane.obstacles) {
          const obstacleX = obstacle.position.x;
          const obstacleY = obstacle.position.y;
          const obstacleWidth = obstacle.width;
          const obstacleHeight = obstacle.height;
          if (
            this.collides(
              frogX,
              frogY,
              frogWidth,
              frogHeight,
              obstacleX,
              obstacleY,
              obstacleWidth,
              obstacleHeight,
            )
          ) {
            return { type: 'log', logId: obstacle.id };
          }
        }

        return { type: 'water' };
    }
  }

  /**
   * input: the bounding boxes (x, y, width, height) of two shapes
   * output: whether the bounding boxes overlap
   *
   * checks whether both X ranges and Y ranges overlap
   *
   * see link for more details: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
   */
  private collides(
    ax: number,
    ay: number,
    aWidth: number,
    aHeight: number,
    bx: number,
    by: number,
    bWidth: number,
    bHeight: number,
  ): boolean {
    return (
      ax < bx + bWidth &&
      bx < ax + aWidth &&
      ay < by + bHeight &&
      by < ay + aHeight);
  }
}
