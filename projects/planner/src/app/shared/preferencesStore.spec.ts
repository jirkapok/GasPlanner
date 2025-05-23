import { TestBed, inject } from '@angular/core/testing';
import { PreferencesStore } from './preferencesStore';
import { PlannerService } from './planner.service';
import { Options, Tank, Salinity, SafetyStop, AirBreakOptions } from 'scuba-physics';
import { OptionExtensions } from './Options.spec';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';
import { DepthsService } from './depths.service';
import { Preferences } from './preferences';
import { SettingsNormalizationService } from './settings-normalization.service';
import { WayPointsService } from './waypoints.service';
import { ViewStates } from './viewStates';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { ApplicationSettingsService } from './ApplicationSettings';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

describe('PreferencesStore', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                WorkersFactoryCommon,
                PreferencesStore, PlannerService,
                UnitConversion, ViewSwitchService,
                Preferences, ViewStates, SubViewStorage,
                SettingsNormalizationService,
                WayPointsService, DiveSchedules,
                ReloadDispatcher, ApplicationSettingsService,
                MdbModalService
            ]
        });

        localStorage.clear();
    });

    it('loads saved disclaimer', inject([PreferencesStore, PlannerService],
        (service: PreferencesStore) => {
            service.disableDisclaimer();
            const enabled = service.disclaimerEnabled();
            expect(enabled).toBeFalsy();
        }));

    describe('Preferences', () => {
        let options: OptionsService;
        let tanksService: TanksService;
        let depthsService: DepthsService;
        let sut: PreferencesStore;

        beforeEach(() => {
            const firstDive = TestBed.inject(DiveSchedules).dives[0];
            sut = TestBed.inject(PreferencesStore);
            options = firstDive.optionsService;
            tanksService = firstDive.tanksService;
            depthsService = firstDive.depths;
        });

        it('Diver values are loaded after save', () => {
            const diver = options.diverOptions;
            diver.rmv = 10;
            diver.stressRmv = 14;
            diver.maxPpO2 = 1.1;
            diver.maxDecoPpO2 = 1.5;
            sut.save();

            diver.rmv = 10;
            diver.stressRmv = 16;
            diver.maxPpO2 = 1.3;
            diver.maxDecoPpO2 = 1.4;
            sut.load();

            const expected = {
                rmv: 10,
                stressRmv: 14,
                maxPpO2: 1.1,
                maxDecoPpO2: 1.5
            };
            expect({
                rmv: diver.rmv,
                stressRmv: diver.stressRmv,
                maxPpO2: diver.maxPpO2,
                maxDecoPpO2: diver.maxDecoPpO2
            }).toEqual(expected);
        });

        it('Options values are loaded after save', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                // not going to test all options, since it is a flat structure
                options.gfLow = 0.3;
                options.descentSpeed = 15;
                viewSwitch.isComplex = true; // otherwise reset of GF.
                sut.save();

                options.gfLow = 0.35;
                options.descentSpeed = 17;
                sut.load();

                const expected = new Options(0.3, 0.85, 1.4, 1.6, Salinity.fresh);
                expected.descentSpeed = 15;
                expected.safetyStop = SafetyStop.auto;
                expect(options.getOptions()).toEqual(expected);
            }));

        it('Tanks are loaded after save', inject(
            [PlannerService, ViewSwitchService],
            (planner: PlannerService, viewSwitch: ViewSwitchService) => {
                // setup needed for consumed calculation
                const oValues = options.getOptions();
                OptionExtensions.applySimpleSpeeds(oValues);
                options.useSafetyOn();
                options.gasSwitchDuration = 1;
                options.problemSolvingDuration = 2;
                depthsService.plannedDepth = 30;
                depthsService.planDuration = 20;

                tanksService.addTank();
                const tanks = tanksService.tanks;
                tanks[0].startPressure = 150;
                tanks[1].o2 = 50;
                viewSwitch.isComplex = true; // otherwise the tank will be removed.
                planner.calculate(1);
                sut.save();

                tanks[0].startPressure = 130;
                tanks[1].o2 = 32;
                tanks[1].workingPressure = 0;
                sut.load();

                planner.calculate(1); // not called automatically
                const expected1 = new Tank(15, 150, 21);
                expected1.id = 1;
                expected1.consumed = 107;
                expected1.reserveVolume = 665.8107445570627; // precise value to simplify the assertion
                const expected2 = new Tank(11.1, 200, 50);
                expected2.id = 2;
                expected2.consumed = 22;
                expected2.reserveVolume = 393.6696946571216;
                // JSON serialization prevents order of items in an array
                const expected: Tank[] = [expected1, expected2];
                expect(tanksService.tankData).toEqual(expected);
                expect(tanksService.tanks[0].workingPressureBars).toBeCloseTo(0, 6);
                expect(tanksService.tanks[1].workingPressureBars).toBeCloseTo(0, 6);
            }));

        it('Plan is loaded after save', inject([PlannerService, ViewSwitchService],
            (planner: PlannerService, viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                tanksService.addTank();
                tanksService.addTank();
                depthsService.addSegment();
                const lastSegment = depthsService.levels[2];
                const secondTank = tanksService.tanks[1];
                lastSegment.tank = secondTank;
                planner.calculate(1);
                sut.save();

                depthsService.removeSegment(lastSegment);
                tanksService.removeTank(secondTank);
                sut.load();

                expect(tanksService.tanks.length).toEqual(3);
                expect(depthsService.segments.length).toEqual(3);
                expect(depthsService.segments[2].tank?.id).toEqual(2);
            }));

        it('Simple profile is loaded after save and trims tank', inject([PlannerService],
            (planner: PlannerService) => {
                const optionsResetToSimple = spyOn(options, 'resetToSimple').and.callThrough();

                // invalid operations for simple profile simulate wrong data
                tanksService.addTank();
                tanksService.addTank();

                depthsService.addSegment();
                planner.calculate(1);
                sut.save();

                sut.load();

                expect(tanksService.tanks.length).toEqual(1);
                expect(depthsService.segments.length).toEqual(2);
                expect(optionsResetToSimple).toHaveBeenCalledTimes(1);
            }));

        it('Applies imperial units', inject(
            [PreferencesStore, UnitConversion, SettingsNormalizationService],
            (service: PreferencesStore, units: UnitConversion, normalizationService: SettingsNormalizationService) => {
                units.imperialUnits = true;
                options.diverOptions.rmv = 29.998867;
                normalizationService.apply();
                service.save();

                units.imperialUnits = false;
                options.diverOptions.rmv = 19.6;
                normalizationService.apply();
                service.load();

                expect(options.diverOptions.rmv).toBeCloseTo(29.998867, 6);
                expect(tanksService.tanks[0].workingPressureBars).toBeCloseTo(237.317546, 6);
                expect(units.imperialUnits).toBeTruthy();
            }));

        it('Save and Load Defaults - First dive is updated from default', inject(
            [DiveSchedules],
            (schedules: DiveSchedules) => {
                tanksService.firstTank.size = 20;
                depthsService.plannedDepth = 21;

                sut.saveDefault();
                tanksService.firstTank.size = 22;
                depthsService.plannedDepth = 23;

                sut.loadDefault(schedules.selected);

                expect(tanksService.firstTank.size).toBeCloseTo(20, 1);
                expect(depthsService.plannedDepth).toBeCloseTo(21, 1);
            }));

        it('Load Defaults when no default is defined', inject([DiveSchedules],
            (schedules: DiveSchedules) => {
                localStorage.clear();

                sut.ensureDefault();
                tanksService.firstTank.size = 22;
                depthsService.plannedDepth = 23;
                sut.loadDefault(schedules.selected);

                expect(tanksService.firstTank.size).toBeCloseTo(15, 1);
                expect(depthsService.plannedDepth).toBeCloseTo(30, 1);
            }));

        it('AppSettings load defaults', inject([ApplicationSettingsService],
            (appSettings: ApplicationSettingsService) => {
                localStorage.clear();

                sut.ensureDefault();

                expect(appSettings.maxGasDensity).toBeCloseTo(5.7, 1);
                expect(appSettings.primaryTankReserve).toBeCloseTo(30, 1);
                expect(appSettings.stageTankReserve).toBeCloseTo(20, 1);
            }));

        it('AppSettings loads saved values', inject([ApplicationSettingsService],
            (appSettings: ApplicationSettingsService) => {
                appSettings.maxGasDensity = 6;
                appSettings.primaryTankReserve = 31;
                appSettings.stageTankReserve = 21;

                sut.save();
                appSettings.maxGasDensity = 5.3;
                appSettings.primaryTankReserve = 32;
                appSettings.stageTankReserve = 22;
                sut.load();

                expect(appSettings.maxGasDensity).toBeCloseTo(6, 1);
                expect(appSettings.primaryTankReserve).toBeCloseTo(31, 1);
                expect(appSettings.stageTankReserve).toBeCloseTo(21, 1);
            }));

        it('Air breaks loads saved values', () => {
            localStorage.clear();

            sut.ensureDefault();
            options.airBreaks.enabled = true;
            options.airBreaks.oxygenDuration = 16;
            options.airBreaks.bottomGasDuration = 6;
            sut.save();

            options.airBreaks.enabled = false;
            options.airBreaks.oxygenDuration = 13;
            options.airBreaks.bottomGasDuration = 4;
            sut.load();

            expect(options.airBreaks).toEqual(new AirBreakOptions(true, 16, 6));
        });
    });
});
