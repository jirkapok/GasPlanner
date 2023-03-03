import { WayPointsService } from './waypoints.service';
import { SwimAction } from './models';
import { Plan } from '../shared/plan.service';
import { Tank, Salinity, CalculatedProfile, Events, Event, EventType, SafetyStop } from 'scuba-physics';
import { OptionExtensions } from '../../../../scuba-physics/src/lib/Options.spec';

describe('WayPointsService', () => {
    const airTank = new Tank(12, 200, 21);
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    options.safetyStop = SafetyStop.always;

    it('No errors converts waypoints', () => {
        const plan = new Plan();
        plan.setSimple(40, 20, airTank, options);
        const profile = CalculatedProfile.fromProfile(plan.segments, []);

        const wayPoints = WayPointsService.calculateWayPoints(profile, new Events());
        expect(wayPoints.wayPoints.length).toBe(2);
    });

    it('With errors generates empty waypoints', () => {
        const plan = new Plan();
        plan.setSimple(30, 10, airTank, options);
        const profile = CalculatedProfile.fromErrors(plan.segments, [
            new Event(0,0, EventType.error)
        ]);

        const wayPoints = WayPointsService.calculateWayPoints(profile, new Events());
        expect(wayPoints.wayPoints.length).toBe(0);
    });

    it('With gas switch adds event', () => {
        const plan = new Plan();
        plan.setSimple(40, 20, airTank, options);
        plan.addSegment(new Tank(10, 0, 50));
        const profile = CalculatedProfile.fromProfile(plan.segments, []);

        const wayPoints = WayPointsService.calculateWayPoints(profile, new Events());
        expect(wayPoints.wayPoints[2].swimAction).toBe(SwimAction.switch);
    });
});
