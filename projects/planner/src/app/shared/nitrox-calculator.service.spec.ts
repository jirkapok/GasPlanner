import { TestBed, inject } from '@angular/core/testing';

import { NitroxCalculatorService, NitroxMode } from './nitrox-calculator.service';

describe('NitroxCalculatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NitroxCalculatorService]
    });
  });

  describe('Maximum operational depth (MOD)', () => {
    it('pO2 1.6 with 50% fO2 has MOD 22.43 m (defaults)', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      expect(service.mod).toBe(22.43);
    }));

    it('pO2 1.3 with 32% fO2 has MOD 31.22 m', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.fO2 = 32;
      service.pO2 = 1.3;
      expect(service.mod).toBe(31.22);
    }));
  });

  describe('Equivalent Air depth (EAD)', () => {
    it('50% fO2 at 22 m has EAD 10.53 (defaults)', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      expect(service.ead).toBe(10.53);
    }));
  });

  describe('Best mix (fO2)', () => {
    it('pO2 1.6 with MOD 22 m has fO2 50.46%', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.BestMix;
      service.mod = 22;
      service.pO2 = 1.6;
      expect(service.fO2).toBe(50.46);
    }));

    it('pO2 1.3 with MOD 30.62 m has fO2 32.47%', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.BestMix;
      service.mod = 30.62;
      service.pO2 = 1.3;
      expect(service.fO2).toBe(32.47);
    }));
  });

  describe('Partial O2 (pO2)', () => {
    it('fO2 50.46% with MOD 22 m has pO2 1.6', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.PO2;
      service.mod = 22;
      service.fO2 = 50.46;
      expect(service.pO2).toBe(1.6);
    }));

    it('fO2 32.47% with MOD 30.62 m has pO2 1.3', inject([NitroxCalculatorService], (service: NitroxCalculatorService) => {
      service.calculation = NitroxMode.PO2;
      service.mod = 30.62;
      service.fO2 = 32.47;
      expect(service.pO2).toBe(1.3);
    }));
  });
});
