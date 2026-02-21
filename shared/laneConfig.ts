// Lane configuration shared between client and server

import type { Lane } from './types.js';

/**
 * Creates the default lane configuration for a Frogger game.
 * Used by both client (FroggerScene) and server (GameState).
 */
export function createDefaultLanes(): Lane[] {
  const lanes: Lane[] = [];

  // Safe zone (bottom 2 rows)
  lanes.push({
    y: 19,
    type: 'safe',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });
  lanes.push({
    y: 18,
    type: 'safe',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });

  // Road lanes (rows 13-17)
  lanes.push({
    y: 17,
    type: 'road',
    obstacles: [],
    spawnRate: 20,
    direction: 1,
    speed: 0.5,
  });
  lanes.push({
    y: 16,
    type: 'road',
    obstacles: [],
    spawnRate: 25,
    direction: -1,
    speed: 0.3,
  });
  lanes.push({
    y: 15,
    type: 'road',
    obstacles: [],
    spawnRate: 18,
    direction: 1,
    speed: 0.4,
  });
  lanes.push({
    y: 14,
    type: 'road',
    obstacles: [],
    spawnRate: 22,
    direction: -1,
    speed: 0.6,
  });
  lanes.push({
    y: 13,
    type: 'road',
    obstacles: [],
    spawnRate: 30,
    direction: 1,
    speed: 0.35,
  });

  // Safe middle (row 12)
  lanes.push({
    y: 12,
    type: 'safe',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });

  // Water lanes (rows 8-11)
  lanes.push({
    y: 11,
    type: 'water',
    obstacles: [],
    spawnRate: 25,
    direction: -1,
    speed: 0.3,
  });
  lanes.push({
    y: 10,
    type: 'water',
    obstacles: [],
    spawnRate: 20,
    direction: 1,
    speed: 0.4,
  });
  lanes.push({
    y: 9,
    type: 'water',
    obstacles: [],
    spawnRate: 30,
    direction: -1,
    speed: 0.25,
  });
  lanes.push({
    y: 8,
    type: 'water',
    obstacles: [],
    spawnRate: 22,
    direction: 1,
    speed: 0.35,
  });

  // Safe middle (row 7)
  lanes.push({
    y: 7,
    type: 'safe',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });

  // Safe zone (row 6) - buffer between water and upper road
  lanes.push({
    y: 6,
    type: 'safe',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });

  // Second road lanes (rows 1-5) - 5 lanes
  lanes.push({
    y: 5,
    type: 'road',
    obstacles: [],
    spawnRate: 28,
    direction: -1,
    speed: 0.35,
  });
  lanes.push({
    y: 4,
    type: 'road',
    obstacles: [],
    spawnRate: 20,
    direction: 1,
    speed: 0.5,
  });
  lanes.push({
    y: 3,
    type: 'road',
    obstacles: [],
    spawnRate: 25,
    direction: -1,
    speed: 0.4,
  });
  lanes.push({
    y: 2,
    type: 'road',
    obstacles: [],
    spawnRate: 18,
    direction: 1,
    speed: 0.55,
  });
  lanes.push({
    y: 1,
    type: 'road',
    obstacles: [],
    spawnRate: 30,
    direction: -1,
    speed: 0.3,
  });

  // Goal zone (row 0)
  lanes.push({
    y: 0,
    type: 'goal',
    obstacles: [],
    spawnRate: 0,
    direction: 1,
    speed: 0,
  });

  return lanes;
}
