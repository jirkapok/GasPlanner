import { TestBed } from '@angular/core/testing';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';
import { DepthsService } from './depths.service';
import { UnitConversion } from './UnitConversion';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { PlannerService } from './planner.service';
import { DelayedScheduleService } from './delayedSchedule.service';
import { WorkersFactoryCommon } from './serial.workers.factory';

describe('View Switch service', () => {
    const o2Expected = 50;
    let tanksService: TanksService;
    let plan: Plan;
    let viewSwitch: ViewSwitchService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                TanksService, ViewSwitchService,
                OptionsDispatcherService, UnitConversion,
                Plan, DepthsService, WorkersFactoryCommon,
                PlannerService, DelayedScheduleService
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        tanksService = TestBed.inject(TanksService);
        tanksService.firstTank.o2 = o2Expected;
        tanksService.addTank();

        const depthsService = TestBed.inject(DepthsService);
        depthsService.assignDepth(7);
        depthsService.levels[1].endDepth = 5;
        depthsService.addSegment();
        plan = TestBed.inject(Plan);

        viewSwitch = TestBed.inject(ViewSwitchService);
        viewSwitch.isComplex = false;
    });

    describe('Switch to simple view', () => {
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
});
