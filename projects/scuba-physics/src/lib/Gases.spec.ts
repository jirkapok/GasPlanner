import { Gases, Gas, GasesValidator } from './Gases';

describe('Gases', () => {
  const air = new Gas(0.21, 0);
  const ean50 = new Gas(0.5, 0);
  const trimix = new Gas(0.18, 0.35);

  describe('Gas', () => {
    describe('MOD of an Air for ppO 1.4', () => {
      const air = new Gas(0.21, 0);
      const ppO2 = 1.4;

      it('is 57.78 m in fresh water', () => {
        const mod = air.mod(ppO2, true);
        expect(mod).toBeCloseTo(57.78392, 5);
      });

      it('is 56.1 m in salt water', () => {
        const mod = air.mod(ppO2, false);
        expect(mod).toBeCloseTo(56.10089, 5);
      });
    });

    describe('Narcotic depth for 60 m with 18/35 trimix', () => {
      const depth = 60;

      it('is 35.43099 m in fresh water', () => {
        const end = trimix.end(depth, true);
        expect(end).toBeCloseTo(35.43099, 5);
      });

      it('is 35.53494 m in salt water', () => {
        const end = trimix.end(depth, false);
        expect(end).toBeCloseTo(35.53494, 5);
      });
    });

    describe('Ceiling', () => {
      it('Hyperoxic nitrox 50% in fresh water to 0 m', () => {
        const ceilnig = ean50.ceiling(true);
        expect(ceilnig).toBe(0);
      });

      it('Air in fresh water to 0 m', () => {
        const ceilnig = air.ceiling(true);
        expect(ceilnig).toBe(0);
      });

      it('Hypooxic Trimix 10/70 in fresh water to 8 m', () => {
        const trimix1070 = new Gas(0.1, 0.7);
        const ceilnig = trimix1070.ceiling(true);
        expect(ceilnig).toBeCloseTo(8.158, 3);
      });
    });
  });

  describe('Gases', () => {
    describe('Is Registered', () => {
      it('Gas as bottom gas is registered', () => {
        const gases = new Gases();
        gases.addBottomGas(air);
        let registered = gases.isRegistered(air);
        expect(registered).toBeTrue();
      });

      it('Gas as deco, gas is registered', () => {
        const gases = new Gases();
        gases.addDecoGas(air);
        let registered = gases.isRegistered(air);
        expect(registered).toBeTrue();
      });

      it('No gases, gas is not registered', () => {
        const gases = new Gases();
        let registered = gases.isRegistered(air);
        expect(registered).toBeFalse();
      });

      it('Gas is not registered', () => {
        const gases = new Gases();
        gases.addDecoGas(ean50);
        let registered = gases.isRegistered(air);
        expect(registered).toBeFalse();
      });
    });

    describe('Best gas', () => {
      const options = {
        maxppO2: 1.6,
        maxEND: 30,
        isFreshWater: false
      };

      it('The only deco gas is found', () => {
        const gases = new Gases();
        gases.addBottomGas(air);
        gases.addDecoGas(ean50);
        let found = gases.bestDecoGas(20, options);
        expect(found).toBe(ean50);
      });

      it('No deco gas, bottom gas is found', () => {
        const gases = new Gases();
        gases.addBottomGas(air);
        let found = gases.bestDecoGas(20, options);
        expect(found).toBe(air);
      });

      it('Muntilpe deco gases, best is found', () => {
        const gases = new Gases();
        gases.addBottomGas(air);
        gases.addDecoGas(ean50);
        gases.addDecoGas(trimix);
        let found = gases.bestDecoGas(20, options);
        expect(found).toBe(ean50);
      });
    });
  });

  describe('Gases validator', () => {
    it('Bottom gases undefined', () => {
      const messages = GasesValidator.validate(null, [], 30);
      expect(messages.length).toBe(1);
    });

    it('Deco gases undefined', () => {
      const messages = GasesValidator.validate([], null, 30);
      expect(messages.length).toBe(1);
    });

    it('No bottom gas', () => {
      const messages = GasesValidator.validate([], [], 30);
      expect(messages.length).toBe(1);
    });

    it('Only one bottom gas', () => {
      const bottomGases = [air];
      const messages = GasesValidator.validate(bottomGases, [], 30);
      expect(messages.length).toBe(0);
    });
  });
});