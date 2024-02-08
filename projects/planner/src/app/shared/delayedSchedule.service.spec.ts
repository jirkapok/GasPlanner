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
    const delayHigherThanScheduler = 110;
    let dispatcher: ReloadDispatcher;
    let schedules: DiveSchedules;
    let scheduler: DelayedScheduleService;
    let plannerSpy: Spy<(diveId?: number) => void>;

    const addRepetitiveDive = (): void => {
        const nextDive = schedules.add();
        nextDive.surfaceInterval = Time.oneHour;
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
        scheduler = TestBed.inject(DelayedScheduleService);
        scheduler.delayMilliseconds = 0;
        addRepetitiveDive();
        schedules.add();
        scheduler.startScheduling(); // to bind events
    });

    const verifySchedules = (testFn: () => void, expectedCalls: [number | undefined][], done: DoneFn) => {
        setTimeout(() => { // to skip initial schedule
            plannerSpy.calls.reset();
            testFn();

            setTimeout(() => {
                const currentCalls = plannerSpy.calls.allArgs();
                expect(currentCalls).toEqual(expectedCalls);
                done();
            }, delayHigherThanScheduler);
        });
    };


    it('Plans all first dives after start', (done) => {
        setTimeout(() => {
            expect(plannerSpy.calls.allArgs()).toEqual([[1], [3]]);
            done();
        }, delayHigherThanScheduler);
    });

    it('Plans current dive', (done) => {
        verifySchedules(() => {
            console.table(plannerSpy.calls.allArgs());
            schedules.add();
            dispatcher.sendDepthChanged();
        }, [[4]], done);
    });

    it('Prevents multiple calculations after quick change of the same time', (done) => {
        verifySchedules(() => {
            dispatcher.sendDepthChanged();
            dispatcher.sendDepthChanged();
            dispatcher.sendDepthChanged();
        }, [[3]], done);
    });

    it('Plans second repetitive dive', (done) => {
        verifySchedules(() => {
            dispatcher.sendInfoCalculated(1);
        }, [[2]], done);
    });

    it('Stops planning after last dive calculated', (done) => {
        verifySchedules(() => {
            dispatcher.sendInfoCalculated(3);
        }, [], done);
    });

    it('Stops planning if next dive is not repetitive dive', (done) => {
        verifySchedules(() => {
            dispatcher.sendInfoCalculated(1);
        }, [[2]], done);
    });

    it('Stops planning when calculation task fails.', (done) => {
        verifySchedules(() => {
            dispatcher.sendInfoCalculated();
        }, [], done);
    });

    it('Schedules dive 2 when scheduling dive 1', (done) => {
        verifySchedules(() => {
            schedules.setSelectedIndex(1);
            dispatcher.sendDepthChanged(); // 2
            schedules.setSelectedIndex(2);
            dispatcher.sendDepthChanged();  // 3
        }, [[2], [3]], done);
    });

    it('Schedules dive 1 when scheduling dive 2', (done) => {
        verifySchedules(() => {
            schedules.setSelectedIndex(2);
            dispatcher.sendDepthChanged(); // 3
            schedules.setSelectedIndex(1);
            dispatcher.sendDepthChanged(); // 2
        }, [[3], [2]], done);
    });
});
