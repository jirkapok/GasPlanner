import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { AppSettingsComponent } from './app-settings.component';
import { SubViewStorage } from '../shared/subViewStorage';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DiveSchedules } from '../shared/dive.schedules';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { LanguageService } from '../shared/language.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';

export class AppSettingsPage {
    constructor(private fixture: ComponentFixture<AppSettingsComponent>) { }

    public get imperialRadio(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#imperialRadio')).nativeElement as HTMLInputElement;
    }

    public get metricRadio(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#metricRadio')).nativeElement as HTMLInputElement;
    }

    public get useButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#useButton')).nativeElement as HTMLButtonElement;
    }

    public get resetToDefault(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#resetToDefault')).nativeElement as HTMLButtonElement;
    }

    public get maxDensityInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('[formControlName="maxDensity"]')).nativeElement as HTMLInputElement;
    }

    public get primaryReserveInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('[formControlName="primaryTankReserve"]')).nativeElement as HTMLInputElement;

    }

    public get stageReserveInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('[formControlName="stageTankReserve"]')).nativeElement as HTMLInputElement;

    }

    public setInputValue(input: HTMLInputElement, value: number | string): void {
        input.value = String(value);
        input.dispatchEvent(new Event('input'));
        this.fixture.detectChanges();
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
                UnitConversion, ReloadDispatcher,
                LanguageService, provideTestTranslate(),
                DecimalPipe, InputControls, ValidatorGroups,
                SettingsNormalizationService, ApplicationSettingsService,
                SubViewStorage, ViewStates,
                PreferencesStore, Preferences,
                ViewSwitchService
            ]
        }).compileComponents();
    });

    describe('Ignored issues', () => {
        beforeEach(() => {
            component.settingsForm.patchValue({
                icdIgnored: true,
                densityIgnored: true,
                noDecoIgnored: true,
                missingAirBreak: true
            });
            component.use();
        });

        it('Are applied to shared application settings', () => {
            const appSettings = TestBed.inject(ApplicationSettingsService);
            expect(appSettings.icdIgnored).toBeTruthy();
            expect(appSettings.densityIgnored).toBeTruthy();
            expect(appSettings.noDecoIgnored).toBeTruthy();
            expect(appSettings.missingAirBreakIgnored).toBeTruthy();
        });

        it('Are restored when returning to the page', () => {
            const reopened = TestBed.createComponent(AppSettingsComponent);
            reopened.detectChanges();
            const restored = reopened.componentInstance.settingsForm.getRawValue();
            expect(restored.icdIgnored).toBeTruthy();
            expect(restored.densityIgnored).toBeTruthy();
            expect(restored.noDecoIgnored).toBeTruthy();
            expect(restored.missingAirBreak).toBeTruthy();
        });
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

        it('Should use stepping precision 0.0001 after increasing max density by one step', () => {
            page.maxDensityInput.stepUp(1);
            fixture.detectChanges();

            expect(page.maxDensityInput.value).toBeCloseTo(0.3559, 4);
        });
    });

    describe('Metric units', () => {
        let options: OptionsService;

        beforeEach(() => {
            page.metricRadio.click();
            component.use();
            const schedules = TestBed.inject(DiveSchedules);
            options = schedules.selected.optionsService;
        });

        it('Should set Max Gas density after switch to metric units', () => {
            expect(component.appSettings.maxGasDensity).toBeCloseTo(5.7, 1);

        });

        it('Should return to default values of max density after changing values', () => {

            page.setInputValue(page.maxDensityInput, 4.5);
            page.setInputValue(page.primaryReserveInput, 29);
            page.setInputValue(page.stageReserveInput, 19);


            page.useButton.click();
            fixture.detectChanges();

            page.resetToDefault.click();
            fixture.detectChanges();

            expect(page.maxDensityInput.value).toBeCloseTo(component.appSettings.defaultMaxGasDensity, 1);
            expect(page.primaryReserveInput.value).toBeCloseTo(component.appSettings.defaultPrimaryTankReserve, 1);
            expect(page.stageReserveInput.value).toBeCloseTo(20,1);

        });

        it('Should use stepping precision 0,1 after increasing max density by one step', () => {
            page.maxDensityInput.stepUp(1);
            fixture.detectChanges();

            expect(page.maxDensityInput.value).toBeCloseTo(5.8, 1);

        });
    });
});
