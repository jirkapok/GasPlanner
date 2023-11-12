import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightCalcComponent } from './weight.component';
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
import { OptionsService } from '../shared/options.service';
import { WayPointsService } from '../shared/waypoints.service';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveResults } from '../shared/diveresults';
import {DepthsService} from '../shared/depths.service';
import {ReloadDispatcher} from '../shared/reloadDispatcher';
import {DiveSchedules} from '../shared/dive.schedules';

describe('WeightCalcComponent', () => {
    let component: WeightCalcComponent;
    let fixture: ComponentFixture<WeightCalcComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WeightCalcComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe, SubViewStorage, ViewStates, DepthsService,
                PreferencesStore, PlannerService, WorkersFactoryCommon,
                TanksService, OptionsService, WayPointsService,
                Preferences, ViewSwitchService, DiveResults,
                ReloadDispatcher, DiveSchedules
            ]
        });
        fixture = TestBed.createComponent(WeightCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Calculates theoretical depth', () => {
        component.tank.tank.consumed = 150;
        expect(component.weight).toBeCloseTo(2.8, 3);
    });
});
