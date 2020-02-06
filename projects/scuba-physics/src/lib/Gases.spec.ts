import { Gases, Gas } from './Gases';

describe('Gas', () => {
  describe('Air MOD for ppO 1.4', () => {
    const air = new Gas(0.21, 0);
    const ppO2 = 1.4;

    it('is 67.49550 m in fresh water', () => {
      const mod = air.modInMeters(ppO2, true);
      expect(mod).toBeCloseTo(57.78392, 5);
    });

    it('is 65.52961 m in salt water', () => {
      const mod = air.modInMeters(ppO2, false);
      expect(mod).toBeCloseTo(56.10089, 5);
    });
  });
});
