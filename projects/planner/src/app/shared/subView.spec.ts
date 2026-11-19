import { TestBed, inject } from '@angular/core/testing';
import { KnownViews, ViewStates } from './viewStates';
import { PreferencesStore } from './preferencesStore';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { WayPointsService } from './waypoints.service';
import { Preferences } from './preferences';
import { ViewSwitchService } from './viewSwitchService';
import { DashBoardViewState, ViewState } from './views.model';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { ApplicationSettingsService } from './ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { LanguageService } from './language.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

const viewId = 'testView';
interface TestView extends ViewState {
    propertyA: string;
}

describe('SubView', () => {
    const changedSate: TestView = {
        propertyA: 'changed',
        id: viewId
    };

    const originalSate: TestView = {
        propertyA: 'original',
        id: viewId
    };

    const loadViews = (v: ViewStates) => {
        v.loadFrom({
            lastScreen: KnownViews.nitrox,
            states: [originalSate]
        });
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                ViewStates, PreferencesStore, SubViewStorage,
                PlannerService, WorkersFactoryCommon,
                UnitConversion, WayPointsService,
                Preferences, ViewSwitchService,
                ReloadDispatcher, DiveSchedules,
                ApplicationSettingsService,
                MdbModalService, LanguageService, provideTestTranslate()
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
    });

    it('Saves view state', inject([SubViewStorage, ViewStates, PreferencesStore],
        (viewStorage: SubViewStorage, viewStates: ViewStates, preferences: PreferencesStore) => {
            const setSpy = vi.spyOn(viewStates, 'set').mockImplementation(() => {});
            const saveSpy = vi.spyOn(preferences, 'save').mockImplementation(() => {});

            viewStorage.saveView(changedSate);

            expect(setSpy).toHaveBeenCalledExactlyOnceWith(changedSate);
            expect(saveSpy).toHaveBeenCalledWith();
        }));

    it('Loads view state', inject([SubViewStorage, ViewStates, PreferencesStore],
        (viewStorage: SubViewStorage, viewStates: ViewStates) => {
            loadViews(viewStates);

            const subView = viewStorage.loadView(viewId);

            expect(subView).toEqual(originalSate);
        }));

    it('No initial loadView returns undefined', inject([SubViewStorage, ViewStates],
        (viewStorage: SubViewStorage, viewStates: ViewStates) => {
            viewStates.reset();

            const subView = viewStorage.loadView(viewId);

            expect(subView).toBeUndefined();
        }));

    it('Set view replaces lastView', inject([SubViewStorage, ViewStates],
        (viewStorage: SubViewStorage, viewStates: ViewStates) => {
            loadViews(viewStates);

            viewStorage.saveView(changedSate);

            expect(viewStates.lastView).toEqual(viewId);
        }));

    describe('Start up', () => {
        it('Initial navigates to last sub view', inject([ViewStates],
            (viewStates: ViewStates) => {
                loadViews(viewStates);

                expect(viewStates.redirectToView).toBeTruthy();
            }));

        it('Repeated Navigates to last sub view', inject([SubViewStorage, ViewStates],
            (viewStorage: SubViewStorage, viewStates: ViewStates) => {
                loadViews(viewStates);
                viewStorage.saveView(changedSate);

                expect(viewStates.redirectToView).toBe(false);
            }));
    });

    describe('Main view rest interval', () => {
        let sut: SubViewStorage;
        let viewStates: ViewStates;

        const loadDashboard = (state: DashBoardViewState) => {
            viewStates.loadFrom({
                lastScreen: KnownViews.dashboard,
                states: [state]
            });
        };

        const storedRestInterval = (): number | undefined =>
            viewStates.get<DashBoardViewState>(KnownViews.dashboard)?.restInterval;

        beforeEach(() => {
            sut = TestBed.inject(SubViewStorage);
            viewStates = TestBed.inject(ViewStates);
            vi.spyOn(TestBed.inject(PreferencesStore), 'save').mockImplementation(() => {});
        });

        it('is 0 when there is no dashboard state', () => {
            viewStates.reset();

            expect(sut.restInterval).toBe(0);
        });

        it('is 0 for dashboard state without rest interval', () => {
            loadDashboard({ id: KnownViews.dashboard, selectedDiveIndex: 0 });

            expect(sut.restInterval).toBe(0);
        });

        it('loads stored value', () => {
            loadDashboard({ id: KnownViews.dashboard, selectedDiveIndex: 0, restInterval: 3600 });

            expect(sut.restInterval).toBe(3600);
        });

        it('setter stores into dashboard view state', () => {
            sut.restInterval = 1800;

            expect(storedRestInterval()).toBe(1800);
        });

        it('saveMainView keeps stored rest interval', () => {
            loadDashboard({ id: KnownViews.dashboard, selectedDiveIndex: 0, restInterval: 3600 });

            sut.saveMainView();

            expect(storedRestInterval()).toBe(3600);
        });

        it('reset clears rest interval', () => {
            sut.restInterval = 1800;

            sut.reset();

            expect(sut.restInterval).toBe(0);
        });
    });
});
