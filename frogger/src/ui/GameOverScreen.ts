// Game Over Screen UI
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH } from '../engine/types.js';

export function renderGameOverScreen(renderer: Renderer, score: number): void {
  const cx = CANVAS_WIDTH / 2;

  // TODO: Polish game over screen design

  renderer.drawText('GAME OVER', cx, 200, {
    fontSize: 48,
    color: 0xff4444,
    anchor: 0.5,
  });

  renderer.drawText(`Score: ${score}`, cx, 270, {
    fontSize: 28,
    color: 0xffffff,
    anchor: 0.5,
  });

  renderer.drawText('Press SPACE to restart', cx, 340, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });
}
