import { TestBed } from '@angular/core/testing';
import { StopsFilter } from './stopsFilter.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import {TestBedExtensions} from './TestbedExtensions.spec';

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
        const schedules = TestBed.inject(DiveSchedules);
        const dive = schedules.dives[0].diveResult;
        dive.wayPoints = TestBedExtensions.sampleWayPoints();
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
