// Heads-Up Display (HUD) - lives, score, timer
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH } from '../engine/types.js';

export function renderHUD(
  renderer: Renderer,
  lives: number,
  score: number,
  timeRemaining?: number
): void {
  // TODO: Polish HUD design
  // - Lives display (hearts? number?)
  // - Score display
  // - Timer (when implemented)

  // Lives (top left)
  const livesText = '♥'.repeat(lives);
  renderer.drawText(livesText, 10, 10, {
    fontSize: 20,
    color: 0xff4444,
  });

  // Score (top right)
  renderer.drawText(`Score: ${score}`, CANVAS_WIDTH - 10, 10, {
    fontSize: 18,
    color: 0xffffff,
    anchor: 1, // right-align
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
