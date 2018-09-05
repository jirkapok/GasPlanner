import { TestBed, inject } from '@angular/core/testing';

import { WayPointsService } from './waypoints.service';
import { Plan, Strategies } from './models';

describe('WayPointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayPointsService]
    });
  });

  it('30m for 20 min calculates all waypoints', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(20, 30, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan);
    expect(wayPoints.length).toBe(3);
  }));
});
