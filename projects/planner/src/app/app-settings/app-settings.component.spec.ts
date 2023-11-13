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

export class AppSettingsPage {
    constructor(private fixture: ComponentFixture<AppSettingsComponent>) { }

    public get imperialRadio(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#imperialRadio')).nativeElement as HTMLInputElement;
    }
}

describe('App settings component', () => {
    let component: AppSettingsComponent;
    let fixture: ComponentFixture<AppSettingsComponent>;
    let page: AppSettingsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppSettingsComponent],
            imports: [ReactiveFormsModule],
            providers: [
                DecimalPipe,
                SettingsNormalizationService,
                UnitConversion, ValidatorGroups,
                InputControls, ViewStates, SubViewStorage,
                DiveSchedules, ReloadDispatcher,
                PreferencesStore, Preferences,
                PlannerService, WorkersFactoryCommon,
                ViewSwitchService, ReloadDispatcher,
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
            component.diver.rmv = 30;
            page.imperialRadio.click();
            component.use();
            const schedules = TestBed.inject(DiveSchedules);
            options = schedules.selected.optionsService;
        });

        it('Normalize rmv to imperial', () => {
            expect(options.diverOptions.rmv).toBeCloseTo(29.998867, 6);
        });

        it('Applies recreational options', () => {
            expect(options.maxEND).toBeCloseTo(100, 4);
        });

        it('Applies units change', inject([UnitConversion],
            (units: UnitConversion) => {
                expect(units.imperialUnits).toBeTruthy();
            }));
    });
});
