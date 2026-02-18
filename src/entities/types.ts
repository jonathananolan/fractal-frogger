// Entity type definitions for Frogger
// Owner: Content Architect (defines) + Systems Integrator (maintains)

export interface Point {
  x: number;
  y: number;
}

export interface Frog {
  position: Point;
  lives: number;
  isAlive: boolean;
  isOnLog: boolean;
  currentLogId?: string;
}

export type ObstacleType = "car" | "log" | "turtle";

export type VehicleSize = "s" | "m" | "l" | "xl";

/** Map VehicleSize to width in grid cells (for collision, spawning, wrapping) */
export const SIZE_TO_WIDTH: Record<VehicleSize, number> = {
  s: 1,
  m: 2,
  l: 3,
  xl: 4,
};

export interface SpriteData {
  file: string;
  length: number; // pixel length of the sprite
}

export interface Obstacle {
  id: string;
  position: Point;
  size: VehicleSize;
  velocity: number; // cells per tick (positive = right, negative = left)
  type: ObstacleType;
  sprite?: SpriteData;
}

export type LaneType = "safe" | "road" | "water" | "goal";

export interface Lane {
  y: number;
  type: LaneType;
  obstacles: Obstacle[];
  spawnRate: number; // ticks between spawns
  direction: 1 | -1; // 1 = right, -1 = left
  speed: number; // base obstacle speed (cells per tick)
}

export interface GameData {
  frog: Frog;
  lanes: Lane[];
  score: number;
  timeRemaining: number;
  level: number;
}

export type GameState = "start" | "playing" | "victory" | "gameOver";

// Debug data exposed by Engine Developer for debug panel
export interface DebugData {
  frogPosition: Point;
  currentLaneType: LaneType;
  isOnLog: boolean;
  tickCount: number;
}
