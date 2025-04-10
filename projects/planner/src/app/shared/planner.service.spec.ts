import {
    CalculatedProfile, CalculatedProfileStatistics,
    Event, StandardGases, Time
} from 'scuba-physics';
import _ from 'lodash';
import { PlannerService } from './planner.service';
import { OptionExtensions } from './Options.spec';
import { inject, TestBed } from '@angular/core/testing';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { PlanningTasks } from '../workers/planning.tasks';
import {
    ConsumptionRequestDto,
    ConsumptionResultDto, DiveInfoRequestDto,
    DiveInfoResultDto,
    ProfileResultDto
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { OptionsService } from './options.service';
import { DepthsService } from './depths.service';
import { SettingsNormalizationService } from './settings-normalization.service';
import { ViewStates } from './viewStates';
import { DiveResults } from './diveresults';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { ViewSwitchService } from './viewSwitchService';
import { ApplicationSettingsService } from './ApplicationSettings';

describe('PlannerService', () => {
    let planner: PlannerService;
    let tanksService: TanksService;
    let depthsService: DepthsService;
    let dive: DiveResults;
    let optionsService: OptionsService;
    let dispatcher: ReloadDispatcher;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                WorkersFactoryCommon,
                PlannerService, UnitConversion,
                DiveSchedules, ReloadDispatcher,
                SettingsNormalizationService, ViewStates,
                ViewSwitchService, ApplicationSettingsService
            ],
            imports: []
        }).compileComponents();

        planner = TestBed.inject(PlannerService);
        const selectedDive = TestBed.inject(DiveSchedules).selected;
        tanksService = selectedDive.tanksService;
        optionsService = selectedDive.optionsService;
        depthsService = selectedDive.depths;
        dive = selectedDive.diveResult;
        OptionExtensions.applySimpleSpeeds(optionsService.getOptions());
        optionsService.problemSolvingDuration = 2;
        optionsService.useSafetyOn();
        depthsService.plannedDepth = 30;
        dispatcher = TestBed.inject(ReloadDispatcher);
        planner.calculate(1);
    });

    describe('Events are fired', () => {
        let profilesReceived: (number | undefined)[];
        let infosReceived: (number | undefined)[];

        beforeEach(() => {
            profilesReceived = [];
            infosReceived = [];
            dispatcher.wayPointsCalculated$.subscribe((source) => profilesReceived.push(source));
            dispatcher.infoCalculated$.subscribe((source) => infosReceived.push(source));
            TestBed.inject(DiveSchedules).add();
            planner.calculate(2);
        });

        it('Profile calculated with correct dive id', () => {
            expect(profilesReceived).toEqual([2]);
        });

        it('Info calculated with correct dive id', () => {
            expect(infosReceived).toEqual([2]);
        });
    });

    describe('Dive info calculated', () => {
        it('No deco limit is calculated', () => {
            const noDecoLimit = dive.noDecoTime;
            expect(noDecoLimit).toEqual(13);
        });

        it('OTU limit is calculated', () => {
            const otuLimit = dive.otu;
            expect(otuLimit).toBeCloseTo(8.2858, 4);
        });

        it('CNS limit is calculated', () => {
            const cnsLimit = dive.cns;
            expect(cnsLimit).toBeCloseTo(2.928569, 6);
        });

        it('Highest density is calculated', () => {
            const highestDensity = dive.highestDensity;
            expect(highestDensity.gas).toEqual(StandardGases.air);
            expect(highestDensity.depth).toEqual(30);
            expect(highestDensity.density).toBeCloseTo(5.094, 3);
        });
    });

    describe('Imperial units are used', () => {
        it('Stops reflect units', inject([UnitConversion, SettingsNormalizationService],
            (units: UnitConversion, normalization: SettingsNormalizationService) => {
                units.imperialUnits = true;
                normalization.apply();
                // no changes in settings nor profile needed
                tanksService.addTank();
                tanksService.tanks[1].o2 = 50;
                tanksService.addTank();
                tanksService.tanks[2].o2 = 100;
                planner.calculate(1);

                const wayPoints = dive.wayPoints;
                expect(wayPoints[3].endDepth).toBeCloseTo(70, 4); // Ean50 switch
                expect(wayPoints[5].endDepth).toBeCloseTo(20, 4); // O2 switch
            }));
    });


    describe('Successfully calculates 30m for 15 minutes (defaults)', () => {
        it('8 minutes time to surface', () => {
            expect(dive.timeToSurface).toEqual(8);
        });

        it('18 minutes maximum dive time', () => {
            expect(dive.maxTime).toEqual(18);
        });

        it('74 bar rock bottom', () => {
            expect(tanksService.firstTank.tank.reserve).toEqual(78);
        });

        it('124 bar remaining gas', () => {
            expect(tanksService.firstTank.tank.endPressure).toEqual(124);
        });
    });

    describe('Shows Warnings', () => {
        it('60m for 50 minutes maximum depth exceeded', () => {
            depthsService.plannedDepth =60;
            planner.calculate(1);
            const hasEvents = dive.events.length > 0;
            expect(hasEvents).toBeTruthy();
        });

        it('60m for 50 minutes not enough gas', () => {
            depthsService.planDuration = 50;
            planner.calculate(1);
            expect(dive.notEnoughGas).toBeTruthy();
        });
    });

    describe('Updates dive', () => {
        it('Average depth is calculated', () => {
            expect(dive.averageDepth).toEqual(21.75);
        });

        it('Waypoints are calculated', () => {
            expect(dive.wayPoints.length).toEqual(5);
        });

        it('Start ascent is updated', () => {
            depthsService.applyNdlDuration();
            expect(dive.emergencyAscentStart).toEqual(Time.oneMinute * 12);
        });

        it('Altitude does not affect Ean50 switch in 21 m', () => {
            tanksService.addTank();
            tanksService.tanks[1].o2 = 50;
            // changing altitude changes surface pressure used to convert depths in algorithm
            // in case it would take effect, the switch depth would be 24 m
            optionsService.altitude = 800;
            planner.calculate(1);
            // 4. segment - gas switch
            expect(dive.wayPoints[3].endDepth).toEqual(21);
        });

        it('Max bottom time uses previous dive surface interval',  inject([DiveSchedules],
            (schedules: DiveSchedules) => {
            const firstDive = schedules.dives[0];
            // make some interesting dive
            firstDive.depths.plannedDepth = 40;
            firstDive.depths.planDuration = 20;
            const followingDive = schedules.add();
            followingDive.surfaceInterval = Time.oneMinute * 10;
            planner.calculate(2);
            expect(followingDive.diveResult.maxTime).toEqual(15); // without surface intrval should be 18
        }));
    });

    describe('Errors', () => {
        const createProfileResultDto = (): ProfileResultDto => {
            const events: Event[] = [ Event.createError('') ];
            const profile = CalculatedProfileStatistics.fromStatisticsErrors(depthsService.segments, events);
            const profileDto = DtoSerialization.fromProfile(profile);
            return {
                diveId: 1,
                profile: profileDto
            };
        };

        const expectDiveMarkedAsCalculated = (diveToCheck: DiveResults): void => {
            expect(diveToCheck.diveInfoCalculated).toBeTruthy();
            expect(diveToCheck.calculated).toBeTruthy();
            expect(diveToCheck.profileCalculated).toBeTruthy();
        };

        describe('Profile calculated with errors', () => {
            let noDecoSpy: jasmine.Spy<(data: DiveInfoRequestDto) => DiveInfoResultDto>;
            let consumptionSpy: jasmine.Spy<(data: ConsumptionRequestDto) => ConsumptionResultDto>;
            let wayPointsFinished = false;
            let infoFinished = false;

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateDecompression')
                    .and.callFake(() => createProfileResultDto());

                dispatcher.wayPointsCalculated$.subscribe(() => wayPointsFinished = true);
                dispatcher.infoCalculated$.subscribe(() => infoFinished = true);
                noDecoSpy = spyOn(PlanningTasks, 'diveInfo').and.callThrough();
                consumptionSpy = spyOn(PlanningTasks, 'calculateConsumption').and.callThrough();
                planner.calculate(1);
            });

            it('Fallback to error state', () => {
                expect(dive.hasErrors).toBeTruthy();
            });

            it('Sets waypoints to empty', () => {
                expect(dive.wayPoints.length).toEqual(0);
            });

            it('Still fires waypoints calculated event', () => {
                expect(wayPointsFinished).toBeTruthy();
            });

            it('Still fires info calculated event', () => {
                expect(infoFinished).toBeTruthy();
            });

            it('Sets all progress properties to true', () => {
                expectDiveMarkedAsCalculated(dive);
            });

            it('Doesn\'t call no deco task', () => {
                expect(noDecoSpy).not.toHaveBeenCalled();
            });

            it('Doesn\'t call consumption task', () => {
                expect(consumptionSpy).not.toHaveBeenCalled();
            });
        });

        describe('Profile task failed', () => {
            let noDecoSpy: jasmine.Spy<(data: DiveInfoRequestDto) => DiveInfoResultDto>;
            let consumptionSpy: jasmine.Spy<(data: ConsumptionRequestDto) => ConsumptionResultDto>;
            let wayPointsFinished = false;
            // serial processing in tests results in wrong behavior, the task is still finished
            const infoFinished: (number | undefined)[] = [];

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateDecompression')
                    .and.throwError('Profile failed');

                dispatcher.wayPointsCalculated$.subscribe(() => wayPointsFinished = true);
                dispatcher.infoCalculated$.subscribe((source) => infoFinished.push(source));
                noDecoSpy = spyOn(PlanningTasks, 'diveInfo').and.callThrough();
                consumptionSpy = spyOn(PlanningTasks, 'calculateConsumption').and.callThrough();
                planner.calculate(1);
            });

            it('Still finishes waypoints calculated event', () => {
                expect(wayPointsFinished).toBeTruthy();
            });

            it('Still finishes info calculated event', () => {
                expect(infoFinished[0]).toBeUndefined();
            });

            it('Sets calculation to failed', () => {
                expectDiveMarkedAsCalculated(dive);
            });

            it('Skips no deco task', () => {
                expect(noDecoSpy).not.toHaveBeenCalled();
            });

            it('Skips consumption task', () => {
                expect(consumptionSpy).not.toHaveBeenCalled();
            });
        });

        describe('DiveInfo task failed', () => {
            // serial processing in tests results in wrong behavior, the task is still finished
            const infoFinished: (number | undefined)[] = [];

            beforeEach(() => {
                spyOn(PlanningTasks, 'diveInfo')
                    .and.throwError('No deco failed');

                dispatcher.infoCalculated$.subscribe((source) => infoFinished.push(source));
                planner.calculate(1);
            });

            it('Still ends info calculated event', () => {
                expect(infoFinished[0]).toBeUndefined();
            });

            it('Sets calculation to resolved failed', () => {
                expectDiveMarkedAsCalculated(dive);
            });
        });

        describe('Consumption task failed', () => {
            let infoFinished: number | undefined = -1; // unknown id

            beforeEach(() => {
                spyOn(PlanningTasks, 'calculateConsumption')
                    .and.throwError('Consumption failed');

                dispatcher.infoCalculated$.subscribe((source) => infoFinished = source);
                planner.calculate(1);
            });

            it('Still ends calculated event', () => {
                expect(infoFinished).toBeUndefined();
            });

            it('Sets consumption to resolved failed', () => {
                expectDiveMarkedAsCalculated(dive);
            });
        });

        describe('Handles unknown dive Id (removed dive)', () => {
            const unknownDiveId = 5;
            let diveCalculated = false;

            beforeEach(() => {
                dispatcher.infoCalculated$.subscribe(() => diveCalculated = true);
                diveCalculated = false;
            });

            it('skips calculate', () => {
                const calculateDecoSpy = spyOn(PlanningTasks, 'calculateDecompression')
                    .and.callThrough();

                planner.calculate(unknownDiveId);
                expect(calculateDecoSpy).toHaveBeenCalledTimes(0);
                expect(diveCalculated).toBeFalsy();
            });

            it('interrupts calculation processing calculated profile', () => {
                const calculateConsumptionSpy = spyOn(PlanningTasks, 'calculateConsumption')
                    .and.callThrough();

                const calculateInfoSpy = spyOn(PlanningTasks, 'diveInfo')
                    .and.callThrough();

                spyOn(PlanningTasks, 'calculateDecompression')
                    .and.callFake(() => ({
                        diveId: unknownDiveId,
                        profile: {
                            segments: [],
                            ceilings: [],
                            finalTissues: [],
                            tissues: [],
                            tissueOverPressures: CalculatedProfile.emptyTissueOverPressures,
                            errors: []
                        },
                        events: []
                    }));

                planner.calculate(1);
                expect(calculateConsumptionSpy).toHaveBeenCalledTimes(0);
                expect(calculateInfoSpy).toHaveBeenCalledTimes(0);
                expect(diveCalculated).toBeFalsy();
            });

            it('does not apply consumption result', () => {
                spyOn(PlanningTasks, 'calculateConsumption')
                    .and.callFake(() => ({
                        diveId: unknownDiveId,
                        maxTime: 0,
                        timeToSurface: 0,
                        tanks: []
                    }));

                expect( () => planner.calculate(1)).not.toThrow();
                expect(diveCalculated).toBeFalsy();
            });

            it('does not apply dive info result', () => {
                spyOn(PlanningTasks, 'diveInfo')
                    .and.callFake(() => ({
                        diveId: unknownDiveId,
                        noDeco: 0,
                        otu: 0,
                        cns: 0,
                        density: {
                            gas: {
                                fO2: 0,
                                fHe: 0
                            },
                            depth: 0,
                            density: 0,
                        },
                        averageDepth: 0,
                        events: [],
                        surfaceGradient: 0,
                        offgasingStartTime: 0,
                        offgasingStartDepth: 0,
                        ceilings: [],
                        tissues: [],
                        tissueOverPressures: []
                    }));

                expect( () => planner.calculate(1)).not.toThrow();
                expect(diveCalculated).toBeFalsy();
            });
        });
    });

    describe('App settings are applied', () => {
        let diveInfoSpy: jasmine.Spy<(data: DiveInfoRequestDto) => DiveInfoResultDto>;

        beforeEach(() => {
            const appSettings = TestBed.inject(ApplicationSettingsService);
            appSettings.maxGasDensity = 6;
            appSettings.primaryTankReserve = 99;
            appSettings.stageTankReserve = 88;
            tanksService.addTank();
            depthsService.planDuration = 20; // enforce small deco, but don't hurt the second tank reserve
            appSettings.noDecoIgnored = true;

            diveInfoSpy = spyOn(PlanningTasks, 'diveInfo').and.callThrough();
            planner.calculate(1);
        });

        it('Uses gas density', () => {
            expect(diveInfoSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    eventOptions: jasmine.objectContaining({ maxDensity: 6 })
                })
            );
        });

        it('Uses primary and secondary tank reserve', () => {
            expect(tanksService.tankData[0].reserve).toEqual(101);
            expect(tanksService.tankData[1].reserve).toEqual(90);
        });

        it('Filters events', () => {
            expect(_(dive.events).some(e => e.isNoDeco)).toBeFalsy();
        });
    });
});
