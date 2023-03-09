import {
    Time, SafetyStop, Segment, Event,
    EventType, CalculatedProfile, Events
} from 'scuba-physics';
import { PlannerService } from './planner.service';
import { OptionExtensions } from '../../../../scuba-physics/src/lib/Options.spec';
import { inject, TestBed } from '@angular/core/testing';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { PlanningTasks } from '../workers/planning.tasks';
import {
    ConsumptionRequestDto, ConsumptionResultDto,
    DiveInfoResultDto, DtoSerialization,
    ProfileRequestDto, ProfileResultDto
} from './serialization.model';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';
import { Plan } from './plan.service';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { DepthsService } from './depths.service';
import { DelayedScheduleService } from './delayedSchedule.service';

describe('PlannerService', () => {
    let planner: PlannerService;
    let tanksService: TanksService;
    let viewSwitch: ViewSwitchService;
    let plan: Plan;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [WorkersFactoryCommon,
                PlannerService, UnitConversion,
                TanksService, ViewSwitchService,
                OptionsDispatcherService, Plan,
                DepthsService, DelayedScheduleService
            ],
            imports: []
        }).compileComponents();

        planner = TestBed.inject(PlannerService);
        tanksService = TestBed.inject(TanksService);
        viewSwitch = TestBed.inject(ViewSwitchService);
        plan = TestBed.inject(Plan);
        OptionExtensions.applySimpleSpeeds(planner.options);
        planner.options.problemSolvingDuration = 2;
        planner.options.safetyStop = SafetyStop.always;
        plan.assignDepth(30, tanksService.firstTank.tank, planner.options);
        planner.calculate();
    });

    describe('Dive info calculated', () => {
        it('No deco limit is calculated', () => {
            const noDecoLimit = plan.noDecoTime;
            expect(noDecoLimit).toBe(12);
        });

        it('OTU limit is calculated', () => {
            const otuLimit = planner.dive.otu;
            expect(otuLimit).toBeCloseTo(7.6712, 4);
        });

        it('CNS limit is calculated', () => {
            const cnsLimit = planner.dive.cns;
            expect(cnsLimit).toBeCloseTo(0.025702, 6);
        });
    });

    describe('30m for 15 minutes Calculates (defaults)', () => {
        it('8 minutes time to surface', () => {

            planner.calculate();
            expect(planner.dive.timeToSurface).toBe(8);
        });

        it('18 minutes maximum dive time', () => {
            planner.calculate();
            expect(planner.dive.maxTime).toBe(18);
        });

        it('74 bar rock bottom', () => {
            planner.calculate();
            expect(tanksService.firstTank.tank.reserve).toBe(78);
        });

        it('109 bar remaining gas', () => {
            planner.calculate();
            expect(tanksService.firstTank.tank.endPressure).toBe(123);
        });
    });

    describe('Shows errors', () => {
        it('60m for 50 minutes maximum depth exceeded', () => {
            plan.assignDepth(60, tanksService.firstTank.tank, planner.options);
            planner.calculate();
            const hasEvents = planner.dive.events.length > 0;
            expect(hasEvents).toBeTruthy();
        });

        it('60m for 50 minutes not enough gas', inject([DepthsService], (depthService: DepthsService) => {
            depthService.assignDuration(50);
            planner.calculate();
            expect(planner.dive.notEnoughGas).toBeTruthy();
        }));

        it('30m for 20 minutes no decompression time exceeded', inject([DepthsService], (depthService: DepthsService) => {
            depthService.assignDuration(20);
            planner.calculate();
            expect(planner.dive.noDecoExceeded).toBeTruthy();
        }));
    });

    describe('Switch between simple and complex', () => {
        const o2Expected = 50;

        beforeEach(() => {
            tanksService.firstTank.o2 = o2Expected;
            // TODO simplify setup
            tanksService.addTank();

            plan.assignDepth(7, tanksService.firstTank.tank, planner.options);
            plan.segments[1].endDepth = 5;
            const depthsService = TestBed.inject(DepthsService);
            depthsService.addSegment();
            plan.fixDepths(); // to simplify setup
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

    describe('Manage tanks', () => {
        describe('Remove', () => {
            let lastSegment: Segment;

            beforeEach(() => {
                tanksService.addTank();
                tanksService.addTank();
                const secondTank = tanksService.tanks[1];

                const depthsService = TestBed.inject(DepthsService);
                depthsService.addSegment();
                const segments = plan.segments;
                lastSegment = segments[1];
                lastSegment.tank = secondTank.tank;
                tanksService.removeTank(secondTank);
            });

            it('Updates segment reference to first tank', () => {
                expect(lastSegment.tank).toEqual(tanksService.firstTank.tank);
            });
        });
    });

    describe('Updates dive', () => {
        it('Average depth is calculated', () => {
            planner.calculate();
            expect(planner.dive.averageDepth).toBe(21.75);
        });

        it('Start ascent is updated', inject([DepthsService], (depthService: DepthsService) => {
            planner.calculate();
            depthService.applyNdlDuration();
            expect(planner.dive.emergencyAscentStart).toEqual(Time.oneMinute * 12);
        }));
    });

    describe('Errors', () => {
        const createProfileResultDto = (): ProfileResultDto => {
            const events = new Events();
            events.add(new Event(0, 0, EventType.error));
            const profile = CalculatedProfile.fromErrors(plan.segments, []);
            const profileDto = DtoSerialization.fromProfile(profile);
            return {
                profile: profileDto,
                events: DtoSerialization.fromEvents(events.items)
            };
        };

        const expectDiveMarkedAsCalculated = (): void => {
            expect(planner.dive.diveInfoCalculated).toBeTruthy();
            expect(planner.dive.calculated).toBeTruthy();
            expect(planner.dive.profileCalculated).toBeTruthy();
        };

        describe('Profile calculated with errors', () => {
            let noDecoSpy: jasmine.Spy<(data: ProfileRequestDto) => DiveInfoResultDto>;
            let consumptionSpy: jasmine.Spy<(data: ConsumptionRequestDto) => ConsumptionResultDto>;
            let wayPointsFinished = false;
            let infoFinished = false;

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateDecompression')
                    .and.callFake(() => createProfileResultDto());

                planner.wayPointsCalculated$.subscribe(() => wayPointsFinished = true);
                planner.infoCalculated$.subscribe(() => infoFinished = true);
                noDecoSpy = spyOn(PlanningTasks, 'diveInfo').and.callThrough();
                consumptionSpy = spyOn(PlanningTasks, 'calculateConsumption').and.callThrough();
                planner.calculate();
            });

            it('Fallback to error state', () => {
                expect(planner.dive.hasErrors).toBeTruthy();
            });

            it('Still fires waypoints calculated event', () => {
                expect(wayPointsFinished).toBeTruthy();
            });

            it('Still fires info calculated event', () => {
                expect(infoFinished).toBeTruthy();
            });

            it('Sets all progress properties to true', () => {
                expectDiveMarkedAsCalculated();
            });

            it('Doesn\'t call no deco task', () => {
                expect(noDecoSpy).not.toHaveBeenCalled();
            });

            it('Doesn\'t call consumption task', () => {
                expect(consumptionSpy).not.toHaveBeenCalled();
            });
        });

        describe('Profile task failed', () => {
            let noDecoSpy: jasmine.Spy<(data: ProfileRequestDto) => DiveInfoResultDto>;
            let consumptionSpy: jasmine.Spy<(data: ConsumptionRequestDto) => ConsumptionResultDto>;
            let wayPointsFinished = false;
            let infoFinished = false;

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateDecompression')
                    .and.throwError('Profile failed');

                planner.wayPointsCalculated$.subscribe(() => wayPointsFinished = true);
                planner.infoCalculated$.subscribe(() => infoFinished = true);
                noDecoSpy = spyOn(PlanningTasks, 'diveInfo').and.callThrough();
                consumptionSpy = spyOn(PlanningTasks, 'calculateConsumption').and.callThrough();
                planner.calculate();
            });

            it('Still finishes waypoints calculated event', () => {
                expect(wayPointsFinished).toBeTruthy();
            });

            it('Still finishes info calculated event', () => {
                expect(infoFinished).toBeTruthy();
            });

            it('Sets calculation to failed', () => {
                expectDiveMarkedAsCalculated();
            });

            it('Skips no deco task', () => {
                expect(noDecoSpy).not.toHaveBeenCalled();
            });

            it('Skips consumption task', () => {
                expect(consumptionSpy).not.toHaveBeenCalled();
            });
        });

        describe('No deco task failed', () => {
            let infoFinished = false;

            beforeEach(() => {
                spyOn(PlanningTasks, 'diveInfo')
                    .and.throwError('No deco failed');

                planner.infoCalculated$.subscribe(() => infoFinished = true);
                planner.calculate();
            });

            it('Still ends info calculated event', () => {
                expect(infoFinished).toBeTruthy();
            });

            it('Sets calculation to resolved failed', () => {
                expectDiveMarkedAsCalculated();
            });
        });

        describe('Consumption task failed', () => {
            let infoFinished = false;

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateConsumption')
                    .and.throwError('Consumption failed');

                planner.infoCalculated$.subscribe(() => infoFinished = true);
                planner.calculate();
            });

            it('Still ends calculated event', () => {
                expect(infoFinished).toBeTruthy();
            });

            it('Sets consumption to resolved failed', () => {
                expectDiveMarkedAsCalculated();
            });
        });
    });
});
