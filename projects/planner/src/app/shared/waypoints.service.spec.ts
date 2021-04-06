import { WayPointsService } from './waypoints.service';
import { Plan, Strategies } from './models';
import { Options, Tank } from 'scuba-physics';

describe('WayPointsService', () => {
    const airTank = new Tank(12, 200, 21);
    const gases = [airTank];
    const options = new Options(0.4, 0.85, 1.4, 1.6, 30, true);

    it('40m for 20 min calculates all way points', () => {
        const plan = new Plan(Strategies.ALL, 40, 20, airTank, options);

        const wayPoints = WayPointsService.calculateWayPoints(plan, gases, options);
        expect(wayPoints.wayPoints.length).toBe(13);
    });

    it('10m for 30 min calculates all way points', () => {
        const plan = new Plan(Strategies.ALL, 30, 10, airTank, options);

        const wayPoints = WayPointsService.calculateWayPoints(plan, gases, options);
        expect(wayPoints.wayPoints.length).toBe(3);
    });
});
