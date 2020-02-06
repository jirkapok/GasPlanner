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

  describe('18/35  Narcotic depth for 60 m', () => {
    const gas = new Gas(0.18, 0.35);
    const depth = 60;

    it('is 35.43099 m in fresh water', () => {
      const end = gas.endInMeters(depth, true);
      expect(end).toBeCloseTo(35.43099, 5);
    });

    it('is 35.53494 m in salt water', () => {
      const end = gas.endInMeters(depth, false);
      expect(end).toBeCloseTo(35.53494, 5);
    });
  });
});

describe('Gases', () => {
  const air = new Gas(0.21, 0);
  const ean50 = new Gas(0.5, 0);
  const trimix = new Gas(0.18, 0.35);

  describe('Is Registered', () => {
    it('Gas as bottom gas is registered', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      let registered = gases.isRegistered(air);
      expect(registered).toBeTrue();
    });

    it('Gas as deco gas is registered', () => {
      const gases = new Gases();
      gases.addDecoGas(air);
      let registered = gases.isRegistered(air);
      expect(registered).toBeTrue();
    });

    it('No gases gas is not registered', () => {
      const gases = new Gases();
      let registered = gases.isRegistered(air);
      expect(registered).toBeFalse();
    });

    it('No gases gas is not registered', () => {
      const gases = new Gases();
      gases.addDecoGas(ean50);
      let registered = gases.isRegistered(air);
      expect(registered).toBeFalse();
    });
  });

  describe('Best gas', () => {
    it('The only deco gas is found', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      gases.addDecoGas(ean50);
      let found = gases.bestDecoGasName(20, 1.6, 30, false);
      expect(found).toBe(ean50);
    });

    // TODO no deco gas found, bottom gas is used

    it('No deco gas, nothing is found', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      let found = gases.bestDecoGasName(20, 1.6, 30, false);
      expect(found).toBeUndefined();
    });
    
    it('Muntilpe deco gases, best is found', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      gases.addDecoGas(ean50);
      gases.addDecoGas(trimix);
      let found = gases.bestDecoGasName(20, 1.6, 30, false);
      expect(found).toBe(ean50);
    });
  });
});
