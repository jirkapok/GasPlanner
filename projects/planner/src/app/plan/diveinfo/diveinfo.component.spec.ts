import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdbTabComponent, MdbTabsComponent } from "mdb-angular-ui-kit/tabs";

import { DiveInfoComponent } from './diveinfo.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { WayPointsService } from '../../shared/waypoints.service';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ViewStates } from '../../shared/viewStates';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';

describe('DiveInfoComponent', () => {
    let component: DiveInfoComponent;
    let fixture: ComponentFixture<DiveInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DiveInfoComponent, MdbTabComponent, MdbTabsComponent
            ],
            providers: [
                UnitConversion, PlannerService, SubViewStorage,
                WorkersFactoryCommon, WayPointsService,
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
