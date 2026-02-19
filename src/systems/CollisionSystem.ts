// Collision System - detects frog collisions with obstacles and zones
// Owner: Engine Developer

import { GameData, Obstacle, SIZE_TO_WIDTH } from '../../shared/types';

export type CollisionResult =
  | { type: 'none' }
  | { type: 'car' }
  | { type: 'water' }
  | { type: 'log'; logId: string }
  | { type: 'goal' };

export class CollisionSystem {
  private godMode: boolean = false;

  /**
   * Toggle god mode (no death from collisions).
   */
  setGodMode(enabled: boolean): void {
    this.godMode = enabled;
  }

  isGodMode(): boolean {
    return this.godMode;
  }

  /**
   * Check what the frog is colliding with.
   * Returns the collision result.
   */
  update(gameData: GameData): CollisionResult {
    const frogX = gameData.frog.position.x;
    const frogY = gameData.frog.position.y;

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
          if (this.pointInObstacle(frogX, frogY, obstacle)) {
            return { type: 'car' };
          }
        }
        return { type: 'none' };

      case 'water':
        // Check if on a log
        for (const obstacle of currentLane.obstacles) {
          if (this.pointInObstacle(frogX, frogY, obstacle)) {
            return { type: 'log', logId: obstacle.id };
          }
        }

        return { type: 'water' };
    }
  }

  /**
   * Check if a point is inside an obstacle's bounding box.
   */
  private pointInObstacle(x: number, y: number, obstacle: Obstacle): boolean {
    return (
      x >= obstacle.position.x &&
      x < obstacle.position.x + SIZE_TO_WIDTH[obstacle.size] &&
      y === obstacle.position.y
    );
  }
}
