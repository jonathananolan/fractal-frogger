// Start Screen UI
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';

// Draws a single keycap icon (rounded rectangle + label) onto the stage

export function renderStartScreen(renderer: Renderer): void {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  renderer.drawText('FROGGER', cx, 200, {
    fontSize: 64,
    color: 0x44cc44,
    anchor: 0.5,
  });

  // Arrow key icons in a cross layout + "to move" label
  const arrowY = cy + 30;
  renderer.drawKeyCap('▲', cx, arrowY - 28, 30, 30); // up
  renderer.drawKeyCap('◀', cx - 34, arrowY + 6, 30, 30); // left
  renderer.drawKeyCap('▼', cx, arrowY + 6, 30, 30); // down
  renderer.drawKeyCap('▶', cx + 34, arrowY + 6, 30, 30); // right

  // "Press [SPACE] to start" with a keycap icon for SPACE
  renderer.drawText('Press', cx - 90, 405, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });
  renderer.drawKeyCap('SPACE', cx, 420, 80, 30);
  renderer.drawText('to start', cx + 110, 405, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });
}
