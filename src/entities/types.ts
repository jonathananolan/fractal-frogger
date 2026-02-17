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

export type ObstacleType = 'car' | 'log' | 'turtle';

export interface Obstacle {
  id: string;
  position: Point;
  width: number;           // in grid cells
  velocity: number;        // cells per tick (positive = right, negative = left)
  type: ObstacleType;
}

export type LaneType = 'safe' | 'road' | 'water' | 'goal';

export interface Lane {
  y: number;
  type: LaneType;
  obstacles: Obstacle[];
  spawnRate: number;       // ticks between spawns
  direction: 1 | -1;       // 1 = right, -1 = left
  speed: number;           // base obstacle speed (cells per tick)
}

export interface GameData {
  frog: Frog;
  lanes: Lane[];
  score: number;
  timeRemaining: number;
  level: number;
}

export type GameState = 'start' | 'playing' | 'victory' | 'gameOver';

// Debug data exposed by Engine Developer for debug panel
export interface DebugData {
  frogPosition: Point;
  currentLaneType: LaneType;
  isOnLog: boolean;
  godMode: boolean;
  tickCount: number;
}
