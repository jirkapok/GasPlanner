import { TestBed, inject } from '@angular/core/testing';

import { WayPointsService } from './waypoints.service';
import { Plan, Strategies, Gas } from './models';
import { Options } from 'scuba-physics';

describe('WayPointsService', () => {
  const air = new Gas(12, 21, 200);
  const options = new Options(0.4, 0.85, 1.6, 30, true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayPointsService]
    });
  });

  it('30m for 20 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(30, 20, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan, air, options);
    expect(wayPoints.wayPoints.length).toBe(7);
  }));

  it('10m for 30 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(30, 10, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan, air, options);
    expect(wayPoints.wayPoints.length).toBe(3);
  }));
});
