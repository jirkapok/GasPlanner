import {DiveSchedule, DiveSchedules} from './dive.schedules';
import { TestBed, inject } from '@angular/core/testing';
import {UnitConversion} from './UnitConversion';
import {PreferencesStore} from './preferencesStore';
import {PlannerService} from './planner.service';
import {WorkersFactoryCommon} from './serial.workers.factory';
import {WayPointsService} from './waypoints.service';
import {Preferences} from './preferences';
import {ViewSwitchService} from './viewSwitchService';
import {ViewStates} from './viewStates';
import {DelayedScheduleService} from './delayedSchedule.service';
import {SubViewStorage} from './subViewStorage';
import {ManagedDiveSchedules} from './managedDiveSchedules';
import Spy = jasmine.Spy;
import {ReloadDispatcher} from './reloadDispatcher';

// TODO Scheduled dives test cases:
// * Dives are loaded from saved storage at start
describe('Managed Schedules', () => {
    const expectedSecondTankSize = 24;
    const expectedMaxEnd = 27;
    const expectedMaxDepth = 25;
    let sut: ManagedDiveSchedules;
    let preferencesStore: PreferencesStore;
    let schedules: DiveSchedules;
    let savePreferencesSpy: Spy<() => void>;
    let schedulerSpy: Spy<() => void>;

    const changeDive = (dive: DiveSchedule) => {
        const tankService = dive.tanksService;
        tankService.addTank();
        tankService.tankData[1].size = expectedSecondTankSize;

        const optionsService = dive.optionsService;
        optionsService.maxEND = expectedMaxEnd;

        dive.depths.plannedDepth = expectedMaxDepth;
    };

    const saveFirstDiveAsDefault = () => {
        changeDive(schedules.selected);
        preferencesStore.saveDefault();
    };

    const assertDive = (dive: DiveSchedule) => {
        const tanks = dive.tanksService.tanks;
        expect(tanks.length).toEqual(2);
        expect(tanks[1].size).toEqual(expectedSecondTankSize);
        const maxDepth = dive.depths.plannedDepthMeters;
        expect(maxDepth).toEqual(expectedMaxDepth);
        const options = dive.optionsService;
        expect(options.maxEND).toEqual(expectedMaxEnd);
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                ManagedDiveSchedules, UnitConversion,
                DiveSchedules, PreferencesStore,
                PlannerService, WorkersFactoryCommon,
                ReloadDispatcher, WayPointsService,
                Preferences, ViewSwitchService,
                ViewStates, DelayedScheduleService,
                SubViewStorage,
            ],
        }).compileComponents();

        sut = TestBed.inject(ManagedDiveSchedules);
        preferencesStore = TestBed.inject(PreferencesStore);
        savePreferencesSpy = spyOn(preferencesStore, 'save').and.callThrough();
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule').and.callThrough();
        schedules = TestBed.inject(DiveSchedules);
    });

    describe('Add new dive', () => {
        beforeEach(() => {
            localStorage.clear();
            saveFirstDiveAsDefault();
            sut.add();
        });

        it('Loads default dive setup', () => {
            const lastDive = schedules.dives[1];
            assertDive(lastDive);
        });

        it('Saves new dive in preferences', () => {
            expect(savePreferencesSpy).toHaveBeenCalledWith();
        });

        it('Calls scheduler after add', () => {
            expect(schedulerSpy).toHaveBeenCalledWith();
        });
    });

    describe('Remove dive', () => {
        let scheduleRemoveSpy: Spy<(d: DiveSchedule) => void>;
        let toRemove: DiveSchedule;

        beforeEach(() => {
            sut.add();
            sut.add();

            scheduleRemoveSpy = spyOn(schedules, 'remove').and.callThrough();
            toRemove = schedules.dives[1];
            sut.remove(toRemove);
        });

        it('Saves state in preferences', () => {
            expect(savePreferencesSpy).toHaveBeenCalledWith();
        });

        it('Is removed from dives', () => {
            expect(scheduleRemoveSpy).toHaveBeenCalledWith(toRemove);
        });

        it('Calls scheduler after remove', () => {
            expect(schedulerSpy).toHaveBeenCalledWith();
        });
    });

    describe('Load default dive', () => {
        let secondDive: DiveSchedule;

        beforeEach(() => {
            saveFirstDiveAsDefault();
            sut.add();
            secondDive = schedules.dives[1];
            schedules.selected = secondDive;
            sut.loadDefaults();
        });

        it('Loads dive setup to currently selected dive', () => {
            assertDive(secondDive);
        });

        it('Calls scheduled to recalculate selected dive', () => {
            expect(schedulerSpy).toHaveBeenCalledWith();
        });
    });

    describe('Save dive as default', () => {
        it('Calls save preferences with selected dive', () => {
            const saveDefaultSpy = spyOn(preferencesStore, 'saveDefault').and.callThrough();
            sut.add();
            const secondDive = schedules.dives[1];
            schedules.selected = secondDive;
            changeDive(secondDive);
            sut.saveDefaults();
            expect(saveDefaultSpy).toHaveBeenCalledWith();
        });
    });

    describe('Load all', () => {
        it('Loads all dives data', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true; // to prevent shrink of tanks while loading
                const second = schedules.add();
                changeDive(second);

                preferencesStore.save();
                schedules.clear();
                sut.loadAll();

                expect(schedules.length).toEqual(2);
                assertDive(schedules.dives[1]);
            }));
    });
});
