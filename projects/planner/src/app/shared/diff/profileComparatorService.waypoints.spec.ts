import { TestBed } from '@angular/core/testing';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from '../dive.schedules';
import { UnitConversion } from '../UnitConversion';
import { ReloadDispatcher } from '../reloadDispatcher';
import { WayPointsService } from '../waypoints.service';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { ComparedWaypoint } from './ComparedWaypoint';
import _ from 'lodash';

interface AssertedWayPoint {
    runTime: number;
    depthA: number | undefined;
    durationA: number | undefined;
    depthB: number | undefined;
    durationB: number | undefined;
}

describe('WayPoints Difference Service', () => {
    const irrelevantTissues = ProfileTissues.createAtSurface(0);
    let sut: ProfileComparatorService;
    let schedules: DiveSchedules;
    let wayPoints: WayPointsService;
    let dispatcher: ReloadDispatcher;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                ProfileComparatorService,
                DiveSchedules, UnitConversion, ReloadDispatcher,
                WayPointsService
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        schedules = TestBed.inject(DiveSchedules);
        schedules.add();
        sut = TestBed.inject(ProfileComparatorService);
        wayPoints = TestBed.inject(WayPointsService);
        dispatcher = TestBed.inject(ReloadDispatcher);
        setDiveCalculated(0);
        setDiveCalculated(1);
    });

    const setDiveCalculated = (index: number) => {
        const result = schedules.dives[index].diveResult;
        result.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        result.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
    };

    const setCalculationRunning = (index: number) => {
        const result = schedules.dives[index].diveResult;
        result.start();
    };

    const segments3_minutes6: Segment[] = [
        new Segment(0, 20, StandardGases.air, 60),
        new Segment(20, 20, StandardGases.air, 120),
        new Segment(20, 0, StandardGases.air, 180)
    ];

    const segments3_minutes9: Segment[] = [
        new Segment(0, 20, StandardGases.air, 60),
        new Segment(20, 20, StandardGases.air, 300),
        new Segment(20, 0, StandardGases.air, 180)
    ];

    const segments4_minutes11: Segment[] = [
        new Segment(0, 20, StandardGases.air, 60),
        new Segment(20, 20, StandardGases.air, 120),
        new Segment(20, 10, StandardGases.air, 300),
        new Segment(10, 0, StandardGases.air, 180)
    ];

    const segments6_minutes11: Segment[] = [
        new Segment(0, 20, StandardGases.air, 60),
        new Segment(20, 15, StandardGases.air, 30),
        new Segment(15, 15, StandardGases.air, 60),
        new Segment(15, 20, StandardGases.air, 30),
        new Segment(20, 10, StandardGases.air, 300),
        new Segment(10, 0, StandardGases.air, 180)
    ];

    function toAssert(current: ComparedWaypoint[]): AssertedWayPoint[] {
        return _(current).map<AssertedWayPoint>(e => ({
            runTime: e.runTime,
            depthA: e.depthA,
            durationA: e.durationA,
            depthB: e.depthB,
            durationB: e.durationB
        })).toArray().value();
    }

    const assertDivesWayPointsCompare = (profileA: Segment[], profileB: Segment[], expected: AssertedWayPoint[])=> {
        schedules.dives[0].diveResult.updateProfile(wayPoints.calculateWayPoints(profileA), irrelevantTissues);
        schedules.dives[1].diveResult.updateProfile(wayPoints.calculateWayPoints(profileB), irrelevantTissues);
        // simulate calculation behavior to enforce cache of waypoints
        dispatcher.sendInfoCalculated(1);
        dispatcher.sendInfoCalculated(2);
        const current = toAssert(sut.difference);
        expect(current).toEqual(expected);
    };

    it('Not calculated profile A', (done) => {
        setCalculationRunning(0);

        setTimeout(() => {
            assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, []);
            done();
        }, 500);
    });

    it('Not calculated profile B', (done) => {
        setCalculationRunning(1);

        setTimeout(() => {
            assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, []);
            done();
        }, 500);
    });

    it('Failed profile A with valid profile B', () => {
        schedules.dives[0].diveResult.endFailed();
        schedules.dives[1].diveResult.updateProfile(wayPoints.calculateWayPoints(segments3_minutes6), irrelevantTissues);
        expect(sut.difference).toEqual([]);
    });

    it('Failed profile B with valid profile A', () => {
        schedules.dives[0].diveResult.updateProfile(wayPoints.calculateWayPoints(segments3_minutes6), irrelevantTissues);
        schedules.dives[1].diveResult.endFailed();
        expect(sut.difference).toEqual([]);
    });

    it('Identical profiles', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 0, durationA: 180, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, expected);
    });

    it('Profile B takes longer', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: undefined, durationB: undefined },
            { runTime: 360, depthA: 0, durationA: 180, depthB: 20, durationB: 300 },
            { runTime: 540, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes9, expected);
    });

    it('Profile A takes longer', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: undefined, durationA: undefined, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 20, durationA: 300, depthB: 0, durationB: 180 },
            { runTime: 540, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
        ];
        assertDivesWayPointsCompare(segments3_minutes9, segments3_minutes6, expected);
    });

    it('Profile B has more segments', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
            { runTime: 480, depthA: undefined, durationA: undefined, depthB: 10, durationB: 300 },
            { runTime: 660, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments4_minutes11, expected);
    });

    it('Profile A has more segments', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
            { runTime: 480, depthA: 10, durationA: 300, depthB: undefined, durationB: undefined },
            { runTime: 660, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
        ];
        assertDivesWayPointsCompare(segments4_minutes11, segments3_minutes6, expected);
    });

    it('Profile B has levels missing in profile A', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 90, depthA: undefined, durationA: undefined, depthB: 15, durationB: 30 },
            { runTime: 150, depthA: undefined, durationA: undefined, depthB: 15, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 30 },
            { runTime: 480, depthA: 10, durationA: 300, depthB: 10, durationB: 300 },
            { runTime: 660, depthA: 0, durationA: 180, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments4_minutes11, segments6_minutes11, expected);
    });

    it('Profile A has levels missing in profile B', () => {
        const expected: AssertedWayPoint[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 90, depthA: 15, durationA: 30, depthB: undefined, durationB: undefined },
            { runTime: 150, depthA: 15, durationA: 60, depthB: undefined, durationB: undefined },
            { runTime: 180, depthA: 20, durationA: 30, depthB: 20, durationB: 120 },
            { runTime: 480, depthA: 10, durationA: 300, depthB: 10, durationB: 300 },
            { runTime: 660, depthA: 0, durationA: 180, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments6_minutes11, segments4_minutes11, expected);
    });

    it('Comparison returns cached diff', () => {
        // irrelevant profiles
        schedules.dives[0].diveResult.updateProfile(wayPoints.calculateWayPoints(segments3_minutes6), irrelevantTissues);
        schedules.dives[1].diveResult.updateProfile(wayPoints.calculateWayPoints(segments6_minutes11), irrelevantTissues);
        dispatcher.sendInfoCalculated(1);
        dispatcher.sendInfoCalculated(2);
        expect(sut.difference).toBe(sut.difference);
    });

    it('Recalculated even same profile refreshes diff', () => {
        // irrelevant profiles
        schedules.dives[0].diveResult.updateProfile(wayPoints.calculateWayPoints(segments3_minutes6), irrelevantTissues);
        schedules.dives[1].diveResult.updateProfile(wayPoints.calculateWayPoints(segments6_minutes11), irrelevantTissues);
        dispatcher.sendInfoCalculated(1);
        dispatcher.sendInfoCalculated(2);
        const first = sut.difference;
        dispatcher.sendInfoCalculated(2);
        expect(first).not.toBe(sut.difference);
    });
});
