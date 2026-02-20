// Heads-Up Display (HUD) - lives, score, timer
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH } from '../../shared/constants.js';

export function renderHUD(renderer: Renderer, score: number, timeRemaining?: number): void {
  // Score (top right) — keep as-is
  renderer.drawText(`Score: ${score}`, CANVAS_WIDTH - 10, 10, {
    fontSize: 18,
    color: 0xffffff,
    anchor: 1,
  });

  // Timer (if provided)
  if (timeRemaining !== undefined) {
    const timerColor = timeRemaining <= 10 ? 0xff4444 : 0xffffff;
    renderer.drawText(`Time: ${timeRemaining}`, CANVAS_WIDTH / 2, 10, {
      fontSize: 18,
      color: timerColor,
      anchor: 0.5,
    });
  }
}
