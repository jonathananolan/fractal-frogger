// Start Screen UI
// Owner: Content Architect

import { Graphics, Text, TextStyle } from "pixi.js";
import type { Renderer } from "../engine/types.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../engine/types.js";

// Draws a single keycap icon (rounded rectangle + label) onto the stage
function drawKeycap(
  renderer: Renderer,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  // Draw the rounded rectangle background
  const bg = new Graphics();
  bg.roundRect(x - width / 2, y - height / 2, width, height, 6);
  bg.fill(0x333333);
  bg.stroke({ color: 0x666666, width: 2 });
  renderer.stage.addChild(bg);

  // Draw the label text centered on the keycap
  const style = new TextStyle({ fontSize: 14, fill: 0xffffff });
  const text = new Text({ text: label, style });
  text.anchor.set(0.5);
  text.x = x;
  text.y = y;
  renderer.stage.addChild(text);
}

export function renderStartScreen(renderer: Renderer): void {
  const cx = CANVAS_WIDTH / 2;

  renderer.drawText("FROGGER", cx, 200, {
    fontSize: 64,
    color: 0x44cc44,
    anchor: 0.5,
  });

  // "Press [SPACE] to start" with a keycap icon for SPACE
  renderer.drawText("Press", cx - 90, 405, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });
  drawKeycap(renderer, "SPACE", cx, 420, 80, 30);
  renderer.drawText("to start", cx + 70, 405, {
    fontSize: 24,
    color: 0xaaaaaa,
    anchor: 0.5,
  });

  // Arrow key icons in a cross layout + "to move" label
  const arrowY = 320;
  drawKeycap(renderer, "▲", cx, arrowY - 28, 30, 30); // up
  drawKeycap(renderer, "◀", cx - 34, arrowY + 6, 30, 30); // left
  drawKeycap(renderer, "▼", cx, arrowY + 6, 30, 30); // down
  drawKeycap(renderer, "▶", cx + 34, arrowY + 6, 30, 30); // right

  //renderer.drawText("to move", cx, arrowY + 50, {
  // fontSize: 18,
  // color: 0x666666,
  // anchor: 0.5,
  // });
}
