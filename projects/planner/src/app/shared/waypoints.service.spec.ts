import { WayPointsService } from './waypoints.service';
import { SwimAction } from './wayPoint';
import { Plan } from './plan.service';
import {
    Tank, Salinity, SafetyStop
} from 'scuba-physics';
import { OptionExtensions } from './Options.spec';
import { UnitConversion } from './UnitConversion';

describe('WayPointsService', () => {
    const airTank = new Tank(12, 200, 21);
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    options.safetyStop = SafetyStop.always;

    const sut = new WayPointsService(new UnitConversion());

    it('No segments returns empty array', () => {
        const wayPoints = sut.calculateWayPoints([]);
        expect(wayPoints.length).toEqual(0);
    });

    it('No errors converts waypoints', () => {
        const plan = new Plan();
        plan.setSimple(40, 20, airTank, options);

        const wayPoints = sut.calculateWayPoints(plan.segments);
        expect(wayPoints.length).toEqual(2);
    });

    it('With gas switch adds event', () => {
        const plan = new Plan();
        plan.setSimple(40, 20, airTank, options);
        plan.addSegment(new Tank(10, 0, 50));

        const wayPoints = sut.calculateWayPoints(plan.segments);
        expect(wayPoints[2].swimAction).toEqual(SwimAction.switch);
    });
});
