import { TestBed, inject } from '@angular/core/testing';

import { NitroxCalculatorService, NitroxMode } from './nitrox-calculator.service';

describe('NitroxCalculatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NitroxCalculatorService]
    });
  });

  describe('MOD', () => {
    it('pO2 1.6 with 50% fO2 has MOD 22 m (defaults)', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      expect(service.mod).toBe(22);
    }));

    it('pO2 1.3 with 32% fO2 has MOD 30 m', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.fO2 = 32;
      service.pO2 = 1.3;
      expect(service.mod).toBe(30.62);
    }));
  });

  describe('Best mix', () => {
    it('pO2 1.6 with MOD 22 m has fO2 50%', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.BestMix;
      service.mod = 22;
      service.pO2 = 1.6;
      expect(service.fO2).toBe(50);
    }));

    it('pO2 1.3 with MOD 30 m has fO2 32%', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.BestMix;
      service.mod = 30.62;
      service.pO2 = 1.3;
      expect(service.fO2).toBe(32);
    }));
  });

  describe('Partial O2', () => {
    it('fO2 50% with MOD 22 m has pO2 1.6', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.PO2;
      service.mod = 22;
      service.fO2 = 50;
      expect(service.pO2).toBe(1.6);
    }));

    it('fO2 32% with MOD 30 m has pO2 1.3', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.PO2;
      service.mod = 30.62;
      service.fO2 = 32;
      expect(service.pO2).toBe(1.3);
    }));
  });
});
