import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RedundanciesComponent } from './redundancies.component';
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
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DiveSchedules } from '../shared/dive.schedules';

describe('RedundanciesComponent', () => {
    let component: RedundanciesComponent;
    let fixture: ComponentFixture<RedundanciesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RedundanciesComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe, SubViewStorage, ViewStates,
                PreferencesStore, PlannerService, WorkersFactoryCommon,
                Preferences, ViewSwitchService,
                ReloadDispatcher, DiveSchedules
            ]
        });

        const units = TestBed.inject(UnitConversion);
        units.imperialUnits = true;
        // no need to reset view states, they are empty
        fixture = TestBed.createComponent(RedundanciesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Creates default tank dimensions in imperial units', () => {
        expect(component.firstTank.size).toBeCloseTo(124.1 , 1);
        expect(component.firstTank.workingPressure).toBeCloseTo(3442);
        expect(component.secondTank.size).toBeCloseTo(124.1 , 1);
        expect(component.secondTank.workingPressure).toBeCloseTo(3442);
    });
});
