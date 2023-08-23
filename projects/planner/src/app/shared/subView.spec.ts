import { TestBed, inject } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ViewStates } from './viewStates';
import { PersistedSubViewComponent } from './subView';
import { PreferencesService } from './preferences.service';
import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { Plan } from './plan.service';
import { OptionsService } from './options.service';
import { WayPointsService } from './waypoints.service';
import { PreferencesFactory } from './preferences.factory';
import { ViewSwitchService } from './viewSwitchService';
import { ViewState } from './serialization.model';

const viweId = 'testView';
interface TestView extends ViewState {
    propertyA: string;
}

@Injectable()
class TestSubViewComponent extends PersistedSubViewComponent<TestView> {
    constructor(views: ViewStates, preferences: PreferencesService, location: Location) {
        super({
            propertyA: 'propA',
            id: viweId
        }, viweId, views, preferences, location);
    }
}

describe('SubView', () => {
    const changedSate: TestView = {
        propertyA: 'changed',
        id: viweId
    };

    const originalSate: TestView = {
        propertyA: 'original',
        id: viweId
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                TestSubViewComponent,
                ViewStates, PreferencesService,
                PlannerService, WorkersFactoryCommon, TanksService,
                UnitConversion, Plan, OptionsService, WayPointsService,
                PreferencesFactory, ViewSwitchService
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        const viewStates = TestBed.inject(ViewStates);
        viewStates.set('testView', originalSate);
        const preferences = TestBed.inject(PreferencesService);
        preferences.saveDefaults();
    });

    it('Saves view state', inject([TestSubViewComponent, ViewStates, PreferencesService],
        (subView: TestSubViewComponent, viewStates: ViewStates, preferences: PreferencesService) => {
            spyOn(viewStates, 'set');
            spyOn(preferences, 'saveDefaults');
            subView.viewState = changedSate;

            subView.saveView();

            expect(viewStates.set).toHaveBeenCalledOnceWith('testView', changedSate);
            expect(preferences.saveDefaults).toHaveBeenCalledWith();
        }));

    it('Loads view state', inject([TestSubViewComponent, ViewStates, PreferencesService],
        (subView: TestSubViewComponent, viewStates: ViewStates, preferences: PreferencesService) => {
            spyOn(preferences, 'saveDefaults');
            subView.viewState = changedSate;

            subView.loadView();

            expect(subView.viewState).toEqual(originalSate);
        }));
});
