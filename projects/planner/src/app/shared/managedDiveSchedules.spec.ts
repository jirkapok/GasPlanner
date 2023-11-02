import {DiveSchedule, DiveSchedules} from './dive.schedules';
import {inject, TestBed} from '@angular/core/testing';
import {UnitConversion} from './UnitConversion';
import {TanksService} from './tanks.service';
import {PreferencesStore} from './preferencesStore';
import {PlannerService} from './planner.service';
import {WorkersFactoryCommon} from './serial.workers.factory';
import {Plan} from './plan.service';
import {DiveResults} from './diveresults';
import {OptionsService} from './options.service';
import {WayPointsService} from './waypoints.service';
import {Preferences} from './preferences';
import {ViewSwitchService} from './viewSwitchService';
import {ViewStates} from './viewStates';
import {DepthsService} from './depths.service';
import {DelayedScheduleService} from './delayedSchedule.service';
import {SubViewStorage} from './subViewStorage';
import {TestBedExtensions} from './TestBedCommon.spec';
import {ManagedDiveSchedules} from './managedDiveSchedules';

// TODO Scheduled dives test cases:
// * any change in dive list triggers save preferences
// * Dives are loaded from saved storage
// * any change triggers planner recalculate
describe('Managed Schedules Loads default dive settings', () => {
    let sut: ManagedDiveSchedules;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                ManagedDiveSchedules, UnitConversion,
                TanksService, DiveSchedules, PreferencesStore,
                PlannerService, WorkersFactoryCommon,
                Plan, DiveResults, OptionsService,
                WayPointsService, Preferences, ViewSwitchService,
                ViewStates, DepthsService, DelayedScheduleService,
                SubViewStorage
            ],
        }).compileComponents();

        sut = TestBed.inject(ManagedDiveSchedules);
    });

    describe('Add new dive loads defaults', () => {
        let lastDive: DiveSchedule;

        beforeEach(() => {
            localStorage.clear();

            // TODO replace initialization by saving from managed schedule first dive
            TestBedExtensions.initPlan();

            const tankService = TestBed.inject(TanksService);
            tankService.addTank();
            tankService.tankData[1].size = 24;

            const optionsService = TestBed.inject(OptionsService);
            optionsService.maxEND = 27;

            const plan = TestBed.inject(Plan);
            plan.assignDepth(25, tankService.firstTank.tank, optionsService.getOptions());

            const preferencesStore = TestBed.inject(PreferencesStore);
            preferencesStore.saveDefault();

            sut.add();
            const schedules = TestBed.inject(DiveSchedules);
            lastDive = schedules.dives[1];
        });

        it('Loads tanks', () => {
            const secondDiveTanks = lastDive.tanksService.tanks;
            expect(secondDiveTanks.length).toEqual(2);
            expect(secondDiveTanks[1].size).toEqual(24);
        });

        it('Loads Profile',() => {
            const maxDepth = lastDive.plan.maxDepth;
            expect(maxDepth).toEqual(25);
        });

        it('Loads dive options', () => {
            const options = lastDive.optionsService;
            expect(options.maxEND).toEqual(27);
        });
    });
});
