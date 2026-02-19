export interface Point {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  color: number;
  position: Point;
  height: number;
  width: number;
  isAlive: boolean;
}

export type ObstacleType = 'car' | 'log' | 'turtle';

export type VehicleSize = 's' | 'm' | 'l' | 'xl';

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
  height: number;
  width: number;
  velocity: number;
  type: ObstacleType;
  size: VehicleSize;
  sprite?: SpriteData;
}

export type LaneType = 'safe' | 'road' | 'water' | 'goal';

export interface Lane {
  y: number;
  type: LaneType;
  obstacles: Obstacle[];
  spawnRate: number;
  direction: 1 | -1;
  speed: number;
}

export interface Frog {
  position: Point;
  height: number;
  width: number;
  lives: number;
  isAlive: boolean;
  isOnLog: boolean;
  currentLogId?: string;
}

export interface GameData {
  frog: Frog;
  lanes: Lane[];
  score: number;
  timeRemaining: number;
  level: number;
}

// Client -> Server events
export interface ClientToServerEvents {
  join: (payload: { name?: string }) => void;
  move: (payload: { x: number; y: number }) => void;
  death: (payload: { cause: string }) => void;
  victory: () => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  welcome: (payload: { playerId: string; color: number; players: Player[]; lanes: Lane[] }) => void;
  playerJoined: (payload: { playerId: string; color: number; name: string }) => void;
  playerLeft: (payload: { playerId: string }) => void;
  playerMoved: (payload: { playerId: string; x: number; y: number }) => void;
  playerDied: (payload: { playerId: string }) => void;
  playerWon: (payload: { playerId: string }) => void;
  obstacles: (payload: { lanes: Lane[] }) => void;
}

// Color palette for players
export const PLAYER_COLORS = [
  0x44ff44, // green (default frog)
  0xff44ff, // magenta
  0x44ffff, // cyan
  0xffff44, // yellow
  0xff8844, // orange
  0x8844ff, // purple
  0x44ff88, // mint
  0xff4488, // pink
];
