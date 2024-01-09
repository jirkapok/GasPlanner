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
import { Time } from 'scuba-physics';

describe('Delayed Schedule', () => {
    let dispatcher: ReloadDispatcher;
    let schedules: DiveSchedules;
    let plannerSpy: Spy<(diveId?: number) => void>;

    const addRepetitiveDive = (): void => {
        const thirdDive = schedules.add();
        thirdDive.surfaceInterval = Time.oneHour;
    };

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
        dispatcher = TestBed.inject(ReloadDispatcher);
        schedules = TestBed.inject(DiveSchedules);
        TestBed.inject(DelayedScheduleService);
    });

    it('Plans all first dives', (done) => {
        schedules.add();
        addRepetitiveDive();
        schedules.add();
        dispatcher.sendDepthsReloaded();

        setTimeout(() => {
            expect(plannerSpy).toHaveBeenCalledWith(1);
            expect(plannerSpy).toHaveBeenCalledWith(2);
            expect(plannerSpy).toHaveBeenCalledWith(4);
            done();
        }, 110);
    });

    it('Plans current dive', (done) => {
        schedules.add();
        dispatcher.sendDepthChanged();

        setTimeout(() => {
            expect(plannerSpy).toHaveBeenCalledWith(2);
            done();
        }, 110);
    });

    it('Plans second dive', (done) => {
        addRepetitiveDive();
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
    // * Stops scheduling when previous calculation failed
});
