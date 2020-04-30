import { DepthConverter } from './depth-converter';

describe('Depth Converter', () => {
  describe('Fresh water', () => {
    const freshWaterConverter = DepthConverter.forFreshWater();

    it('0 m converts to 1.01325 bar', () => {
      const result = freshWaterConverter.toBar(0);
      expect(result).toBe(1.01325);
    });

    it('1.01325 bar converts to 0 m', () => {
      const result = freshWaterConverter.fromBar(1.01325);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.171 bar', () => {
      const result = freshWaterConverter.toBar(22);
      expect(result).toBeCloseTo(3.171, 3);
    });

    it('3.171 bar converts to 22.3 m', () => {
      const result = freshWaterConverter.fromBar(3.171);
      expect(result).toBeCloseTo(22);
    });
  });

  describe('Salt water', () => {
    const saltWaterConverter = DepthConverter.forSaltWater();

    it('0 bars throws exception', () => {
      expect(() => saltWaterConverter.fromBar(0)).toThrow();
    });

    it('0 m converts to 1.01325 bar', () => {
      const result = saltWaterConverter.toBar(0);
      expect(result).toBe(1.01325);
    });

    it('1.01325 bar converts to 0 m', () => {
      const result = saltWaterConverter.fromBar(1.01325);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.235 bar', () => {
      const result = saltWaterConverter.toBar(22);
      expect(result).toBeCloseTo(3.235, 3);
    });

    it('3.235 converts to 22m', () => {
      const result = saltWaterConverter.fromBar(3.235);
      expect(result).toBeCloseTo(22);
    });
  });
});
