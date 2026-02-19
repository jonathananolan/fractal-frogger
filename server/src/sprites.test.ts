import { describe, it, expect } from 'vitest';
import { VEHICLE_SPRITES, SIZE_TO_WIDTH, VEHICLES_BY_SIZE } from './sprites.js';
import type { VehicleSize } from '../../shared/types.js';

describe('sprites', () => {
  describe('VEHICLE_SPRITES', () => {
    it('contains sprite entries', () => {
      expect(VEHICLE_SPRITES.length).toBeGreaterThan(0);
    });

    it('each sprite has a file name ending in .png', () => {
      VEHICLE_SPRITES.forEach((sprite) => {
        expect(sprite.file).toMatch(/\.png$/);
      });
    });

    it('each sprite has a valid length (48, 64, 96, or 128)', () => {
      const validLengths = [48, 64, 96, 128];
      VEHICLE_SPRITES.forEach((sprite) => {
        expect(validLengths).toContain(sprite.length);
      });
    });

    it('each sprite file starts with "Vehicle_"', () => {
      VEHICLE_SPRITES.forEach((sprite) => {
        expect(sprite.file).toMatch(/^Vehicle_/);
      });
    });

    it('contains expected number of sprites per size category', () => {
      const shortSprites = VEHICLE_SPRITES.filter((s) => s.length === 48);
      const mediumSprites = VEHICLE_SPRITES.filter((s) => s.length === 64);
      const largeSprites = VEHICLE_SPRITES.filter((s) => s.length === 96);
      const xlSprites = VEHICLE_SPRITES.filter((s) => s.length === 128);

      expect(shortSprites.length).toBe(3);
      expect(mediumSprites.length).toBe(41);
      expect(largeSprites.length).toBe(11);
      expect(xlSprites.length).toBe(12);
    });

    it('contains specific known vehicles', () => {
      const fileNames = VEHICLE_SPRITES.map((s) => s.file);
      expect(fileNames).toContain('Vehicle_Taxi.png');
      expect(fileNames).toContain('Vehicle_Bus.png');
      expect(fileNames).toContain('Vehicle_Cop_Car.png');
      expect(fileNames).toContain('Vehicle_Fire_Truck.png');
    });
  });

  describe('SIZE_TO_WIDTH', () => {
    it('maps s to 1 grid cell', () => {
      expect(SIZE_TO_WIDTH.s).toBe(1);
    });

    it('maps m to 2 grid cells', () => {
      expect(SIZE_TO_WIDTH.m).toBe(2);
    });

    it('maps l to 3 grid cells', () => {
      expect(SIZE_TO_WIDTH.l).toBe(3);
    });

    it('maps xl to 4 grid cells', () => {
      expect(SIZE_TO_WIDTH.xl).toBe(4);
    });

    it('has all VehicleSize keys', () => {
      const sizes: VehicleSize[] = ['s', 'm', 'l', 'xl'];
      sizes.forEach((size) => {
        expect(SIZE_TO_WIDTH[size]).toBeDefined();
      });
    });

    it('widths increase with size', () => {
      expect(SIZE_TO_WIDTH.s).toBeLessThan(SIZE_TO_WIDTH.m);
      expect(SIZE_TO_WIDTH.m).toBeLessThan(SIZE_TO_WIDTH.l);
      expect(SIZE_TO_WIDTH.l).toBeLessThan(SIZE_TO_WIDTH.xl);
    });
  });

  describe('VEHICLES_BY_SIZE', () => {
    it('categorizes small vehicles (48px) correctly', () => {
      VEHICLES_BY_SIZE.s.forEach((sprite) => {
        expect(sprite.length).toBe(48);
      });
      expect(VEHICLES_BY_SIZE.s.length).toBe(3);
    });

    it('categorizes medium vehicles (64px) correctly', () => {
      VEHICLES_BY_SIZE.m.forEach((sprite) => {
        expect(sprite.length).toBe(64);
      });
      expect(VEHICLES_BY_SIZE.m.length).toBe(41);
    });

    it('categorizes large vehicles (96px) correctly', () => {
      VEHICLES_BY_SIZE.l.forEach((sprite) => {
        expect(sprite.length).toBe(96);
      });
      expect(VEHICLES_BY_SIZE.l.length).toBe(11);
    });

    it('categorizes extra-large vehicles (128px) correctly', () => {
      VEHICLES_BY_SIZE.xl.forEach((sprite) => {
        expect(sprite.length).toBe(128);
      });
      expect(VEHICLES_BY_SIZE.xl.length).toBe(12);
    });

    it('total sprites across all sizes equals VEHICLE_SPRITES length', () => {
      const totalFromSizes =
        VEHICLES_BY_SIZE.s.length +
        VEHICLES_BY_SIZE.m.length +
        VEHICLES_BY_SIZE.l.length +
        VEHICLES_BY_SIZE.xl.length;
      expect(totalFromSizes).toBe(VEHICLE_SPRITES.length);
    });

    it('each size category has at least one vehicle', () => {
      const sizes: VehicleSize[] = ['s', 'm', 'l', 'xl'];
      sizes.forEach((size) => {
        expect(VEHICLES_BY_SIZE[size].length).toBeGreaterThan(0);
      });
    });

    it('no duplicate sprites across size categories', () => {
      const allSpritesFromSizes = [
        ...VEHICLES_BY_SIZE.s,
        ...VEHICLES_BY_SIZE.m,
        ...VEHICLES_BY_SIZE.l,
        ...VEHICLES_BY_SIZE.xl,
      ];
      const fileNames = allSpritesFromSizes.map((s) => s.file);
      const uniqueFileNames = new Set(fileNames);
      expect(uniqueFileNames.size).toBe(fileNames.length);
    });
  });
});
