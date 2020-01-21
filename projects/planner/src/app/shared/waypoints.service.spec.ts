import { TestBed, inject } from '@angular/core/testing';

import { WayPointsService } from './waypoints.service';
import { Plan, Strategies } from './models';

describe('WayPointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayPointsService]
    });
  });

  it('30m for 20 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(30, 20, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan);
    expect(wayPoints.length).toBe(5);
  }));

  it('10m for 30 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(30, 10, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan);
    expect(wayPoints.length).toBe(3);
  }));
});
