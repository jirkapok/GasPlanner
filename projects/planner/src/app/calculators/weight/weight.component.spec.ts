import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeightCalcComponent } from './weight.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { InputControls } from '../../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ViewStates } from '../../shared/viewStates';
import { PreferencesStore } from '../../shared/preferencesStore';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { By } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MdbModalService } from "mdb-angular-ui-kit/modal";

describe('WeightCalcComponent', () => {
    let component: WeightCalcComponent;
    let fixture: ComponentFixture<WeightCalcComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WeightCalcComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe, SubViewStorage, ViewStates,
                PreferencesStore, PlannerService, WorkersFactoryCommon,
                Preferences, ViewSwitchService,
                ReloadDispatcher, DiveSchedules,
                ApplicationSettingsService,
                MdbModalService
            ],
            imports: [
                RouterTestingModule.withRoutes([]),
                ReactiveFormsModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WeightCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Calculates weight', () => {
        const consumedInput = fixture.debugElement.query(By.css('#consumed'))?.nativeElement as HTMLInputElement;
        consumedInput.value = '150';
        consumedInput.dispatchEvent(new Event('input'));
        expect(component.tank.startPressure).toBeCloseTo(180, 3);
        expect(component.weight).toBeCloseTo(2.7, 3);
    });
});
