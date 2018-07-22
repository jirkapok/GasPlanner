import { TestBed, inject } from '@angular/core/testing';

import { DepthConverterService } from './depth-converter.service';

describe('DepthConverterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepthConverterService]
    });
  });

  it('22m converts to 3.2 bar', () => {
    const result = DepthConverterService.toAtm(22);
    expect(result).toBe(3.2);
  });

  it('3.2 converts to 22 m', () => {
    const result = DepthConverterService.fromAtm(3.2);
    expect(result).toBe(22);
  });
});
