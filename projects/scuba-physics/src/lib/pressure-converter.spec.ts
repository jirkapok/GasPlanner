import { TestBed, inject } from '@angular/core/testing';

import { PressureConverter } from './pressure-converter';

describe('PressureConverter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PressureConverter]
    });
  });

  it('315700 pascals converts to 3.157 bar', () => {
    const result = PressureConverter.pascalToBar(315700);
    expect(result).toBeCloseTo(3.157, 3);
  });

  it('3.157 converts to 315700 pascals', () => {
    const result = PressureConverter.barToPascal(3.157);
    expect(result).toBeCloseTo(315700);
  });
});