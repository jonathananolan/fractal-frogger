// Prize Registry - configuration and metadata for all prize types
// Owner: Content Architect

import { Assets } from 'pixi.js';
import { PrizeType } from '../../shared/types.js';
import { SPRITE_PATH } from '../sprites.js';

export interface PrizeConfig {
  type: PrizeType;
  file: string;
  value: number;
  rarity: number; // 1-10, higher = rarer
  duration: number; // ticks before disappearing (0 = permanent)
}

// Prize configurations - easily extensible
export const PRIZE_CONFIGS: Record<PrizeType, PrizeConfig> = {
  coin: {
    type: 'coin',
    file: 'Prize_Coin.svg',
    value: 10,
    rarity: 1, // most common
    duration: 0, // permanent until collected
  },
  orange: {
    type: 'orange',
    file: 'Prize_Orange.svg',
    value: 25,
    rarity: 3,
    duration: 200, // disappears after ~10 seconds
  },
  watermelon: {
    type: 'watermelon',
    file: 'Prize_Watermelon.svg',
    value: 50,
    rarity: 5,
    duration: 150,
  },
  crystal: {
    type: 'crystal',
    file: 'Prize_Crystal.svg',
    value: 100,
    rarity: 7,
    duration: 100, // rare and quick
  },
  butterfly: {
    type: 'butterfly',
    file: 'Prize_Butterfly.svg',
    value: 200,
    rarity: 9, // very rare
    duration: 80, // quick flutter
  },
};

// Get all prize types for iteration
export const PRIZE_TYPES: PrizeType[] = Object.keys(PRIZE_CONFIGS) as PrizeType[];

// Get random prize type weighted by rarity (lower rarity = more likely)
export function getRandomPrizeType(): PrizeType {
  // Build weighted pool - lower rarity = more entries
  const pool: PrizeType[] = [];
  for (const config of Object.values(PRIZE_CONFIGS)) {
    const weight = 11 - config.rarity; // rarity 1 gets 10 entries, rarity 10 gets 1
    for (let i = 0; i < weight; i++) {
      pool.push(config.type);
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get config for a prize type
export function getPrizeConfig(type: PrizeType): PrizeConfig {
  return PRIZE_CONFIGS[type];
}

// Get sprite path for a prize
export function getPrizeSpritePath(type: PrizeType): string {
  return SPRITE_PATH + PRIZE_CONFIGS[type].file;
}

// Load all prize sprites - call once at startup
export async function loadPrizeSprites(): Promise<void> {
  const paths = Object.values(PRIZE_CONFIGS).map((c) => SPRITE_PATH + c.file);
  await Assets.load(paths);
}
