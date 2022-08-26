import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { FormsModule, NgModel } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PlannerService } from '../shared/planner.service';
import { SacCalculatorService } from '../shared/sac-calculator.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { SacComponent } from './sac.component';

describe('Sac component', () => {
    let component: SacComponent;
    let fixture: ComponentFixture<SacComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SacComponent, NgModel],
            providers: [WorkersFactoryCommon, UnitConversion, PlannerService],
            imports: [RouterTestingModule.withRoutes([]), FormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SacComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('use applies rmv to diver', inject([PlannerService, SacCalculatorService],
        (planner: PlannerService) => {
            planner.diver.rmv = 30;
            component.use();
            const applied = planner.diver.rmv;
            expect(applied).toBeCloseTo(20.13, 5);
        }));

    describe('Imperial units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
            // not real values, only round numbers similar to metric
            component.calcDepth = 50;
            component.calcTank = 110;
            component.calcUsed = 2175;
        });

        it('adjusts tank', () => {
            expect(component.calcTank).toBeCloseTo(110, 5);
        });

        it('adjusts depth', () => {
            expect(component.calcDepth).toBe(50);
        });

        it('adjusts used', () => {
            expect(component.calcUsed).toBe(2175);
        });

        it('adjusts rmv', () => {
            expect(component.calcRmv).toBeCloseTo(0.7069996, 7);
        });

        it('adjusts sac', () => {
            expect(component.gasSac()).toBeCloseTo(0.046947, 5);
        });
    });
});
