// Victory Screen UI
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH } from '../../shared/constants.js';

export function renderVictoryScreen(renderer: Renderer, score: number): void {
  const cx = CANVAS_WIDTH / 2;

  // TODO: Polish victory screen design

  renderer.drawText('YOU WIN!', cx, 200, {
    fontSize: 48,
    color: 0x44ff44,
    anchor: 0.5,
  });

  renderer.drawText(`Score: ${score}`, cx, 270, {
    fontSize: 28,
    color: 0xffffff,
    anchor: 0.5,
  });

  renderer.drawText('Press SPACE to play again', cx, 340, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });
}
