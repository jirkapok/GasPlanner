import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveInfoComponent } from './diveinfo.component';
import { UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { WayPointsService } from '../shared/waypoints.service';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DiveSchedules } from '../shared/dive.schedules';

describe('DiveInfoComponent', () => {
    let component: DiveInfoComponent;
    let fixture: ComponentFixture<DiveInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DiveInfoComponent,
            ],
            providers: [
                UnitConversion, DelayedScheduleService, PlannerService,
                WorkersFactoryCommon, WayPointsService, SubViewStorage,
                ViewStates, PreferencesStore, Preferences,
                ViewSwitchService, ReloadDispatcher,
                DiveSchedules
            ]
        });
        fixture = TestBed.createComponent(DiveInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
