// Start Screen UI
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/types.js';

export function renderStartScreen(renderer: Renderer): void {
  const cx = CANVAS_WIDTH / 2;

  // TODO: Implement start screen
  // - Game title "FROGGER"
  // - "Press SPACE to start"
  // - Controls hint

  renderer.drawText('FROGGER', cx, 200, {
    fontSize: 64,
    color: 0x44cc44,
    anchor: 0.5,
  });

  renderer.drawText('Press SPACE to start', cx, 320, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });

  renderer.drawText('Arrow keys or WASD to move', cx, 360, {
    fontSize: 18,
    color: 0x666666,
    anchor: 0.5,
  });
}
