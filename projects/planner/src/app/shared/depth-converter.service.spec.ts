import { TestBed, inject } from '@angular/core/testing';

import { DepthConverterService } from './depth-converter.service';

describe('DepthConverterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepthConverterService]
    });
  });

  it('22m converts to 3.157 bar', () => {
    const result = DepthConverterService.toBar(22);
    expect(result).toBeCloseTo(3.157, 3);
  });

  it('3.2 converts to 22.43 m', () => {
    const result = DepthConverterService.fromBar(3.2);
    expect(result).toBeCloseTo(22.43, 2);
  });
});
