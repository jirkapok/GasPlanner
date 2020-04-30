import { NitroxCalculator } from './NitroxCalculator';

describe('NitroxCalculatorService', () => {
  describe('Maximum operational depth (MOD)', () => {
    it('pO2 1.6 with 50% fO2 has MOD 22.29 m (defaults)', () => {
      const mod = NitroxCalculator.mod(1.6, 50);
      expect(mod).toBe(22.29);
    });

    it('pO2 1.3 with 32% fO2 has MOD 31.09 m', () => {
      const mod = NitroxCalculator.mod(1.3, 32);
      expect(mod).toBe(31.09);
    });
  });

  describe('Equivalent Air depth (EAD)', () => {
    it('50% fO2 at 22 m has EAD 10.26 (defaults)', () => {
      const ead = NitroxCalculator.ead(50, 22);
      expect(ead).toBe(10.26);
    });
  });

  describe('Best mix (fO2)', () => {
    it('pO2 1.6 with MOD 22 m has fO2 50.46%', () => {
      const fO2 = NitroxCalculator.bestMix(1.6, 22);
      expect(fO2).toBe(50.46);
    });

    it('pO2 1.3 with MOD 30 m has fO2 32.86%', () => {
      const fO2 = NitroxCalculator.bestMix(1.3, 30);
      expect(fO2).toBe(32.86);
    });
  });

  describe('Partial O2 (pO2)', () => {
    it('fO2 50% with MOD 22.29 m has pO2 1.6', () => {
      const pO2 = NitroxCalculator.partialPressure(50, 22.29);
      expect(pO2).toBe(1.6);
    });

    it('fO2 32.68% with MOD 30 m has pO2 1.3', () => {
      const pO2 = NitroxCalculator.partialPressure(32.86, 30);
      expect(pO2).toBe(1.3);
    });
  });
});
