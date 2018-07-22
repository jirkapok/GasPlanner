import { TestBed, inject } from '@angular/core/testing';

import { SacCalculatorService } from './sac-calculator.service';

describe('SacCalculatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SacCalculatorService]
    });
  });

  it('should be created', inject([SacCalculatorService], (service: SacCalculatorService) => {
    expect(service).toBeTruthy();
  }));
});
