import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { AppSettingsComponent } from './app-settings.component';
import { ViewStates } from '../shared/viewStates';
import { SubViewStorage } from '../shared/subViewStorage';
import { Preferences } from '../shared/preferences';
import { PreferencesStore } from '../shared/preferencesStore';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DiveSchedules } from '../shared/dive.schedules';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { ImperialUnits } from 'projects/scuba-physics/src/public-api';
import { values } from 'lodash';
import { AppSettings } from '../shared/models';

export class AppSettingsPage {
    constructor(private fixture: ComponentFixture<AppSettingsComponent>) { }

    public get imperialRadio(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#imperialRadio')).nativeElement as HTMLInputElement;
    }

    public get metricRadio(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#metricRadio')).nativeElement as HTMLInputElement;
    }
}

describe('App settings component', () => {
    let component: AppSettingsComponent;
    let fixture: ComponentFixture<AppSettingsComponent>;
    let page: AppSettingsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [
                ReactiveFormsModule, AppSettingsComponent,
                CardHeaderComponent
            ],
            providers: [
                MdbModalService, DiveSchedules,
                UnitConversion, ReloadDispatcher
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        page = new AppSettingsPage(fixture);
    });

    describe('Imperial units', () => {
        let options: OptionsService;

        beforeEach(() => {
            page.imperialRadio.click();
            component.use();
            const schedules = TestBed.inject(DiveSchedules);
            options = schedules.selected.optionsService;
        });

        it('Converts Gas density', () => {
            expect(component.appSettings.maxGasDensity).toBeCloseTo(0.35584, 4);
        });

        it('Rounds END', () => {
            expect(options.maxEND).toBeCloseTo(98, 4);
        });

        it('Applies units change', inject([UnitConversion],
            (units: UnitConversion) => {
                expect(units.imperialUnits).toBeTruthy();

        }));
    });

    describe('Metric units', () => {
        let options: OptionsService;

        beforeEach(() => {
            page.metricRadio.click();
            component.use();
            const schedules = TestBed.inject(DiveSchedules);
            options = schedules.selected.optionsService;
        })

        it('Max Gas density', () => {
            expect(component.appSettings.maxGasDensity).toBeCloseTo(5.7, 1);

        });

        it('Should return to default values of max density after changing values', () => {

            component.settingsForm.patchValue({maxDensity:4.5, primaryTankReserve:29,stageTankReserve: 19});
            fixture.detectChanges();

            component.use();

            component.resetToDefault();
            expect(component.settingsForm.value.maxDensity).toBeCloseTo(component.appSettings.defaultMaxGasDensity,1);
            expect(component.settingsForm.value.primaryTankReserve).toBeCloseTo(component.appSettings.defaultPrimaryTankReserve,1);
            expect(component.settingsForm.value.stageTankReserve).toBeCloseTo(20,1);

        });

        it('should apply ICD ignored after Use', () => {

            component.settingsForm.patchValue({ icdIgnored: true });

            fixture.detectChanges();

            component.use();
            expect(component.appSettings.icdIgnored).toBeTrue();

        });

        it('should not apply Use after invalid value is filled', () => {

            component.settingsForm.patchValue({ maxDensity: -1});

            fixture.detectChanges();

            component.use();
            expect(component.settingsForm.invalid).toBeTrue();
            expect(component.appSettings.maxGasDensity).not.toBe(-1);
         });
    });
});
