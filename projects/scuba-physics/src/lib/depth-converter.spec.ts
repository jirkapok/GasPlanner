import { DepthConverter } from './depth-converter';

describe('Depth Converter', () => {
  describe('Fress water', () => {

    it('0 m converts to 1 bar', () => {
      const result = DepthConverter.toBar(0, true);
      expect(result).toBe(1);
    });

    it('1 bar converts to 0 m', () => {
      const result = DepthConverter.fromBar(1, true);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.157 bar', () => {
      const result = DepthConverter.toBar(22, true);
      expect(result).toBeCloseTo(3.157, 3);
    });

    it('3.2 bar converts to 22.43 m', () => {
      const result = DepthConverter.fromBar(3.2, true);
      expect(result).toBeCloseTo(22.43, 2);
    });
  });

  describe('Salt water', () => {

    it('0 m converts to 1 bar', () => {
      const result = DepthConverter.toBar(0, false);
      expect(result).toBe(1);
    });

    it('1 bar converts to 0 m', () => {
      const result = DepthConverter.fromBar(1, false);
      expect(result).toBe(0);
    });

    it('22 m converts to 3.222 bar', () => {
      const result = DepthConverter.toBar(22, false);
      expect(result).toBeCloseTo(3.222, 3);
    });

    it('3.2 converts to 22.43 m', () => {
      const result = DepthConverter.fromBar(3.2, false);
      expect(result).toBeCloseTo(21.780, 3);
    });
  });
});
