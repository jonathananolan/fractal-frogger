// Game Over Screen UI
// Owner: Content Architect

import { CANVAS_WIDTH } from '../../shared/constants.js';
import type { Renderer } from '../engine/types.js';
import { BACKGROUND2_PATH } from '../sprites.js';

export function renderGameOverScreen(renderer: Renderer, score: number): void {
  const cx = CANVAS_WIDTH / 2;

  renderer.drawBackground(BACKGROUND2_PATH);

  renderer.drawText('GAME OVER', cx, 200, {
    fontSize: 48,
    color: 0xffc0cb,
    anchor: 0.5,
  });

  renderer.drawText(`Score: ${score}`, cx, 270, {
    fontSize: 28,
    color: 0xffffff,
    anchor: 0.5,
  });

  renderer.drawText('Press SPACE to restart', cx, 340, {
    fontSize: 24,
    color: 0xffffff,
    anchor: 0.5,
  });
}
