import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltitudeCalcComponent } from './altitude-calc.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { Plan } from '../shared/plan.service';
import { OptionsService } from '../shared/options.service';
import { WayPointsService } from '../shared/waypoints.service';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';

describe('AltitudeCalcComponent', () => {
    let component: AltitudeCalcComponent;
    let fixture: ComponentFixture<AltitudeCalcComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AltitudeCalcComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe, SubViewStorage, ViewStates,
                PreferencesStore, PlannerService, WorkersFactoryCommon,
                TanksService, Plan, OptionsService, WayPointsService,
                Preferences, ViewSwitchService
            ]
        });
        fixture = TestBed.createComponent(AltitudeCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
