// Heads-Up Display (HUD) - score
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH } from '../../shared/constants.js';

export function renderHUD(
  renderer: Renderer,
  score: number,
): void {
  // Score (top right)
  renderer.drawText(`Score: ${score}`, CANVAS_WIDTH - 10, 10, {
    fontSize: 18,
    color: 0xffffff,
    anchor: 1, // right-align
  });
}
