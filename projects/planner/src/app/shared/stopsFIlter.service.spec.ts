import { TestBed } from '@angular/core/testing';
import { StopsFilter } from './stopsFilter.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { TestBedExtensions } from './TestbedExtensions.testing';
import { DiveResults } from './diveresults';
import { WayPointsService } from './waypoints.service';
import { CircuitType, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { ViewSwitchService } from './viewSwitchService';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

describe('Stops filter', () => {
    const irrelevantTissues = ProfileTissues.createAtSurface(0);
    let service: StopsFilter;
    let dive: DiveResults;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestTranslate(),
                StopsFilter, UnitConversion,
                DiveSchedules, ReloadDispatcher,
                WayPointsService, ViewSwitchService
            ]
        });

        service = TestBed.inject(StopsFilter);
        const schedules = TestBed.inject(DiveSchedules);
        dive = schedules.selected.diveResult;

        dive.updateProfile(TestBedExtensions.sampleWayPoints(), irrelevantTissues, []);
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
        dive.updateProfile(wayPointService.calculateWayPoints(profile), irrelevantTissues, []);
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

    describe('Bailout profile', () => {
        // default plan descent and bottom take 720 seconds, then the emergency ascent starts
        const ascentStart = 720;

        beforeEach(() => {
            const schedules = TestBed.inject(DiveSchedules);
            schedules.selected.optionsService.circuit = CircuitType.pscr;
            const emergencySegments = [
                new Segment(30, 30, StandardGases.air, 60), // problem solving
                new Segment(30, 6, StandardGases.air, 160),
                new Segment(6, 6, StandardGases.air, 120), // deco stop
                new Segment(6, 0, StandardGases.air, 60)
            ];
            const emergencyAscent = TestBed.inject(WayPointsService).calculateWayPoints(emergencySegments, ascentStart);
            dive.updateConsumption(0, 0, ascentStart, 0, 0, false, false, emergencyAscent);
            TestBed.inject(ViewSwitchService).showBailoutProfile = true;
        });

        it('continues the plan by the emergency ascent', () => {
            const expected = [
                { startDepth: 0, endDepth: 30, duration: 102 },
                { startDepth: 30, endDepth: 30, duration: 618 },
                { startDepth: 30, endDepth: 30, duration: 60 },
                { startDepth: 30, endDepth: 6, duration: 160 },
                { startDepth: 6, endDepth: 6, duration: 120 },
                { startDepth: 6, endDepth: 0, duration: 60 }
            ];

            expect(mapWayPoints()).toEqual(expected);
            expect(service.wayPoints[2].startTime).toBe(ascentStart);
            expect(service.totalDuration).toBe(ascentStart + 400);
        });

        it('applies stops filter', () => {
            service.switchFilter();

            const expected = [
                { startDepth: 0, endDepth: 30, duration: 102 },
                { startDepth: 30, endDepth: 30, duration: 618 },
                { startDepth: 30, endDepth: 30, duration: 60 },
                { startDepth: 6, endDepth: 6, duration: 120 },
                { startDepth: 6, endDepth: 0, duration: 60 }
            ];

            expect(mapWayPoints()).toEqual(expected);
        });

        it('open circuit shows the dive profile', () => {
            TestBed.inject(DiveSchedules).selected.optionsService.circuit = CircuitType.oc;
            expect(service.showBailout).toBe(false);
            expect(service.wayPoints.length).toBe(7);
        });

        it('rebreather dive profile tab shows the dive profile', () => {
            TestBed.inject(ViewSwitchService).showBailoutProfile = false;
            expect(service.wayPoints.length).toBe(7);
        });

        it('closed circuit loop part shows setpoint, bailout ascent not', () => {
            TestBed.inject(DiveSchedules).selected.optionsService.circuit = CircuitType.eccr;
            const points = service.wayPoints;
            expect(service.setpoint(points[1])).toBe(1.1);
            expect(service.setpoint(points[2])).toBeUndefined();
        });
    });

    describe('Setpoint in dive profile', () => {
        const options = () => TestBed.inject(DiveSchedules).selected.optionsService;

        it('open circuit has no setpoint', () => {
            expect(service.setpoint(service.wayPoints[1])).toBeUndefined();
        });

        it('pSCR has no setpoint', () => {
            options().circuit = CircuitType.pscr;
            expect(service.setpoint(service.wayPoints[1])).toBeUndefined();
        });

        it('mCCR holds the same setpoint during the whole dive', () => {
            options().circuit = CircuitType.mccr;
            options().setpoint = 1.2;
            expect(service.wayPoints.map(p => service.setpoint(p))).toEqual([1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2]);
        });

        it('eCCR uses bottom setpoint before and deco setpoint after the deepest point', () => {
            options().circuit = CircuitType.eccr;
            const points = service.wayPoints;
            expect(service.setpoint(points[0])).toBe(1.1);
            expect(service.setpoint(points[1])).toBe(1.1);
            expect(service.setpoint(points[2])).toBe(1.3);
        });
    });
});
