// Start Screen UI
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';
import { isMobile } from '../../shared/utils.js';

// Draws a single keycap icon (rounded rectangle + label) onto the stage

export function renderStartScreen(renderer: Renderer): void {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  renderer.drawBackground();

  renderer.drawText('FROGGERS', cx, 200, {
    fontSize: 64,
    color: 0x7ce97c,
    anchor: 0.5,
  });

  if (isMobile()) {
    // Mobile: start button is shown by FroggerScene, no static text needed here
  } else {
    // Desktop: arrow key icons in a cross layout
    const arrowY = cy + 30;
    renderer.drawKeyCap('▲', cx, arrowY - 28, 30, 30); // up
    renderer.drawKeyCap('◀', cx - 34, arrowY + 6, 30, 30); // left
    renderer.drawKeyCap('▼', cx, arrowY + 6, 30, 30); // down
    renderer.drawKeyCap('▶', cx + 34, arrowY + 6, 30, 30); // right

    // "Press [ENTER] to start" with a keycap icon for ENTER
    renderer.drawText('Press', cx - 90, 515, {
      fontSize: 24,
      color: 0xffffff,
      anchor: 0.5,
    });
    renderer.drawKeyCap('ENTER', cx, 525, 80, 30);
    renderer.drawText('to start', cx + 110, 515, {
      fontSize: 24,
      color: 0xffffff,
      anchor: 0.5,
    });
  }
}
