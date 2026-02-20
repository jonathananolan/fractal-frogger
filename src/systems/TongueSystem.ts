// Tongue System - handles frog tongue shooting and prize catching
// Owner: Engine Developer

import { Tongue, Prize, Point } from '../../shared/types.js';

// Tongue extends 2 grid cells (60 pixels at 30px/cell)
const TONGUE_RANGE = 2;
// Speed in grid cells per tick
const TONGUE_SPEED = 0.4;

export class TongueSystem {
  private tongue: Tongue = {
    active: false,
    startY: 0,
    currentY: 0,
    targetY: 0,
    x: 0,
    extending: false,
    caughtPrize: null,
  };

  /**
   * Shoot the tongue from the frog's position
   */
  shoot(frogPosition: Point): boolean {
    // Can't shoot if tongue is already active
    if (this.tongue.active) return false;

    this.tongue = {
      active: true,
      startY: frogPosition.y,
      currentY: frogPosition.y,
      targetY: frogPosition.y - TONGUE_RANGE,
      x: frogPosition.x,
      extending: true,
      caughtPrize: null,
    };

    return true;
  }

  /**
   * Update tongue position each tick
   */
  update(): void {
    if (!this.tongue.active) return;

    if (this.tongue.extending) {
      // Move tongue upward
      this.tongue.currentY -= TONGUE_SPEED;

      // Check if reached target
      if (this.tongue.currentY <= this.tongue.targetY) {
        this.tongue.currentY = this.tongue.targetY;
        this.tongue.extending = false; // Start retracting
      }
    } else {
      // Retract tongue
      this.tongue.currentY += TONGUE_SPEED;

      // Check if fully retracted
      if (this.tongue.currentY >= this.tongue.startY) {
        this.tongue.active = false;
        this.tongue.caughtPrize = null;
      }
    }
  }

  /**
   * Check if tongue tip collides with any prize
   * Returns the caught prize or null
   */
  checkPrizeCollision(prizes: Prize[]): Prize | null {
    if (!this.tongue.active || this.tongue.caughtPrize) return null;

    const tongueX = Math.floor(this.tongue.x);
    const tongueY = Math.floor(this.tongue.currentY);

    for (const prize of prizes) {
      if (prize.collected) continue;

      // Check if tongue tip overlaps with prize (same grid cell)
      if (Math.floor(prize.position.x) === tongueX && prize.position.y === tongueY) {
        this.tongue.caughtPrize = prize.id;
        prize.collected = true;
        return prize;
      }
    }

    return null;
  }

  /**
   * Get tongue state for rendering
   */
  getTongue(): Tongue {
    return this.tongue;
  }

  /**
   * Check if tongue is currently active
   */
  isActive(): boolean {
    return this.tongue.active;
  }

  /**
   * Reset tongue state
   */
  reset(): void {
    this.tongue = {
      active: false,
      startY: 0,
      currentY: 0,
      targetY: 0,
      x: 0,
      extending: false,
      caughtPrize: null,
    };
  }
}
