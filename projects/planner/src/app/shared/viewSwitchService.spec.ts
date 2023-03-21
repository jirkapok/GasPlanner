import { TestBed } from '@angular/core/testing';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';
import { DepthsService } from './depths.service';

describe('Switch to simple view', () => {
    const o2Expected = 50;
    let tanksService: TanksService;
    let plan: Plan;
    let viewSwitch: ViewSwitchService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [WorkersFactoryCommon,
                TanksService, ViewSwitchService,
                Plan, DepthsService
            ],
            imports: []
        }).compileComponents();

        TestBed.inject(TanksService);
        TestBed.inject(ViewSwitchService);
    });

    beforeEach(() => {
        tanksService.firstTank.o2 = o2Expected;
        tanksService.addTank();

        const depthsService = TestBed.inject(DepthsService);
        depthsService.assignDepth(7);
        depthsService.levels[1].endDepth = 5;
        depthsService.addSegment();

        viewSwitch.isComplex = false;
    });

    it('Sets simple profile', () => {
        expect(plan.duration).toBe(22);
    });

    it('Plan has correct depths', () => {
        const segments = plan.segments;
        expect(segments.length).toBe(2);
        expect(segments[0].endDepth).toBe(7);
        expect(segments[1].endDepth).toBe(7);
    });
});
