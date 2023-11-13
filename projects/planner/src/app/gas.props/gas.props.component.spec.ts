import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GasPropertiesCalcComponent } from './gas.props.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { StandardGases } from 'scuba-physics';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DiveSchedules } from '../shared/dive.schedules';

describe('GasPropertiesCalcComponent', () => {
    let component: GasPropertiesCalcComponent;
    let fixture: ComponentFixture<GasPropertiesCalcComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GasPropertiesCalcComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe, SubViewStorage, ViewStates,
                PreferencesStore, PlannerService, WorkersFactoryCommon,
                Preferences, ViewSwitchService,
                ReloadDispatcher, DiveSchedules
            ]
        });
        fixture = TestBed.createComponent(GasPropertiesCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Calculates theoretical depth', () => {
        component.tank.assignStandardGas(StandardGases.trimix1845.name);
        component.calc.depth = 30;
        expect(component.calc.density).toBeCloseTo(3.20184, 3);
    });
});
