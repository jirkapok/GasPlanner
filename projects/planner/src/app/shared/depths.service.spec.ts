import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { PlannerService } from './planner.service';
import { Plan } from './plan.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { DepthsService } from './depths.service';
import { inject, TestBed } from '@angular/core/testing';
import { DelayedScheduleService } from './delayedSchedule.service';
import { OptionsDispatcherService } from './options-dispatcher.service';

describe('Depths service', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, DelayedScheduleService,
                OptionsDispatcherService, Plan,
                DepthsService, TanksService
            ]
        })
            .compileComponents();
    });

    describe('When NOT yet calculated', () => {
        // this value is used as minimum for simple profiles to be able descent
        // with default speed to default depth 30m.
        const descentOnly = 1.7;

        // manual service initialization to avoid testbed conflicts
        const createPlanner = (plan: Plan) => new PlannerService(
            new WorkersFactoryCommon(),
            new TanksService(new UnitConversion()),
            plan);

        it('Max bottom time is NOT applied', inject([DepthsService, Plan],
            (depthService: DepthsService, plan: Plan) => {
                depthService.applyMaxDuration();
                expect(plan.duration).toBe(descentOnly);
            }));

        // Plan needs to be already calculated because NDL is needed
        it('No deco limit is NOT applied', inject([DepthsService, Plan],
            (depthService: DepthsService, plan: Plan) => {
                const planner = createPlanner(plan);
                planner.applyNdlDuration();
                expect(plan.duration).toBe(descentOnly);
            }));
    });
});
