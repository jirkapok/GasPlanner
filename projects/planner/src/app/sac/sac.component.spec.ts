import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { Plan } from '../shared/plan.service';
import { SacCalculatorService } from '../shared/sac-calculator.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { SacComponent } from './sac.component';
import { TankSizeComponent } from '../tank.size/tank.size.component';
import _ from 'lodash';

class SacPage {
    constructor(private fixture: ComponentFixture<SacComponent>) { }

    public get workingPressure(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#workPressure'))?.nativeElement as HTMLInputElement;
    }

    public applyTemplateButton(text: string): HTMLLinkElement {
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
    let sacPage: SacPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SacComponent, TankSizeComponent],
            providers: [
                WorkersFactoryCommon, UnitConversion,
                OptionsService, DecimalPipe,
                ValidatorGroups, InputControls, SacCalculatorService,
                TanksService, Plan
            ],
            imports: [
                RouterTestingModule.withRoutes([]),
                ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SacComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        sacPage = new SacPage(fixture);
    });

    it('use applies rmv to diver', inject([OptionsService, SacCalculatorService],
        (options: OptionsService) => {
            options.diver.rmv = 30;
            component.use();
            const applied = options.diver.rmv;
            expect(applied).toBeCloseTo(20, 5);
        }));

    describe('Metric units', () => {
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
            component.units.imperialUnits = true;
            component.ngOnInit();
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
