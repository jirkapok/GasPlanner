import { TestBed } from '@angular/core/testing';
import { CircuitType, Tank } from 'scuba-physics';
import { PlannerService } from './planner.service';
import { OptionExtensions } from './Options.testing';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { SettingsNormalizationService } from './settings-normalization.service';
import { ViewStates } from './viewStates';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { ViewSwitchService } from './viewSwitchService';
import { ApplicationSettingsService } from './ApplicationSettings';

describe('PlannerService - Rebreathers', () => {
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
        expect(dive.diveResult.calculated).toBe(true);
    });

    describe('mCCR', () => {
        const prepareMccr = (oxygenPercent: number): void => {
            dive.tanksService.loadFrom([new Tank(12, 200, 21), new Tank(3, 200, oxygenPercent)]);
            dive.optionsService.circuit = CircuitType.mccr;
        };

        it('calculates different profile than open circuit and consumes the oxygen tank', () => {
            dive.tanksService.firstTank.o2 = 21;
            const openCircuit = calculate();
            prepareMccr(100);
            const mccr = calculate();

            expect(mccr.duration).not.toBe(openCircuit.duration);
            expect(dive.tanksService.tanks[1].tank.consumed).toBeGreaterThan(0);
            expect(dive.diveResult.hasErrors).toBe(false);
        });

        it('second tank without oxygen ends with profile error', () => {
            prepareMccr(50);
            planner.calculate(dive.id);

            expect(dive.diveResult.hasErrors).toBe(true);
            expect(dive.diveResult.calculated).toBe(true);
        });
    });

    describe('eCCR', () => {
        const prepareEccr = (oxygenPercent: number): void => {
            dive.tanksService.loadFrom([new Tank(12, 200, 21), new Tank(3, 200, oxygenPercent)]);
            dive.optionsService.circuit = CircuitType.eccr;
        };

        it('calculates eCCR profile different from open circuit and consumes the oxygen tank', () => {
            dive.tanksService.firstTank.o2 = 21;
            const openCircuit = calculate();
            prepareEccr(100);
            const eccr = calculate();

            expect(eccr.duration).not.toBe(openCircuit.duration);
            expect(dive.tanksService.tanks[1].tank.consumed).toBeGreaterThan(0);
            expect(dive.diveResult.hasErrors).toBe(false);
        });

        it('eCCR without oxygen in second tank ends with profile error', () => {
            prepareEccr(50);
            planner.calculate(dive.id);

            expect(dive.diveResult.hasErrors).toBe(true);
            expect(dive.diveResult.calculated).toBe(true);
        });
    });
});
