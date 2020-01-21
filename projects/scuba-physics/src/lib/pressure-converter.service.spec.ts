import { TestBed, inject } from '@angular/core/testing';

import { PressureConverterService } from './pressure-converter.service';

describe('PressureConverterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PressureConverterService]
    });
  });

  it('315700 pascals converts to 3.157 bar', () => {
    const result = PressureConverterService.pascalToBar(315700);
    expect(result).toBeCloseTo(3.157, 3);
  });

  it('3.157 converts to 315700 pascals', () => {
    const result = PressureConverterService.barToPascal(3.157);
    expect(result).toBeCloseTo(315700);
  });
});