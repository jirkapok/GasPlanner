import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { FormBuilder, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
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
            providers: [WorkersFactoryCommon, UnitConversion,
                PlannerService, DecimalPipe, FormBuilder ],
            imports: [RouterTestingModule.withRoutes([]), FormsModule, ReactiveFormsModule ]
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
            component.ngOnInit();
        });

        it('adjusts tank', () => {
            expect(component.calcTank).toBeCloseTo(109.567285, 6);
        });

        it('adjusts depth', () => {
            expect(component.calcDepth).toBeCloseTo(49.212598, 6);
        });

        it('adjusts used', () => {
            expect(component.calcUsed).toBeCloseTo(2175.566, 3);
        });

        it('adjusts rmv', () => {
            expect(component.calcRmv).toBeCloseTo(0.710884, 6);
        });

        it('adjusts sac', () => {
            expect(component.gasSac).toBeCloseTo(19.464064, 6);
        });
    });
});
