// Help Overlay - shows controls
// Owner: Content Architect

import type { Renderer } from '../engine/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/types.js';

export function renderHelpOverlay(renderer: Renderer): void {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  // TODO: Add semi-transparent background
  // TODO: Polish layout

  renderer.drawText('CONTROLS', cx, cy - 80, {
    fontSize: 32,
    color: 0xffffff,
    anchor: 0.5,
  });

  const controls = [
    'Arrow Keys / WASD - Move',
    'H - Toggle this help',
    'D - Toggle debug panel',
    'SPACE - Start / Restart',
  ];

  controls.forEach((line, i) => {
    renderer.drawText(line, cx, cy - 20 + i * 30, {
      fontSize: 18,
      color: 0xcccccc,
      anchor: 0.5,
    });
  });

  renderer.drawText('Press H to close', cx, cy + 120, {
    fontSize: 16,
    color: 0x888888,
    anchor: 0.5,
  });
}
