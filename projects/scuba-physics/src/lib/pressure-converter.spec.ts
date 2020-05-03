import { PressureConverter, AltitudePressure } from './pressure-converter';

describe('Pressure', () => {
  describe('Pressure Converter', () => {
    it('315700 pascals converts to 3.157 bar', () => {
      const result = PressureConverter.pascalToBar(315700);
      expect(result).toBeCloseTo(3.157, 3);
    });

    it('3.157 converts to 315700 pascals', () => {
      const result = PressureConverter.barToPascal(3.157);
      expect(result).toBeCloseTo(315700);
    });
  });

  describe('Altitude pressure', () => {
    it('At sea level is 10325 Pa', () => {
      const gravity = AltitudePressure.atAltitude(0);
      expect(gravity).toBeCloseTo(101325);
    });

    it('400 level is 96611 Pa', () => {
      const gravity = AltitudePressure.atAltitude(400);
      expect(gravity).toBeCloseTo(96611, 0);
    });

    it('1000 level is 89875 Pa', () => {
      const gravity = AltitudePressure.atAltitude(1000);
      expect(gravity).toBeCloseTo(89875, 0);
    });

    it('2000 level is 79495 Pa', () => {
      const gravity = AltitudePressure.atAltitude(2000);
      expect(gravity).toBeCloseTo(79495, 0);
    });

    it('3000 level is 70109 Pa', () => {
      const gravity = AltitudePressure.atAltitude(3000);
      expect(gravity).toBeCloseTo(70109, 0);
    });
  });
});
