import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveInfoComponent } from './diveinfo.component';
import { DepthsService } from '../shared/depths.service';
import { UnitConversion } from '../shared/UnitConversion';
import { TanksService } from '../shared/tanks.service';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { Plan } from '../shared/plan.service';
import { DiveResults } from '../shared/diveresults';
import { OptionsService } from '../shared/options.service';
import { WayPointsService } from '../shared/waypoints.service';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';

describe('DiveInfoComponent', () => {
    let component: DiveInfoComponent;
    let fixture: ComponentFixture<DiveInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DiveInfoComponent,
            ],
            providers: [
                DepthsService, UnitConversion, TanksService,
                DelayedScheduleService, PlannerService,
                WorkersFactoryCommon, Plan, DiveResults,
                OptionsService, WayPointsService, SubViewStorage,
                ViewStates, PreferencesStore, Preferences,
                ViewSwitchService
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