import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { PlannerService } from './planner.service';
import { Plan } from './plan.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { DepthsService } from './depths.service';
import { inject, TestBed } from '@angular/core/testing';
import { DelayedScheduleService } from './delayedSchedule.service';
import { OptionsService } from './options-dispatcher.service';
import { OptionExtensions } from 'projects/scuba-physics/src/lib/Options.spec';
import { SafetyStop } from 'scuba-physics';

describe('Depths service', () => {
    let depthService: DepthsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, DelayedScheduleService,
                OptionsService, Plan,
                DepthsService, TanksService
            ]
        })
            .compileComponents();

        depthService = TestBed.inject(DepthsService);
    });

    describe('When NOT yet calculated', () => {
        // this value is used as minimum for simple profiles to be able descent
        // with default speed to default depth 30m.
        const descentOnly = 1.7;

        it('Max bottom time is NOT applied', inject([Plan],
            (plan: Plan) => {
                depthService.applyMaxDuration();
                expect(plan.duration).toBe(descentOnly);
            }));

        // Plan needs to be already calculated because NDL is needed
        it('No deco limit is NOT applied', inject([Plan],
            (plan: Plan) => {
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

            const optionsService = TestBed.inject(OptionsService);
            optionsService.loadFrom(planner.options);

            const tanksService = TestBed.inject(TanksService);
            const plan = TestBed.inject(Plan);
            plan.assignDepth(30, tanksService.firstTank.tank, planner.options);
            planner.calculate();
        });

        describe('When Calculated', () => {
            it('Max bottom time is applied', inject([PlannerService, Plan],
                (planner: PlannerService, plan: Plan) => {
                    planner.calculate();
                    depthService.applyMaxDuration();
                    expect(plan.duration).toBe(18);
                }));

            it('No deco limit is applied', inject([PlannerService, Plan],
                (planner: PlannerService, plan: Plan) => {
                    planner.calculate();
                    depthService.applyNdlDuration();
                    expect(plan.duration).toBe(12);
                }));
        });
    });

    describe('Depths', () => {
        let plan: Plan;
        let tanksService: TanksService;

        beforeEach(() => {
            plan = TestBed.inject(Plan);
            tanksService = TestBed.inject(TanksService);
        });

        it('Add correct segment to the end', () => {
            depthService.addSegment();
            const added = plan.segments[2];
            expect(added.endDepth).toBe(30);
            expect(added.duration).toBe(600);
        });

        it('Added segment has previous segment tank', () => {
            depthService.addSegment();
            tanksService.addTank();
            plan.segments[2].tank = tanksService.tankData[1];
            depthService.addSegment();
            expect(plan.segments[3].tank).toBe(tanksService.tankData[1]);
        });

        it('Remove first segment sets initial depth to 0m', () => {
            depthService.addSegment();
            let first = plan.segments[0];
            plan.removeSegment(first);
            first = plan.segments[0];
            expect(first.startDepth).toBe(0);
        });

        it('Remove middle segment corrects start depths', () => {
            plan.segments[1].endDepth = 40;
            depthService.addSegment();
            let middle = plan.segments[1];
            plan.removeSegment(middle);
            middle = plan.segments[1];
            expect(middle.startDepth).toBe(30);
        });
    });

    describe('Imperial Units', () => {
        beforeEach(() => {
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
        });

        it('Updates end depth', () => {
            const last = depthService.levels[1];
            last.endDepth = 70;
            const result = last.segment.endDepth;
            expect(result).toBeCloseTo(21.336, 6);
        });

        it('Converts start depth', () => {
            const last = depthService.levels[1];
            last.segment.startDepth = 6.096;
            expect(last.startDepth).toBeCloseTo(20, 6);
        });

        it('Adjusts tank label', () => {
            const last = depthService.levels[1];
            const tank = last.tank;
            tank.startPressure = 3000;
            tank.workingPressure = 3000;
            tank.size = 100;
            expect(last.tankLabel).toBe('1. Air/100/3000');
        });

        it('Defaults to 100 tf', inject(
            [PlannerService, TanksService, DelayedScheduleService,
                Plan, OptionsService],
            (planner: PlannerService,
                tanksService: TanksService,
                delayedCalc: DelayedScheduleService,
                plan: Plan,
                optionsService: OptionsService) => {
                const units = new UnitConversion();
                units.imperialUnits = true; // before the depths service was even created
                const sut = new DepthsService(units, planner, tanksService,
                    delayedCalc, plan, optionsService);
                expect(sut.plannedDepth).toBeCloseTo(100, 6);
            }));
    });
});
