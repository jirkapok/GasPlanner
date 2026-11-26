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
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

describe('PlannerService - Rebreathers', () => {
    let planner: PlannerService;
    let dive: DiveSchedule;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                provideTestTranslate(),
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

    it('calculates pSCR runtime 1:20:51 and consumes 41 bar', () => {
        dive.optionsService.circuit = CircuitType.pscr;
        const pscr = calculate();

        expect(pscr.duration).toBe(4851); // OC 3237
        expect(pscr.consumed).toBe(41); // OC 200
        expect(dive.diveResult.calculated).toBe(true);
    });

    describe('mCCR', () => {
        const prepareMccr = (oxygenPercent: number): void => {
            dive.tanksService.loadFrom([new Tank(12, 200, 21), new Tank(3, 200, oxygenPercent)]);
            dive.optionsService.circuit = CircuitType.mccr;
        };

        it('calculates mCCR runtime 48:31 and consumes 17 bar from the oxygen tank', () => {
            dive.tanksService.firstTank.o2 = 21;
            prepareMccr(100);
            const mccr = calculate();

            expect(mccr.duration).toBe(2911); // OC 4508
            expect(dive.tanksService.tanks[1].tank.consumed).toBe(17);
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

        it('calculates eCCR runtime 51:14 and consumes 19 bar from the oxygen tank', () => {
            dive.tanksService.firstTank.o2 = 21;
            prepareEccr(100);
            const eccr = calculate();

            expect(eccr.duration).toBe(3074); // OC 4508
            expect(dive.tanksService.tanks[1].tank.consumed).toBe(19);
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
