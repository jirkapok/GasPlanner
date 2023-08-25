import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { Plan } from '../shared/plan.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { AppSettingsComponent } from './app-settings.component';
import { ViewStates } from '../shared/viewStates';

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
            providers: [DecimalPipe,
                SettingsNormalizationService,
                UnitConversion, ValidatorGroups,
                InputControls, OptionsService, Plan,
                PlannerService, WorkersFactoryCommon,
                TanksService, ViewStates
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        page = new AppSettingsPage(fixture);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            component.diver.rmv = 30;
            page.imperialRadio.click();
            component.use();
        });

        it('Normalize rmv to imperial', inject([OptionsService],
            (options: OptionsService) => {
                expect(options.diver.rmv).toBeCloseTo(29.998867, 6);
            }));

        it('Applies units change', inject([UnitConversion],
            (units: UnitConversion) => {
                expect(units.imperialUnits).toBeTruthy();
            }));

        it('Applies recreational options', inject([OptionsService],
            (options: OptionsService) => {
                expect(options.maxEND).toBeCloseTo(100, 4);
            }));
    });
});
