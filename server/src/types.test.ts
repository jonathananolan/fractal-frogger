import { describe, it, expect } from 'vitest';
import { PLAYER_COLORS } from './types.js';

describe('types', () => {
  describe('PLAYER_COLORS', () => {
    it('contains 8 colors', () => {
      expect(PLAYER_COLORS).toHaveLength(8);
    });

    it('all colors are valid hex numbers', () => {
      PLAYER_COLORS.forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });

    it('all colors are unique', () => {
      const uniqueColors = new Set(PLAYER_COLORS);
      expect(uniqueColors.size).toBe(PLAYER_COLORS.length);
    });

    it('first color is green (default frog color)', () => {
      expect(PLAYER_COLORS[0]).toBe(0x44ff44);
    });

    it('contains expected specific colors', () => {
      expect(PLAYER_COLORS).toContain(0x44ff44); // green
      expect(PLAYER_COLORS).toContain(0xff44ff); // magenta
      expect(PLAYER_COLORS).toContain(0x44ffff); // cyan
      expect(PLAYER_COLORS).toContain(0xffff44); // yellow
      expect(PLAYER_COLORS).toContain(0xff8844); // orange
      expect(PLAYER_COLORS).toContain(0x8844ff); // purple
      expect(PLAYER_COLORS).toContain(0x44ff88); // mint
      expect(PLAYER_COLORS).toContain(0xff4488); // pink
    });

    it('colors are in expected order', () => {
      expect(PLAYER_COLORS).toEqual([
        0x44ff44, // green
        0xff44ff, // magenta
        0x44ffff, // cyan
        0xffff44, // yellow
        0xff8844, // orange
        0x8844ff, // purple
        0x44ff88, // mint
        0xff4488, // pink
      ]);
    });

    it('all colors have high saturation (not grayscale)', () => {
      PLAYER_COLORS.forEach((color) => {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        // At least one channel should be high and channels shouldn't all be equal
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        expect(max).toBeGreaterThan(128); // At least one bright channel
        expect(max - min).toBeGreaterThan(50); // Some saturation
      });
    });
  });
});
