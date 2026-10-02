import { TestBed } from '@angular/core/testing';
import { CircuitType } from 'scuba-physics';
import { PlannerService } from './planner.service';
import { OptionExtensions } from './Options.spec';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { SettingsNormalizationService } from './settings-normalization.service';
import { ViewStates } from './viewStates';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { ViewSwitchService } from './viewSwitchService';
import { ApplicationSettingsService } from './ApplicationSettings';

describe('PlannerService - pSCR', () => {
    let planner: PlannerService;
    let dive: DiveSchedule;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                WorkersFactoryCommon,
                PlannerService, UnitConversion,
                DiveSchedules, ReloadDispatcher,
                SettingsNormalizationService, ViewStates,
                ViewSwitchService, ApplicationSettingsService
            ]
        }).compileComponents();

        planner = TestBed.inject(PlannerService);
        dive = TestBed.inject(DiveSchedules).selected;
        OptionExtensions.applySimpleSpeeds(dive.optionsService.getOptions());
        dive.tanksService.firstTank.o2 = 32;
        dive.depths.plannedDepth = 30;
        // long enough to need decompression, so the leaner loop gas changes the runtime
        dive.depths.planDuration = 40;
    });

    const calculate = (): { duration: number; consumed: number } => {
        planner.calculate(dive.id);
        return {
            duration: dive.diveResult.totalDuration,
            consumed: dive.tanksService.firstTank.tank.consumed
        };
    };

    it('calculates different profile and lower consumption than open circuit', () => {
        const openCircuit = calculate();
        dive.optionsService.circuit = CircuitType.pscr;
        const pscr = calculate();

        expect(pscr.duration).toBeGreaterThan(openCircuit.duration);
        expect(pscr.consumed).toBeLessThan(openCircuit.consumed);
        expect(dive.diveResult.calculated).toBeTrue();
    });
});
