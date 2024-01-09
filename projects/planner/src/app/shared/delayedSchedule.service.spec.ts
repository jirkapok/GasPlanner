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
import { Time } from "../../../../scuba-physics/src/lib/Time";

fdescribe('Delayed Schedule', () => {
    let sut: DelayedScheduleService;
    let dispatcher: ReloadDispatcher;
    let schedules: DiveSchedules;
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

        const planner = TestBed.inject(PlannerService);
        plannerSpy = spyOn(planner, 'calculate').and.callFake((diveId?: number) => {});
        sut = TestBed.inject(DelayedScheduleService);
        dispatcher = TestBed.inject(ReloadDispatcher);
        schedules = TestBed.inject(DiveSchedules);
    });

    it('Plans first dive', (done) => {
        dispatcher.sendDepthChanged();

        setTimeout(() => {
            expect(plannerSpy).toHaveBeenCalledWith(1);
            done();
        }, 110);
    });

    it('Plans second dive', (done) => {
        const secondDive = schedules.add();
        secondDive.surfaceInterval = Time.oneHour;
        dispatcher.sendInfoCalculated(1);

        setTimeout(() => {
            expect(plannerSpy).toHaveBeenCalledWith(2);
            done();
        }, 110);
    });

    it('Stops planning after last dive calculated', (done) => {
        const secondDive = schedules.add();
        secondDive.surfaceInterval = Time.oneHour;
        dispatcher.sendInfoCalculated(2);

        setTimeout(() => {
            expect(plannerSpy).not.toHaveBeenCalledWith(3);
            done();
        }, 110);
    });

    it('Stops planning if next dive is not repetitive dive', (done) => {
        schedules.add();
        dispatcher.sendInfoCalculated(1);

        setTimeout(() => {
            expect(plannerSpy).not.toHaveBeenCalledWith(2);
            done();
        }, 110);
    });

    // TODO delayed schedule test cases
    // * When calculating and calculation is running for dive with higher id than next planned, nothing is scheduled
    // * When calculating and calculation is running for dive wiht lower id than next planned, schedule is restarted from new dive id.
    // * does not calculate next, if next one is first dive (undefined surface interval)
    // * Stops scheduling when previous calculation failed
});
