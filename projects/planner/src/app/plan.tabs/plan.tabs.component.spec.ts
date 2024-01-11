import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanTabsComponent } from './plan.tabs.component';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ManagedDiveSchedules } from '../shared/managedDiveSchedules';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { ViewStates } from '../shared/viewStates';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { SubViewStorage } from '../shared/subViewStorage';

describe('PlanTabsComponent', () => {
    let component: PlanTabsComponent;
    let fixture: ComponentFixture<PlanTabsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [PlanTabsComponent],
            providers: [
                UnitConversion, ReloadDispatcher,
                DiveSchedules, ManagedDiveSchedules,
                PreferencesStore, Preferences,
                ViewSwitchService, ViewStates,
                DelayedScheduleService, PlannerService,
                WorkersFactoryCommon, SubViewStorage
            ]
        });
        fixture = TestBed.createComponent(PlanTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
