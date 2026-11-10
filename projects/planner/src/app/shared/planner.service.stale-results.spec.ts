import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { SettingsNormalizationService } from './settings-normalization.service';
import { ViewStates } from './viewStates';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { ViewSwitchService } from './viewSwitchService';
import { ApplicationSettingsService } from './ApplicationSettings';
import { ConsumptionRequestDto, ConsumptionResultDto } from './serialization.model';
import { IBackgroundTask } from '../workers/background-task';

/** Holds back the consumption results, so they can arrive after the dive was changed, like from a busy web worker */
class DelayedConsumptionFactory extends WorkersFactoryCommon {
    public readonly delayed: ConsumptionResultDto[] = [];
    public delay = false;
    private readonly consumed = new Subject<ConsumptionResultDto>();

    public override createConsumptionWorker(): IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto> {
        const synchronous = super.createConsumptionWorker();
        synchronous.calculated$.subscribe(result => this.delay ? this.delayed.push(result) : this.consumed.next(result));
        return {
            calculated$: this.consumed,
            calculate: (request: ConsumptionRequestDto) => synchronous.calculate(request),
            failed$: synchronous.failed$
        };
    }

    public releaseDelayed(): void {
        this.delay = false;
        this.delayed.splice(0).forEach(result => this.consumed.next(result));
    }
}

describe('PlannerService - stale consumption results', () => {
    let planner: PlannerService;
    let factory: DelayedConsumptionFactory;
    let dive: DiveSchedule;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                { provide: WorkersFactoryCommon, useClass: DelayedConsumptionFactory },
                PlannerService, UnitConversion,
                DiveSchedules, ReloadDispatcher,
                SettingsNormalizationService, ViewStates,
                ViewSwitchService, ApplicationSettingsService
            ]
        }).compileComponents();

        factory = TestBed.inject(WorkersFactoryCommon) as DelayedConsumptionFactory;
        planner = TestBed.inject(PlannerService);
        dive = TestBed.inject(DiveSchedules).selected;
        TestBed.inject(ViewSwitchService).isComplex = true;
    });

    it('ignores result calculated for fewer tanks', () => {
        factory.delay = true;
        planner.calculate(dive.id);
        dive.tanksService.addTank();
        factory.delay = false;
        planner.calculate(dive.id);
        const consumed = dive.tanksService.firstTank.tank.consumed;

        expect(() => factory.releaseDelayed()).not.toThrow();
        expect(dive.tanksService.tanks.length).toBe(2);
        expect(dive.tanksService.firstTank.tank.consumed).toBe(consumed);
    });

    it('ignores result calculated for more tanks', () => {
        dive.tanksService.addTank();
        factory.delay = true;
        planner.calculate(dive.id);
        dive.tanksService.removeTank(dive.tanksService.tanks[1]);
        factory.delay = false;
        planner.calculate(dive.id);
        const consumed = dive.tanksService.firstTank.tank.consumed;

        factory.releaseDelayed();

        expect(dive.tanksService.firstTank.tank.consumed).toBe(consumed);
    });
});
