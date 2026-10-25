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
import { MockInstance as Spy } from 'vitest';
import { Time } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { LanguageService } from './language.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

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
                ViewSwitchService, ApplicationSettingsService,
                MdbModalService, LanguageService, provideTestTranslate()
            ]
        }).compileComponents();

        const planner = TestBed.inject(PlannerService);
        plannerSpy = vi.spyOn(planner, 'calculate').mockImplementation((diveId?: number) => {});
        dispatcher = TestBed.inject(ReloadDispatcher);
        schedules = TestBed.inject(DiveSchedules);
        scheduler = TestBed.inject(DelayedScheduleService);
        scheduler.delayMilliseconds = 0;
        addRepetitiveDive();
        schedules.add();
        scheduler.startScheduling(); // to bind events
    });

    const wait = (milliseconds?: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds));

    const verifySchedules = async (testFn: () => void, expectedCalls: [number | undefined][]): Promise<void> => {
        await wait(); // to skip initial schedule
        plannerSpy.mockClear();
        testFn();

        await wait(delayHigherThanScheduler);
        const currentCalls = plannerSpy.mock.calls;
        expect(currentCalls).toEqual(expectedCalls);
    };


    it('Plans all first dives after start', async () => {
        await wait(delayHigherThanScheduler);
        expect(plannerSpy.mock.calls).toEqual([[1], [3]]);
    });

    it('Plans current dive', async () => {
        await verifySchedules(() => {
            console.table(plannerSpy.mock.calls);
            schedules.add();
            dispatcher.sendDepthChanged();
        }, [[4]]);
    });

    it('Prevents multiple calculations after quick change of the same time', async () => {
        await verifySchedules(() => {
            dispatcher.sendDepthChanged();
            dispatcher.sendDepthChanged();
            dispatcher.sendDepthChanged();
        }, [[3]]);
    });

    it('Plans second repetitive dive', async () => {
        await verifySchedules(() => {
            dispatcher.sendInfoCalculated(1);
        }, [[2]]);
    });

    it('Stops planning after last dive calculated', async () => {
        await verifySchedules(() => {
            dispatcher.sendInfoCalculated(3);
        }, []);
    });

    it('Stops planning if next dive is not repetitive dive', async () => {
        await verifySchedules(() => {
            dispatcher.sendInfoCalculated(1);
        }, [[2]]);
    });

    it('Stops planning when calculation task fails.', async () => {
        await verifySchedules(() => {
            dispatcher.sendInfoCalculated();
        }, []);
    });

    it('Schedules dive 2 when scheduling dive 1', async () => {
        await verifySchedules(() => {
            schedules.setSelectedIndex(1);
            dispatcher.sendDepthChanged(); // 2
            schedules.setSelectedIndex(2);
            dispatcher.sendDepthChanged();  // 3
        }, [[2], [3]]);
    });

    it('Schedules dive 1 when scheduling dive 2', async () => {
        await verifySchedules(() => {
            schedules.setSelectedIndex(2);
            dispatcher.sendDepthChanged(); // 3
            schedules.setSelectedIndex(1);
            dispatcher.sendDepthChanged(); // 2
        }, [[3], [2]]);
    });
});
