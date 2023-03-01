import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { InputControls } from '../shared/inputcontrols';
import { PlannerService } from '../shared/planner.service';
import { SacCalculatorService } from '../shared/sac-calculator.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { SacComponent } from './sac.component';

describe('Sac component', () => {
    let component: SacComponent;
    let fixture: ComponentFixture<SacComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SacComponent],
            providers: [
                WorkersFactoryCommon, UnitConversion,
                PlannerService, DecimalPipe, UntypedFormBuilder,
                ValidatorGroups, InputControls, SacCalculatorService,
                TanksService
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
    });

    it('use applies rmv to diver', inject([PlannerService, SacCalculatorService],
        (planner: PlannerService) => {
            planner.diver.rmv = 30;
            component.use();
            const applied = planner.diver.rmv;
            expect(applied).toBeCloseTo(20, 5);
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
            expect(component.calcRmv).toBeCloseTo(0.706293, 6);
        });

        it('adjusts sac', () => {
            expect(component.gasSac).toBeCloseTo(19.338365, 6);
        });
    });
});
