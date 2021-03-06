import { TestBed, inject } from '@angular/core/testing';

import { SacCalculatorService, SacMode } from './sac-calculator.service';

describe('SacCalculatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SacCalculatorService]
    });
  });

  describe('Sac calculations', () => {
    it('15m for 45 min with 15L tank (defaults) has sac 20.24 L/min.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      expect(service.sac).toBe(20.24);
    }));

    it('15m for 60 min with 15L tank has sac 15.18 L/min.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.duration = 60;
      expect(service.sac).toBe(15.18);
    }));

    it('at 0 m calculates 50 L/min.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.depth = 0;
      expect(service.sac).toBe(50);
    }));

    it('0 bar consumed has SAC 0 L/min.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.used = 0;
      expect(service.sac).toBe(0);
    }));

    it('0 L large tank has SAC 0 L/min.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.tank = 0;
      expect(service.sac).toBe(0);
    }));

    it('for 0 min has infinite SAC', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.duration = 0;
      expect(service.sac).toBe(Infinity);
    }));
  });

  describe('Duration calculations', () => {
    it('15m with 15L tank (defaults) with sac 20.24 L/min. holds 44.99 minutes.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.calculation = SacMode.duration;
      service.sac = 20.24;
      expect(service.duration).toBe(45);
    }));
  });

  describe('Used bars calculations', () => {
    it('15m for 45 min with 15L tank (defaults) with sac 20.24 L/min. consumes 150 bar.', inject([SacCalculatorService], (service: SacCalculatorService) => {
      service.calculation = SacMode.used;
      service.sac = 20.24;
      expect(service.used).toBe(151);
    }));
  });
});
