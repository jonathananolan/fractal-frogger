// Debug Panel - shows game state for debugging
// Owner: Content Architect (design) + Engine Developer (data)

import type { Renderer } from '../engine/types.js';
import type { DebugData } from '../entities/types.js';

export function renderDebugPanel(renderer: Renderer, debugData: DebugData): void {
  // TODO: Polish debug panel design
  // - Small panel in corner
  // - Show useful debug info

  const x = 10;
  let y = 50;
  const lineHeight = 18;
  const fontSize = 14;
  const color = 0x00ff00; // Matrix green for debug

  const lines = [
    `Pos: (${debugData.frogPosition.x}, ${debugData.frogPosition.y})`,
    `Lane: ${debugData.currentLaneType}`,
    `On Log: ${debugData.isOnLog ? 'YES' : 'NO'}`,
    `God Mode: ${debugData.godMode ? 'ON' : 'OFF'}`,
    `Tick: ${debugData.tickCount}`,
  ];

  renderer.drawText('DEBUG', x, y, { fontSize, color });
  y += lineHeight;

  lines.forEach((line) => {
    renderer.drawText(line, x, y, { fontSize, color });
    y += lineHeight;
  });
}
