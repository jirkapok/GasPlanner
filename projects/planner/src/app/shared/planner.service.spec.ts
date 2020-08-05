import { TestBed, inject } from '@angular/core/testing';

import { PlannerService } from './planner.service';
import { DepthConverter } from 'scuba-physics';

describe('PlannerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlannerService]
    });
  });

  describe('no deco limit', () => {
    it('is calculated', inject([PlannerService], (planner: PlannerService) => {
      const noDecoLimit = planner.noDecoTime();
      expect(noDecoLimit).toBe(17);
    }));
  });

  describe('30m for 15 minutes Calculates (defaults)', () => {
    it('8 minutes time to surface', inject([PlannerService], (planner: PlannerService) => {
      planner.calculate();
      expect(planner.dive.timeToSurface).toBe(8);
    }));

    it('22 minutes maximum dive time', inject([PlannerService], (planner: PlannerService) => {
      planner.calculate();
      expect(planner.dive.maxTime).toBe(22);
    }));

    it('74 bar rock bottom', inject([PlannerService], (planner: PlannerService) => {
      planner.calculate();
      expect(planner.gas.reserve).toBe(74);
    }));

    it('109 bar remaining gas', inject([PlannerService], (planner: PlannerService) => {
      planner.calculate();
      expect(planner.gas.endPressure).toBe(109);
    }));
  });

  describe('Shows errors', () => {
    it('60m for 50 minutes maximum depth exceeded', inject([PlannerService], (planner: PlannerService) => {
      planner.plan.depth = 60;
      planner.calculate();
      expect(planner.dive.depthExceeded).toBeTruthy();
    }));

    it('60m for 50 minutes not enough gas', inject([PlannerService], (planner: PlannerService) => {
      planner.plan.duration = 50;
      planner.calculate();
      expect(planner.dive.notEnoughGas).toBeTruthy();
    }));

    it('30m for 20 minutes no decompression time exceeded', inject([PlannerService], (planner: PlannerService) => {
      planner.plan.duration = 20;
      planner.calculate();
      expect(planner.dive.noDecoExceeded).toBeTruthy();
    }));
  });
});
