import { TestBed } from '@angular/core/testing';
import { CircuitType } from 'scuba-physics';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { SettingsNormalizationService } from './settings-normalization.service';
import { ViewStates } from './viewStates';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { ViewSwitchService } from './viewSwitchService';
import { ApplicationSettingsService } from './ApplicationSettings';

/** The same inputs as the eCCR E2E test, so its expected values are calculated here */
describe('PlannerService - eCCR reference dive', () => {
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
        dive.depths.plannedDepth = 60;
        TestBed.inject(ViewSwitchService).isComplex = true;

        const tanks = dive.tanksService;
        tanks.prepareForClosedCircuit();
        dive.optionsService.circuit = CircuitType.eccr;
        tanks.firstTank.o2 = 18;
        tanks.firstTank.he = 45;
        const addBailout = (o2: number, he: number): void => {
            tanks.addTank();
            const added = tanks.tanks[tanks.tanks.length - 1];
            added.o2 = o2;
            added.he = he;
        };
        addBailout(18, 45);
        addBailout(50, 0);
        addBailout(100, 0);

        const options = dive.optionsService;
        options.descentSetpoint = 1.1;
        options.bottomSetpoint = 1.1;
        options.decoSetpoint = 1.3;
        planner.calculate(dive.id);
    });

    it('calculates runtime 31:57', () => {
        expect(dive.diveResult.hasErrors).toBe(false);
        expect(dive.diveResult.totalDuration).toBe(31 * 60 + 57);
    });

    it('consumes oxygen from the CCR oxygen tank only from the plan', () => {
        const tanks = dive.tanksService.tanks;
        expect(tanks[1].tank.endPressure).toBe(188);
        expect(tanks[4].tank.endPressure).toBe(200);
    });
});
