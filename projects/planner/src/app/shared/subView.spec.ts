import { TestBed, inject } from '@angular/core/testing';
import { KnownViews, ViewStates } from './viewStates';
import { PreferencesStore } from './preferencesStore';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { WayPointsService } from './waypoints.service';
import { Preferences } from './preferences';
import { ViewSwitchService } from './viewSwitchService';
import { ViewState } from './views.model';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { ApplicationSettingsService } from './ApplicationSettings';
import { MdbModalService } from "mdb-angular-ui-kit/modal";

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
                MdbModalService
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
    });

    it('Saves view state', inject([SubViewStorage, ViewStates, PreferencesStore],
        (viewStorage: SubViewStorage, viewStates: ViewStates, preferences: PreferencesStore) => {
            spyOn(viewStates, 'set');
            spyOn(preferences, 'save');

            viewStorage.saveView(changedSate);

            expect(viewStates.set).toHaveBeenCalledOnceWith(changedSate);
            expect(preferences.save).toHaveBeenCalledWith();
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

                expect(viewStates.redirectToView).toBeFalse();
            }));
    });
});
