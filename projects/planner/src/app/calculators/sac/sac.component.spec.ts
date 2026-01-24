import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import _ from 'lodash';
import { SacComponent } from './sac.component';
import { InputControls } from '../../shared/inputcontrols';
import { OptionsService } from '../../shared/options.service';
import { SacCalculatorService } from '../../shared/sac-calculator.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { ViewStates } from '../../shared/viewStates';
import { SubViewStorage } from '../../shared/subViewStorage';
import { Preferences } from '../../shared/preferences';
import { PreferencesStore } from '../../shared/preferencesStore';
import { PlannerService } from '../../shared/planner.service';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { TankSizeComponent } from '../../controls/tank.size/tank.size.component';
import { provideAnimations } from '@angular/platform-browser/animations';

class SacPage {
    constructor(private fixture: ComponentFixture<SacComponent>) { }

    public get workingPressure(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#workPressure'))?.nativeElement as HTMLInputElement;
    }

    public applyTemplateButton(text: string): HTMLLinkElement {
        const dropButton = this.fixture.debugElement.query(By.css('.dropdown-toggle'));
        dropButton.nativeElement.click();
        const allButtons = this.fixture.debugElement.queryAll(By.css('.dropdown-item'));
        const button = _(allButtons)
            .filter(de => (<HTMLElement>de.nativeElement).innerText === text)
            .head()?.nativeElement as HTMLLinkElement;
        return button;
    }
}

describe('Sac component', () => {
    let component: SacComponent;
    let fixture: ComponentFixture<SacComponent>;
    let viewStates: ViewStates;
    let sacPage: SacPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                WorkersFactoryCommon, UnitConversion,
                OptionsService, DecimalPipe,
                ValidatorGroups, InputControls, SacCalculatorService,
                SubViewStorage, ViewStates,
                Preferences, PreferencesStore, PlannerService,
                ViewSwitchService, ReloadDispatcher, DiveSchedules,
                ApplicationSettingsService, MdbModalService,
                provideAnimations()
            ],
            imports: [
                RouterModule.forRoot([]),
                ReactiveFormsModule, TankSizeComponent,
                SacComponent
            ]
        }).compileComponents();
    });

    function setTestSuite(imperialUnits: boolean): void {
        viewStates = TestBed.inject(ViewStates);
        viewStates.reset();
        fixture = TestBed.createComponent(SacComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = imperialUnits;
        fixture.detectChanges();
        sacPage = new SacPage(fixture);
    }

    it('use applies rmv to diver', inject([OptionsService, SacCalculatorService],
        (options: OptionsService) => {
            setTestSuite(false);
            options.diverOptions.rmv = 30;
            component.use();
            const applied = options.diverOptions.rmv;
            expect(applied).toBeCloseTo(20, 5);
        }));

    describe('Metric units', () => {
        beforeEach(() => {
            setTestSuite(false);
        });

        it('Working pressure is not visible', () => {
            expect(sacPage.workingPressure).toBeUndefined();
        });

        it('Has default tank', () => {
            expect(component.calcTankSize).toBeCloseTo(15, 1);
        });

        it('Has default depth', () => {
            expect(component.calcDepth).toBeCloseTo(15, 1);
        });

        it('Has default used', () => {
            expect(component.calcUsed).toBeCloseTo(150, 1);
        });

        it('Has default rmv', () => {
            expect(component.calcRmv).toBeCloseTo(20, 1);
        });

        it('Has default sac', () => {
            expect(component.gasSac).toBeCloseTo(1.333333, 6);
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            setTestSuite(true);
        });

        it('adjusts tank', () => {
            expect(component.calcTankSize).toBeCloseTo(124.1, 1);
        });

        it('adjusts depth', () => {
            expect(component.calcDepth).toBeCloseTo(50, 1);
        });

        it('adjusts used', () => {
            expect(component.calcUsed).toBeCloseTo(2200, 1);
        });

        it('adjusts rmv', () => {
            expect(component.calcRmv).toBeCloseTo(0.6985, 4);
        });

        it('adjusts sac', () => {
            expect(component.gasSac).toBeCloseTo(19.374053, 6);
        });

        it('adjusts working pressure', () => {
            expect(component.calcWorkingPressure).toBeCloseTo(3442, 1);
        });

        it('Working pressure affects tank size', () => {
            sacPage.workingPressure.value = '4000';
            sacPage.workingPressure.dispatchEvent(new Event('input'));
            expect(component.calc.tankSize).toBeCloseTo(12.742, 3);
        });

        it('Apply S40 tank template changes size and working pressure', () => {
            const s40Button = sacPage.applyTemplateButton('S40');
            s40Button.click();

            expect(component.calc.tankSize).toBeCloseTo(5.654, 3);
            expect(component.tank.workingPressure).toBeCloseTo(3000);
        });
    });
});
