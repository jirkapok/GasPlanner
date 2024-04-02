import { TestBed } from '@angular/core/testing';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from '../dive.schedules';
import { UnitConversion } from '../UnitConversion';
import { ReloadDispatcher } from '../reloadDispatcher';
import { WayPointsService } from '../waypoints.service';
import { Segment, StandardGases } from 'scuba-physics';
import { ComparedWaypoint } from './ComparedWaypoint';

describe('WayPoints Difference Service', () => {
    let sut: ProfileComparatorService;
    let schedules: DiveSchedules;
    let wayPoints: WayPointsService;

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

    const assertDivesWayPointsCompare = (profileA: Segment[], profileB: Segment[], expected: ComparedWaypoint[])=> {
        schedules.dives[0].diveResult.wayPoints = wayPoints.calculateWayPoints(profileA);
        schedules.dives[1].diveResult.wayPoints = wayPoints.calculateWayPoints(profileB);
        expect(sut.difference).toEqual(expected);
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
        expect(sut.difference).toEqual([]);
    });

    it('Failed profile B with valid profile A', () => {
        schedules.dives[0].diveResult.wayPoints = wayPoints.calculateWayPoints(segments3_minutes6);
        schedules.dives[1].diveResult.endFailed();
        expect(sut.difference).toEqual([]);
    });

    it('Identical profiles', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(180, 20, 120, 20, 120),
            new ComparedWaypoint(360, 0, 180, 0, 180),
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes6, expected);
    });

    it('Profile B takes longer', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(180, 20, 120,  undefined, undefined),
            new ComparedWaypoint( 360, 0, 180, 20, 300),
            new ComparedWaypoint( 540, undefined, undefined, 0, 180),
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments3_minutes9, expected);
    });

    it('Profile A takes longer', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(180, undefined, undefined, 20, 120),
            new ComparedWaypoint(360, 20, 300, 0, 180),
            new ComparedWaypoint(540, 0, 180, undefined, undefined),
        ];
        assertDivesWayPointsCompare(segments3_minutes9, segments3_minutes6, expected);
    });

    it('Profile B has more segments', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(180, 20, 120, 20, 120),
            new ComparedWaypoint(360, 0, 180, undefined, undefined),
            new ComparedWaypoint(480, undefined, undefined, 10, 300),
            new ComparedWaypoint(660, undefined, undefined, 0, 180),
        ];
        assertDivesWayPointsCompare(segments3_minutes6, segments4_minutes11, expected);
    });

    it('Profile A has more segments', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(180, 20, 120, 20, 120),
            new ComparedWaypoint(360, undefined, undefined, 0, 180),
            new ComparedWaypoint(480, 10, 300, undefined,  undefined),
            new ComparedWaypoint(660, 0, 180, undefined, undefined),
        ];
        assertDivesWayPointsCompare(segments4_minutes11, segments3_minutes6, expected);
    });

    it('Profile B has levels missing in profile A', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60),
            new ComparedWaypoint(90, undefined, undefined, 15, 30),
            new ComparedWaypoint(150, undefined, undefined, 15, 60),
            new ComparedWaypoint(180, 20, 120, 20, 30),
            new ComparedWaypoint(480, 10, 300, 10, 300),
            new ComparedWaypoint(660, 0, 180, 0, 180),
        ];
        assertDivesWayPointsCompare(segments4_minutes11, segments6_minutes11, expected);
    });

    it('Profile A has levels missing in profile B', () => {
        const expected: ComparedWaypoint[] = [
            new ComparedWaypoint(60, 20, 60, 20, 60 ),
            new ComparedWaypoint(90, 15, 30, undefined, undefined),
            new ComparedWaypoint(150, 15, 60, undefined, undefined),
            new ComparedWaypoint(180, 20, 30, 20, 120),
            new ComparedWaypoint(480, 10, 300, 10, 300),
            new ComparedWaypoint(660, 0, 180, 0, 180),
        ];
        assertDivesWayPointsCompare(segments6_minutes11, segments4_minutes11, expected);
    });
});
