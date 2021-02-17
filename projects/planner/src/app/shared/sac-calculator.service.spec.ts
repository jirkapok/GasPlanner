import { TestBed, inject } from '@angular/core/testing';

import { SacCalculatorService, SacMode } from './sac-calculator.service';

fdescribe('SacCalculatorService', () => {
  let service: SacCalculatorService;
  beforeEach(() => {
    service = new SacCalculatorService();
  });

  describe('Sac calculations', () => {
    it('15m for 45 min with 15L tank (defaults) has sac 20.13 L/min.', () => {
      expect(service.sac).toBe(20.13);
    });

    it('15m for 60 min with 15L tank has sac 15.1 L/min.', () => {
      service.duration = 60;
      expect(service.sac).toBe(15.1);
    });

    it('at 0 m calculates 49.35 L/min.', () => {
      service.depth = 0;
      expect(service.sac).toBe(49.35);
    });

    it('0 bar consumed has SAC 0 L/min.', () => {
      service.used = 0;
      expect(service.sac).toBe(0);
    });

    it('0 L large tank has SAC 0 L/min.', () => {
      service.tank = 0;
      expect(service.sac).toBe(0);
    });

    it('for 0 min has infinite SAC', () => {
      service.duration = 0;
      expect(service.sac).toBe(Infinity);
    });
  });

  describe('Duration calculations', () => {
    it('15m with 15L tank (defaults) with sac 20.24 L/min. holds 45 minutes.', () => {
      service.calculation = SacMode.duration;
      service.sac = 20.24;
      expect(service.duration).toBe(45);
    });
  });

  describe('Used bars calculations', () => {
    it('15m for 45 min with 15L tank (defaults) with sac 20.24 L/min. consumes 151 bar.', () => {
      service.calculation = SacMode.used;
      service.sac = 20.24;
      expect(service.used).toBe(151);
    });
  });
});
