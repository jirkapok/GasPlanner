import { TestBed } from '@angular/core/testing';
import { StopsFilter } from './stopsFilter.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { TestBedExtensions } from './TestbedExtensions.spec';
import { DiveResults } from './diveresults';
import { WayPointsService } from './waypoints.service';
import { Segment, StandardGases } from 'scuba-physics';

describe('Stops filter', () => {
    let service: StopsFilter;
    let dive: DiveResults;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                StopsFilter, UnitConversion,
                DiveSchedules, ReloadDispatcher,
                WayPointsService
            ]
        });

        service = TestBed.inject(StopsFilter);
        const schedules = TestBed.inject(DiveSchedules);
        dive = schedules.selected.diveResult;
        dive.wayPoints = TestBedExtensions.sampleWayPoints();
    });

    it('When disabled returns all waypoints', () => {
        const count = service.wayPoints.length;
        expect(count).toEqual(7);
    });

    const mapWayPoints = () => service.wayPoints.map(i => ({
        startDepth: i.startDepth,
        endDepth: i.endDepth,
        duration: i.duration
    }));

    it('Default profile filters ascent', () => {
        service.switchFilter();

        const expected = [
            { startDepth: 0, endDepth: 30, duration: 102 },
            { startDepth: 30, endDepth: 30, duration: 618 },
            { startDepth: 3, endDepth: 3, duration: 180 },
            { startDepth: 3, endDepth: 0, duration: 60 }
        ];

        const current = mapWayPoints();
        expect(current).toEqual(expected);
    });

    it('Filters all gas switches and stops', () => {
        const wayPointService = TestBed.inject(WayPointsService);
        const profile = [
            new Segment(0, 30, StandardGases.air, 1),
            new Segment(30, 30, StandardGases.air, 2),
            new Segment(30, 30, StandardGases.ean32, 3), // user defined gas switch
            new Segment(30, 12, StandardGases.ean32, 4),
            new Segment(12, 12, StandardGases.ean32, 5), // deco stop
            new Segment(12, 6, StandardGases.ean32, 6),
            new Segment(6, 6, StandardGases.oxygen, 7),
            new Segment(6, 0, StandardGases.oxygen, 8),
        ];

        // this is incorrect, because we don't set the used defined waypoints in depths plan
        dive.wayPoints = wayPointService.calculateWayPoints(profile);
        service.switchFilter();

        const expected = [
            { startDepth: 0, endDepth: 30, duration: 1 },
            { startDepth: 30, endDepth: 30, duration: 2 },
            { startDepth: 30, endDepth: 30, duration: 3 },
            { startDepth: 12, endDepth: 12, duration: 5 },
            { startDepth: 6, endDepth: 6, duration: 7 },
            { startDepth: 6, endDepth: 0, duration: 8 }
        ];

        const current = mapWayPoints();
        expect(current).toEqual(expected);
    });
});
