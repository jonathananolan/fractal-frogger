import { LaneType, Point, SpriteData, VehicleSize } from '../../shared/types';

export interface GameContext {
  gridSize: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface Renderer {
  drawRect(
    gridX: number,
    gridY: number,
    widthCells: number,
    heightCells: number,
    color: number,
    alpha: number,
  ): void;
  drawText(
    text: string,
    pixelX: number,
    pixelY: number,
    options?: { fontSize?: number; color?: number; anchor?: number },
  ): void;
  drawKeyCap(label: string, x: number, y: number, width: number, height: number): void;
  drawVehicle(gridX: number, gridY: number, size: VehicleSize, sprite: SpriteData): void;

  clear(): void;
  readonly stage: import('pixi.js').Container;
}

export interface Scene {
  init(context: GameContext): void;
  update(dt: number): void;
  render(renderer: Renderer): void;
  onKeyDown(key: string): void;
  onKeyUp(key: string): void;
  destroy(): void;
}

export type GameState = 'start' | 'playing' | 'victory' | 'gameOver';

// Debug data exposed by Engine Developer for debug panel
export interface DebugData {
  frogPosition: Point;
  currentLaneType: LaneType;
  isOnLog: boolean;
  tickCount: number;
}
