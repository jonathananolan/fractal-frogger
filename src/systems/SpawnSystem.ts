// Spawn System - spawns and despawns obstacles in lanes
// Owner: Engine Developer

import type {
  GameData,
  Lane,
  Obstacle,
  VehicleSize,
  SpriteData,
} from "../entities/types.js";
import { SIZE_TO_WIDTH } from "../entities/types.js";
import { VEHICLES_BY_SIZE } from "../sprites.js";

export class SpawnSystem {
  private tickCounters: Map<number, number> = new Map(); // lane y -> ticks since last spawn
  private obstacleIdCounter: number = 0;

  /**
   * Update spawning for all lanes.
   * Spawns new obstacles and removes ones that left the grid.
   */
  update(gameData: GameData, gridSize: number): void {
    for (const lane of gameData.lanes) {
      if (lane.type === "safe" || lane.type === "goal") continue;

      // TODO: Implement spawn logic
      // - Track ticks since last spawn per lane
      // - When spawn rate reached, spawn new obstacle at edge
      // - Spawn from left if direction = 1, from right if direction = -1

      // TODO: Implement despawn logic
      // - Remove obstacles that have fully exited the grid
    }
  }

  /**
   * Create a new obstacle at the spawn edge of a lane.
   */
  private spawnObstacle(
    lane: Lane,
    gridSize: number,
    size?: VehicleSize,
  ): Obstacle {
    const isRoad = lane.type === "road";
    const actualSize = size ?? "m";

    let sprite: SpriteData | undefined;

    if (isRoad) {
      const vehiclesToChooseFrom = VEHICLES_BY_SIZE[actualSize];
      const index = Math.floor(Math.random() * vehiclesToChooseFrom.length);

      sprite = vehiclesToChooseFrom[index];
    }

    const id = `obstacle-${this.obstacleIdCounter++}`;
    const width = SIZE_TO_WIDTH[actualSize];
    const x = lane.direction === 1 ? -width : gridSize;

    return {
      id,
      position: { x, y: lane.y },
      size: actualSize,
      velocity: lane.speed * lane.direction,
      type: lane.type === "road" ? "car" : "log",
      sprite,
    };
  }
}
