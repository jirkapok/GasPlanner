import { TestBed } from '@angular/core/testing';
import { DelayedScheduleService } from './delayedSchedule.service';
import { ReloadDispatcher } from './reloadDispatcher';
import { PlannerService } from './planner.service';
import { DiveSchedules } from './dive.schedules';
import { UnitConversion } from './UnitConversion';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { SubViewStorage } from './subViewStorage';
import { ViewStates } from './viewStates';
import { PreferencesStore } from './preferencesStore';
import { Preferences } from './preferences';
import { ViewSwitchService } from './viewSwitchService';
import Spy = jasmine.Spy;

describe('Delayed Schedule', () => {
    let sut: DelayedScheduleService;
    let plannerSpy: Spy<(diveId?: number) => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                DelayedScheduleService, ReloadDispatcher,
                PlannerService, DiveSchedules, UnitConversion,
                WorkersFactoryCommon, SubViewStorage,
                ViewStates, PreferencesStore, Preferences,
                ViewSwitchService
            ]
        }).compileComponents();

        sut = TestBed.inject(DelayedScheduleService);
        const planner = TestBed.inject(PlannerService);
        plannerSpy = spyOn(planner, 'calculate').and.callFake((diveId?: number) => {});
    });

    it('Plans first dive', (done) => {
        sut.schedule();

        setTimeout(() => {
            expect(plannerSpy).toHaveBeenCalledWith();
            done();
        }, 110);
    });

    // TODO delayed schedule test cases
    // * After received result, next dive is scheduled
    // * After received last dive result, no schedule is done
    // * When calculating and calculation is running for dive with higher id than next planned, nothing is scheduled
    // * When calculating and calculation is running for dive wiht lower id than next planned, schedule is restarted from new dive id.
});
