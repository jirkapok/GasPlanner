import { TestBed, inject } from '@angular/core/testing';
import { KnownViews, ViewStates } from './viewStates';
import { PreferencesStore } from './preferencesStore';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { Plan } from './plan.service';
import { OptionsService } from './options.service';
import { WayPointsService } from './waypoints.service';
import { Preferences } from './preferences';
import { ViewSwitchService } from './viewSwitchService';
import { ViewState } from './serialization.model';
import { SubViewStorage } from './subViewStorage';

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
                PlannerService, WorkersFactoryCommon, TanksService,
                UnitConversion, Plan, OptionsService, WayPointsService,
                Preferences, ViewSwitchService
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
            viewStates.loadFrom({
                lastScreen: '/',
                states: []
            });

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
