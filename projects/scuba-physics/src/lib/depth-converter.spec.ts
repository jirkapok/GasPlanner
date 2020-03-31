import { DepthConverter } from './depth-converter';

describe('Depth Converter', () => {
  describe('Fresh water', () => {
    const freshWaterConverter = DepthConverter.forFreshWater();

    it('0 m converts to 1 bar', () => {
      const result = freshWaterConverter.toBar(0);
      expect(result).toBe(1);
    });

    it('1 bar converts to 0 m', () => {
      const result = freshWaterConverter.fromBar(1);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.157 bar', () => {
      const result = freshWaterConverter.toBar(22);
      expect(result).toBeCloseTo(3.157, 3);
    });

    it('3.2 bar converts to 22.43 m', () => {
      const result = freshWaterConverter.fromBar(3.2);
      expect(result).toBeCloseTo(22.43, 2);
    });
  });

  describe('Salt water', () => {
    const saltWaterConverter = DepthConverter.forSaltWater();

    it('0 m converts to 1 bar', () => {
      const result = saltWaterConverter.toBar(0);
      expect(result).toBe(1);
    });

    it('1 bar converts to 0 m', () => {
      const result = saltWaterConverter.fromBar(1);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.222 bar', () => {
      const result = saltWaterConverter.toBar(22);
      expect(result).toBeCloseTo(3.222, 3);
    });

    it('3.2 converts to 22.43 m', () => {
      const result = saltWaterConverter.fromBar(3.2);
      expect(result).toBeCloseTo(21.780, 3);
    });
  });
});
