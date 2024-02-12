import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LoadTestDataComponent} from './loadtestdata.component';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';
import {TestDataInjector} from '../testDataInjector';
import {PreferencesStore} from '../../../shared/preferencesStore';
import {Preferences} from '../../../shared/preferences';
import {ViewSwitchService} from '../../../shared/viewSwitchService';
import {DiveSchedules} from '../../../shared/dive.schedules';
import {UnitConversion} from '../../../shared/UnitConversion';
import {ReloadDispatcher} from '../../../shared/reloadDispatcher';
import {ViewStates} from '../../../shared/viewStates';
import {PlannerService} from '../../../shared/planner.service';
import {WorkersFactoryCommon} from '../../../shared/serial.workers.factory';

describe('LoadTestDataComponent', () => {
    let component: LoadTestDataComponent;
    let fixture: ComponentFixture<LoadTestDataComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LoadTestDataComponent],
            providers: [
                ProfileComparatorService,
                TestDataInjector,
                PlannerService,
                WorkersFactoryCommon,
                PreferencesStore,
                Preferences,
                ViewSwitchService,
                ViewStates,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]
        });
        fixture = TestBed.createComponent(LoadTestDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
