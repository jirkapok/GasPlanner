import { TestBed } from '@angular/core/testing';
import { StopsFilter } from './stopsFilter.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { WayPointsService } from './waypoints.service';
import {
    CalculatedProfile, Events, Segment, StandardGases
} from 'scuba-physics';

describe('Stops filter', () => {
    let service: StopsFilter;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                StopsFilter, UnitConversion,
                DiveSchedules, ReloadDispatcher,
            ]
        });

        service = TestBed.inject(StopsFilter);
        const segments: Segment[] = [
            new Segment(0,30, StandardGases.air, 102),
            new Segment(30,30, StandardGases.air, 618),
            new Segment(30,12, StandardGases.air, 120),
            new Segment(12,6, StandardGases.air, 60),
            new Segment(6,3, StandardGases.air, 60),
            new Segment(3,3, StandardGases.air, 180),
            new Segment(3,0, StandardGases.air, 60),
        ];
        const profile = CalculatedProfile.fromErrors(segments, []);
        const wayPoints = new WayPointsService(new UnitConversion());
        const schedules = TestBed.inject(DiveSchedules);
        const dive = schedules.dives[0].diveResult;
        dive.wayPoints = wayPoints.calculateWayPoints(profile, new Events()).wayPoints;
    });

    it('When disabled returns all waypoints', () => {
        const count = service.wayPoints.length;
        expect(count).toEqual(7);
    });

    it('Default profile filters ascent', () => {
        service.switchFilter();
        const count = service.wayPoints.length;

        const expected = [
            { startDepth: 0, endDepth: 30, duration: 102 },
            { startDepth: 30, endDepth: 30, duration: 618 },
            { startDepth: 3, endDepth: 3, duration: 180 },
            { startDepth: 3, endDepth: 0, duration: 60 }
        ];

        expect(count).toEqual(4);
        const current = service.wayPoints.map(i => ({
            startDepth: i.startDepth,
            endDepth: i.endDepth,
            duration: i.duration
        }));
        expect(current).toEqual(expected);
    });
});
