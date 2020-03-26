import { SacCalculator } from './SacCalculator';

describe('Sac Calculator', () => {
  describe('Sac calculations', () => {
    it('15m for 45 min with 15L tank (defaults) has sac 20.24 L/min.', () => {
      const result = SacCalculator.calculateSac(15, 15, 150, 45);
      expect(result).toBe(20.24);
    });

    it('15m for 60 min with 15L tank has sac 15.18 L/min.', () => {
      const result = SacCalculator.calculateSac(15, 15, 150, 60);
      expect(result).toBe(15.18);
    });

    it('at 0 m calculates 50 L/min.', () => {
      const result = SacCalculator.calculateSac(0, 15, 150, 45);
      expect(result).toBe(50);
    });

    it('0 bar consumed has SAC 0 L/min.', () => {
      const result = SacCalculator.calculateSac(15, 15, 0, 45);
      expect(result).toBe(0);
    });

    it('0 L large tank has SAC 0 L/min.', () => {
      const result = SacCalculator.calculateSac(15, 0, 150, 45);
      expect(result).toBe(0);
    });

    it('for 0 min has infinite SAC', () => {
      const result = SacCalculator.calculateSac(15, 15, 150, 0);
      expect(result).toBe(Infinity);
    });
  });

  describe('Duration calculations', () => {
    it('15m with 15L tank (defaults) with sac 20.24 L/min. holds 44.99 minutes.', () => {
      const result = SacCalculator.calculateDuration(15, 15, 150, 20.24);
      expect(result).toBe(45);
    });
  });

  describe('Used bars calculations', () => {
    it('15m for 45 min with 15L tank (defaults) with sac 20.24 L/min. consumes 150 bar.', () => {
        const result = SacCalculator.calculateUsed(15, 15, 45, 20.24);
      expect(result).toBe(151);
    });
  });
});
