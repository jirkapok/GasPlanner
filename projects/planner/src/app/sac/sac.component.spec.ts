import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { InputControls } from '../shared/inputcontrols';
import { Plan } from '../shared/plan.service';
import { PlannerService } from '../shared/planner.service';
import { SacCalculatorService } from '../shared/sac-calculator.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { SacComponent } from './sac.component';

class SacPage {
    constructor(private fixture: ComponentFixture<SacComponent>) { }

    public get workingPressure(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#workPressure'))?.nativeElement as HTMLInputElement;
    }
}

describe('Sac component', () => {
    let component: SacComponent;
    let fixture: ComponentFixture<SacComponent>;
    let sacPage: SacPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SacComponent],
            providers: [
                WorkersFactoryCommon, UnitConversion,
                PlannerService, DecimalPipe, UntypedFormBuilder,
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

    it('use applies rmv to diver', inject([PlannerService, SacCalculatorService],
        (planner: PlannerService) => {
            planner.diver.rmv = 30;
            component.use();
            const applied = planner.diver.rmv;
            expect(applied).toBeCloseTo(20, 5);
        }));

    describe('Metric units', () => {
        it('Working pressure is not visible', () => {
            expect(sacPage.workingPressure).toBeUndefined();
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
            component.ngOnInit();
        });

        it('adjusts tank', () => {
            expect(component.calcTankSize).toBeCloseTo(109.6, 1);
        });

        it('adjusts depth', () => {
            expect(component.calcDepth).toBeCloseTo(49.2, 1);
        });

        it('adjusts used', () => {
            expect(component.calcUsed).toBeCloseTo(2175.6, 1);
        });

        it('adjusts rmv', () => {
            expect(component.calcRmv).toBeCloseTo(0.7063, 4);
        });

        it('adjusts sac', () => {
            expect(component.gasSac).toBeCloseTo(19.338365, 6);
        });

        it('adjusts working pressure', () => {
            expect(component.calcWorkingPressure).toBeCloseTo(3000, 3);
        });

        it('Working pressure affects tank size', () => {
            sacPage.workingPressure.value = '4000';
            sacPage.workingPressure.dispatchEvent(new Event('input'));
            expect(component.calc.tank).toBeCloseTo(11.253, 3);
        });
    });
});
