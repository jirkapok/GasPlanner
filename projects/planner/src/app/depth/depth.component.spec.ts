import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthComponent } from './depth.component';

describe('DepthComponent Imperial units', () => {
    let component: DepthComponent;
    let fixture: ComponentFixture<DepthComponent>;
    let planner: PlannerService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthComponent],
            imports: [ReactiveFormsModule],
            providers: [FormBuilder, DecimalPipe,
                WorkersFactoryCommon, PlannerService, UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        planner = TestBed.inject(PlannerService);
        fixture.detectChanges();
    });

    it('Converts bound depth to imperial', () => {
        expect(component.depths.plannedDepth).toBeCloseTo(98.425197, 6);
    });

    it('Depth to imperial', () => {
        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement ;
        input.value = '70';
        input.dispatchEvent(new Event('input'));
        const depth = planner.plan.maxDepth;
        expect(depth).toBeCloseTo(21.336, 6);
    });
});
