// Prize System - spawning, tracking, and collision detection for prizes
// Owner: Engine Developer

import { Prize, PrizeType, Point } from '../../shared/types.js';
import { getRandomPrizeType, getPrizeConfig } from './PrizeRegistry.js';

export interface PrizeCollision {
  type: 'collected';
  prize: Prize;
}

export class PrizeSystem {
  private prizes: Prize[] = [];
  private nextId: number = 0;
  private tickCount: number = 0;

  // Configuration
  private spawnChance: number = 0.02; // 2% chance per tick to spawn
  private maxPrizes: number = 5; // max prizes on screen

  // Valid spawn zones (y positions) - safe zones and road/water lanes
  private validSpawnY: number[] = [];

  constructor(gridSize: number) {
    // Build valid spawn positions (avoid goal zone)
    for (let y = 7; y < gridSize; y++) {
      this.validSpawnY.push(y);
    }
  }

  /**
   * Update prize system - spawn new prizes, remove expired ones
   */
  update(gridSize: number): void {
    this.tickCount++;

    // Try to spawn a new prize
    if (this.prizes.length < this.maxPrizes && Math.random() < this.spawnChance) {
      this.spawnPrize(gridSize);
    }

    // Remove expired prizes
    this.prizes = this.prizes.filter((prize) => {
      const config = getPrizeConfig(prize.type);
      if (config.duration === 0) return true; // permanent
      const age = this.tickCount - prize.spawnTime;
      return age < config.duration && !prize.collected;
    });
  }

  /**
   * Check if frog collides with any prize
   */
  checkCollision(frogX: number, frogY: number): PrizeCollision | null {
    for (const prize of this.prizes) {
      if (prize.collected) continue;

      // Simple grid-based collision (both are 1x1)
      if (Math.floor(frogX) === Math.floor(prize.position.x) && frogY === prize.position.y) {
        prize.collected = true;
        return { type: 'collected', prize };
      }
    }
    return null;
  }

  /**
   * Get all active (non-collected) prizes for rendering
   */
  getActivePrizes(): Prize[] {
    return this.prizes.filter((p) => !p.collected);
  }

  /**
   * Spawn a prize at a random valid position
   */
  private spawnPrize(gridSize: number): void {
    const type = getRandomPrizeType();
    const config = getPrizeConfig(type);

    // Random position on valid row
    const y = this.validSpawnY[Math.floor(Math.random() * this.validSpawnY.length)];
    const x = Math.floor(Math.random() * gridSize);

    // Check for overlap with existing prizes
    const overlaps = this.prizes.some((p) => p.position.x === x && p.position.y === y);
    if (overlaps) return;

    const prize: Prize = {
      id: `prize-${this.nextId++}`,
      position: { x, y },
      type,
      value: config.value,
      collected: false,
      spawnTime: this.tickCount,
    };

    this.prizes.push(prize);
  }

  /**
   * Reset all prizes (e.g., on game restart)
   */
  reset(): void {
    this.prizes = [];
    this.tickCount = 0;
  }

  /**
   * Get count of active prizes (for debugging)
   */
  getActiveCount(): number {
    return this.getActivePrizes().length;
  }
}
