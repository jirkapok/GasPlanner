import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { OxygenDropDownComponent } from '../../controls/oxygen-dropdown/oxygen-dropdown.component';
import { InputControls } from '../../shared/inputcontrols';
import { NitroxCalculatorService } from '../../shared/nitrox-calculator.service';
import { OptionsService } from '../../shared/options.service';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { NitroxComponent } from './nitrox.component';
import { ViewStates } from '../../shared/viewStates';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';


export class NitroxPage {
    constructor(private fixture: ComponentFixture<NitroxComponent>) { }

    public get fO2Input(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#gasO2')).nativeElement as HTMLInputElement;
    }

    public get ppO2Input(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#pO2')).nativeElement as HTMLInputElement;
    }
}

describe('Nitrox component', () => {
    let component: NitroxComponent;
    let fixture: ComponentFixture<NitroxComponent>;
    let page: NitroxPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NitroxComponent, OxygenDropDownComponent],
            providers: [
                UnitConversion, InputControls, DecimalPipe,
                NitroxCalculatorService, ValidatorGroups,
                ViewStates, PreferencesStore, Preferences,
                PlannerService, WorkersFactoryCommon,
                ViewSwitchService, SubViewStorage,
                ReloadDispatcher, DiveSchedules,
                OptionsService, ApplicationSettingsService,
                MdbModalService
            ],
            imports: [RouterTestingModule.withRoutes([]), ReactiveFormsModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NitroxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        page = new NitroxPage(fixture);
    });

    it('Does not apply ppO2, when on EAD tab', () => {
        component.toEad();
        component.inputChanged();
        expect(component.calc.pO2).not.toBeNull();
    });

    describe('Low MOD', () => {
        beforeEach(() => {
            fixture.detectChanges();
            page.fO2Input.value = '80';
            page.fO2Input.dispatchEvent(new Event('input'));
            page.ppO2Input.value = '0.21';
            page.ppO2Input.dispatchEvent(new Event('input'));
        });

        it('invalidates form', () => {
            expect(component.nitroxForm.invalid).toBeTruthy();
        });

        it('MOD returns 0 m', () => {
            expect(component.calcMod).toBe(0);
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
            component.ngOnInit();
        });

        it('adjusts MOD', () => {
            expect(component.calcMod).toBeCloseTo(185.9, 1);
        });

        it('adjusts EAD at depth', () => {
            expect(component.eadAtDepth).toBeCloseTo(98.4, 1);
        });
    });
});
