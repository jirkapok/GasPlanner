import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { PlannerService } from './planner.service';
import { Plan } from './plan.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { DepthsService } from './depths.service';
import { inject, TestBed } from '@angular/core/testing';
import { DelayedScheduleService } from './delayedSchedule.service';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { OptionExtensions } from 'projects/scuba-physics/src/lib/Options.spec';
import { SafetyStop } from 'scuba-physics';

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

        it('Max bottom time is NOT applied', inject([DepthsService, Plan],
            (depthService: DepthsService, plan: Plan) => {
                depthService.applyMaxDuration();
                expect(plan.duration).toBe(descentOnly);
            }));

        // Plan needs to be already calculated because NDL is needed
        it('No deco limit is NOT applied', inject([DepthsService, Plan],
            (depthService: DepthsService, plan: Plan) => {
                depthService.applyNdlDuration();
                expect(plan.duration).toBe(descentOnly);
            }));
    });

    describe('Apply plan limits', () => {
        beforeEach(() => {
            const planner = TestBed.inject(PlannerService);
            OptionExtensions.applySimpleSpeeds(planner.options);
            planner.options.problemSolvingDuration = 2;
            planner.options.safetyStop = SafetyStop.always;
            const tanksService = TestBed.inject(TanksService);
            const plan = TestBed.inject(Plan);
            plan.assignDepth(30, tanksService.firstTank.tank, planner.options);
            planner.calculate();
        });

        describe('When Calculated', () => {
            it('Max bottom time is applied', inject([PlannerService, DepthsService, Plan],
                (planner: PlannerService, depthService: DepthsService, plan: Plan) => {
                    planner.calculate();
                    depthService.applyMaxDuration();
                    expect(plan.duration).toBe(18);
                }));

            it('No deco limit is applied', inject([PlannerService, DepthsService, Plan],
                (planner: PlannerService, depthService: DepthsService, plan: Plan) => {
                    planner.calculate();
                    depthService.applyNdlDuration();
                    expect(plan.duration).toBe(12);
                }));
        });
    });
});
