import { TestBed, inject } from '@angular/core/testing';
import { PreferencesService } from './preferences.service';
import { PlannerService } from './planner.service';
import { Diver, Options, Tank, Salinity, SafetyStop } from 'scuba-physics';
import { OptionExtensions } from '../../../../scuba-physics/src/lib/Options.spec';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';
import { Plan } from './plan.service';

describe('PreferencesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WorkersFactoryCommon,
                PreferencesService, PlannerService,
                UnitConversion, TanksService,
                ViewSwitchService,
                OptionsDispatcherService, Plan]
        });

        localStorage.clear();
    });

    it('loads saved disclaimer', inject([PreferencesService, PlannerService],
        (service: PreferencesService) => {
            service.disableDisclaimer();
            const enabled = service.disclaimerEnabled();
            expect(enabled).toBeFalsy();
        }));

    describe('Preferences', () => {
        it('Diver values are loaded after save', inject([PreferencesService, PlannerService],
            (service: PreferencesService, planner: PlannerService) => {
                const diver = planner.diver;
                diver.rmv = 10;
                diver.maxPpO2 = 1.1;
                diver.maxDecoPpO2 = 1.5;
                planner.calculate();
                service.saveDefaults();

                diver.rmv = 10;
                diver.maxPpO2 = 1.3;
                diver.maxDecoPpO2 = 1.4;
                service.loadDefaults();

                const expected = new Diver(10, 1.1);
                expected.maxDecoPpO2 = 1.5;
                expect(diver).toEqual(expected);
            }));

        it('Options values are loaded after save', inject([PreferencesService, PlannerService, OptionsDispatcherService, ViewSwitchService],
            (service: PreferencesService, planner: PlannerService, options: OptionsDispatcherService, viewSwitch: ViewSwitchService) => {
                // not going to test all options, since it is a flat structure
                options.gfLow = 0.3;
                options.descentSpeed = 15;
                viewSwitch.isComplex = true; // otherwise reset of GF.
                planner.assignOptions(options.getOptions());
                planner.calculate();
                service.saveDefaults();

                options.gfLow = 0.35;
                options.descentSpeed = 17;
                service.loadDefaults();

                const expected = new Options(0.3, 0.85, 1.4, 1.6, Salinity.fresh);
                expected.descentSpeed = 15;
                expected.safetyStop = SafetyStop.auto;
                expect(planner.options).toEqual(expected);
            }));

        it('Tanks are loaded after save', inject(
            [PreferencesService, PlannerService, TanksService, OptionsDispatcherService, ViewSwitchService],
            (service: PreferencesService, planner: PlannerService,
                tanksService: TanksService, options: OptionsDispatcherService,
                viewSwitch: ViewSwitchService) => {
                const oValues = options.getOptions();
                OptionExtensions.applySimpleSpeeds(oValues);
                options.safetyStop = SafetyStop.always;
                options.gasSwitchDuration = 1;
                options.problemSolvingDuration = 2;
                planner.assignOptions(options.getOptions());
                tanksService.addTank();
                const tanks = tanksService.tanks;
                tanks[0].startPressure = 150;
                tanks[1].o2 = 50;
                viewSwitch.isComplex = true; // otherwise the tank will be removed.
                planner.calculate();
                service.saveDefaults();

                tanks[0].startPressure = 130;
                tanks[1].o2 = 32;
                service.loadDefaults();

                const expected1 = new Tank(15, 150, 21);
                expected1.id = 1;
                expected1.consumed = 66;
                expected1.reserve = 45;
                const expected2 = new Tank(11, 200, 50);
                expected2.id = 2;
                expected2.consumed = 21;
                expected2.reserve = 62;
                // JSON serialization prevents order of items in an array
                const expected: Tank[] = [expected1, expected2];
                expect(tanksService.tankData).toEqual(expected);
            }));

        it('Plan is loaded after save', inject(
            [PreferencesService, PlannerService, TanksService, ViewSwitchService, Plan],
            (service: PreferencesService, planner: PlannerService,
                tanksService: TanksService, viewSwitch: ViewSwitchService,
                plan: Plan) => {
                tanksService.addTank();
                tanksService.addTank();
                planner.addSegment();
                const lastSegment = plan.segments[2];
                const secondTank = tanksService.tanks[1];
                lastSegment.tank = secondTank.tank;
                viewSwitch.isComplex = true;
                planner.calculate();
                service.saveDefaults();

                planner.removeSegment(lastSegment);
                tanksService.removeTank(secondTank);
                service.loadDefaults();

                expect(tanksService.tanks.length).toEqual(3);
                expect(plan.length).toEqual(3);
                expect(plan.segments[2].tank?.id).toEqual(2);
            }));

        it('Simple profile is loaded after save and trims tank', inject(
            [PreferencesService, PlannerService, TanksService, Plan, OptionsDispatcherService],
            (service: PreferencesService, planner: PlannerService,
                tanksService: TanksService, plan: Plan, options: OptionsDispatcherService) => {
                const optionsResetToSimple = spyOn(options, 'resetToSimple').and.callThrough();

                // invalid operations for simple profile simulate wrong data
                tanksService.addTank();
                tanksService.addTank();
                planner.addSegment();
                planner.calculate();
                service.saveDefaults();

                service.loadDefaults();

                expect(tanksService.tanks.length).toEqual(1);
                expect(plan.length).toEqual(2);
                expect(optionsResetToSimple).toHaveBeenCalledTimes(1);
            }));
    });
});
