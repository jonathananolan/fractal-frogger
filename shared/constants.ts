export const GRID_SIZE = 20;
export const CELL_SIZE = 30;
export const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE; // 600px
export const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE; // 600px
export const TICK_RATE_MS = 150; // 150 = ~6.67 ticks/sec
export const TICK_RATE_S = TICK_RATE_MS / 1000; // 0.15s per tick
export const MAX_ACCUMULATOR_MS = 1000;
export const SPRITE_BASE_PX = 48;

// Game mechanics
export const INVINCIBILITY_DURATION = 100; // ~5 seconds at 20 ticks/sec
export const POSITION_SYNC_INTERVAL = 10; // Sync every ~1.5 seconds at 6.67 ticks/sec
export const START_Y = 19; // Spawn row (bottom of grid)
