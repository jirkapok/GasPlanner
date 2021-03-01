import { TestBed, inject } from '@angular/core/testing';

import { WayPointsService } from './waypoints.service';
import { Plan, Strategies } from './models';
import { Options, Tank } from 'scuba-physics';

describe('WayPointsService', () => {
  const air = new Tank(12, 200, 21);
  const gases = [air];
  const options = new Options(0.4, 0.85, 1.4, 1.6, 30, true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayPointsService]
    });
  });

  it('40m for 20 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(20, 40, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan, gases, options);
    expect(wayPoints.wayPoints.length).toBe(13);
  }));

  it('10m for 30 min calculates all way points', inject([WayPointsService], (service: WayPointsService) => {
    const plan = new Plan(30, 10, Strategies.ALL);

    const wayPoints = WayPointsService.calculateWayPoints(plan, gases, options);
    expect(wayPoints.wayPoints.length).toBe(3);
  }));
});
