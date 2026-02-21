export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  id: string;
  name: string;
  color: number;
  position: Point;
  height: number;
  width: number;
  isAlive: boolean;
  score: number;
  pendingInput?: Direction;
  respawnTimer: number;
  ridingObstacleId: string | null;
  isInvincible: boolean;
  invincibilityEndTick: number;
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

// Prize types for collectible items
export type PrizeType = 'coin' | 'crystal' | 'orange' | 'watermelon' | 'butterfly';

export interface Prize {
  id: string;
  position: Point;
  type: PrizeType;
  value: number;
  collected: boolean;
  spawnTime: number;
}

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
  color: number;
  // Invincibility state (from catching butterfly/crystal)
  isInvincible: boolean;
  invincibilityEndTick: number;
}

// Tongue state for catching prizes
export interface Tongue {
  active: boolean;
  startY: number; // Starting Y position (frog position)
  currentY: number; // Current Y position of tongue tip
  targetY: number; // Target Y position (2 cells up from frog)
  x: number; // X position (same as frog)
  extending: boolean; // true = shooting out, false = retracting
  caughtPrize: string | null; // Prize ID if caught something
}

export interface GameData {
  frog: Frog;
  lanes: Lane[];
  score: number;
  timeRemaining: number;
  level: number;
}

export interface ServerGameState {
  players: Player[];
  lanes: Lane[];
  prizes: Prize[];
}

// Client -> Server events
export interface ClientToServerEvents {
  join: (payload: { name?: string }) => void;
  move: (payload: { x: number; y: number }) => void;
  death: (payload: { cause: string }) => void;
  victory: () => void;
  scoreUpdate: (payload: { score: number }) => void;
  input: (payload: { direction: Direction }) => void;
  collectPrize: (payload: { prizeId: string }) => void;
}

// Leaderboard entry sent from server to clients
export interface LeaderboardEntry {
  id: string;
  name: string;
  color: number;
  score: number;
}

// Server -> Client events
export interface ServerToClientEvents {
  welcome: (payload: { playerId: string; color: number; players: Player[]; lanes: Lane[] }) => void;
  playerJoined: (payload: {
    playerId: string;
    color: number;
    name: string;
    position: Point;
  }) => void;
  playerLeft: (payload: { playerId: string }) => void;
  playerMoved: (payload: { playerId: string; x: number; y: number }) => void;
  playerDied: (payload: { playerId: string }) => void;
  playerWon: (payload: { playerId: string }) => void;
  obstacles: (payload: { lanes: Lane[] }) => void;
  leaderboard: (payload: { players: LeaderboardEntry[] }) => void;
  gameState: (payload: ServerGameState) => void;
  prizeCollected: (payload: { prizeId: string; playerId: string }) => void;
}

// Prize configuration for server-side spawning
export interface PrizeConfig {
  type: PrizeType;
  value: number;
  rarity: number; // 1-10, higher = rarer
  duration: number; // ticks before disappearing (0 = permanent)
}

export const PRIZE_CONFIGS: Record<PrizeType, PrizeConfig> = {
  coin: { type: 'coin', value: 10, rarity: 1, duration: 0 },
  orange: { type: 'orange', value: 25, rarity: 3, duration: 200 },
  watermelon: { type: 'watermelon', value: 50, rarity: 5, duration: 150 },
  crystal: { type: 'crystal', value: 100, rarity: 7, duration: 100 },
  butterfly: { type: 'butterfly', value: 200, rarity: 9, duration: 80 },
};

export const PRIZE_TYPES: PrizeType[] = ['coin', 'orange', 'watermelon', 'crystal', 'butterfly'];

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
