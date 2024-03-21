import { TestBed } from '@angular/core/testing';
import { WaypointsDifferenceService } from './waypoints-difference.service';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from './dive.schedules';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { WayPointsService } from './waypoints.service';
import { Segment, StandardGases } from 'scuba-physics';
import { WaypointsComparisonTableRow } from './WaypointsComparisonTableRow';

fdescribe('WayPoints Difference Service', () => {
    let sut: WaypointsDifferenceService;
    let schedules: DiveSchedules;
    let wayPoints: WayPointsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                WaypointsDifferenceService, ProfileComparatorService,
                DiveSchedules, UnitConversion, ReloadDispatcher,
                WayPointsService
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        sut = TestBed.inject(WaypointsDifferenceService);
        schedules = TestBed.inject(DiveSchedules);
        schedules.add();
        const selection = TestBed.inject(ProfileComparatorService);
        selection.appendProfileToProfileComparison(1);
        wayPoints = TestBed.inject(WayPointsService);
        setDiveCalculated(0);
        setDiveCalculated(1);
    });

    const setDiveCalculated = (index: number) => {
        const result = schedules.dives[index].diveResult;
        result.consumptionFinished();
        result.diveInfoFinished();
    };

    const setCalculationRunning = (index: number) => {
        const result = schedules.dives[index].diveResult;
        result.start();
        result.showStillRunning();
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

    const assertDivesWayPointsCompare = (profileA: Segment[], profileB: Segment[], expected: WaypointsComparisonTableRow[])=> {
        // TODO cant use for empty profiles, because it is not accepted by waypoint service - fix waypoint service
        schedules.dives[0].diveResult.wayPoints = wayPoints.calculateWayPoints(profileA);
        schedules.dives[1].diveResult.wayPoints = wayPoints.calculateWayPoints(profileB);
        const diff = sut.getRows();
        expect(diff).toEqual(expected);
    };

    it('Not calculated profile A', () => {
        setCalculationRunning(0);
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, []);
    });

    it('Not calculated profile B', () => {
        setCalculationRunning(1);
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, []);
    });

    it('Failed profile A with valid profile B', () => {
        schedules.dives[0].diveResult .endFailed();
        schedules.dives[1].diveResult.wayPoints = wayPoints.calculateWayPoints(segments3_minutes6);
        const diff = sut.getRows();
        expect(diff).toEqual([]);
    });

    it('Failed profile B with valid profile A', () => {
        schedules.dives[0].diveResult.wayPoints = wayPoints.calculateWayPoints(segments3_minutes6);
        schedules.dives[1].diveResult.endFailed();
        const diff = sut.getRows();
        expect(diff).toEqual([]);
    });

    it('Identical profiles', () => {
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 0, durationA: 180, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, expected);
    });

    it('Profile B takes longer', () => {
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: undefined, durationB: undefined },
            { runTime: 360, depthA: 0, durationA: 180, depthB: 20, durationB: 300 },
            { runTime: 540, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes9, expected);
    });

    it('Profile A takes longer', () => {
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: undefined, durationA: undefined, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 20, durationA: 300, depthB: 0, durationB: 180 },
            { runTime: 540, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
        ];
        assertDivesWayPointsCompare(segments3_minutes9, segments3_minutes6, expected);
    });

    it('Profile B has more segments', () => {
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
            { runTime: 480, depthA: undefined, durationA: undefined, depthB: 10, durationB: 300 },
            { runTime: 660, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments4_minutes11, expected);
    });

    it('Profile A has more segments', () => {
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 180, depthA: 20, durationA: 120, depthB: 20, durationB: 120 },
            { runTime: 360, depthA: undefined, durationA: undefined, depthB: 0, durationB: 180 },
            { runTime: 480, depthA: 10, durationA: 300, depthB: undefined, durationB: undefined },
            { runTime: 660, depthA: 0, durationA: 180, depthB: undefined, durationB: undefined },
        ];
        assertDivesWayPointsCompare(segments4_minutes11, segments3_minutes6, expected);
    });

    it('Profile B has levels missing in profile A', () => {
        const expected: WaypointsComparisonTableRow[] = [
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
        const expected: WaypointsComparisonTableRow[] = [
            { runTime: 60, depthA: 20, durationA: 60, depthB: 20, durationB: 60 },
            { runTime: 90, depthA: 15, durationA: 30, depthB: undefined, durationB: undefined },
            { runTime: 150, depthA: 15, durationA: 60, depthB: undefined, durationB: undefined },
            { runTime: 180, depthA: 20, durationA: 30, depthB: 20, durationB: 120 },
            { runTime: 480, depthA: 10, durationA: 300, depthB: 10, durationB: 300 },
            { runTime: 660, depthA: 0, durationA: 180, depthB: 0, durationB: 180 },
        ];
        assertDivesWayPointsCompare(segments6_minutes11, segments4_minutes11, expected);
    });

    // TODO rename areResultsCalculated to bothResultsCalculated
    // TODO rename to difference, refactor to property
});
