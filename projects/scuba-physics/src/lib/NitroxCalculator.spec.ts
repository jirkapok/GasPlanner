import { NitroxCalculator } from './NitroxCalculator';

describe('NitroxCalculatorService', () => {
  describe('Maximum operational depth (MOD)', () => {
    it('pO2 1.6 with 50% fO2 has MOD 22.43 m (defaults)', () => {
      const mod = NitroxCalculator.mod(1.6, 50);
      expect(mod).toBe(22.43);
    });

    it('pO2 1.3 with 32% fO2 has MOD 31.22 m', () => {
      const mod = NitroxCalculator.mod(1.3, 32);
      expect(mod).toBe(31.22);
    });
  });

  describe('Equivalent Air depth (EAD)', () => {
    it('50% fO2 at 22 m has EAD 10.53 (defaults)', () => {
      const ead = NitroxCalculator.ead(50, 22.43);
      expect(ead).toBe(10.53);
    });
  });

  describe('Best mix (fO2)', () => {
    it('pO2 1.6 with MOD 22 m has fO2 50.67%', () => {
      const fO2 = NitroxCalculator.bestMix(1.6, 22);
      expect(fO2).toBe(50.67);
    });

    it('pO2 1.3 with MOD 30.62 m has fO2 32.47%', () => {
      const fO2 = NitroxCalculator.bestMix(1.3, 30.62);
      expect(fO2).toBe(32.47);
    });
  });

  describe('Partial O2 (pO2)', () => {
    it('fO2 50.67% with MOD 22 m has pO2 1.6', () => {
      const pO2 = NitroxCalculator.partialPressure(50.67, 22);
      expect(pO2).toBe(1.6);
    });

    it('fO2 32.47% with MOD 30.62 m has pO2 1.3', () => {
      const pO2 = NitroxCalculator.partialPressure(32.47, 30.62);
      expect(pO2).toBe(1.3);
    });
  });
});
