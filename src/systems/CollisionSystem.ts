// Collision System - detects frog collisions with obstacles and zones
// Owner: Engine Developer

import type { GameData, Lane, Obstacle } from '../entities/types.js';

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
    // TODO: Implement collision detection
    // - Find which lane the frog is in
    // - Check lane type (safe, road, water, goal)
    // - If road: check collision with cars
    // - If water: check if on log, otherwise water death
    // - If goal: return goal reached
    // - Respect godMode flag
    return { type: 'none' };
  }

  /**
   * Check if a point is inside an obstacle's bounding box.
   */
  private pointInObstacle(x: number, y: number, obstacle: Obstacle): boolean {
    return (
      x >= obstacle.position.x &&
      x < obstacle.position.x + obstacle.width &&
      y === obstacle.position.y
    );
  }
}
