import { PressureConverter, VapourPressure } from './pressure-converter';

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

describe('Vapour pressure', () => {
  it('0°C results in out of range', () => {
    const result = VapourPressure.waterVapourPressureInBars(0);
    expect(result).toBe(0.0013332238741500001);
  });

  it('32,5°C corresponds to NaN', () => {
    // TODO fix algorithm
    const result = VapourPressure.waterVapourPressureInBars(0);
    expect(result).toBe(0.0013332238741500001);
  });

  it('1°C corresponds to 0.0065 bar', () => {
    const result = VapourPressure.waterVapourPressureInBars(1);
    expect(result).toBeCloseTo(0.00651, 5);
  });
 
  it('32,5°C corresponds to 0.04878 bar', () => {
    const result = VapourPressure.waterVapourPressureInBars(32.5);
    expect(result).toBeCloseTo(0.04878, 5);
  }); 

  it('100°C corresponds to 1.0190 bar', () => {
    // TODO fix algorithm
    const result = VapourPressure.waterVapourPressureInBars(100);
    expect(result).toBeCloseTo(1.013365, 5);
  });

  it('376°C corresponds to NaN', () => {
    // TODO fix algorithm
    const result = VapourPressure.waterVapourPressureInBars(376);
    expect(result).toBeCloseTo(0.001333, 6);
  });
});