import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Diver, Options } from 'scuba-physics';
import { DelayedScheduleService } from './delayedSchedule.service';
import { DepthsService } from './depths.service';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { SettingsNormalizationService } from './settings-normalization.service';
import { TanksService } from './tanks.service';
import { TestBedExtensions } from './TestBedCommon.spec';
import { UnitConversion } from './UnitConversion';
import { WayPointsService } from './waypoints.service';
import { ViewStates } from './viewStates';
import { PreferencesStore } from './preferencesStore';
import { Preferences } from './preferences';
import { SubViewStorage } from './subViewStorage';
import { ViewSwitchService } from './viewSwitchService';

describe('SettingsNormalizationService', () => {
    let service: SettingsNormalizationService;
    let diver: Diver;

    const applySut = (options: OptionsService) => {
        options.applyDiver(diver);
        service.apply();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            providers: [WorkersFactoryCommon, UnitConversion,
                PlannerService, RouterTestingModule, OptionsService,
                SettingsNormalizationService, TanksService,
                Plan, DepthsService, DelayedScheduleService,
                WayPointsService, SubViewStorage, ViewStates,
                PreferencesStore, Preferences, ViewSwitchService
            ],
            imports: [RouterTestingModule.withRoutes([])]
        });

        TestBedExtensions.initPlan();
        service = TestBed.inject(SettingsNormalizationService);
        diver = new Diver();
    });

    describe('Diver', () => {
        it('RMV applies to planner', inject([OptionsService],
            (options: OptionsService) => {
                diver.rmv = 18;
                applySut(options);
                expect(options.diver.rmv).toBe(18);
            }));

        it('ppO2 applies to planner', inject([OptionsService],
            (options: OptionsService) => {
                diver.maxPpO2 = 1.1;
                applySut(options);
                expect(options.maxPpO2).toBe(1.1);
            }));

        it('Deco ppO2 applies to planner', inject([OptionsService],
            (options: OptionsService) => {
                diver.maxDecoPpO2 = 1.5;
                applySut(options);
                expect(options.maxDecoPpO2).toBe(1.5);
            }));
    });

    describe('Imperial units', () => {
        let options: Options;
        let sourceOptions: OptionsService;

        beforeEach(() => {
            sourceOptions = TestBed.inject(OptionsService);
            sourceOptions.altitude = 100;
            sourceOptions.diver.rmv = 19.837563;
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
            service.apply();
            options = sourceOptions.getOptions();
        });

        it('Updates depth level options to 10 feet', () => {
            expect(options.decoStopDistance).toBeCloseTo(3.048, 4);
            expect(options.minimumAutoStopDepth).toBeCloseTo(10.0584, 4);
            expect(options.lastStopDepth).toBeCloseTo(4.572, 4);
        });

        it('Updates diver rounded rmv', () => {
            const units = TestBed.inject(UnitConversion);
            const rmv = units.fromLiter(sourceOptions.diver.rmv);
            expect(rmv).toBeCloseTo(0.70060, 5);
        });

        it('Rounds options feet', () => {
            expect(options.maxEND).toBeCloseTo(30.48, 4);
            expect(options.altitude).toBeCloseTo(99.9744, 4);
            expect(options.ascentSpeed50perc).toBeCloseTo(9.144, 4);
            expect(options.ascentSpeed50percTo6m).toBeCloseTo(9.144, 4);
            expect(options.ascentSpeed6m).toBeCloseTo(9.144, 4);
            expect(options.descentSpeed).toBeCloseTo(18.288, 4);
        });

        it('Rounds segments to feet', inject([Plan],
            (plan: Plan) => {
                const segment = plan.segments[1];
                // 30 m flat segment rounded to 98 feet
                expect(segment.startDepth).toBeCloseTo(29.8704, 4);
                expect(segment.endDepth).toBeCloseTo(29.8704, 4);
            }));

        it('Rounds tank properties', inject([TanksService],
            (tanks: TanksService) => {
                const bound = tanks.firstTank;
                expect(bound.startPressure).toBeCloseTo(2901, 6);
                expect(bound.size).toBeCloseTo(125.7, 3);
            }));

        it('Sets working pressure', inject([TanksService],
            (tanks: TanksService) => {
                // tank was created before switch to imperial,
                // so it still has valid working pressure even it wasn't used in metric
                const workingPressure = tanks.firstTank.workingPressure;
                expect(workingPressure).toBeCloseTo(3442, 6);
            }));
    });

    describe('Metric units', () => {
        let options: Options;
        let sourceOptions: OptionsService;

        beforeEach(() => {
            sourceOptions = TestBed.inject(OptionsService);
            sourceOptions.altitude = 100;
            diver.rmv = 19.837563;
            applySut(sourceOptions);
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
            applySut(sourceOptions);
            units.imperialUnits = false;
            applySut(sourceOptions);
            options = sourceOptions.getOptions();
        });

        it('Updates depth level options to 3 m', () => {
            expect(options.decoStopDistance).toBe(3);
            expect(options.minimumAutoStopDepth).toBe(10);
            expect(options.lastStopDepth).toBe(5);
        });

        it('Updates diver rounded rmv liters', () => {
            expect(sourceOptions.diver.rmv).toBeCloseTo(19.84000, 5);
        });

        it('Rounds options meters using recreational values', () => {
            expect(options.maxEND).toBe(30);
            expect(options.altitude).toBe(100);
            expect(options.ascentSpeed50perc).toBe(9);
            expect(options.ascentSpeed50percTo6m).toBe(9);
            expect(options.ascentSpeed6m).toBe(9);
            expect(options.descentSpeed).toBe(18);
        });

        it('Rounds segments to meters', inject([Plan],
            (plan: Plan) => {
                const segment = plan.segments[1];
                expect(segment.startDepth).toBe(30);
                expect(segment.endDepth).toBe(30);
            }));

        it('Rounds tank properties without change', inject([TanksService],
            (tanks: TanksService) => {
                const tank = tanks.firstTank.tank;
                expect(tank.startPressure).toBe(200);
                expect(tank.size).toBe(15);
            }));

        it('Sets working pressure without affecting size', inject([TanksService],
            (tanks: TanksService) => {
                // tank was created before switch to imperial,
                // so it still has valid working pressure even it wasn't used in metric
                const workingPressure = tanks.firstTank.workingPressure;
                expect(workingPressure).toBeCloseTo(0, 6);
            }));
    });
});
