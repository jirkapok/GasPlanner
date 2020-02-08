import { Gases, Gas, GasesValidator, GasPressures } from './Gases';

describe('Gases', () => {
  // for ppo2 1.6 test data (even not used all gases with these values)
  const air = new Gas(0.21, 0); // 65.5m - 0m
  const ean50 = new Gas(0.5, 0); // 21.8m - 0m
  const trimix1835 = new Gas(0.18, 0.35); // 78.1m - 9.9m
  const trimix1070 = new Gas(0.1, 0.7);  // 148.5m - 7.9m
  const oxygen = new Gas(1, 0);  // 5.9m - 0m

  const options = {
    maxppO2: 1.6,
    maxEND: 30,
    isFreshWater: false
  };

  describe('Gas', () => {
    describe('MOD of an Air for ppO 1.4', () => {
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
        const end = trimix1835.end(depth, true);
        expect(end).toBeCloseTo(35.43099, 5);
      });

      it('is 35.53494 m in salt water', () => {
        const end = trimix1835.end(depth, false);
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
        gases.addDecoGas(trimix1835);
        let found = gases.bestDecoGas(20, options);
        expect(found).toBe(ean50);
      });
    });
  });

  describe('Gases validator', () => {
    it('Bottom gases undefined', () => {
      const messages = GasesValidator.validate(null, [], options, 30);
      expect(messages.length).toBe(1);
    });

    it('Deco gases undefined', () => {
      const messages = GasesValidator.validate([], null, options, 30);
      expect(messages.length).toBe(1);
    });

    it('No gas defined', () => {
      const messages = GasesValidator.validate([], [], options, 30);
      expect(messages.length).toBe(1);
    });

    it('Only one gas', () => {
      const bottomGases = [air];
      const messages = GasesValidator.validate(bottomGases, [], options, 30);
      expect(messages.length).toBe(0);
    });

    it('No bottom gas for depth', () => {
      const bottomGases = [air];
      const messages = GasesValidator.validate(bottomGases, [], options, 100);
      expect(messages.length).toBe(1);
    });

    it('No gas to surface', () => {
      const bottomGases = [trimix1070];
      const messages = GasesValidator.validate(bottomGases, [], options, 30);
      expect(messages.length).toBe(1);
    });

    it('Gases don`t cover all depths', () => {
      const bottomGases = [trimix1070];
      const decoGases = [oxygen];
      const messages = GasesValidator.validate(bottomGases, decoGases, options, 30);
      expect(messages.length).toBe(1);
    });

    it('Multiple gases', () => {
      const bottomGases = [air];
      const decoGases = [ean50];
      const messages = GasesValidator.validate(bottomGases, decoGases, options, 30);
      expect(messages.length).toBe(0);
    });
  });

  describe('Gas pressures', () => {
    it('At 1 bar 0.79 volume fraction converts to ', () => {
      const result = GasPressures.partialPressure(1, 0.79);
      expect(result).toBe(0.79);
    });

    it('At 3 bar 0.79 volume fraction converts to ', () => {
      const result = GasPressures.partialPressure(6.667, 0.21);
      expect(result).toBeCloseTo(1.40, 3);
    });

    it('At 0 bars any fraction results in 0 partial pressure', () => {
      const result = GasPressures.partialPressure(0, 0.79);
      expect(result).toBe(0);
    });

    it('At any bars 0 fraction results in 0 partial pressure', () => {
      const result = GasPressures.partialPressure(3, 0);
      expect(result).toBe(0);
    });
  });
});